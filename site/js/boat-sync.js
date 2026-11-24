/*
 * My Boat, kept with an IRB account.
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
    ['tending', 'stars', 'gathered', 'moons'].forEach(function (k) {
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
    if (b.lunar !== undefined) { out.lunar = b.lunar; }
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
      return token().then(function (s) { return call('/rest/v1/river_boats?owner_id=eq.' + s.user_id, { method: 'DELETE', token: s.access_token }); });
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
})();
