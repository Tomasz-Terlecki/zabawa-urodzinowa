'use strict';
// Ekran TV: tylko wyświetla stan otrzymany z panelu prowadzącego.

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let S = Game.load();
let prevScores = Game.scores(S);
let lastStageKey = '';
let lastMsgId = S.prz.msg ? S.prz.msg.id : null;
let prevRevealed = null;
let prevPrzIndex = null;
let prevAkrKey = null;
let prevAkrFull = S.akr.showFull;
let prevKalCount = null;
let toastTimer = null;

// ---------- Dźwięki (WebAudio, bez plików) ----------
const Sound = {
  ctx: null,
  init() { try { this.ctx = this.ctx || new AudioContext(); this.ctx.resume(); } catch (e) { /* bez dźwięku */ } },
  tone(freq, dur, type = 'sine', when = 0, vol = 0.2) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur);
  },
  hit() { this.tone(880, 0.25, 'sine', 0); this.tone(1320, 0.4, 'sine', 0.12); },
  miss() { this.tone(150, 0.5, 'sawtooth', 0, 0.12); this.tone(110, 0.6, 'sawtooth', 0.15, 0.12); },
  vowel() { this.tone(520, 0.25, 'triangle'); },
  reveal() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, 'triangle', i * 0.1)); },
  point() { this.tone(700, 0.15, 'sine'); this.tone(1050, 0.2, 'sine', 0.08); },
  minus() { this.tone(300, 0.25, 'square', 0, 0.08); },
  tick() { this.tone(1000, 0.08, 'square', 0, 0.06); },
  end() { this.tone(220, 1.3, 'square', 0, 0.12); this.tone(165, 1.3, 'square', 0, 0.12); },
};

// Nazwa bieżącej konkurencji w górnym pasku (tytuł teleturnieju tylko na tablicy wyników)
function compTitle() {
  return ({
    przyslowia: '📜 Przysłowia',
    licytacja: karaokeOn() ? '🎶 Śpiewamy razem!' : '🎤 Licytacja wersów',
    bomba: '💣 Bomba',
    akronimy: '🔤 Akronimy',
    kalambury: '🎭 Kalambury',
    czolko: '🎵 Czółko',
    zdjecia: '📸 Co to za zdjęcie?',
  })[S.view] || '';
}

// ---------- Renderowanie ----------
function render(initial = false) {
  document.body.dataset.view = S.view;
  document.body.dataset.theme = S.theme || 'klasyczny';
  document.body.classList.toggle('themed', !!S.theme && S.theme !== 'klasyczny');
  $('#tv-title').textContent = compTitle();
  [0, 1].forEach(i => {
    $$(`[data-name="${i}"]`).forEach(el => { el.textContent = S.teams[i].name; });
    $$(`[data-team-box="${i}"]`).forEach(el => {
      el.style.setProperty('--team', S.teams[i].color);
      el.classList.toggle('active', (S.view === 'przyslowia' && S.prz.team === i) || (S.view === 'czolko' && S.czo.team === i) || (S.view === 'kalambury' && !S.kal.showSummary && S.kal.team === i) ||
        (S.view === 'licytacja' && S.lic.phase !== 'done' && S.lic.bids.length > 0 && S.lic.bids[S.lic.bids.length - 1].team === i));
    });
  });

  let played = false;
  played = renderStage(initial) || played;
  played = renderToast(initial) || played;
  renderScores(initial, played);
  tick();
}

function renderScores(initial, soundPlayed) {
  const sc = Game.scores(S);
  [0, 1].forEach(i => {
    $$(`[data-score="${i}"]`).forEach(el => { el.textContent = sc[i]; });
    const d = sc[i] - prevScores[i];
    if (d !== 0 && !initial) {
      bump(i, d);
      if (!soundPlayed && S.view !== 'bomba') (d > 0 ? Sound.point() : Sound.minus());   // Bomba: dźwięki robi głośniczek
    }
  });
  prevScores = sc;
}

function bump(team, d) {
  $$(`[data-team-box="${team}"]`).forEach(box => {
    if (!box.offsetParent) return;   // niewidoczny
    const sc = box.querySelector(`[data-score="${team}"]`);
    if (sc) { sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); }
    const f = document.createElement('div');
    f.className = 'floater ' + (d > 0 ? 'pos' : 'neg');
    f.textContent = d > 0 ? `+${d}` : String(d);
    box.appendChild(f);
    setTimeout(() => f.remove(), 1600);
  });
}

