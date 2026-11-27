// The Relational River's small worker.
// Serves the static site, and keeps offerings poured into the Well.
//
// Offerings live in a Cloudflare D1 database bound as WELL_DB. Until that
// binding exists, the Well answers "not connected" and the page says so.
// Stewards can read offerings with the STEWARD_KEY secret (set in the
// Cloudflare dashboard, never in this repository).
//
// Care: no IP addresses, device identifiers or tracking are stored. Each
// offering can be read and withdrawn with its own private link, and a
// withdrawal deletes it completely.

const W = ['wonder', 'wit', 'wisdom', 'wealth'];
const TIME = ['hours', 'month', 'week', 'season', 'project'];
const REACH = ['local', 'online', 'anywhere'];
const EX = ['gift', 'time', 'swap', 'paid', 'funded'];
const VIS = ['river', 'members', 'anyone'];

const SCHEMA = `CREATE TABLE IF NOT EXISTS offerings (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  created TEXT NOT NULL,
  w TEXT NOT NULL, skills TEXT, exp TEXT, pass TEXT, need TEXT, place TEXT,
  time TEXT, reach TEXT, ex TEXT, vis TEXT NOT NULL, contact TEXT
)`;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function clean(v, max) {
  return typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '';
}

function pickList(v, allowed) {
  return Array.isArray(v) ? allowed.filter((a) => v.includes(a)) : [];
}

function pickOne(v, allowed, fallback) {
  return allowed.includes(v) ? v : fallback;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomHex(bytes) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function sameText(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function shape(row) {
  return {
    id: row.id, created: row.created, w: JSON.parse(row.w), skills: row.skills, exp: row.exp,
    pass: row.pass, need: row.need, where: row.place, time: row.time, reach: row.reach,
    ex: JSON.parse(row.ex || '[]'), vis: row.vis, contact: row.contact,
  };
}

async function ready(env) {
  await env.WELL_DB.prepare(SCHEMA).run();
}

async function pour(request, env) {
  let b;
  try { b = await request.json(); } catch (e) { return json({ error: 'bad_request' }, 400); }
  if (!b || typeof b !== 'object') return json({ error: 'bad_request' }, 400);
  if (b.website) return json({ ok: true }); // a field people never see: quietly ignore robots
  if (b.consent !== true) return json({ error: 'consent_needed' }, 400);
  const o = {
    w: pickList(b.w, W), skills: clean(b.skills, 400), exp: clean(b.exp, 600), pass: clean(b.pass, 1200),
    need: clean(b.need, 600), where: clean(b.where, 120), time: pickOne(b.time, TIME, 'month'),
    reach: pickOne(b.reach, REACH, 'local'), ex: pickList(b.ex, EX), vis: pickOne(b.vis, VIS, 'river'),
    contact: clean(b.contact, 200),
  };
  if (!o.w.length || !(o.skills || o.exp || o.pass)) return json({ error: 'empty' }, 400);
  if (o.contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.contact)) return json({ error: 'contact' }, 400);
  await ready(env);
  const id = crypto.randomUUID();
  const token = randomHex(24);
  await env.WELL_DB.prepare(
    'INSERT INTO offerings (id, token_hash, created, w, skills, exp, pass, need, place, time, reach, ex, vis, contact) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).bind(id, await sha256(token), new Date().toISOString().slice(0, 10), JSON.stringify(o.w), o.skills, o.exp,
    o.pass, o.need, o.where, o.time, o.reach, JSON.stringify(o.ex), o.vis, o.contact || null).run();
  return json({ ok: true, key: id + '.' + token }, 201);
}

async function mine(request, env, key) {
  const [id, token] = String(key || '').split('.');
  if (!id || !token) return json({ error: 'not_found' }, 404);
  await ready(env);
  const row = await env.WELL_DB.prepare('SELECT * FROM offerings WHERE id = ?').bind(id).first();
  if (!row || !sameText(row.token_hash, await sha256(token))) return json({ error: 'not_found' }, 404);
  if (request.method === 'DELETE') {
    await env.WELL_DB.prepare('DELETE FROM offerings WHERE id = ?').bind(id).run();
    return json({ ok: true, withdrawn: true });
  }
  return json({ ok: true, offering: shape(row) });
}

async function steward(request, env) {
  const auth = request.headers.get('authorization') || '';
  if (!env.STEWARD_KEY || !sameText(auth, 'Bearer ' + env.STEWARD_KEY)) return json({ error: 'not_allowed' }, 401);
  await ready(env);
  const { results } = await env.WELL_DB.prepare('SELECT * FROM offerings ORDER BY created DESC LIMIT 500').all();
  return json({ ok: true, offerings: results.map(shape) });
}

// iNaturalist, fetched by the worker on the visitor's behalf, so visitors'
// browsers make no requests to iNaturalist or its photo hosts (GDPR).
const PHOTO_HOSTS = ['inaturalist-open-data.s3.amazonaws.com', 'static.inaturalist.org'];

async function cached(request, ctx, make) {
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await make();
  if (res.ok) ctx.waitUntil(cache.put(request, res.clone()));
  return res;
}

async function inat(request, url, ctx) {
  if (request.method !== 'GET') return json({ error: 'not_found' }, 404);
  if (url.pathname === '/api/inat/observations') {
    return cached(request, ctx, async () => {
      const r = await fetch('https://api.inaturalist.org/v1/observations' + url.search, {
        headers: { accept: 'application/json', 'user-agent': 'RelationalRiver/1.0 (relationalriver.org)' },
      });
      if (!r.ok) return json({ error: 'upstream' }, 502);
      return new Response(await r.text(), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=86400' },
      });
    });
  }
  if (url.pathname === '/api/inat/places') {
    const q = (url.searchParams.get('q') || '').trim().slice(0, 60);
    if (q.length < 2) return json({ results: [] });
    return cached(request, ctx, async () => {
      const r = await fetch('https://api.inaturalist.org/v1/places/autocomplete?per_page=20&q=' + encodeURIComponent(q), {
        headers: { accept: 'application/json', 'user-agent': 'RelationalRiver/1.0 (relationalriver.org)' },
      });
      if (!r.ok) return json({ error: 'upstream' }, 502);
      const d = await r.json();
      // Prefer standard places (countries, regions, counties, towns) over people's own gardens and hotspots.
      const all = d.results || [];
      const standard = all.filter((p) => p.admin_level !== null && p.admin_level !== undefined);
      const results = (standard.length ? standard : all).slice(0, 6).map((p) => ({ id: p.id, name: p.display_name || p.name, loc: p.location || '' }));
      return new Response(JSON.stringify({ results }), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=604800' },
      });
    });
  }
  if (url.pathname === '/api/inat/photo') {
    let src;
    try { src = new URL(url.searchParams.get('u') || ''); } catch (e) { return json({ error: 'bad_request' }, 400); }
    if (src.protocol !== 'https:' || !PHOTO_HOSTS.includes(src.hostname) || !/^\/photos\//.test(src.pathname)) {
      return json({ error: 'bad_request' }, 400);
    }
    return cached(request, ctx, async () => {
      const r = await fetch(src.toString());
      if (!r.ok || !/^image\//.test(r.headers.get('content-type') || '')) return json({ error: 'upstream' }, 502);
      return new Response(r.body, {
        headers: { 'content-type': r.headers.get('content-type'), 'cache-control': 'public, max-age=604800' },
      });
    });
  }
  return json({ error: 'not_found' }, 404);
}

