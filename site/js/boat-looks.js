/*
 * Your Boat's look, and the keepsakes it gathers.
 *
 * Thirteen Boats to choose from (and change whenever you like). Keepsakes appear aboard
 * on their own, mostly when you come back from time spent with the living world and
 * write a note about it. Nothing here is scored or compared. It simply shows what your
 * Boat has carried.
 */
(function () {
  'use strict';
  var INK = '#2F2B28';
  var WATER = '<path d="M2 41 C 12 37, 20 45, 32 41 S 52 37, 62 41" fill="none" stroke="#9FD3DC" stroke-width="2" stroke-linecap="round"/>';
  function mast(x, y1, y2) { return '<path d="M' + x + ' ' + y1 + ' L' + x + ' ' + y2 + '" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/>'; }
  var S = ' stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"';

  // a: anchors for keepsakes: m = mast top, b = bow, h = middle of the hull, s = sail
  var LOOKS = [
    { id: 'river', name: 'The River’s own', line: 'A small wooden sloop with a sky-blue jib and a golden sail. Where many journeys begin.',
      art: '<path d="M6 30 C 13 40, 49 41, 58 29 Z" fill="#F5EEE1"' + S + '/>' + mast(33, 5, 30) + '<path d="M35 8 C 46 15, 51 23, 53 28 L35 28 Z" fill="#E8C77A"' + S + '/><path d="M31 12 C 24 17, 20 23, 17 28 L31 28 Z" fill="#CFE1E4"' + S + '/>',
      a: { m: [33, 5], b: [56, 30], h: [32, 35], s: [44, 21] } },
    { id: 'reed', name: 'Reed skiff', line: 'Bundled reeds with upturned ends, like the oldest boats on many rivers.',
      art: '<path d="M4 25 C 10 37, 52 38, 60 23 C 55 31, 10 32, 4 25 Z" fill="#C9B46A"' + S + '/><g stroke="#6B5A2A" stroke-width="1.2" stroke-linecap="round"><path d="M16 30 L16 34"/><path d="M26 31 L26 35"/><path d="M38 31 L38 35"/><path d="M48 30 L48 34"/></g>' + mast(32, 8, 31) + '<path d="M23 10 L41 10 L40 26 L24 26 Z" fill="#DCE6D2"' + S + '/><path d="M23.5 16 L40.6 16 M23.8 21 L40.3 21" stroke="#8FB27A" stroke-width="1"/>',
      a: { m: [32, 8], b: [59, 24], h: [32, 33], s: [32, 18] } },
    { id: 'driftwood', name: 'Driftwood dory', line: 'Weathered timbers the sea has already carried, with a patched sail.',
      art: '<path d="M6 30 C 14 40, 50 40, 58 30 L54 28 L10 28 Z" fill="#A08A70"' + S + '/><path d="M12 32 C 24 35, 40 35, 52 32" fill="none" stroke="#6E5B48" stroke-width="1"/>' + mast(32, 4, 28) + '<path d="M34 6 C 44 13, 49 21, 51 27 L34 27 Z" fill="#F2EAD8"' + S + '/><path d="M38 16 L44 17 L43 22 L37 21 Z" fill="#F2D3BC" stroke="' + INK + '" stroke-width="1"/>',
      a: { m: [32, 4], b: [57, 29], h: [32, 34], s: [41, 20] } },
    { id: 'leaf', name: 'Leaf boat', line: 'A fallen leaf, curled just enough to float. Light, and very patient.',
      art: '<path d="M4 30 C 16 22, 46 22, 60 30 C 46 40, 16 40, 4 30 Z" fill="#8FB27A"' + S + '/><path d="M6 30 C 24 31, 40 31, 58 30" fill="none" stroke="#4F7A3F" stroke-width="1.3"/><path d="M22 30.5 L18 26 M32 30.6 L29 25.5 M42 30.4 L40 25.8 M26 30.6 L23 35 M38 30.5 L36 35.2" stroke="#4F7A3F" stroke-width="1"/><path d="M14 30 C 13 22, 15 14, 18 8" fill="none" stroke="#4F7A3F" stroke-width="2" stroke-linecap="round"/><path d="M18 8 C 24 6, 26 10, 22 13 C 19 13, 18 11, 18 8 Z" fill="#B7D39A"' + S + '/>',
      a: { m: [18, 8], b: [58, 30], h: [32, 34], s: [36, 27] } },
    { id: 'paper', name: 'Paper boat', line: 'Folded from a page you were finished with, and set loose in a gutter stream.',
      art: '<path d="M6 28 L58 28 L50 38 L14 38 Z" fill="#FBF7EF"' + S + '/><path d="M20 28 L32 8 L44 28 Z" fill="#FFFFFF"' + S + '/><path d="M32 8 L32 28" stroke="#8C8178" stroke-width="1"/><path d="M6 28 L14 22 L20 28 Z" fill="#F1EADB"' + S + '/><path d="M58 28 L50 22 L44 28 Z" fill="#F1EADB"' + S + '/>',
      a: { m: [32, 8], b: [56, 30], h: [32, 34], s: [32, 21] } },
    { id: 'seedpod', name: 'Seed pod', line: 'A split pod with a silken seed for a sail, ready to go wherever the wind agrees.',
      art: '<path d="M6 30 C 10 40, 54 40, 58 30 C 50 34, 14 34, 6 30 Z" fill="#B98B5E"' + S + '/><g fill="#6E4E32"><circle cx="20" cy="34" r="1.4"/><circle cx="28" cy="35" r="1.4"/><circle cx="36" cy="35" r="1.4"/><circle cx="44" cy="34" r="1.4"/></g>' + mast(30, 6, 31) + '<path d="M31 8 C 44 10, 50 20, 48 28 L31 28 Z" fill="#FBF7EF"' + S + '/><path d="M31 12 L44 16 M31 17 L47 21 M31 22 L48 25" stroke="#D8CFC0" stroke-width="0.9"/>',
      a: { m: [30, 6], b: [57, 30], h: [32, 35], s: [40, 20] } },
    { id: 'coracle', name: 'Coracle', line: 'A round woven bowl, turning slowly. It goes where it goes, and that is the point.',
      art: '<path d="M10 28 C 10 42, 54 42, 54 28 Z" fill="#8C6E4E"' + S + '/><path d="M14 31 L50 31 M12 35 L52 35 M22 28 L24 39 M32 28 L32 40 M42 28 L40 39" stroke="#5A4632" stroke-width="1"/><path d="M10 28 C 20 25, 44 25, 54 28" fill="none"' + S + '/><path d="M44 30 L50 6" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/><path d="M49 5 C 53 4, 54 10, 51 13 C 48 13, 47 9, 49 5 Z" fill="#C9A27A"' + S + '/>',
      a: { m: [50, 6], b: [54, 29], h: [32, 34], s: [24, 33] } },
    { id: 'moon', name: 'Moon barque', line: 'A silver crescent hull and a sail the colour of the night between stars.',
      art: '<path d="M4 26 C 12 42, 52 42, 60 26 C 50 36, 14 36, 4 26 Z" fill="#D7DCE8"' + S + '/>' + mast(32, 4, 30) + '<path d="M34 6 C 46 12, 52 22, 54 28 L34 28 Z" fill="#2E3A7A"' + S + '/><path d="M30 10 C 22 16, 18 22, 16 28 L30 28 Z" fill="#B9A7E8"' + S + '/><g fill="#F5EEE1"><circle cx="40" cy="14" r="0.9"/><circle cx="46" cy="21" r="1.1"/><circle cx="38" cy="23" r="0.8"/></g>',
      a: { m: [32, 4], b: [59, 27], h: [32, 35], s: [43, 18] } },
    { id: 'lantern', name: 'Lantern sloop', line: 'A ribbed coral sail and a lantern at the stern, for travelling after dusk.',
      art: '<path d="M6 29 C 12 39, 52 39, 58 27 L52 27 L8 29 Z" fill="#8E4A3A"' + S + '/>' + mast(26, 4, 30) + '<path d="M26 6 L46 9 L48 28 L26 28 Z" fill="#F0A07A"' + S + '/><path d="M26 11 L46.5 13 M26 16 L47 17.5 M26 21 L47.5 22.5" stroke="' + INK + '" stroke-width="1"/><path d="M12 22 L12 25" stroke="' + INK + '" stroke-width="1"/><circle cx="12" cy="27" r="5" fill="#FFD98A" opacity="0.3"/><circle cx="12" cy="27" r="2.4" fill="#FFD98A" stroke="' + INK + '" stroke-width="0.8"/>',
      a: { m: [26, 4], b: [57, 28], h: [32, 34], s: [37, 17] } },
    { id: 'shell', name: 'Shell boat', line: 'A cockle shell with a petal for a sail. Small enough to notice everything.',
      art: '<path d="M8 30 C 10 42, 54 42, 56 30 Z" fill="#F2D3BC"' + S + '/><path d="M16 31 L20 39 M24 30.5 L26 40 M32 30 L32 40.5 M40 30.5 L38 40 M48 31 L44 39" stroke="#C89A7E" stroke-width="1"/>' + mast(32, 8, 30) + '<path d="M33 9 C 46 12, 48 24, 33 28 Z" fill="#E8B7C8"' + S + '/>',
      a: { m: [32, 8], b: [55, 31], h: [32, 35], s: [39, 19] } },
    { id: 'raft', name: 'Log raft', line: 'Two logs lashed together and a broad leaf for a sail. Unhurried, and steady.',
      art: '<rect x="6" y="28" width="52" height="5" rx="2.5" fill="#9C744C"' + S + '/><rect x="8" y="33" width="48" height="5" rx="2.5" fill="#B08758"' + S + '/><path d="M14 27 L14 39 M50 27 L50 39" stroke="#5A4632" stroke-width="1.4"/>' + mast(32, 6, 28) + '<path d="M33 7 C 48 10, 50 22, 33 27 C 38 20, 38 13, 33 7 Z" fill="#8FB27A"' + S + '/><path d="M33 8 C 38 14, 39 20, 34 26" fill="none" stroke="#4F7A3F" stroke-width="1"/>',
      a: { m: [32, 6], b: [57, 30], h: [32, 33], s: [41, 17] } },
    { id: 'feather', name: 'Feather boat', line: 'A feather found on a walk, set upright as a sail, in kinship with the birds.',
      art: '<path d="M10 31 C 16 39, 48 39, 54 31 Z" fill="#2C4A5A"' + S + '/><path d="M30 31 C 30 20, 34 10, 40 3" fill="none" stroke="' + INK + '" stroke-width="1.6" stroke-linecap="round"/><path d="M40 3 C 50 8, 50 22, 31 29 C 30 20, 33 10, 40 3 Z" fill="#CFE1E4"' + S + '/><path d="M34 22 L44 16 M33 26 L46 20 M36 14 L44 9" stroke="#8FB8C4" stroke-width="0.9"/>',
      a: { m: [40, 3], b: [53, 32], h: [32, 35], s: [40, 16] } },
    { id: 'fern', name: 'Fern sloop', line: 'A forest-green hull and a sail with a fern frond unfurling across it.',
      art: '<path d="M6 30 C 13 40, 51 40, 58 29 Z" fill="#3E6B5A"' + S + '/>' + mast(33, 5, 30) + '<path d="M35 6 C 46 14, 50 22, 52 28 L35 28 Z" fill="#DCE6D2"' + S + '/><path d="M37 26 C 41 20, 43 14, 38 8" fill="none" stroke="#4F7A3F" stroke-width="1.3"/><path d="M39 24 L44 22 M40 20 L45 18 M40.5 16 L44.5 14 M39.5 12 L42.5 10" stroke="#4F7A3F" stroke-width="1.2" stroke-linecap="round"/>',
      a: { m: [33, 5], b: [57, 30], h: [32, 35], s: [44, 20] } }
  ];
  var BY = {}; LOOKS.forEach(function (l) { BY[l.id] = l; });

  var KEEPSAKES = [
    { id: 'pennant', name: 'A pennant', how: 'flown when you first come back from a practice and write a note about it' },
    { id: 'lantern', name: 'A bow lantern', how: 'lit after three notes from practices you have tried out in the world' },
    { id: 'crescent', name: 'A crescent on the sail', how: 'appears after your first night of Making with Moon in your lunar journal' },
    { id: 'star', name: 'A guiding star', how: 'rises once five Beings, places or people shine in your constellation' },
    { id: 'ripples', name: 'A wake of ripples', how: 'trails behind once your Boat has visited seven waters of the River' },
    { id: 'garland', name: 'A green garland', how: 'woven after seven notes from time spent with the living world' },
    { id: 'spiral', name: 'A small spiral', how: 'you will know where it came from', secret: true }
  ];

  function keepsakesFor(b) {
    if (!b) { return []; }
    var notes = 0; (b.tending || []).forEach(function (t) { notes += (t && t.notes ? t.notes.length : 0); });
    var waters = {}; (b.wake || []).forEach(function (w) { if (w && w.w) { waters[w.w] = 1; } });
    var has = {
      pennant: notes >= 1, lantern: notes >= 3, garland: notes >= 7,
      crescent: (b.moons || []).length >= 1, star: (b.stars || []).length >= 5,
      ripples: Object.keys(waters).length >= 7, spiral: !!(b.wyrd && b.wyrd.arrived)
    };
    return KEEPSAKES.filter(function (k) { return has[k.id]; }).map(function (k) { return k.id; });
  }

  function keepArt(k, a) {
    var m = a.m, bw = a.b, h = a.h, s = a.s;
    if (k === 'pennant') { return '<path d="M' + m[0] + ' ' + m[1] + ' l9 2.6 -9 2.6 z" fill="#E8C77A" stroke="' + INK + '" stroke-width="0.9" stroke-linejoin="round"/>'; }
    if (k === 'lantern') { return '<path d="M' + bw[0] + ' ' + bw[1] + ' l2 -6" stroke="' + INK + '" stroke-width="1"/><circle cx="' + (bw[0] + 2) + '" cy="' + (bw[1] - 7.5) + '" r="5" fill="#FFD98A" opacity="0.35"/><circle cx="' + (bw[0] + 2) + '" cy="' + (bw[1] - 7.5) + '" r="2.3" fill="#FFD98A" stroke="' + INK + '" stroke-width="0.8"/>'; }
    if (k === 'garland') { var g = ''; [-14, -7, 0, 7, 14].forEach(function (d, i) { g += '<ellipse cx="' + (h[0] + d) + '" cy="' + (h[1] - (i % 2)) + '" rx="2" ry="1.2" fill="' + (i % 2 ? '#8FB27A' : '#4F7A3F') + '"/>'; }); return '<path d="M' + (h[0] - 16) + ' ' + h[1] + ' C ' + (h[0] - 6) + ' ' + (h[1] + 2) + ', ' + (h[0] + 6) + ' ' + (h[1] + 2) + ', ' + (h[0] + 16) + ' ' + h[1] + '" fill="none" stroke="#4F7A3F" stroke-width="0.8"/>' + g; }
    if (k === 'crescent') { return '<path d="M' + s[0] + ' ' + (s[1] - 3.2) + ' a3.2 3.2 0 1 0 0 6.4 a2.4 2.4 0 1 1 0 -6.4 z" fill="#F5EEE1" stroke="' + INK + '" stroke-width="0.6"/>'; }
    if (k === 'star') { var x = m[0] - 7, y = m[1] - 1; return '<path d="M' + x + ' ' + (y - 3.5) + ' L' + (x + 1) + ' ' + (y - 1) + ' L' + (x + 3.5) + ' ' + y + ' L' + (x + 1) + ' ' + (y + 1) + ' L' + x + ' ' + (y + 3.5) + ' L' + (x - 1) + ' ' + (y + 1) + ' L' + (x - 3.5) + ' ' + y + ' L' + (x - 1) + ' ' + (y - 1) + ' Z" fill="#F5EEE1" stroke="#E8C77A" stroke-width="0.6"/>'; }
    if (k === 'ripples') { return '<path d="M-8 44 C -5 42.5, -2 45.5, 1 44" fill="none" stroke="#9FD3DC" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/><path d="M-6 47 C -3 45.5, 0 48.5, 3 47" fill="none" stroke="#9FD3DC" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>'; }
    if (k === 'spiral') { var cx = s[0] - 5, cy = s[1] + 5; return '<path d="M' + cx + ' ' + (cy - 2.6) + ' C ' + (cx + 2.6) + ' ' + (cy - 2.6) + ', ' + (cx + 3) + ' ' + (cy + 2) + ', ' + cx + ' ' + (cy + 2) + ' C ' + (cx - 1.8) + ' ' + (cy + 2) + ', ' + (cx - 1.8) + ' ' + (cy - 0.6) + ', ' + (cx - 0.2) + ' ' + (cy - 0.4) + '" fill="none" stroke="#E8C77A" stroke-width="0.9" stroke-linecap="round"/>'; }
    return '';
  }

  function inner(id, keeps) {
    var l = BY[id] || BY.river, out = WATER + l.art;
    (keeps || []).forEach(function (k) { out += keepArt(k, l.a); });
    return out;
  }
  function svg(id, keeps, opts) {
    opts = opts || {};
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -6 78 56"' + (opts.cls ? ' class="' + opts.cls + '"' : '') + ' aria-hidden="true">' + inner(id, keeps) + '</svg>';
  }
  function uri(id, keeps) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(id, keeps)); }
  function current() { try { var b = JSON.parse(localStorage.getItem('rr.boat.v1') || 'null'); return b && b.v === 1 ? b : null; } catch (e) { return null; } }
  function lookOf(b) { return b && BY[b.look] ? b.look : 'river'; }

  window.RiverBoatLooks = { LOOKS: LOOKS, KEEPSAKES: KEEPSAKES, keepsakesFor: keepsakesFor, inner: inner, svg: svg, uri: uri, current: current, lookOf: lookOf, byId: function (id) { return BY[id] || BY.river; } };
})();