function stageKey() {
  if (S.view === 'score') return JSON.stringify(['score', S.title, S.teams, S.showTable, S.showTable ? Game.table(S) : 0]);
  if (S.view === 'licytacja') return JSON.stringify(['lic', S.lic.round, S.lic.song, S.lic.phase, S.lic.bids, licStart(), S.teams, karaokeOn() && S.lic.kpos]);
  if (S.view === 'bomba') return JSON.stringify(['bomba', S.bomba.phase, S.bomba.loser, S.bomba.award, bombaCur(), Game.bombaCount(S), S.teams]);
  if (S.view === 'akronimy') return JSON.stringify(['akr', S.akr.index, S.akr.showSkrot, S.akr.showFull]);
  if (S.view === 'kalambury') return JSON.stringify(['kal', S.kal.showSummary, S.kal.team, Game.kalCount(S, 0), Game.kalCount(S, 1), S.kal.points, S.teams]);
  if (S.view === 'zdjecia') return JSON.stringify(['zdj', S.zdj.index, zdjGrid(S, S.zdj.index), zdjRevealed(S, S.zdj.index), S.zdj.caption]);
  if (S.view === 'czolko') return JSON.stringify(['czo', S.czo.phase, S.czo.current, S.czo.results, S.czo.team, S.czo.order, S.teams]);
  return JSON.stringify(['prz', S.prz.index, S.prz.guessed, S.prz.solved]);
}

// ---------- Licytacja wersów ----------
function licStart() {
  if (S.lic.startManual != null) return S.lic.startManual;
  const sc = Game.scores(S);
  return sc[0] === sc[1] ? 0 : sc[0] < sc[1] ? 0 : 1;
}
const teamTag = i => `<b class="team-tag" style="--team:${T.esc(S.teams[i].color)}">${T.esc(S.teams[i].name)}</b>`;
const wersy = n => (n === 1 ? 'wers' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'wersy' : 'wersów');

// Karaoke: po licytacji tekst na TV po 2 wersy + zapowiedź kolejnych
const karaokeOn = () => S.lic.karaoke && S.lic.phase === 'done' && licLines(DATA.licytacja[S.lic.song]).length > 0;
function karDotsHTML(song, p) {
  const st = KARAOKE_STEP, pages = Math.ceil(licLines(song).length / st), page = Math.floor(p / st);
  if (pages > 30) return '<div class="kar-dots"></div>';
  return `<div class="kar-dots">${Array.from({ length: pages }, (_, k) => `<i class="${k < page ? 'past' : k === page ? 'now' : ''}"></i>`).join('')}</div>`;
}
// Cały tekst na "wałku": wszystkie wersy w jednej kolumnie, przesuwanej płynnie w pionie
function karaokeHTML(song) {
  const lines = licLines(song);
  const items = lines.map((t, i) => `<div class="kar-line ${i % KARAOKE_STEP === 0 && i ? 'pair' : ''}" data-i="${i}">${T.esc(t)}</div>`).join('');
  return `<div class="kar-view instant" data-song="${S.lic.song}">
    <div class="kar-song">🎶 ${T.esc(song.tytul)} <span>· ${T.esc(song.autor)}</span></div>
    <div class="kar-viewport"><div class="kar-track">${items}<div class="kar-line kar-end pair" data-i="${lines.length}">🎉 Brawo! 🎉</div></div></div>
    ${karDotsHTML(song, S.lic.kpos)}</div>`;
}
// Ustawia wersy wg S.lic.kpos: bieżąca para na środku, reszta pochylona i przygaszona jak na wałku
function karaokeLayout(view) {
  const p = S.lic.kpos, st = KARAOKE_STEP;
  const lines = [...view.querySelectorAll('.kar-line')];
  lines.forEach(el => {
    const i = Number(el.dataset.i);
    const d = i < p ? i - p : i >= p + st ? i - (p + st - 1) : 0;   // odległość od bieżącej pary
    const a = Math.min(Math.abs(d), 4);
    el.style.setProperty('--d', Math.max(-4, Math.min(4, d)));
    el.style.setProperty('--s', [1.3, .82, .74, .68, .64][a]);
    el.style.setProperty('--o', [1, .5, .26, .1, 0][a]);
    el.classList.toggle('now', d === 0);
  });
  const vp = view.querySelector('.kar-viewport'), track = view.querySelector('.kar-track');
  const first = lines.find(el => Number(el.dataset.i) === p);
  if (!first) return;
  const lastIdx = Math.min(p + st - 1, lines.length - 2);
  const last = lines.find(el => Number(el.dataset.i) === lastIdx) || first;
  const center = (first.offsetTop + last.offsetTop + last.offsetHeight) / 2;
  track.style.transform = `translateY(${Math.round(vp.clientHeight * 0.42 - center)}px)`;
  const page = Math.floor(p / st);
  view.querySelectorAll('.kar-dots i').forEach((dot, k) => { dot.className = k < page ? 'past' : k === page ? 'now' : ''; });
  if (view.classList.contains('instant')) {
    requestAnimationFrame(() => requestAnimationFrame(() => view.classList.remove('instant')));
  }
}
// Zwraca false, jeśli na ekranie nie ma jeszcze karaoke tej piosenki (wtedy trzeba je narysować od zera)
function karaokeSlide(stage) {
  const view = stage.querySelector('.kar-view');
  if (!view || Number(view.dataset.song) !== S.lic.song) return false;
  karaokeLayout(view);
  return true;
}
function karaokeRelayout() {
  const view = document.querySelector('.kar-view');
  if (!view) return;
  view.classList.add('instant');
  karaokeLayout(view);
}
window.addEventListener('resize', karaokeRelayout);
if (document.fonts) document.fonts.ready.then(karaokeRelayout);

