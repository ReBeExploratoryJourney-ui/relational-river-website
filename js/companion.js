/*
 * Your Boat, travelling with you.
 *
 * A small companion in the corner of each water: your own Boat (its look and keepsakes),
 * where you are on the River, and a short menu for the way back to your Boat or the whole
 * River. If you have no Boat, a soft outline offers to build one, and never insists.
 * It can be tucked away at any time.
 */
(function () {
  'use strict';
  var SKIP = { '/': 1, '/boat': 1, '/scroll': 1, '/lunar-journal': 1 };
  var WHERE = {
    '/flow': 'on the whole River', '/source': 'at the Source', '/springs': 'at the Springs', '/streams': 'in the Streams',
    '/tributaries': 'in the Tributaries', '/eddies': 'in the Eddies', '/lakes': 'on the Lakes', '/islands': 'by the Islands of coherence',
    '/waterfall': 'at the Waterfall', '/local-currents': 'in the Local currents', '/channels': 'in the Channels', '/estuary': 'in the Estuary',
    '/confluences': 'at the Confluences', '/capital-journey': 'on the Capital journey', '/ocean': 'out on the Ocean', '/groundwater': 'over the Groundwater',
    '/well': 'at the Well', '/moon': 'under Moon', '/harbour': 'in the Harbour', '/canal': 'on the Canal', '/ways-of-seeing': 'among the Ways of seeing',
    '/hylo': 'gathering on Hylo', '/ai': 'reading how the River uses AI', '/privacy': 'reading the privacy promise', '/wyrd-bay': 'in Wyrd Bay'
  };
  var TKEY = 'rr.companion.tucked';
  function here() { return (location.pathname || '').replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '') || '/'; }
  if (SKIP[here()]) { return; }
  function boat() { try { var b = JSON.parse(localStorage.getItem('rr.boat.v1') || 'null'); return b && b.v === 1 ? b : null; } catch (e) { return null; } }
  function tucked() { try { return localStorage.getItem(TKEY) === '1'; } catch (e) { return false; } }
  function setTucked(v) { try { if (v) { localStorage.setItem(TKEY, '1'); } else { localStorage.removeItem(TKEY); } } catch (e) {} }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var css = '' +
    '.rc{position:fixed;right:16px;bottom:16px;z-index:50;font-family:Jost,sans-serif;display:flex;flex-direction:column;align-items:flex-end;gap:10px;transition:opacity .4s ease}' +
    '.rc.rc-hide{opacity:0;pointer-events:none}' +
    '.rc-boat{display:flex;align-items:center;gap:8px;min-height:52px;padding:4px 16px 4px 6px;background:rgba(14,30,58,.9);color:#EFE6D2;border:1.5px solid rgba(159,211,220,.55);border-radius:28px 34px 26px 36px;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.35);text-align:left}' +
    '.rc-boat:hover{border-color:#9FD3DC}' +
    '.rc-boat:focus-visible,.rc-menu a:focus-visible,.rc-menu button:focus-visible{outline:2px dashed #9FD3DC;outline-offset:3px}' +
    '.rc-art{width:64px;height:46px;display:block;flex:0 0 64px;border-radius:50%;background:radial-gradient(ellipse at 50% 58%,rgba(239,230,210,.3),rgba(239,230,210,0) 70%)}' +
    '.rc-art svg{display:block;width:100%;height:100%;overflow:visible}' +
    '@keyframes rcbob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2px) rotate(-1.5deg)}}' +
    '.rc-art svg{animation:rcbob 4.2s ease-in-out infinite}' +
    '.rc-ghost .rc-art{opacity:.55}' +
    '.rc-label{display:flex;flex-direction:column;line-height:1.2;max-width:170px}' +
    '.rc-label b{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.rc-label i{font-size:12px;color:#C9D6E0}' +
    '.rc.rc-tucked .rc-boat{padding:4px;border-radius:50% 46% 52% 48%}' +
    '.rc.rc-tucked .rc-label{display:none}' +
    '.rc.rc-tucked .rc-art{width:44px;height:34px;flex-basis:44px}' +
    '@keyframes rcpulse{0%{box-shadow:0 0 0 0 rgba(232,199,122,.7)}100%{box-shadow:0 0 0 18px rgba(232,199,122,0)}}' +
    '.rc-pulse .rc-boat{animation:rcpulse 1.2s ease-out 2}' +
    '.rc-menu{width:min(290px,calc(100vw - 32px));background:#FBF7EF;color:#2F2B28;border-radius:18px 24px 16px 22px;padding:14px 14px 10px;box-shadow:0 18px 40px rgba(0,0,0,.45);display:flex;flex-direction:column;gap:2px}' +
    '.rc-menu[hidden]{display:none}' +
    '.rc-menu p{margin:0 6px 8px;font-size:14px;line-height:1.45;font-style:italic;color:#4A433D}' +
    '.rc-menu a,.rc-menu button{display:flex;align-items:center;min-height:44px;padding:0 10px;border-radius:10px;font-family:Jost,sans-serif;font-size:16px;color:#2F2B28;text-decoration:none;background:none;border:none;cursor:pointer;text-align:left;width:100%;box-sizing:border-box}' +
    '.rc-menu a:hover,.rc-menu button:hover{background:#EFE6D2}' +
    '.rc-menu a b{font-weight:600}' +
    '.rc-menu .rc-quiet{font-size:14px;color:#5A524B;text-decoration:underline}' +
    '@media (max-width:520px){.rc{right:10px;bottom:10px}.rc-label i{display:none}.rc-label{max-width:120px}}' +
    '@media print{.rc{display:none}}' +
    '@media (prefers-reduced-motion: reduce){.rc-art svg,.rc-pulse .rc-boat{animation:none}.rc{transition:none}}';

  var root, btn, menu, open = false;
  function art(b) {
    var L = window.RiverBoatLooks;
    if (!L) { return ''; }
    return b ? L.svg(L.lookOf(b), L.keepsakesFor(b)) : L.svg('river', []);
  }
  function render() {
    var b = boat(), where = WHERE[here()] || 'on the River', name = b ? (b.name || 'Your Boat') : 'Build your Boat';
    root.className = 'rc' + (b ? '' : ' rc-ghost') + (tucked() ? ' rc-tucked' : '') + (root.className.indexOf('rc-pulse') >= 0 ? ' rc-pulse' : '') + (root.className.indexOf('rc-hide') >= 0 ? ' rc-hide' : '');
    btn.innerHTML = '<span class="rc-art">' + art(b) + '</span><span class="rc-label"><b>' + esc(name) + '</b><i>' + esc(b ? where : 'never required') + '</i></span>';
    btn.setAttribute('aria-label', (b ? (b.name ? b.name + ', your Boat, ' : 'Your Boat, ') + where : 'No Boat yet. Build your Boat') + '. Open the Boat menu');
    var items = b ? [
      '<p>' + esc(b.name ? b.name + ' is ' + where + ' with you.' : 'Your Boat is ' + where + ' with you.') + '</p>',
      '<a href="/boat"><b>Open your Boat</b></a>',
      (b.wake && b.wake.length ? '<a href="/flow?voyage=1">Launch your Boat on the River</a>' : ''),
      '<a href="/flow">See the whole River</a>',
      '<button type="button" class="rc-quiet" data-rc="tuck">' + (tucked() ? 'Bring your Boat back into view' : 'Tuck your Boat away') + '</button>'
    ] : [
      '<p>A Boat can carry what you gather along the River: practices, Beings, keepsakes. It is never required.</p>',
      '<a href="/boat"><b>Build your Boat</b></a>',
      '<a href="/flow">See the whole River</a>',
      '<button type="button" class="rc-quiet" data-rc="tuck">' + (tucked() ? 'Bring this back into view' : 'Tuck this away') + '</button>'
    ];
    menu.innerHTML = items.join('');
    var t = menu.querySelector('[data-rc="tuck"]');
    if (t) { t.addEventListener('click', function () { setTucked(!tucked()); close(); render(); }); }
  }
  function close() { open = false; menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
  function toggle() { open = !open; menu.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); if (open) { var f = menu.querySelector('a'); if (f) { try { f.focus(); } catch (e) {} } } }
  function pulse() { render(); root.classList.add('rc-pulse'); setTimeout(function () { root.classList.remove('rc-pulse'); }, 2600); }

  function start() {
    if (!document.getElementById('rc-css')) { var st = document.createElement('style'); st.id = 'rc-css'; st.textContent = css; document.head.appendChild(st); }
    root = document.createElement('div'); root.className = 'rc';
    menu = document.createElement('div'); menu.className = 'rc-menu'; menu.hidden = true; menu.setAttribute('role', 'region'); menu.setAttribute('aria-label', 'Your Boat');
    btn = document.createElement('button'); btn.type = 'button'; btn.className = 'rc-boat'; btn.setAttribute('aria-expanded', 'false');
    root.appendChild(menu); root.appendChild(btn); document.body.appendChild(root);
    // Leave room at the foot of the page, so nothing ends up hidden beneath your Boat.
    var pad = parseInt(window.getComputedStyle(document.body).paddingBottom, 10) || 0; if (pad < 84) { document.body.style.paddingBottom = '84px'; }
    btn.addEventListener('click', toggle);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { close(); try { btn.focus(); } catch (x) {} } });
    document.addEventListener('click', function (e) { if (open && !root.contains(e.target)) { close(); } });
    window.addEventListener('storage', function (e) { if (e.key === 'rr.boat.v1') { render(); } });
    var rb = window.RiverBoat;
    if (rb && rb.touched && !rb._rcWrapped) { var orig = rb.touched; rb.touched = function () { var r = orig.apply(rb, arguments); setTimeout(pulse, 60); return r; }; rb._rcWrapped = true; }
    render();
    // Step aside while Raven is speaking, or a note from the River is open.
    setInterval(function () {
      var g = document.querySelector('.gbubble'), n = document.querySelector('.wy-note, .wy-entry');
      var busy = !!n; if (g && !busy) { var cs = window.getComputedStyle(g), r = g.getBoundingClientRect(); busy = cs.display !== 'none' && cs.visibility !== 'hidden' && r.height > 0; }
      root.classList.toggle('rc-hide', busy);
    }, 700);
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }
})();
