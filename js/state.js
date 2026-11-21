'use strict';
// Wspólny stan gry dla panelu prowadzącego i ekranu TV.
// Stan trzymany w localStorage, synchronizacja okien: BroadcastChannel + zdarzenie "storage".

const STORAGE_KEY = 'teleturniej_mama_v1';
const DATA = Object.assign({ akronimy: [], przyslowia: [], czolko: [], kalambury: { A: [], B: [] }, licytacja: [], bomba: [], zdjecia: [] }, window.PYTANIA || {});

// Kolejność konkurencji (nazwy jak w polu `comp` wpisów historii) – do tabeli punktacji
const COMP_ORDER = ['Przysłowia', 'Licytacja', 'Bomba', 'Akronimy', 'Kalambury', 'Czółko', 'Zdjęcia mamy'];
// Konkurencje dodatkowe – na TV w tabeli tylko, jeśli ktoś zdobył w nich punkty
const OPTIONAL_COMPS = ['Zdjęcia mamy', 'Inne / ręczne'];

// ---------- Narzędzia tekstowe ----------
const T = {
  ALPHABET: [...'AĄBCĆDEĘFGHIJKLŁMNŃOÓPQRSŚTUVWXYZŹŻ'],
  VOWELS: [...'AĄEĘIOÓUY'],
  upper: s => String(s).toLocaleUpperCase('pl-PL'),
  isLetter: ch => /^\p{L}$/u.test(ch),
  isVowel: L => T.VOWELS.includes(L),
  // Przysłowia: zgaduje się spółgłoski oraz Ą, Ę, Ó
  isGuessable: L => T.ALPHABET.includes(L) && !'AEIOUY'.includes(L),
  get GUESSABLE() { return T.ALPHABET.filter(T.isGuessable); },
  count(text, L) {
    let n = 0;
    for (const ch of T.upper(text)) if (ch === L) n++;
    return n;
  },
  lettersOf: text => new Set([...T.upper(text)].filter(T.isLetter)),
  esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  time(ms) {
    const d = new Date(ms), p = n => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  },
  // Dzieli rozwinięcie na słowa (także po myślniku) i oznacza pierwsze litery pasujące kolejno do skrótu.
  // Litery skrótu, które nie są początkiem żadnego słowa (np. V w TVP, E i O w REGON), są pomijane.
  acronymParts(skrot, full) {
    const letters = [...T.upper(skrot)].filter(T.isLetter);
    let p = 0;
    return String(full).split(/(\s+|-)/).filter(w => w !== '').map(w => {
      if (/^(\s+|-)$/.test(w)) return { text: w };
      const first = [...w][0];
      const idx = letters.indexOf(T.upper(first), p);
      if (idx !== -1) {
        p = idx + 1;
        return { first, rest: w.slice(first.length) };
      }
      return { text: w };
    });
  },
  acronymHTML(a) {
    return T.acronymParts(a.skrot, a.rozwiniecie)
      .map(x => x.first ? `<span class="hl">${T.esc(x.first)}</span>${T.esc(x.rest)}` : T.esc(x.text))
      .join('');
  },
};