// ---------- Zdjęcia mamy ----------
// Zdjęcie zakryte numerowanymi kafelkami; odkryte kafelki obracają się i znikają
function zdjTilesHTML(cols, rows, open) {
  return Array.from({ length: cols * rows }, (_, k) => `<div class="zdj-tile ${open.includes(k) ? 'open' : ''}" data-k="${k}"><span>${k + 1}</span></div>`).join('');
}
function zdjRender(stage) {
  const i = S.zdj.index, z = DATA.zdjecia[i];
  if (!z) { stage.innerHTML = '<div class="center-msg">Brak zdjęć</div>'; return; }
  const g = zdjGrid(S, i), open = zdjRevealed(S, i);
  stage.innerHTML = `<div class="zdj-view instant ${S.zdj.caption ? 'with-caption' : ''}" data-i="${i}" data-grid="${g.cols}x${g.rows}">
    <div class="zdj-frame">
      <img src="${T.esc(z.plik)}" alt="">
      <div class="zdj-grid" style="grid-template-columns:repeat(${g.cols},1fr);grid-template-rows:repeat(${g.rows},1fr)">${zdjTilesHTML(g.cols, g.rows, open)}</div>
    </div>
    <div class="zdj-caption">${T.esc(z.podpis || '')}</div>
  </div>`;
  const view = stage.querySelector('.zdj-view'), img = stage.querySelector('img');
  img.addEventListener('load', zdjFit);
  if (img.complete) zdjFit();
  img.addEventListener('error', () => {
    view.innerHTML = `<div class="center-msg">Nie znaleziono pliku:<br><small>${T.esc(z.plik)}</small></div>`;
  });
  requestAnimationFrame(() => requestAnimationFrame(() => view.classList.remove('instant')));
}
// Tylko zmiana kafelków / podpisu – bez przeładowania zdjęcia (płynne animacje)
function zdjUpdate(stage) {
  const view = stage.querySelector('.zdj-view'), i = S.zdj.index, g = zdjGrid(S, i);
  if (!view || Number(view.dataset.i) !== i || view.dataset.grid !== `${g.cols}x${g.rows}` || !view.querySelector('img')) return false;
  const open = zdjRevealed(S, i);
  view.querySelectorAll('.zdj-tile').forEach(t => t.classList.toggle('open', open.includes(Number(t.dataset.k))));
  view.classList.toggle('with-caption', !!S.zdj.caption);
  zdjFit();
  return true;
}
// Zdjęcie zajmuje całe dostępne miejsce na scenie (minus podpis, jeśli jest widoczny)
function zdjFit() {
  const view = document.querySelector('.zdj-view'), img = view && view.querySelector('img');
  if (!img || !img.naturalWidth) return;
  const stage = $('#stage'), cs = getComputedStyle(stage);
  const w = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  let h = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  if (view.classList.contains('with-caption')) {
    const vu = Math.min(innerHeight / 100, innerWidth * 0.005625);
    h -= view.querySelector('.zdj-caption').scrollHeight + 2.5 * vu;
  }
  const first = !view.classList.contains('fitted');
  if (first) img.style.transition = 'none';   // pierwsze dopasowanie bez animacji rozmiaru
  if (fitImage(img, w, h)) view.classList.add('fitted');
  if (first) { void img.offsetWidth; img.style.transition = ''; }
}
window.addEventListener('resize', zdjFit);