// Hylo: public groups and public events, read from Hylo's public GraphQL API by the worker
// (never from visitors' browsers), cached for an hour, and trimmed to what the River shows.
// Only what groups have chosen to make public is ever returned. Everything links back to Hylo.
const HYLO_API = 'https://hylo.com/noo/graphql';
const HYLO_EVENT_GROUPS = ['institute-of-relational-being'];

async function hyloQuery(query, variables) {
  const r = await fetch(HYLO_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', 'user-agent': 'RelationalRiver/1.0 (relationalriver.org)' },
    body: JSON.stringify({ query, variables }),
  });
  if (!r.ok) throw new Error('upstream ' + r.status);
  const d = await r.json();
  if (d.errors && !d.data) throw new Error('graphql ' + JSON.stringify(d.errors).slice(0, 200));
  return d.data || {};
}

function km(a, b) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function plain(text, n) {
  return String(text || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, n);
}

async function hyloGroups(url) {
  const lat = Math.round(parseFloat(url.searchParams.get('lat')) * 100) / 100;
  const lng = Math.round(parseFloat(url.searchParams.get('lng')) * 100) / 100;
  const radius = Math.min(150, Math.max(10, parseFloat(url.searchParams.get('km')) || 60));
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return json({ error: 'bad_request' }, 400);
  const dLat = radius / 111, dLng = radius / (111 * Math.max(0.2, Math.cos(lat * Math.PI / 180)));
  const box = [{ lat: lat - dLat, lng: lng - dLng }, { lat: lat + dLat, lng: lng + dLng }];
  const fields = 'items { id name slug description purpose location avatarUrl memberCount locationObject { center { lat lng } city region country } }';
  const q = 'query ($near: PointInput, $box: [PointInput]) { groups(nearCoord: $near, boundingBox: $box, sortBy: "nearest", allowedInPublic: true, first: 24) { ' + fields + ' } }';
  let data;
  try { data = await hyloQuery(q, { near: { lat, lng }, box }); }
  catch (e) {
    // If the public listing filter isn't available, fall back to public groups only.
    data = await hyloQuery(q.replace(' allowedInPublic: true,', ''), { near: { lat, lng }, box });
  }
  const here = { lat, lng };
  const groups = ((data.groups && data.groups.items) || []).map((g) => {
    const c = g.locationObject && g.locationObject.center;
    const at = c && isFinite(parseFloat(c.lat)) ? { lat: parseFloat(c.lat), lng: parseFloat(c.lng) } : null;
    return {
      name: plain(g.name, 90), slug: g.slug,
      about: plain(g.purpose || g.description, 220),
      where: plain(g.location || [g.locationObject && g.locationObject.city, g.locationObject && g.locationObject.region].filter(Boolean).join(', '), 80),
      members: g.memberCount || 0,
      avatar: /^https:\/\//.test(g.avatarUrl || '') ? g.avatarUrl : '',
      km: at ? Math.round(km(here, at)) : null,
      url: 'https://www.hylo.com/groups/' + encodeURIComponent(g.slug),
    };
  }).filter((g) => g.slug && g.km !== null && g.km <= radius).slice(0, 12);
  return new Response(JSON.stringify({ groups, radius, source: 'Hylo public groups' }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}

async function hyloEvents(url) {
  const slug = url.searchParams.get('group') || HYLO_EVENT_GROUPS[0];
  if (!HYLO_EVENT_GROUPS.includes(slug)) return json({ error: 'bad_request' }, 400);
  const q = 'query ($slugs: [String], $after: Date) { posts(groupSlugs: $slugs, types: ["event"], afterTime: $after, sortBy: "start_time", order: "ASC", first: 12) { items { id title details startTime endTime timezone location meetingLink isPublic } } }';
  const data = await hyloQuery(q, { slugs: [slug], after: new Date().toISOString() });
  const now = Date.now();
  const events = ((data.posts && data.posts.items) || []).filter((p) => p.isPublic !== false).map((p) => ({
    title: plain(p.title, 140), about: plain(p.details, 260),
    start: p.startTime || null, end: p.endTime || null, tz: p.timezone || '',
    where: plain(p.location, 100), online: !!p.meetingLink,
    url: 'https://www.hylo.com/post/' + encodeURIComponent(p.id),
  })).filter((e) => e.start && Date.parse(e.end || e.start) >= now).slice(0, 8);
  return new Response(JSON.stringify({ events, group: slug, groupUrl: 'https://www.hylo.com/groups/' + slug, source: 'Hylo public events' }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}

async function hylo(request, url, ctx) {
  if (request.method !== 'GET') return json({ error: 'not_found' }, 404);
  if (url.pathname === '/api/hylo/groups') return cached(request, ctx, () => hyloGroups(url));
  if (url.pathname === '/api/hylo/events') return cached(request, ctx, () => hyloEvents(url));
  return json({ error: 'not_found' }, 404);
}

// Offerings are kept no longer than three years.
async function tidy(env) {
  if (!env.WELL_DB) return;
  await ready(env);
  const cutoff = new Date(Date.now() - 3 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  await env.WELL_DB.prepare('DELETE FROM offerings WHERE created < ?').bind(cutoff).run();
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(tidy(env));
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/hylo/')) {
      try { return await hylo(request, url, ctx); } catch (e) { return json({ error: 'upstream' }, 502); }
    }
    if (url.pathname.startsWith('/api/inat/')) {
      try { return await inat(request, url, ctx); } catch (e) { return json({ error: 'server' }, 500); }
    }
    if (url.pathname.startsWith('/api/')) {
      if (!env.WELL_DB) return json({ error: 'not_connected' }, 503);
      try {
        if (url.pathname === '/api/well/offering' && request.method === 'POST') return await pour(request, env);
        if (url.pathname === '/api/well/mine' && (request.method === 'GET' || request.method === 'DELETE')) {
          return await mine(request, env, request.headers.get('x-well-key'));
        }
        if (url.pathname === '/api/well/steward' && request.method === 'GET') return await steward(request, env);
        return json({ error: 'not_found' }, 404);
      } catch (e) {
        return json({ error: 'server' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
