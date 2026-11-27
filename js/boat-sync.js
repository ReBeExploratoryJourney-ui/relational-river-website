/*
 * Your Boat, kept with an IRB account.
 *
 * Sign-in is a one-time code sent by email (no passwords). The Boat is stored in the
 * Institute of Relational Being's account home (Supabase, in the EU), where row level
 * security lets each collaborator reach only their own Boat. The same account can open
 * ReBe, and neither ever requires the other.
 *
 * Written by hand, with no outside libraries, so nothing else loads into the River.
 * The publishable key below is meant to be public: it can only do what the database's
 * row level security allows.
 */
(function () {
  'use strict';
  var URL = 'https://xejsnwvqzijexnungonw.supabase.co';
  var KEY = 'sb_publishable_OEKhbWjd_qltl0Na6AR_pQ_A-Kzlgnn';
  var SKEY = 'rr.irb.session', BKEY = 'rr.boat.v1';

  function store(k, v) { try { if (v == null) { localStorage.removeItem(k); } else { localStorage.setItem(k, JSON.stringify(v)); } } catch (e) {} }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }

  function friendly(status, body) {
    var m = (body && (body.msg || body.message || body.error_description || body.error)) || '';
    if (status === 429 || /security purposes|rate limit/i.test(m)) { return 'Please wait a minute before asking for another code.'; }
    if (/expired|invalid/i.test(m) && /token|otp|code/i.test(m)) { return 'That code didn’t work. It may have expired. Ask for a new one and try again.'; }
    if (/email.*invalid|invalid.*email|validate email/i.test(m)) { return 'That email address doesn’t look quite right.'; }
    if (status >= 500 && /email|smtp|domain|send/i.test(m)) { return 'The code email couldn’t be sent just now. Please try again later.'; }
    if (status >= 500) { return 'The account home had a hiccup. Please try again in a moment.'; }
    if (status === 401 || /jwt expired/i.test(m)) { return 'Your sign-in has gently expired. Please sign in again on Your Boat, then try once more.'; }
    if (status === 0) { return 'The River couldn’t reach the account home. Please check your connection and try again.'; }
    return 'Something went wrong. Please try again in a moment.';
  }

  function call(path, opts) {
    opts = opts || {};
    var headers = { apikey: KEY, 'Content-Type': 'application/json' };
    if (opts.token) { headers.Authorization = 'Bearer ' + opts.token; }
    for (var h in (opts.headers || {})) { headers[h] = opts.headers[h]; }
    return fetch(URL + path, { method: opts.method || 'GET', headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (res) {
        return res.text().then(function (t) {
          var body = null; try { body = t ? JSON.parse(t) : null; } catch (e) { body = null; }
          if (!res.ok) { var err = new Error(friendly(res.status, body)); err.status = res.status; throw err; }
          return body;
        });
      }, function () { var err = new Error(friendly(0)); err.status = 0; throw err; });
  }

  function keep(s) {
    var sess = { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at || (Math.floor(Date.now() / 1000) + (s.expires_in || 3600)),
      user_id: s.user && s.user.id, email: s.user && s.user.email };
    var old = load(SKEY);
    if (!sess.user_id && old) { sess.user_id = old.user_id; sess.email = old.email; }
    store(SKEY, sess);
    return sess;
  }

  var refreshing = null;
  function token() {
    var s = load(SKEY);
    if (!s) { return Promise.reject(new Error('Not signed in')); }
    if (s.expires_at - 90 > Date.now() / 1000) { return Promise.resolve(s); }
    if (!refreshing) {
      refreshing = call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } })
        .then(function (r) { refreshing = null; return keep(r); }, function (e) { refreshing = null; if (e.status === 400 || e.status === 401 || e.status === 403) { store(SKEY, null); } throw e; });
    }
    return refreshing;
  }

  // Lists are joined by id; nothing either side added is lost.
  function merge(a, b) {
    var out = JSON.parse(JSON.stringify(a || {})), byId = function (list) { var m = {}; (list || []).forEach(function (x) { if (x && x.id) { m[x.id] = x; } }); return m; };
    ['tending', 'stars', 'gathered', 'moons', 'wake', 'log', 'offerings'].forEach(function (k) {
      var m = byId(out[k]);
      (b[k] || []).forEach(function (x) {
        if (!x || !x.id) { return; }
        if (!m[x.id]) { m[x.id] = x; return; }
        if (k === 'tending') {
          var seen = {}, notes = (m[x.id].notes || []).concat(x.notes || []).filter(function (n) { var key = n.at + '|' + n.text; if (seen[key]) { return false; } seen[key] = 1; return true; });
          notes.sort(function (p, q) { return p.at < q.at ? -1 : 1; });
          m[x.id].notes = notes;
        }
      });
      out[k] = Object.keys(m).map(function (id) { return m[id]; }).sort(function (p, q) { return (p.at || '') < (q.at || '') ? -1 : 1; });
    });
    var seenB = {}; out.began = (out.began || []).concat(b.began || []).filter(function (x) { if (!x || seenB[x.at]) { return false; } seenB[x.at] = 1; return true; }).sort(function (p, q) { return p.at < q.at ? -1 : 1; });
    out.name = b.name || out.name || '';
    out.look = b.look || out.look || '';
    if (b.lunar !== undefined) { out.lunar = b.lunar; }
    if (b.wyrd && !out.wyrd) { out.wyrd = b.wyrd; }
    out.launched = [out.launched, b.launched].filter(Boolean).sort()[0] || new Date().toISOString();
    out.v = 1;
    return out;
  }

  function plain(boat) { var c = JSON.parse(JSON.stringify(boat)); delete c.dirty; delete c.synced; c.kind = 'account'; return c; }

  var RB = {
    session: function () { return load(SKEY); },
    signedIn: function () { return !!load(SKEY); },
    email: function () { var s = load(SKEY); return s ? s.email : ''; },
    sendCode: function (email) {
      return call('/auth/v1/otp', { method: 'POST', body: { email: String(email || '').trim().toLowerCase(), create_user: true } });
    },
    verify: function (email, code) {
      return call('/auth/v1/verify', { method: 'POST', body: { type: 'email', email: String(email || '').trim().toLowerCase(), token: String(code || '').replace(/\D/g, '') } })
        .then(function (r) { if (!r || !r.access_token) { throw new Error(friendly(403, { msg: 'invalid token' })); } return keep(r); });
    },
    pull: function () {
      return token().then(function (s) { return call('/rest/v1/river_boats?select=boat,updated_at&owner_id=eq.' + s.user_id, { token: s.access_token }); })
        .then(function (rows) { return rows && rows[0] ? rows[0] : null; });
    },
    push: function (boat) {
      return token().then(function (s) {
        return call('/rest/v1/river_boats?on_conflict=owner_id', { method: 'POST', token: s.access_token,
          headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: { owner_id: s.user_id, boat: plain(boat) } });
      }).then(function (rows) { return rows && rows[0] ? rows[0].updated_at : null; });
    },
    // Bring this device's Boat and the account's Boat together, and keep both in step.
    sync: function () {
      var local = load(BKEY);
      return RB.pull().then(function (row) {
        var serverChanged = row && (!local || row.updated_at !== local.synced);
        var localChanged = local && (local.dirty || !local.synced);
        var next;
        if (!row && !local) { return null; }
        if (!row || (localChanged && !serverChanged)) { next = local; }
        else if (!local || (serverChanged && !localChanged)) { next = row.boat; next.synced = row.updated_at; next.kind = 'account'; next.dirty = false; store(BKEY, next); return next; }
        else if (localChanged && serverChanged) { next = merge(row.boat, local); }
        else { return local; }
        return RB.push(next).then(function (at) { next = plain(next); next.synced = at; next.dirty = false; store(BKEY, next); return next; });
      });
    },
    // Pages call this after changing the Boat, so it reaches the account soon after.
    touched: function () {
      if (!RB.signedIn()) { return; }
      clearTimeout(RB._t);
      RB._t = setTimeout(function () { RB.sync().catch(function () {}); }, 500);
    },
    sinkRemote: function () {
      return token().then(function (s) {
        return call('/rest/v1/harbour_boats?owner_id=eq.' + s.user_id, { method: 'DELETE', token: s.access_token }).catch(function () {})
          .then(function () { return call('/rest/v1/wyrd_moorings?owner_id=eq.' + s.user_id, { method: 'DELETE', token: s.access_token }).catch(function () {}); })
          .then(function () { return call('/rest/v1/river_boats?owner_id=eq.' + s.user_id, { method: 'DELETE', token: s.access_token }); });
      });
    },
    // ---- The Harbour: Boats their owners have opened to others ----
    // Only what the owner writes on their Harbour card is public; nothing from the private Boat is shared.
    HARBOUR_COLS: 'owner_id,display_name,working_on,invitation,place,themes,hylo_url,look,updated_at',
    harbourMine: function () {
      return token().then(function (s) { return call('/rest/v1/harbour_boats?select=' + RB.HARBOUR_COLS + ',hidden&owner_id=eq.' + s.user_id, { token: s.access_token }); })
        .then(function (rows) { return rows && rows[0] ? rows[0] : null; });
    },
    harbourSave: function (card) {
      return token().then(function (s) {
        var body = { owner_id: s.user_id, display_name: card.display_name, working_on: card.working_on, invitation: card.invitation || null,
          place: card.place || null, themes: card.themes || [], hylo_url: card.hylo_url || null, look: card.look || null };
        return call('/rest/v1/harbour_boats?on_conflict=owner_id', { method: 'POST', token: s.access_token, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: body });
      });
    },
    harbourLeave: function () {
      return token().then(function (s) { return call('/rest/v1/harbour_boats?owner_id=eq.' + s.user_id, { method: 'DELETE', token: s.access_token }); });
    },
    harbourList: function () {
      return call('/rest/v1/harbour_boats?select=' + RB.HARBOUR_COLS + '&order=updated_at.desc&limit=300');
    },
    harbourReport: function (ownerId, reason) {
      return call('/rest/v1/harbour_reports', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { owner_id: ownerId, reason: String(reason || '').slice(0, 500) || null } });
    },
    // ---- Wyrd Bay moorings: Wyrd Workers who choose to be findable inside the Bay ----
    WYRD_COLS: 'owner_id,display_name,threshold,open_to,quest,hylo_url,updated_at',
    wyrdMine: function () {
      return token().then(function (s) { return call('/rest/v1/wyrd_moorings?select=' + RB.WYRD_COLS + ',hidden&owner_id=eq.' + s.user_id, { token: s.access_token }); })
        .then(function (rows) { return rows && rows[0] ? rows[0] : null; });
    },
    wyrdSave: function (card) {
      return token().then(function (s) {
        var body = { owner_id: s.user_id, display_name: card.display_name, threshold: card.threshold, open_to: card.open_to || 'either', quest: card.quest || null, hylo_url: card.hylo_url || null };
        return call('/rest/v1/wyrd_moorings?on_conflict=owner_id', { method: 'POST', token: s.access_token, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: body });
      });
    },
    wyrdLeave: function () {
      return token().then(function (s) { return call('/rest/v1/wyrd_moorings?owner_id=eq.' + s.user_id, { method: 'DELETE', token: s.access_token }); });
    },
    wyrdList: function () {
      return call('/rest/v1/wyrd_moorings?select=' + RB.WYRD_COLS + '&order=updated_at.desc&limit=300');
    },
    wyrdReport: function (ownerId, reason) {
      return call('/rest/v1/wyrd_reports', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { owner_id: ownerId, reason: String(reason || '').slice(0, 500) || null } });
    },
    signOut: function () {
      var s = load(SKEY);
      store(SKEY, null);
      if (s) { return call('/auth/v1/logout', { method: 'POST', token: s.access_token }).catch(function () {}); }
      return Promise.resolve();
    },
    deleteAccount: function () {
      return token().then(function (s) { return call('/rest/v1/rpc/delete_own_account', { method: 'POST', token: s.access_token, body: {} }); })
        .then(function () { store(SKEY, null); });
    }
  };
  window.RiverBoat = RB;

  // Your Boat's wake: which waters of the River you have visited, one mark per water per day,
  // so "Launch your Boat" can sail them with you. It is kept only inside your Boat (on this
  // device, or with your IRB account if you chose that), and never sent anywhere else.
  // You can pause or clear it on the Boat page.
  var WATERS = { '/source': 'Source', '/springs': 'Springs', '/streams': 'Streams', '/tributaries': 'Tributaries',
    '/eddies': 'Eddies', '/lakes': 'Lakes', '/islands': 'Islands of coherence', '/waterfall': 'Waterfall',
    '/local-currents': 'Local currents', '/channels': 'Channels', '/estuary': 'Estuary', '/confluences': 'Confluences',
    '/capital-journey': 'Confluences', '/ocean': 'Ocean', '/groundwater': 'Groundwater', '/well': 'The Well',
    '/moon': 'Moon', '/lunar-journal': 'Moon' };
  function markWake() {
    var path = (location.pathname || '').replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    var w = WATERS[path]; if (!w) { return; }
    var b = load(BKEY); if (!b || b.v !== 1 || b.wakeOff) { return; }
    var d = new Date(), day = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    var id = w + '|' + day;
    b.wake = Array.isArray(b.wake) ? b.wake : [];
    if (b.wake.some(function (x) { return x && x.id === id; })) { return; }
    b.wake.push({ id: id, w: w, at: day });
    if (b.wake.length > 400) { b.wake = b.wake.slice(-400); }
    b.dirty = true; store(BKEY, b); RB.touched();
  }
  try { markWake(); } catch (e) {}

  // Your Boat's logbook: the films, talks, articles and offerings you open from the River, so you
  // can find them again and "Launch your Boat" can remember them with you. Only the title, the
  // link, the kind of thing it is and the water it came from are kept, inside your Boat. Nothing
  // about what you do on other websites is ever seen. Pausing your wake pauses the logbook too.
  function waterHere() {
    var path = (location.pathname || '').replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    return WATERS[path] || '';
  }
  function textOf(el, n) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, n) : ''; }
  function logClick(ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null; if (!a) { return; }
    if (a.closest('nav, header, footer, .vmenu, .gbubble')) { return; }
    var href = a.href || ''; if (!/^https?:\/\//i.test(href)) { return; }
    var u; try { u = new window.URL(href); } catch (e) { return; }
    if (u.host === location.host) { return; }
    var b = load(BKEY); if (!b || b.v !== 1 || b.wakeOff) { return; }
    var card = a.closest('article, section, li') || a.parentNode;
    var head = card ? card.querySelector('h3, h2, h4') : null;
    var title = textOf(head, 140) || textOf(a, 140) || u.host;
    var kindEl = card ? card.querySelector('.k, [style*="uppercase"]') : null;
    var kind = textOf(kindEl, 60);
    var d = new Date(), day = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    var id = 'l' + (u.host + u.pathname + u.search).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 100);
    b.log = Array.isArray(b.log) ? b.log : [];
    var had = null; b.log = b.log.filter(function (x) { if (x && x.id === id) { had = x; return false; } return true; });
    b.log.push({ id: id, t: title, h: href.slice(0, 400), k: kind, w: waterHere(), at: day, n: (had && had.n ? had.n : 0) + 1, first: had && had.first ? had.first : day });
    if (b.log.length > 300) { b.log = b.log.slice(-300); }
    b.dirty = true; store(BKEY, b); RB.touched();
  }
  try { document.addEventListener('click', logClick, true); document.addEventListener('auxclick', logClick, true); } catch (e) {}
})();