function licStageHTML() {
  const l = S.lic, song = DATA.licytacja[l.song], top = l.bids[l.bids.length - 1];
  if (song && karaokeOn()) return karaokeHTML(song);
  if (!song) return '<div class="lic-view"><div class="center-msg">Brak piosenki</div></div>';
  let bottom;
  if (l.phase === 'bidding') {
    bottom = top
      ? `<div class="lic-big">${teamTag(top.team)} <span class="lic-n bump">${top.n}</span> ${wersy(top.n)}</div>`
      : `<div class="lic-sub">Licytację zaczyna: ${teamTag(licStart())}</div>`;
  } else if (l.phase === 'singing') {
    bottom = `<div class="lic-sub">Śpiewa bez pomyłki:</div><div class="lic-big">${teamTag(top.team)} <span class="lic-n">${top.n}</span> ${wersy(top.n)}</div>`;
  } else {
    bottom = `<div class="lic-sub">${l.msg ? T.esc(l.msg.text) : ''}</div>`;
  }
  return `<div class="lic-view">
    <div class="czo-title">${T.esc(song.tytul)}</div>
    <div class="czo-author lic-author">${T.esc(song.autor)}</div>
    ${bottom}</div>`;
}

// ---------- Bomba ----------
function bombaCur() {
  for (let i = 0; i < DATA.bomba.length; i++) if (!S.bomba.results[i] && !S.bomba.used.includes(i)) return i;
  return -1;
}
function bombaStageHTML() {
  const b = S.bomba, n = Game.bombaCount(S);
  if (b.phase === 'boom' && b.loser != null) {
    return `<div class="bomba-view boom">
      <div class="bomba-boom">💥 BUM! 💥</div>
      <div class="lic-sub">Bomba wybuchła u: ${teamTag(b.loser)} – 0 pkt</div>
      <div class="lic-big">${teamTag(1 - b.loser)} <span class="lic-n">+${b.award}</span> pkt</div></div>`;
  }
  const q = DATA.bomba[bombaCur()];
  return `<div class="bomba-view">
    <div class="bomba-q">${q ? T.esc(q.pytanie) : 'Koniec pytań!'}</div>
    <div class="kal-count">Poprawne odpowiedzi: <b>${n}</b></div></div>`;
}

const timerHTML = () => '<div class="timer-tv" data-timer></div><div class="timer-bar"><i data-bar></i></div>';

function czoStageHTML() {
  const c = S.czo, n = DATA.czolko.length, team = S.teams[c.team];
  const song = c.current != null ? DATA.czolko[(c.order.length ? c.order : [...Array(n).keys()])[c.current - 1]] : null;
  if (c.phase === 'ready') {
    return `<div class="czo-ready">
      <div class="akr-label">Piosenka nr ${c.current}</div>
      <div class="czo-big" style="--team:${T.esc(team.color)}">${T.esc(team.name)}</div>
      <div class="akr-sub">odwróćcie się tyłem do ekranu!</div></div>`;
  }
  if (c.phase === 'song' && song) {
    return `<div class="czo-song">
      <div class="akr-label">Nucimy!</div>
      <div class="czo-title">${T.esc(song.tytul)}</div>
      <div class="czo-author">${T.esc(song.autor)}</div>
      ${timerHTML()}</div>`;
  }
  const tiles = Array.from({ length: n }, (_, k) => {
    const num = k + 1, r = c.results[num];
    if (!r) return `<span class="czo-tile">${num}</span>`;
    return `<span class="czo-tile done ${r.ok ? 'ok' : 'fail'}" style="--team:${T.esc(S.teams[r.team].color)}">${num}<small>${r.ok ? '✓' : '✗'}</small></span>`;
  }).join('');
  const g = czoGrid(n);
  return `<div class="czo-view">
    <div class="czo-turn">Wybiera: <b style="--team:${T.esc(team.color)}">${T.esc(team.name)}</b></div>
    <div class="czo-tiles" style="--cols:${g.cols};--size:${g.size}">${tiles}</div></div>`;
}

