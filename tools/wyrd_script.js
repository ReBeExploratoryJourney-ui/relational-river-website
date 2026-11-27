class Component extends DCLogic {
  constructor(props) {
    super(props);
    var open = !!(window.RiverWyrd && window.RiverWyrd.arrived());
    this.state = { open: open, scene: '', qOpen: {}, show: 'all', quest: '', list: null, problem: '', reporting: '', reasons: {}, reported: {},
      m: { loaded: false, loading: false, card: null, name: '', thr: '', openTo: 'either', quest: '', hylo: '', agree: false, busy: false, msg: '' } };
  }
  componentDidMount() {
    var self = this, rb = window.RiverBoat;
    if (!this.state.open) { return; }
    var through = false; try { through = sessionStorage.getItem('rr.wyrd.through') === '1' || sessionStorage.getItem('rr.wyrd.seen') !== '1'; sessionStorage.removeItem('rr.wyrd.through'); sessionStorage.setItem('rr.wyrd.seen', '1'); } catch (x) {}
    if (through) { this.setState({ scene: 'pre' }); setTimeout(function () { self.crossing(); }, 30); }
    if (rb && rb.wyrdList) { rb.wyrdList().then(function (rows) { self.setState({ list: Array.isArray(rows) ? rows : [] }); }, function (e) { self.setState({ list: [], problem: e.message }); }); }
    else { this.setState({ list: [] }); }
    if (location.hash) { setTimeout(function () { var t = document.getElementById(location.hash.slice(1)); if (t && !through) { t.scrollIntoView(); } }, 400); }
  }

  // ---- the crossing: your Boat sails into the mist, the fog takes it, and the Bay is revealed ----
  crossing() {
    var self = this, still = !!(window.RiverWyrd && window.RiverWyrd.still());
    try { window.scrollTo(0, 0); } catch (x) {}
    var ov = document.createElement('div');
    ov.className = 'wy-entry'; ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = '<div class="we-sea"></div>' +
      '<svg class="we-lines" viewBox="0 0 1200 800" preserveAspectRatio="none"><g fill="none" stroke="#9FD3DC" stroke-linecap="round"><path d="M0 520 C 200 505, 400 535, 600 520 S 1000 505, 1200 522" stroke-opacity="0.35" stroke-width="1.4"></path><path d="M0 600 C 220 585, 420 615, 640 600 S 1000 585, 1200 602" stroke-opacity="0.28" stroke-width="1.2"></path><path d="M0 690 C 180 676, 380 704, 600 690 S 980 676, 1200 692" stroke-opacity="0.22" stroke-width="1.2"></path></g></svg>' +
      '<div class="we-boat"><svg viewBox="0 0 64 48"><path d="M2 41 C 12 37, 20 45, 32 41 S 52 37, 62 41" fill="none" stroke="#9FD3DC" stroke-width="2" stroke-linecap="round"/><path d="M6 30 C 13 40, 49 41, 58 29 Z" fill="#F5EEE1" stroke="#2F2B28" stroke-width="2" stroke-linejoin="round"/><path d="M33 5 L33 30" stroke="#2F2B28" stroke-width="2" stroke-linecap="round"/><path d="M35 8 C 46 15, 51 23, 53 28 L35 28 Z" fill="#E8C77A" stroke="#2F2B28" stroke-width="1.6" stroke-linejoin="round"/><path d="M31 12 C 24 17, 20 23, 17 28 L31 28 Z" fill="#CFE1E4" stroke="#2F2B28" stroke-width="1.6" stroke-linejoin="round"/></svg></div>' +
      '<div class="we-fog f1"></div><div class="we-fog f2"></div><div class="we-fog f3"></div><div class="we-thick"></div>' +
      '<p class="we-word">Not knowing, you go on.</p>';
    var skip = document.createElement('button');
    skip.className = 'we-skip'; skip.type = 'button'; skip.textContent = 'Skip the fog';
    document.body.appendChild(ov); ov.appendChild(skip);
    var prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    var boat = ov.querySelector('.we-boat'), thick = ov.querySelector('.we-thick'), word = ov.querySelector('.we-word');
    var fogs = ov.querySelectorAll('.we-fog');
    var done = false, start = null;
    var ease = function (u) { u = Math.max(0, Math.min(1, u)); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
    var span = function (t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); };
    var mask = function (r) { var v = r <= 0 ? 'none' : 'radial-gradient(circle at 50% 38%, transparent ' + r + '%, #000 ' + (r + 22) + '%)'; ov.style.webkitMaskImage = v; ov.style.maskImage = v; };
    var finish = function () {
      if (done) { return; } done = true;
      ov.remove(); document.body.style.overflow = prevOverflow; document.removeEventListener('keydown', onKey);
      self.setState({ scene: still ? '' : 'bloom' });
      setTimeout(function () { var h = document.querySelector('.bayh1'); if (h) { try { h.focus({ preventScroll: true }); } catch (x) {} } }, 60);
    };
    var onKey = function (e) { if (e.key === 'Escape') { finish(); } };
    document.addEventListener('keydown', onKey);
    skip.addEventListener('click', finish);
    try { skip.focus(); } catch (x) {}
    var W = function () { return window.innerWidth; }, H = function () { return window.innerHeight; };
    if (still) {
      // A calm, still crossing: the Boat rests in the mist, then the mist clears.
      boat.style.transform = 'translate(' + (W() * 0.45) + 'px,' + (H() * 0.6) + 'px)';
      thick.style.opacity = '0.55'; word.style.opacity = '1';
      var stillStep = function (ts) {
        if (done) { return; } if (start === null) { start = ts; }
        var t = (ts - start) / 1000;
        if (t > 2.2) { ov.style.opacity = String(1 - span(t, 2.2, 3.4)); }
        if (t >= 3.4) { finish(); return; }
        requestAnimationFrame(stillStep);
      };
      requestAnimationFrame(stillStep);
      return;
    }
    var bloomed = false;
    var step = function (ts) {
      if (done) { return; } if (start === null) { start = ts; }
      var t = (ts - start) / 1000;
      var u = ease(span(t, 0.2, 4.6));
      var x = W() * (0.06 + 0.42 * u), y = H() * (0.76 - 0.16 * u) + Math.sin(t * 2.1) * 4;
      var sc = 1 - 0.38 * u, rot = Math.sin(t * 1.6) * 2.5;
      boat.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + sc + ') rotate(' + rot + 'deg)';
      boat.style.opacity = String(1 - span(t, 2.6, 4.4));
      fogs[0].style.transform = 'translateX(' + (-t * 14) + 'px)';
      fogs[1].style.transform = 'translateX(' + (t * 18) + 'px)';
      fogs[2].style.transform = 'translate(' + (-t * 9) + 'px,' + (-t * 4) + 'px)';
      thick.style.opacity = String(Math.pow(span(t, 1.2, 4.7), 1.6));
      word.style.opacity = String(span(t, 4.4, 5.0) * (1 - span(t, 5.7, 6.2)));
      if (t >= 6.0) {
        var r = 160 * ease(span(t, 6.0, 8.6));
        mask(r);
        if (!bloomed) { bloomed = true; self.setState({ scene: 'bloom' }); }
      }
      if (t >= 8.8) { finish(); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---- Your Boat (kept on this device, and with an account if you chose that) ----
  boatRead() { try { var b = JSON.parse(localStorage.getItem('rr.boat.v1') || 'null'); return b && b.v === 1 ? b : null; } catch (x) { return null; } }
  boatHas(list, id) { var b = this.boatRead(); return !!(b && Array.isArray(b[list]) && b[list].some(function (g) { return g && g.id === id; })); }
  boatToggle(list, item) {
    var b = this.boatRead();
    if (!b) { try { sessionStorage.setItem('rr.boat.pending', JSON.stringify({ list: list, item: item })); } catch (x) {} window.location.href = 'Boat.dc.html'; return; }
    if (!Array.isArray(b[list])) { b[list] = []; }
    var had = b[list].some(function (g) { return g && g.id === item.id; });
    if (had && list === 'tending') { window.location.href = 'Boat.dc.html#tending'; return; }
    b[list] = b[list].filter(function (g) { return !g || g.id !== item.id; });
    if (!had) { var now = new Date().toISOString(), it = {}; for (var k in item) { it[k] = item[k]; } it.at = now; if (list === 'tending') { it.since = now; it.notes = []; } b[list].push(it); }
    b.dirty = true;
    try { localStorage.setItem('rr.boat.v1', JSON.stringify(b)); } catch (x) {}
    if (window.RiverBoat) { window.RiverBoat.touched(); }
    this.setState({ boatTick: (this.state.boatTick || 0) + 1 });
  }
  aboardFor(list, item) {
    var self = this, on = this.boatHas(list, item.id), tend = list === 'tending';
    return { aboardOn: on ? 'true' : 'false', aboardHint: tend && !on ? 'Once you have begun this quest, you can stow it in your Boat and keep tending it there.' : '', aboardLabel: on ? (tend ? 'Stowed in your Boat' : 'Aboard your Boat') : (tend ? 'Stow this quest in your Boat' : 'Bring aboard'), aboard: function () { self.boatToggle(list, item); } };
  }

  renderVals() {
    var self = this, s = this.state;
    if (!s.open) { return { veiled: true, open: false }; }
    var MODE = { alone: 'Alone', together: 'Together', either: 'Alone or together' };
    var Q = [
      { id: 'anomaly', mode: 'alone', title: 'Follow an anomaly', text: 'Notice something that does not fit: in your work, a place you know well, a conversation that went strangely. Resist fixing it. Follow it instead.', steps: ['Name the anomaly in a sentence, without explaining it.', 'For a week, notice when and where it shows up again, and what it seems to interrupt.', 'At the week’s end, ask what pattern it revealed by not fitting.'] },
      { id: 'threshold-dusk', mode: 'alone', title: 'Walk a threshold at dusk', text: 'Choose a boundary place: a shoreline, the edge of a wood, a bridge, a doorway between seasons. Arrive just before dusk and stay until the light has changed.', steps: ['Go without headphones, and leave your phone in a pocket.', 'Stand where one thing becomes another, and notice what you notice.', 'As the light turns, notice what turns in you. Write a line or two before you leave.'] },
      { id: 'name-becoming', mode: 'either', title: 'Name what is becoming', text: 'Something not yet formed may be trying to emerge around you. Give it a working name, hold it lightly, and see who else recognises it.', steps: ['Describe what you sense, as if to a friend, without deciding what it is.', 'Give it a playful working name, one you are willing to change.', 'Say the name to two or three people, and listen to what it calls up in them.'] },
      { id: 'council-unknowing', mode: 'together', title: 'A council of unknowing', text: 'Gather three to five people. Each brings a question they cannot answer. For an hour, nobody offers solutions: you may only ask further questions.', steps: ['Sit in a circle and begin with a minute of quiet.', 'One at a time, offer your question, and let the others respond only with questions.', 'Close by each naming one thing that shifted, however small.'] },
      { id: 'oblique-steps', mode: 'together', title: 'Oblique steps', text: 'With a companion, choose a situation that feels stuck. Rather than forcing it, each of you takes one small sideways action a week, tending the conditions instead of the outcome.', steps: ['Describe the stuckness to each other in plain words.', 'Each week, try one small action that changes the conditions: who meets, where, in what order, with what question.', 'Compare notes. What moved, even slightly, and from where?'] },
      { id: 'system-weather', mode: 'either', title: 'Read the weather of a system', text: 'Spend a day noticing a team, family or neighbourhood the way you would notice weather: pressure, warmth, where things gather, where they will not go.', steps: ['Choose the system, and a day to watch it with soft attention.', 'Sketch its weather: fronts, still pockets, sudden squalls.', 'Ask what the weather might be asking for, without rushing to change it.'] },
      { id: 'wyrd-log', mode: 'alone', title: 'Keep a wyrd log for one moon', text: 'From one new moon to the next, note synchronicities, odd timings and small surprises, without explaining them away.', steps: ['Begin on a new moon. You can find the next one on the Moon page.', 'Each day, note anything uncanny, strangely timed or quietly delightful.', 'At the next new moon, read it all back and see what the month was weaving.'] },
      { id: 'story-being', mode: 'alone', title: 'Trade a story with a Being', text: 'Tell a tree, river, boulder or bird a story you are living. Then stay long enough to receive one back, in whatever form it comes.', steps: ['Go to a Being you already feel some kinship with.', 'Tell them, aloud or silently, what you are in the middle of.', 'Sit and listen with your whole body. Note what you receive, even if it is only a feeling or a change in the wind.'] }
    ];
    var QTITLE = {}; Q.forEach(function (q) { QTITLE[q.id] = q.title; });
    var list = s.list || [];
    var seekers = {}; list.forEach(function (h) { if (h.quest && h.open_to !== 'alone') { seekers[h.quest] = (seekers[h.quest] || 0) + 1; } });
    var BGQ = ['#D9D3EA', '#CFE1E4', '#EDE3CC', '#DCE6D2', '#F2D3BC', '#E6E2F2'];
    var quests = Q.map(function (q, i) {
      var open = !!s.qOpen[q.id], ab = self.aboardFor('tending', { id: 'wyrd:' + q.id, title: q.title, kind: 'Quest · Wyrd Bay', href: 'WyrdBay.dc.html#quests', cta: 'Return to the quest' });
      var n = seekers[q.id] || 0;
      return { tilt: i % 2 ? 'tr' : 'tl', bg: BGQ[i % BGQ.length], mode: MODE[q.mode], title: q.title, text: q.text, steps: q.steps, open: open, openAttr: open ? 'true' : 'false', toggleLabel: open ? 'Fold the quest away' : 'The quest',
        toggle: function () { var o = {}; for (var k in self.state.qOpen) { o[k] = self.state.qOpen[k]; } o[q.id] = !open; self.setState({ qOpen: o }); },
        hasSeekers: n > 0, seekLabel: n === 1 ? 'One Wyrd Worker seeks companions for this' : n + ' Wyrd Workers seek companions for this',
        seeSeekers: function () { self.setState({ quest: q.id, show: 'all' }); setTimeout(function () { var t = document.getElementById('moorings'); if (t) { t.scrollIntoView({ behavior: window.RiverWyrd && window.RiverWyrd.still() ? 'auto' : 'smooth' }); } }, 50); },
        hasHint: !!ab.aboardHint, aboardHint: ab.aboardHint, aboardOn: ab.aboardOn, aboardLabel: ab.aboardLabel, aboard: ab.aboard };
    });
    var F = [
      { id: 'foxwizard', kind: 'Podcast · museletter · programmes', title: 'Wyrd Work with Dr Fox', by: 'Dr Jason Fox', text: 'Jason describes wyrd work as carefully cultivating, and sometimes disturbing, the conditions of an entangled system so that emergence can quicken. His podcast and museletter offer wit, wisdom and wiles for liminal agents and all who quest, with a playful, mythic voice and real depth. The first lantern on this shore.', links: [['The podcast', 'https://www.foxwizard.com/podcast/'], ['The museletter', 'https://www.foxwizard.com/museletter/'], ['foxwizard.com', 'https://www.foxwizard.com/']] },
      { id: 'way-of-wyrd', kind: 'Book · 1983, reissued 2013', title: 'The Way of Wyrd', by: 'Brian Bates', text: 'A novel built on years of research into Anglo-Saxon magical and medical manuscripts, in which a young scribe is apprenticed to a sorcerer and learns to see the world as a web of wyrd. Read it as story rather than history, as some readers question how much of the initiation can be evidenced. For many, it is where this old word first opened.', links: [['About the book', 'https://penguinrandomhouse.ca/books/604501/the-way-of-wyrd-by-brian-bates']] },
      { id: 'limen', kind: 'Roots of a word', title: 'Rites of passage and the threshold', by: 'Arnold van Gennep (1909) and Victor Turner (1969)', text: 'Liminal comes from limen, the threshold. Van Gennep described rites of passage as separation, a threshold time and return. Turner explored that betwixt-and-between state, and the deep companionship it can bring, in The Ritual Process. Returning to the roots is a good guard against the word’s overuse.', links: [['Liminality, an overview', 'https://en.wikipedia.org/wiki/Liminality']] },
      { id: 'emergence-network', kind: 'Network · courses · writing', title: 'The Emergence Network', by: 'Báyò Akómoláfé and collaborators', text: 'Báyò, a Yoruba poet and philosopher, speaks of postactivism: what becomes possible when things no longer fit and the usual solutions fall short. He invites slowing down in urgent times, and a “politics of surprise”. The Emergence Network convenes courses and gatherings, including We Will Dance with Mountains.', links: [['The Emergence Network', 'https://www.emergencenetwork.org'], ['Báyò Akómoláfé', 'https://www.bayoakomolafe.net']] },
      { id: 'aphanipoiesis', kind: 'Essay · open access', title: 'Aphanipoiesis', by: 'Nora Bateson', text: 'Nora coined this word for the way life coalesces toward vitality unseen, long before anything gets called emergence. A gentle companion to wyrd work: much of what matters happens out of view, between contexts. Her book Combining continues the thread.', links: [['Read the essay', 'https://journals.isss.org/index.php/jisss/article/view/3887']] },
      { id: 'weird-studies', kind: 'Podcast · courses', title: 'Weird Studies', by: 'Phil Ford and J. F. Martel', text: 'A musicologist and a writer and filmmaker in long, rigorous, playful conversation about art and ideas that resist settled explanation, from synchronicity to cinema to tarot. They treat the weird as something to dwell with rather than explain away. Their Weirdosphere hosts courses.', links: [['Listen', 'https://podcasts.apple.com/us/podcast/weird-studies/id1343819177']] },
      { id: 'trickster', kind: 'Book · 1998', title: 'Trickster Makes This World', by: 'Lewis Hyde', text: 'Hyde follows trickster figures across many cultures as spirits of thresholds and crossroads, who keep cultures supple by crossing the lines they draw. Essential reading for anyone who works between worlds, and for thinking about the ethics of mischief.', links: [['Lewis Hyde', 'https://lewishyde.com']] },
      { id: 'enchantment', kind: 'Books · 2019 and 2023', title: 'Enchantment: Wonder in Modern Life', by: 'Patrick Curry', text: 'Curry describes enchantment as an experience of wonder, and its counterfeit as glamour: wonder manufactured to sell or to steer. The Bay uses his distinction as its lantern test. Art and Enchantment continues the inquiry.', links: [['Patrick Curry', 'https://www.patrickcurry.co.uk']] },
      { id: 'emerald', kind: 'Podcast', title: 'The Emerald', by: 'Josh Schrei', text: 'Myth, initiation and the animate world, explored with depth and humour. Josh draws on many traditions to ask what modern life lost when it stopped listening to the imaginative, poetic heart of experience, and what it might mean to remember it.', links: [['Listen', 'https://podcasts.apple.com/us/podcast/the-emerald/id1465445746']] },
      { id: 'school-of-myth', kind: 'Mythtelling · school', title: 'Westcountry School of Myth', by: 'Dr Martin Shaw', text: 'A mythteller and long-time wilderness rites-of-passage guide, Martin tells old stories as living beings that still have something to say to us. His school has recently begun a Christian mythopoetics programme, and he notes that most of his team are not Christian and all are welcome.', links: [['Martin Shaw’s writing', 'https://martinshaw.substack.com']] }
    ];
    var BGF = ['#EDE3CC', '#CFE1E4', '#D9D3EA', '#DCE6D2', '#F2D3BC'];
    var flotsam = F.map(function (f, i) {
      var ab = self.aboardFor('gathered', { id: 'wyrd-src:' + f.id, title: f.title, kind: 'Flotsam · Wyrd Bay', by: f.by, href: f.links[0][1] });
      return { tilt: i % 2 ? 'tl' : 'tr', bg: BGF[i % BGF.length], kind: f.kind, title: f.title, by: f.by, text: f.text, links: f.links.map(function (l) { return { label: l[0], href: l[1] }; }), aboardOn: ab.aboardOn, aboardLabel: ab.aboardLabel, aboard: ab.aboard };
    });

    // ---- moorings ----
    var OPEN = { alone: 'Questing alone', companions: 'Seeking companions', either: 'Alone or with others' };
    var shown = list.filter(function (h) { return (s.show === 'all' || h.open_to === s.show || (s.show === 'companions' && h.open_to === 'either')) && (!s.quest || h.quest === s.quest); });
    var okHylo = function (u) { return typeof u === 'string' && /^https:\/\/(www\.)?hylo\.com\//.test(u) ? u : ''; };
    var BGM = ['#E6E2F2', '#CFE1E4', '#EDE3CC', '#DCE6D2'];
    var out = {
      veiled: false, open: true, sceneCls: s.scene, quests: quests, flotsam: flotsam,
      mFilters: [['all', 'All moorings'], ['companions', 'Seeking companions'], ['alone', 'Questing alone']].map(function (f) { var on = s.show === f[0]; return { label: f[1], on: on ? 'true' : 'false', cls: on ? 'dchip on' : 'dchip', pick: function () { self.setState({ show: f[0] }); } }; }),
      mQuestNote: s.quest ? 'Showing those who would welcome company on “' + (QTITLE[s.quest] || s.quest) + '”.' : '', mClearQuest: function () { self.setState({ quest: '' }); },
      mLoading: s.list === null, mProblem: s.problem, mEmpty: s.list !== null && !s.problem && shown.length === 0,
      mEmptyText: list.length ? 'No moorings match that just now.' : 'The moorings are quiet for now. Perhaps you will be the first lantern here.',
      moorings: shown.map(function (h, i) {
        var id = h.owner_id, hylo = okHylo(h.hylo_url), rep = s.reporting === id;
        return { tilt: i % 2 ? 'tr' : 'tl', bg: BGM[i % BGM.length], name: h.display_name, threshold: h.threshold, openTo: OPEN[h.open_to] || OPEN.either, quest: QTITLE[h.quest] || '', hasQuest: !!QTITLE[h.quest],
          hylo: hylo, hasHylo: !!hylo, hyloLabel: 'Open ' + h.display_name + '’s profile on Hylo (opens in a new tab)',
          reportLabel: s.reported[id] ? 'Concern sent' : 'Raise a concern', reporting: rep && !s.reported[id], reported: !!s.reported[id], rid: 'wr' + i,
          report: function () { if (self.state.reported[id]) { return; } self.setState({ reporting: rep ? '' : id }); },
          typeReason: function (e) { self.state.reasons[id] = e && e.target ? e.target.value : ''; },
          cancel: function () { self.setState({ reporting: '' }); },
          send: function () { window.RiverBoat.wyrdReport(id, self.state.reasons[id] || '').then(function () { var r = {}; for (var k in self.state.reported) { r[k] = 1; } r[id] = 1; self.setState({ reported: r, reporting: '' }); }, function (e) { self.setState({ problem: e.message }); }); } };
      })
    };
    var rb = window.RiverBoat, b = this.boatRead(), acct = !!(rb && rb.signedIn());
    var m = s.m, mSet = function (patch) { var n = {}; for (var k in self.state.m) { n[k] = self.state.m[k]; } for (var k2 in patch) { n[k2] = patch[k2]; } self.setState({ m: n }); };
    if (acct && b && !m.loaded && !m.loading && rb.wyrdMine) {
      m.loading = true;
      setTimeout(function () { rb.wyrdMine().then(function (c) { mSet({ loaded: true, loading: false, card: c, name: c ? c.display_name : (b.name || ''), thr: c ? c.threshold : '', openTo: c ? c.open_to : 'either', quest: c ? (c.quest || '') : '', hylo: c ? (c.hylo_url || '') : '', agree: !!c }); }, function (e) { mSet({ loaded: true, loading: false, msg: e.message }); }); }, 0);
    }
    out.mFormTitle = m.card ? 'Your mooring' : 'Moor here';
    out.mNoBoat = !b; out.mNeedsAccount = !!b && !acct; out.mReady = acct && !!b && m.loaded;
    out.mMoored = !!m.card;
    out.mStatus = m.card && m.card.hidden ? 'Your card is resting out of view while a steward looks at it. You can still change it or cast off.' : 'You are moored in the Bay, where other Wyrd Workers can find you.';
    out.mName = m.name; out.mThr = m.thr; out.mHylo = m.hylo; out.mMsg = m.msg;
    out.mTypeName = function (e) { self.state.m.name = e && e.target ? e.target.value : ''; };
    out.mTypeThr = function (e) { self.state.m.thr = e && e.target ? e.target.value : ''; };
    out.mTypeHylo = function (e) { self.state.m.hylo = e && e.target ? e.target.value : ''; };
    out.mOpenChips = [['alone', 'Questing alone'], ['companions', 'Seeking companions'], ['either', 'Open to either']].map(function (c) { var on = m.openTo === c[0]; return { label: c[1], on: on ? 'true' : 'false', cls: on ? 'chip on' : 'chip', pick: function () { mSet({ openTo: c[0] }); } }; });
    out.mQuestChips = Q.map(function (q) { var on = m.quest === q.id; return { label: q.title, on: on ? 'true' : 'false', cls: on ? 'chip on' : 'chip', pick: function () { mSet({ quest: on ? '' : q.id }); } }; });
    out.mAgreeOn = m.agree ? 'true' : 'false'; out.mAgreeCls = m.agree ? 'chip on' : 'chip';
    out.mAgree = function () { mSet({ agree: !self.state.m.agree }); };
    out.mSaveLabel = m.busy ? 'Mooring…' : (m.card ? 'Update your mooring' : 'Moor in the Bay');
    out.mSave = function () {
      var h = self.state.m; if (h.busy) { return; }
      var name = (h.name || '').trim(), thr = (h.thr || '').trim(), hylo = (h.hylo || '').trim();
      if (hylo && !/^https?:\/\//i.test(hylo)) { hylo = 'https://' + hylo; }
      hylo = hylo.replace(/^http:\/\//i, 'https://');
      if (!name) { mSet({ msg: 'Please add a name for your card.' }); return; }
      if (!thr) { mSet({ msg: 'Please share a line about what you are tending at the threshold.' }); return; }
      if (hylo && !/^https:\/\/(www\.)?hylo\.com\/[A-Za-z0-9\/_.~%=&?#-]+$/.test(hylo)) { mSet({ msg: 'That Hylo address doesn’t look quite right. It should start with https://www.hylo.com/' }); return; }
      if (!h.agree) { mSet({ msg: 'Please read and agree to the Bay’s agreements first.' }); return; }
      mSet({ busy: true, msg: '' });
      var was = !!h.card;
      rb.wyrdSave({ display_name: name.slice(0, 60), threshold: thr.slice(0, 400), open_to: h.openTo, quest: h.quest || null, hylo_url: hylo || null })
        .then(function () { return rb.wyrdMine(); })
        .then(function (c) { mSet({ busy: false, card: c, hylo: hylo, msg: was ? 'Your mooring is updated.' : 'You are moored in the Bay. Other Wyrd Workers can find you now.' }); return rb.wyrdList(); })
        .then(function (rows) { if (rows) { self.setState({ list: rows }); } }, function (e) { mSet({ busy: false, msg: e.message }); });
    };
    out.mLeave = function () {
      if (self.state.m.busy) { return; }
      mSet({ busy: true, msg: '' });
      rb.wyrdLeave().then(function () { mSet({ busy: false, card: null, agree: false, msg: 'You have cast off. Your card is no longer visible to anyone.' }); return rb.wyrdList(); })
        .then(function (rows) { if (rows) { self.setState({ list: rows }); } }, function (e) { mSet({ busy: false, msg: e.message }); });
    };
    return out;
  }
}
