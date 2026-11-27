/*
 * A quieter path through the River.
 *
 * Some waters hold faint signs, and the signs hold fragments. What you have drifted
 * through and what you have found is remembered only in this browser (and inside your
 * Boat, if you keep one), so that a path can open over time. Nothing is sent anywhere.
 *
 * This is a veil, not a lock: it asks for curiosity rather than keeping anyone out.
 */
(function () {
  'use strict';
  var KEY = 'rr.wyrd.v1', BKEY = 'rr.boat.v1';
  var DEEP = { '/well': 'well', '/groundwater': 'groundwater', '/moon': 'moon', '/eddies': 'eddies', '/waterfall': 'waterfall' };
  var ORDER = ['well', 'groundwater', 'moon', 'eddies', 'waterfall'];
  var FRAG = {
    well: 'Where the River forgets its name,',
    groundwater: 'beneath what all the maps agree on,',
    moon: 'a tide keeps time with what is not yet.',
    eddies: 'Bring no map. Bring a question you can carry.',
    waterfall: 'Then seek the mist at the River’s far edge, and when it asks what you know, answer as the mist would.'
  };
  var SPOT = { well: 0.36, groundwater: 0.55, moon: 0.68, eddies: 0.44, waterfall: 0.6 };
  var WORDS = ['no fragments yet', 'one of the five fragments', 'two of the five fragments', 'three of the five fragments', 'four of the five fragments', 'all five fragments'];

  function get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function state() { var s = get(KEY); if (!s || typeof s !== 'object') { s = {}; } s.drift = s.drift && typeof s.drift === 'object' ? s.drift : {}; s.frags = s.frags && typeof s.frags === 'object' ? s.frags : {}; return s; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function here() { return (location.pathname || '').replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '') || '/'; }
  function still() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function held(s) { return ORDER.filter(function (k) { return s.frags[k]; }).length; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function arrived() {
    var s = state(); if (s.arrived) { return true; }
    var b = get(BKEY); return !!(b && b.v === 1 && b.wyrd && b.wyrd.arrived);
  }
  function markArrived() {
    var s = state(), day = today(); if (!s.arrived) { s.arrived = day; put(KEY, s); }
    var b = get(BKEY);
    if (b && b.v === 1 && !(b.wyrd && b.wyrd.arrived)) { b.wyrd = { arrived: day }; b.dirty = true; put(BKEY, b); if (window.RiverBoat) { window.RiverBoat.touched(); } }
  }

  // ---- shared look ----
  var css = '' +
    '.wy-sign{position:absolute;z-index:20;width:46px;height:46px;padding:7px;border:none;background:transparent;cursor:pointer;opacity:.34;transition:opacity .6s ease;border-radius:50%}' +
    '.wy-sign:hover,.wy-sign:focus-visible{opacity:.9}' +
    '.wy-sign.kept{opacity:.18}' +
    '.wy-sign svg{display:block;width:100%;height:100%;overflow:visible}' +
    '.wy-sign:focus-visible{outline:2px dashed #9FD3DC;outline-offset:3px}' +
    '@keyframes wybreathe{0%,100%{opacity:.22}50%{opacity:.5}}' +
    '.wy-sign:not(.kept):not(:hover):not(:focus-visible){animation:wybreathe 7s ease-in-out infinite}' +
    '.wy-note{position:fixed;z-index:60;left:50%;bottom:24px;transform:translateX(-50%);width:min(460px,calc(100vw - 32px));box-sizing:border-box;background:#14163A;color:#EFE6D2;border:1px solid rgba(232,199,122,.35);border-radius:18px 24px 16px 22px;padding:22px 24px 18px;font-family:Jost,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.5)}' +
    '.wy-note .wy-k{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#E8C77A}' +
    '.wy-note .wy-f{margin:8px 0 10px;font-family:"Averia Serif Libre",Georgia,serif;font-style:italic;font-size:20px;line-height:1.45}' +
    '.wy-note .wy-lines{margin:8px 0 12px;font-family:"Averia Serif Libre",Georgia,serif;font-style:italic;font-size:17px;line-height:1.55}' +
    '.wy-note .wy-lines span{display:block}' +
    '.wy-note .wy-gap{opacity:.4}' +
    '.wy-note p{margin:0 0 10px;font-size:15px;line-height:1.5}' +
    '.wy-note input{font-family:Jost,sans-serif;font-size:16px;width:100%;box-sizing:border-box;padding:11px 13px;border-radius:12px 16px 10px 14px;border:1.5px solid rgba(239,230,210,.5);background:rgba(255,255,255,.06);color:#EFE6D2;margin:2px 0 10px}' +
    '.wy-note .wy-row{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}' +
    '.wy-note button{font-family:Jost,sans-serif;font-size:15px;min-height:44px;cursor:pointer;border-radius:12px 16px 10px 14px}' +
    '.wy-note .wy-go{background:#E8C77A;color:#14163A;border:none;padding:10px 18px;font-weight:600}' +
    '.wy-note .wy-soft{background:none;border:none;color:#EFE6D2;text-decoration:underline;padding:0 4px}' +
    '.wy-note button:focus-visible,.wy-note input:focus-visible{outline:2px dashed #9FD3DC;outline-offset:3px}';
  function addCss() { if (document.getElementById('wy-css')) { return; } var st = document.createElement('style'); st.id = 'wy-css'; st.textContent = css; document.head.appendChild(st); }

  var GLYPH = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5 C 24 5, 28 11, 27 16 C 26 22, 20 25, 16 24 C 12 23, 10.5 19.5, 11.5 16.5 C 12.5 13.5, 15.5 12.5, 17.5 13.5 C 19.2 14.4, 19 16.4, 17.8 17.2" fill="none" stroke="#E8C77A" stroke-width="1.7" stroke-linecap="round"/><path d="M4 27 C 8 25, 12 29, 16 27 S 24 25, 28 27" fill="none" stroke="#9FD3DC" stroke-width="1.3" stroke-linecap="round"/></svg>';

  var note = null, lastFocus = null;
  function closeNote() { if (note) { note.remove(); note = null; document.removeEventListener('keydown', onKey); if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} } } }
  function onKey(e) { if (e.key === 'Escape') { closeNote(); } }
  function openNote(html, label) {
    addCss(); closeNote(); lastFocus = document.activeElement;
    note = document.createElement('div'); note.className = 'wy-note'; note.setAttribute('role', 'dialog'); note.setAttribute('aria-label', label || 'A note');
    note.innerHTML = html; document.body.appendChild(note); document.addEventListener('keydown', onKey);
    var first = note.querySelector('input, .wy-go, button'); if (first) { setTimeout(function () { try { first.focus(); } catch (e) {} }, 30); }
    note.querySelectorAll('[data-wy-close]').forEach(function (b) { b.addEventListener('click', closeNote); });
    return note;
  }

  // ---- signs on the deeper waters ----
  function placeSign(btn, frac) {
    var main = document.querySelector('main'); if (!main) { return; }
    var r = main.getBoundingClientRect(), top = r.top + window.scrollY + r.height * frac;
    var vw = document.documentElement.clientWidth, right = r.right + window.scrollX;
    var left = vw - right > 70 ? right + 14 : vw - 54;
    btn.style.top = Math.round(top) + 'px'; btn.style.left = Math.round(left) + 'px';
  }
  function showFragment(name) {
    var s = state(), n = held(s);
    openNote('<div class="wy-k">A fragment, drifting</div><div class="wy-f">' + esc(FRAG[name]) + '</div>' +
      '<p>You carry ' + WORDS[n] + '.' + (n === 5 ? ' Read together, they might point somewhere.' : '') + '</p>' +
      '<div class="wy-row"><button class="wy-go" data-wy-close>Fold it away</button></div>', 'A fragment');
  }
  function signs() {
    var s = state(), name = DEEP[here()]; if (!name) { return; }
    if (!s.drift[name]) { s.drift[name] = today(); put(KEY, s); }
    if (Object.keys(s.drift).length < 3) { return; }
    addCss();
    var btn = document.createElement('button');
    btn.className = 'wy-sign' + (s.frags[name] ? ' kept' : ''); btn.type = 'button';
    btn.setAttribute('aria-label', 'A faint sign'); btn.innerHTML = GLYPH;
    btn.addEventListener('click', function () {
      var st = state(); if (!st.frags[name]) { st.frags[name] = today(); put(KEY, st); btn.classList.add('kept'); }
      showFragment(name);
    });
    document.body.appendChild(btn);
    var frac = SPOT[name];
    var tick = function () { placeSign(btn, frac); };
    setTimeout(tick, 600); setTimeout(tick, 1800); setInterval(tick, 2500);
    window.addEventListener('resize', tick);
  }

  // ---- the mist at the River's far edge ----
  var tries = 0;
  var NOTYET = ['The mist thickens. Perhaps you know too much.', 'The mist curls around your answer, and lets it go.', 'Fog has never been impressed by certainty.', 'The mist waits. It is very good at waiting.'];
  function accepts(a) {
    a = String(a || '').trim().toLowerCase().replace(/[’']/g, '');
    if (!a) { return false; }
    if (/^[?.…\s]+$/.test(a)) { return true; }
    return /(dont know|do not know|dunno|not know|no idea|unknow|nothing|not yet|who knows|nobody knows|no one knows|noone knows|mystery|not sure|unsure|uncertain|i wonder|wonder|silence|listen)/.test(a);
  }
  function through() {
    markArrived();
    try { sessionStorage.setItem('rr.wyrd.through', '1'); } catch (e) {}
    location.href = '/wyrd-bay';
  }
  function atMist() {
    if (arrived()) { through(); return; }
    var s = state(), n = held(s);
    if (n === 0) {
      openNote('<p class="wy-f" style="font-size:18px">Only the sound of water, and something just out of hearing.</p><div class="wy-row"><button class="wy-soft" data-wy-close>Drift on</button></div>', 'Mist');
      return;
    }
    var lines = ORDER.map(function (k) { return s.frags[k] ? '<span>' + esc(FRAG[k]) + '</span>' : '<span class="wy-gap">…</span>'; }).join('');
    if (n < 5) {
      openNote('<div class="wy-k">The mist</div><div class="wy-lines">' + lines + '</div><p>The mist stirs, but you hear only part of what it is saying.</p><div class="wy-row"><button class="wy-soft" data-wy-close>Drift on</button></div>', 'Mist');
      return;
    }
    var el = openNote('<div class="wy-k">The mist</div><div class="wy-lines">' + lines + '</div>' +
      '<label for="wy-ans" style="display:block;font-size:16px;margin-bottom:4px">The mist asks: <i>what do you know?</i></label>' +
      '<input id="wy-ans" autocomplete="off" maxlength="120">' +
      '<p class="wy-reply" aria-live="polite" style="min-height:1.5em;font-style:italic"></p>' +
      '<div class="wy-row"><button class="wy-go wy-answer">Answer</button><button class="wy-soft" data-wy-close>Not now</button></div>', 'The mist asks a question');
    var input = el.querySelector('#wy-ans'), reply = el.querySelector('.wy-reply'), go = el.querySelector('.wy-answer');
    var answer = function () {
      if (accepts(input.value)) {
        reply.textContent = 'The mist opens. Somewhere ahead, a lantern.';
        go.textContent = 'Go through'; go.onclick = through; input.disabled = true; try { go.focus(); } catch (e) {}
        return;
      }
      reply.textContent = NOTYET[tries % NOTYET.length] + (tries >= 2 ? ' What would a mist say, if asked what it knows?' : '');
      tries += 1;
    };
    go.onclick = answer;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go.onclick(); } });
  }

  window.RiverWyrd = { arrived: arrived, atMist: atMist, markArrived: markArrived, still: still };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', signs); } else { signs(); }
})();