// ---------- Zegar (Kalambury / Czółko) ----------
let endPlayedFor = null, lastBeep = null;
function activeTimer() {
  if (S.view === 'kalambury' && !S.kal.showSummary) return S.kal.timer;
  if (S.view === 'czolko' && S.czo.phase === 'song') return S.czo.timer;
  return null;
}
function tick() {
  const t = activeTimer(), el = document.querySelector('[data-timer]');
  if (!t || !el) return;
  const ms = Timer.remaining(t);
  el.textContent = ms <= 0 ? 'KONIEC CZASU!' : Timer.fmt(ms);
  el.classList.toggle('low', ms > 0 && ms <= 10000);
  el.classList.toggle('done', ms <= 0);
  el.classList.toggle('paused', !t.running && ms > 0 && ms < t.duration * 1000);
  const bar = document.querySelector('[data-bar]');
  if (bar) {
    bar.style.width = `${Math.max(0, Math.min(100, ms / (t.duration * 1000) * 100))}%`;
    bar.classList.toggle('low', ms <= 10000);
  }
  if (t.running) {
    const s = Math.ceil(ms / 1000);
    if (ms <= 0) {
      if (endPlayedFor !== t.endsAt && Date.now() - t.endsAt < 2000) Sound.end();
      endPlayedFor = t.endsAt;
    } else if (s <= 5 && lastBeep !== `${t.endsAt}|${s}`) {
      lastBeep = `${t.endsAt}|${s}`;
      Sound.tick();
    }
  }
}
setInterval(tick, 100);

