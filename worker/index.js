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
      const r = await fetch('https://api.inaturalist.org/v1/places/autocomplete?per_page=6&q=' + encodeURIComponent(q), {
        headers: { accept: 'application/json', 'user-agent': 'RelationalRiver/1.0 (relationalriver.org)' },
      });
      if (!r.ok) return json({ error: 'upstream' }, 502);
      const d = await r.json();
      const results = (d.results || []).map((p) => ({ id: p.id, name: p.display_name || p.name }));
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