// Wersy piosenki z licytacji (bez pustych linii)
const licLines = song => String(song?.tekst || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
const KARAOKE_STEP = 2;

// Zdjęcia mamy: siatka kafelków danego zdjęcia (ustawienie z panelu albo domyślne z pytania.js)
function zdjGrid(s, i) {
  const g = s.zdj.grids[i], d = DATA.zdjecia[i] || {};
  const clamp = v => Math.max(1, Math.min(15, Math.floor(Number(v)) || 0));
  return { cols: clamp(g ? g.cols : d.kolumny || 4), rows: clamp(g ? g.rows : d.wiersze || 3) };
}
const zdjRevealed = (s, i) => s.zdj.revealed[i] || [];
// Skaluje zdjęcie (także w górę – małe pliki też wypełnią miejsce) do pola maxW × maxH z zachowaniem proporcji
function fitImage(img, maxW, maxH) {
  if (!img || !img.naturalWidth || maxW <= 0 || maxH <= 0) return false;
  const k = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
  img.style.width = `${Math.floor(img.naturalWidth * k)}px`;
  img.style.height = `${Math.floor(img.naturalHeight * k)}px`;
  return true;
}

// Czółko: układ numerków na TV zależny od liczby piosenek (size = bok kafelka w jednostkach --vu ≈ % wysokości ekranu)
function czoGrid(n) {
  const cols = n <= 18 ? 6 : n <= 24 ? 8 : 10;
  const rows = Math.max(1, Math.ceil(n / cols));
  const size = rows <= 2 ? 15 : rows === 3 ? 13 : 10;
  return { cols, rows, size };
}

// ---------- Timer (stan w obiekcie, liczony z zegara – działa w obu oknach) ----------
const Timer = {
  make: sec => ({ duration: sec, running: false, endsAt: 0, left: sec * 1000 }),
  remaining: (t, now = Date.now()) => (t.running ? Math.max(0, t.endsAt - now) : t.left),
  start(t) {
    if (t.running) return;
    if (t.left <= 0) t.left = t.duration * 1000;
    t.running = true;
    t.endsAt = Date.now() + t.left;
  },
  pause(t) {
    if (!t.running) return;
    t.left = Timer.remaining(t);
    t.running = false;
  },
  reset(t, sec) {
    if (sec) t.duration = sec;
    t.running = false;
    t.endsAt = 0;
    t.left = t.duration * 1000;
  },
  fmt(ms) {
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  },
};

// ---------- Stan gry ----------
const Game = (() => {
  let chan = null;
  try { chan = new BroadcastChannel('teleturniej_mama'); } catch (e) { /* brak wsparcia – zostaje "storage" */ }

  function defaultState() {
    return {
      ver: 3,
      showTable: false,     // tabela punktacji na TV (widok Wyniki)
      theme: 'klasyczny',   // motyw ekranu TV: klasyczny | rzutnik | gala | konfetti
      rev: 0,
      title: 'Teleturniej urodzinowy',
      namesConfirmed: false,
      teams: [
        { name: 'Drużyna 1', color: '#d7263d' },
        { name: 'Drużyna 2', color: '#1f6feb' },
      ],
      log: [],              // { id, t, team (0|1), pts, comp, desc, letter?, prz?, solvedNow?, czo? }
      view: 'score',        // 'score' | 'akronimy' | 'przyslowia' | 'kalambury' | 'czolko'
      akr: { index: 0, showSkrot: false, showFull: false, seen: [], points: 2 },
      prz: { index: 0, team: 0, guessed: [], solved: false, msg: null, seen: [], pointValue: 2, solveBonus: 7 },
      // Kalambury: drużyna `team` pokazuje hasła z zestawu sets[team]; results[zestaw][i] = 'ok' | 'fail'
      kal: { timer: Timer.make(120), team: 0, sets: ['A', 'B'], results: { A: {}, B: {} }, points: 1, showSummary: false },
      // Licytacja wersów: song = indeks w DATA.licytacja; bids = kolejne oferty
      // karaoke: tekst na TV po licytacji, kpos = indeks pierwszego wyświetlanego wersu (co 2)
      lic: { round: 1, song: null, phase: 'bidding', bids: [], startManual: null, seen: [], msg: null, karaoke: false, kpos: 0 },
      // Bomba: results[i] = 'ok'|'fail' w bieżącej rundzie, used = pytania z poprzednich rund
      bomba: { results: {}, used: [], phase: 'play', loser: null, award: 0, points: 1 },
      // Zdjęcia mamy: index = bieżące zdjęcie, grids[i] = { cols, rows }, revealed[i] = numery odkrytych kafelków (od 0)
      zdj: { index: 0, grids: {}, revealed: {}, caption: false },
      // Czółko: numery 1..N → piosenka DATA.czolko[order[n-1]]; results[n] = { team, ok }
      czo: { order: [], results: {}, current: null, phase: 'board', team: 0, points: 3, timer: Timer.make(45), msg: null },
    };
  }

  // Uaktualnienie zapisów ze starszej wersji aplikacji
  function migrate(raw, s) {
    if ((raw.ver || 1) < 2) {
      if (s.title === 'Kocham Cię, Mamo!') s.title = 'Teleturniej urodzinowy';
      if (Number(s.prz.pointValue) === 1) s.prz.pointValue = 2;
      s.namesConfirmed = s.log.length > 0;
      s.ver = 2;
    }
    if ((raw.ver || 1) < 3) {
      if (Number(s.prz.solveBonus) === 5) s.prz.solveBonus = 7;
      if (Number(s.kal.points) === 2) s.kal.points = 1;
      s.ver = 3;
    }
    return s;
  }

  function merge(base, extra) {
    for (const k of Object.keys(extra)) {
      const b = base[k], e = extra[k];
      if (b && e && typeof b === 'object' && typeof e === 'object' && !Array.isArray(b) && !Array.isArray(e)) merge(b, e);
      else base[k] = e;
    }
    return base;
  }

  const normalize = raw => migrate(raw || {}, merge(defaultState(), JSON.parse(JSON.stringify(raw || {}))));

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { console.warn('Nie udało się wczytać stanu', e); }
    return defaultState();
  }

  function save(s) {
    s.rev = (s.rev || 0) + 1;
    const raw = JSON.stringify(s);
    localStorage.setItem(STORAGE_KEY, raw);
    if (chan) chan.postMessage(raw);
  }

  function subscribe(cb) {
    let last = -1;
    const handle = raw => {
      try {
        const s = normalize(JSON.parse(raw));
        if (s.rev === last) return;
        last = s.rev;
        cb(s);
      } catch (e) { console.warn(e); }
    };
    if (chan) chan.onmessage = e => handle(e.data);
    window.addEventListener('storage', e => { if (e.key === STORAGE_KEY && e.newValue) handle(e.newValue); });
  }

  // Ile haseł w Kalamburach odgadła drużyna
  function kalCount(s, team) {
    const r = s.kal.results[s.kal.sets[team]] || {};
    return Object.values(r).filter(v => v === 'ok').length;
  }

  function scores(s) {
    const r = [0, 0];
    for (const e of s.log) r[e.team] += Number(e.pts) || 0;
    return r;
  }

  // Tabela punktacji: wiersze w kolejności konkurencji + „Inne / ręczne”
  function table(s) {
    const rows = COMP_ORDER.map(name => ({ name, pts: [0, 0] }));
    const other = { name: 'Inne / ręczne', pts: [0, 0] };
    for (const e of s.log) {
      const comp = /^Licytacja I+$/.test(e.comp) ? 'Licytacja' : e.comp; // stare wpisy „Licytacja I/II”
      const row = rows.find(r => r.name === comp) || other;
      row.pts[e.team] += Number(e.pts) || 0;
    }
    return [...rows, other];
  }

  // Bomba: liczba poprawnych odpowiedzi w bieżącej rundzie
  const bombaCount = s => Object.values(s.bomba.results).filter(v => v === 'ok').length;

  return { defaultState, normalize, load, save, subscribe, scores, kalCount, table, bombaCount };
})();