// Zwraca true, jeśli odegrano dźwięk
function renderStage(initial) {
  const key = stageKey();
  if (key === lastStageKey) return false;
  lastStageKey = key;
  const stage = $('#stage');
  let played = false;

  if (S.view === 'score' && S.showTable) {
    const rows = Game.table(S), sc = Game.scores(S);
    stage.innerHTML = `
      <div class="score-view">
        <h1 class="big-title table-title">${T.esc(S.title)} – punktacja</h1>
        <table class="tv-table">
          <thead><tr><th></th>${[0, 1].map(i => `<th><span style="--team:${T.esc(S.teams[i].color)}">${T.esc(S.teams[i].name)}</span></th>`).join('')}</tr></thead>
          <tbody>${rows.filter(r => !OPTIONAL_COMPS.includes(r.name) || r.pts[0] || r.pts[1]).map(r => `<tr><td>${T.esc(r.name)}</td><td>${r.pts[0]}</td><td>${r.pts[1]}</td></tr>`).join('')}</tbody>
          <tfoot><tr><td>Suma</td><td>${sc[0]}</td><td>${sc[1]}</td></tr></tfoot>
        </table>
      </div>`;
  } else if (S.view === 'score') {
    stage.innerHTML = `
      <div class="score-view">
        <h1 class="big-title">${T.esc(S.title)}</h1>
        <div class="score-cols">
          ${[0, 1].map(i => `
            <div class="score-col" data-team-box="${i}" style="--team:${T.esc(S.teams[i].color)}">
              <div class="sc-name">${T.esc(S.teams[i].name)}</div>
              <div class="sc-val" data-score="${i}"></div>
            </div>`).join('<div class="score-vs">:</div>')}
        </div>
      </div>`;
  } else if (S.view === 'akronimy') {
    const a = DATA.akronimy[S.akr.index];
    const akrKey = `${S.akr.index}|${S.akr.showSkrot}`;
    const animTiles = akrKey !== prevAkrKey && !initial;
    prevAkrKey = akrKey;
    if (!a) {
      stage.innerHTML = '<div class="center-msg">Brak akronimów</div>';
    } else if (!S.akr.showSkrot) {
      stage.innerHTML = `<div class="akr-wait"><div class="akr-sub">Przygotujcie się…</div></div>`;
    } else {
      const letters = [...a.skrot];
      stage.innerHTML = `
        <div class="akr-view">
          <div class="akr-label">Co oznacza ten skrót?</div>
          <div class="akr-tiles">
            ${letters.map((ch, i) => `<span class="akr-tile ${animTiles ? 'pop' : ''}" style="animation-delay:${i * 120}ms">${T.esc(ch)}</span>`).join('')}
          </div>
          ${S.akr.showFull ? `<div class="akr-full reveal">${T.acronymHTML(a)}</div>` : ''}
        </div>`;
    }
    if (S.akr.showFull && !prevAkrFull && !initial) { Sound.reveal(); played = true; }
    prevAkrFull = S.akr.showFull;
  } else if (S.view === 'kalambury') {
    const k = S.kal, pts = Number(k.points) || 0;
    if (k.showSummary) {
      const c = [Game.kalCount(S, 0), Game.kalCount(S, 1)];
      stage.innerHTML = `
        <div class="score-view">
          <h1 class="big-title">Podsumowanie</h1>
          <div class="score-cols">
            ${[0, 1].map(i => `
              <div class="score-col" style="--team:${T.esc(S.teams[i].color)}">
                <div class="sc-name">${T.esc(S.teams[i].name)}</div>
                <div class="sc-val kal-sum">${c[i]}</div>
                <div class="kal-sum-sub">${c[i] === 1 ? 'hasło' : c[i] % 10 >= 2 && c[i] % 10 <= 4 && (c[i] % 100 < 12 || c[i] % 100 > 14) ? 'hasła' : 'haseł'} · +${c[i] * pts} pkt</div>
              </div>`).join('<div class="score-vs">:</div>')}
          </div>
        </div>`;
      if (!initial) { Sound.reveal(); played = true; }
    } else {
      const n = Game.kalCount(S, k.team);
      const grew = prevKalCount && prevKalCount.team === k.team && n > prevKalCount.n;
      stage.innerHTML = `
        <div class="kal-view">
          ${timerHTML()}
          <div class="kal-count">Odgadnięte: <b class="${grew ? 'bump' : ''}">${n}</b></div>
        </div>`;
      if (grew && !initial) { Sound.hit(); played = true; }
      prevKalCount = { team: k.team, n };
    }
  } else if (S.view === 'zdjecia') {
    if (!zdjUpdate(stage)) zdjRender(stage);
  } else if (S.view === 'czolko') {
    stage.innerHTML = czoStageHTML();
  } else if (S.view === 'licytacja') {
    if (!(karaokeOn() && karaokeSlide(stage))) {
      stage.innerHTML = licStageHTML();
      const kv = stage.querySelector('.kar-view');
      if (kv) karaokeLayout(kv);
    }
  } else if (S.view === 'bomba') {
    stage.innerHTML = bombaStageHTML();
  } else {
    const text = DATA.przyslowia[S.prz.index] || '';
    const revealed = S.prz.solved ? T.lettersOf(text) : new Set(S.prz.guessed);
    if (initial || prevRevealed === null) prevRevealed = new Set(revealed);   // bez animacji przy starcie
    else if (prevPrzIndex !== S.prz.index) prevRevealed = new Set();
    let k = 0;
    const inText = T.lettersOf(text);
    const board = text.split(' ').map(word => `<span class="word">${[...word].map(ch => {
      if (!T.isLetter(ch)) return `<span class="punct">${T.esc(ch)}</span>`;
      const U = T.upper(ch), shown = revealed.has(U), isNew = shown && !prevRevealed.has(U);
      return `<span class="tile ${shown ? 'shown' : ''} ${isNew ? 'flip' : ''}" ${isNew ? `style="animation-delay:${(k++) * 110}ms"` : ''}><span>${shown ? T.esc(U) : ''}</span></span>`;
    }).join('')}</span>`).join('');
    const used = T.GUESSABLE.map(L => {
      const g = S.prz.guessed.includes(L);
      return `<span class="u ${g ? (inText.has(L) ? 'hit' : 'miss') : ''} ${T.isVowel(L) ? 'vowel' : ''}">${L}</span>`;
    }).join('');
    stage.innerHTML = `
      <div class="prz-view">
        <div class="prz-label">Runda ${S.prz.index + 1}</div>
        <div class="board">${text ? board : 'Brak przysłów'}</div>
        <div class="used">${used}</div>
      </div>`;
    prevRevealed = new Set(revealed);
    prevPrzIndex = S.prz.index;
  }
  return played;
}

function renderToast(initial) {
  const m = S.view === 'czolko' ? S.czo.msg : S.view === 'przyslowia' ? S.prz.msg : S.view === 'licytacja' ? S.lic.msg : null;
  if (!m || m.id === lastMsgId) return false;
  lastMsgId = m.id;
  if (initial) return false;
  const el = $('#toast');
  el.textContent = m.text;
  el.className = `toast ${m.kind}`;
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
  ({ hit: () => Sound.hit(), miss: () => Sound.miss(), vowel: () => Sound.vowel(), solve: () => Sound.reveal(), reveal: () => Sound.reveal() }[m.kind] || (() => {}))();
  return true;
}

// ---------- Pełny ekran ----------
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
}
$('#start-overlay').addEventListener('click', () => {
  Sound.init();
  document.documentElement.requestFullscreen().catch(() => {});
  $('#start-overlay').remove();
});
document.addEventListener('dblclick', () => { Sound.init(); toggleFullscreen(); });

// ---------- Start ----------
Game.subscribe(ns => { S = ns; render(); });
render(true);
