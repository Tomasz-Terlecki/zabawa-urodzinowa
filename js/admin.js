'use strict';
// Panel prowadzącego: jedyne miejsce, które zmienia stan gry.

let S = Game.load();
let localWarn = null;   // ostrzeżenie widoczne tylko w panelu (np. powtórzona litera)

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const VIEW_NAMES = { score: 'Ogólne', akronimy: 'Akronimy', przyslowia: 'Przysłowia', kalambury: 'Kalambury', czolko: 'Czółko', bomba: 'Bomba', zdjecia: 'Zdjęcia mamy' };
const licComp = (r = S.lic.round) => (r === 2 ? 'Licytacja II' : 'Licytacja I');
const compName = () => (S.view === 'licytacja' ? licComp() : VIEW_NAMES[S.view]);
const fmtPts = p => (p > 0 ? `+${p}` : String(p));

function commit() {
  Game.save(S);
  render();
  Zapis.schedule(S);
}

function addEntry(team, pts, comp, desc, extra = {}) {
  S.log.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    t: Date.now(), team, pts, comp, desc, ...extra,
  });
}

// Następny indeks, który jeszcze nie był (jeśli wszystkie były – po prostu następny)
function nextUnseen(cur, n, seen) {
  for (let k = 1; k <= n; k++) {
    const i = (cur + k) % n;
    if (!seen.includes(i)) return i;
  }
  return (cur + 1) % n;
}
const toggleIn = (arr, i) => (arr.includes(i) ? arr.filter(x => x !== i) : [...arr, i]);

// ---------- Punkty ----------
function manualPoints(team, pts) {
  pts = Number(pts);
  if (!pts) return;
  let desc = 'ręcznie';
  if (S.view === 'akronimy') {
    const a = DATA.akronimy[S.akr.index];
    if (a) desc = `akronim ${a.skrot}`;
  } else if (S.view === 'przyslowia') {
    desc = `ręcznie (przysłowie nr ${S.prz.index + 1})`;
  }
  addEntry(team, pts, compName(), desc);
  localWarn = null;
  commit();
}

function undo() {
  const e = S.log.pop();
  if (!e) return;
  if (e.letter && e.prz === S.prz.index) {
    S.prz.guessed = S.prz.guessed.filter(x => x !== e.letter);
    if (e.solvedNow) S.prz.solved = false;
    S.prz.msg = null;
  }
  if (e.kal) {
    const r = S.kal.results[e.kal.set];
    if (r && r[e.kal.i] === 'ok') delete r[e.kal.i];
  }
  if (e.lic) {
    S.lic.round = e.lic.round;
    S.lic.song = e.lic.song;
    S.lic.bids = e.lic.bids;
    S.lic.phase = 'singing';
    S.lic.msg = null;
    S.lic.karaoke = false;
  }
  if (e.bomba) {
    S.bomba.phase = 'play';
    S.bomba.loser = null;
    S.bomba.award = 0;
  }
  if (e.czo != null) {
    delete S.czo.results[e.czo];
    S.czo.team = e.team;
    S.czo.msg = null;
  }
  localWarn = `Cofnięto: ${S.teams[e.team].name} ${fmtPts(e.pts)} (${e.desc})`;
  commit();
}

// ---------- Nazwy drużyn ----------
function openNames() {
  [0, 1].forEach(i => {
    $(`#dlg-name-${i}`).value = S.teams[i].name;
    $(`#dlg-color-${i}`).value = S.teams[i].color;
  });
  const d = $('#names-dialog');
  if (!d.open) d.showModal();
  $('#dlg-name-0').select();
}
function closeNames(ok) {
  if (ok) {
    [0, 1].forEach(i => {
      S.teams[i].name = $(`#dlg-name-${i}`).value.trim() || `Drużyna ${i + 1}`;
      S.teams[i].color = $(`#dlg-color-${i}`).value;
    });
  }
  S.namesConfirmed = true;
  commit();
}

// ---------- Akronimy ----------
function akrMarkSeen() { if (!S.akr.seen.includes(S.akr.index)) S.akr.seen.push(S.akr.index); }
function akrShow() { S.akr.showSkrot = true; S.akr.showFull = false; akrMarkSeen(); commit(); }
function akrReveal() { S.akr.showSkrot = true; S.akr.showFull = true; akrMarkSeen(); commit(); }
function akrHide() { S.akr.showSkrot = false; S.akr.showFull = false; commit(); }
function akrSelect(i) {
  if (!DATA.akronimy.length) return;
  S.akr.index = i;
  S.akr.showSkrot = false;
  S.akr.showFull = false;
  commit();
}
function akrNext() {
  const n = DATA.akronimy.length;
  if (!n) return;
  S.akr.index = nextUnseen(S.akr.index, n, S.akr.seen);
  S.akr.showSkrot = true;
  S.akr.showFull = false;
  akrMarkSeen();
  commit();
}
function akrStep() {
  if (!S.akr.showSkrot) akrShow();
  else if (!S.akr.showFull) akrReveal();
  else akrNext();
}
function akrAward(team) {
  const a = DATA.akronimy[S.akr.index];
  if (!a) return;
  addEntry(team, Number(S.akr.points) || 0, 'Akronimy', `akronim ${a.skrot}`);
  S.akr.showSkrot = true;
  S.akr.showFull = true;
  akrMarkSeen();
  localWarn = null;
  commit();
}

// ---------- Licytacja wersów ----------
const licSongs = (r = S.lic.round) => DATA.licytacja.map((s, i) => ({ ...s, i })).filter(s => Number(s.runda) === r);
const licSong = () => DATA.licytacja[S.lic.song];
const licTop = () => S.lic.bids[S.lic.bids.length - 1] || null;
// Wersy tekstu (bez pustych linii) i limit licytacji
const licMax = song => Number(song?.maxWersow) || licLines(song).length || 99;

// Muzyka do licytacji: plik wgrany w panelu (IndexedDB, klucz = tytuł) albo ścieżka `mp3` z pytania.js
const LicAudio = {
  db: null, key: null, url: null, stored: false, mem: {},
  open() {
    return this.db || (this.db = new Promise((res, rej) => {
      const r = indexedDB.open('teleturniej_mama_audio', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('mp3');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
  },
  op(mode, fn) {
    const work = this.open().then(db => new Promise((res, rej) => {
      const tx = db.transaction('mp3', mode), req = fn(tx.objectStore('mp3'));
      tx.oncomplete = () => res(req.result);
      tx.onerror = () => rej(tx.error);
    }));
    // Gdyby przeglądarka nie odpowiadała (np. blokada plików lokalnych) – nie czekamy w nieskończoność
    const limit = new Promise((_, rej) => setTimeout(() => rej(new Error('IndexedDB timeout')), 2000));
    return Promise.race([work, limit]);
  },
  async get(k) { try { return await this.op('readonly', st => st.get(k)); } catch (e) { return this.mem[k]; } },
  async put(k, v) { this.mem[k] = v; try { await this.op('readwrite', st => st.put(v, k)); } catch (e) { console.warn('Plik tylko do odświeżenia strony', e); } },
  async del(k) { delete this.mem[k]; try { await this.op('readwrite', st => st.delete(k)); } catch (e) { /* brak IndexedDB */ } },
  keyOf: song => (song ? `lic:${song.tytul}` : null),
  el: () => $('#lic-audio'),
  async load(song, force = false) {
    const key = this.keyOf(song);
    if (key === this.key && !force) return;
    this.key = key;
    const a = this.el();
    a.pause();
    if (this.url) { URL.revokeObjectURL(this.url); this.url = null; }
    const rec = key ? await this.get(key) : null;
    if (this.key !== key) return;   // w międzyczasie zmieniono piosenkę
    this.stored = !!rec;
    if (rec) {
      this.url = URL.createObjectURL(rec.blob);
      a.src = this.url;
      this.info(`Wgrany plik: <b>${T.esc(rec.name)}</b>`);
    } else if (song && song.mp3) {
      a.src = song.mp3;
      this.info(`Plik: <b>${T.esc(song.mp3)}</b>`);
    } else {
      a.removeAttribute('src');
      a.load();
      this.info('Brak muzyki – wgraj plik mp3 poniżej.');
    }
    $('#lic-mp3-del').disabled = !this.stored;
    $('#lic-play').disabled = $('#lic-stop').disabled = !a.getAttribute('src');
  },
  info(html) { $('#lic-audio-info').innerHTML = html; },
  async upload(file) {
    const song = licSong();
    if (!file || !song) return;
    await this.put(this.keyOf(song), { blob: file, name: file.name });
    await this.load(song, true);
  },
  async remove() {
    const song = licSong();
    if (!song || !this.stored || !confirm(`Usunąć wgrany plik dla „${song.tytul}”?`)) return;
    await this.del(this.keyOf(song));
    await this.load(song, true);
  },
  toggle() {
    const a = this.el();
    if (!a.getAttribute('src')) return;
    if (a.paused) a.play().catch(err => this.info(`Nie da się odtworzyć: ${T.esc(err.message)}`));
    else a.pause();
  },
  stop() { const a = this.el(); a.pause(); a.currentTime = 0; },
};
// Licytację zaczyna drużyna z mniejszą liczbą punktów (przy remisie / ręcznej zmianie – wybór prowadzącego)
function licStartTeam() {
  if (S.lic.startManual != null) return S.lic.startManual;
  const sc = Game.scores(S);
  return sc[0] === sc[1] ? 0 : sc[0] < sc[1] ? 0 : 1;
}
function licSelect(i) {
  S.lic.song = i;
  S.lic.phase = 'bidding';
  S.lic.bids = [];
  S.lic.startManual = null;
  S.lic.msg = null;
  S.lic.karaoke = false;
  S.lic.kpos = 0;
  if (!S.lic.seen.includes(i)) S.lic.seen.push(i);
  localWarn = null;
  commit();
}
// Karaoke: tekst piosenki na TV po 2 wersy (dostępne po rozstrzygnięciu licytacji)
const karAvailable = () => S.lic.phase === 'done' && licLines(licSong()).length > 0;
function karToggle() {
  if (!karAvailable()) return;
  S.lic.karaoke = !S.lic.karaoke;
  if (S.lic.karaoke) S.lic.kpos = 0;
  commit();
}
function karMove(dir) {
  if (!S.lic.karaoke || !karAvailable()) return;
  const n = licLines(licSong()).length;
  const last = Math.floor((n - 1) / KARAOKE_STEP) * KARAOKE_STEP;
  const pos = Math.max(0, Math.min(last, S.lic.kpos + dir * KARAOKE_STEP));
  if (pos === S.lic.kpos) return;
  S.lic.kpos = pos;
  commit();
}
function karJump(lineIdx) {
  if (!S.lic.karaoke || !karAvailable()) return;
  S.lic.kpos = Math.floor(lineIdx / KARAOKE_STEP) * KARAOKE_STEP;
  commit();
}
function licEnsureSong() {
  const songs = licSongs();
  if (!songs.length) { S.lic.song = null; return; }
  if (!songs.some(s => s.i === S.lic.song)) {
    const fresh = songs.find(s => !S.lic.seen.includes(s.i)) || songs[0];
    S.lic.song = fresh.i;
    S.lic.phase = 'bidding';
    S.lic.bids = [];
    S.lic.startManual = null;
    S.lic.msg = null;
    if (!S.lic.seen.includes(fresh.i)) S.lic.seen.push(fresh.i);
  }
}
function licBid(team, n) {
  const song = licSong(), top = licTop();
  if (!song || S.lic.phase !== 'bidding') return;
  n = Math.floor(Number(n));
  const max = licMax(song);
  if (!n || n < 1) { localWarn = 'Podaj liczbę wersów.'; return render(); }
  if (top && n <= top.n) { localWarn = `Oferta musi być większa niż ${top.n}.`; return render(); }
  if (n > max) { localWarn = `Maksymalnie ${max} wersów.`; return render(); }
  S.lic.bids.push({ team, n });
  localWarn = null;
  commit();
}
function licUndoBid() {
  if (S.lic.phase !== 'bidding' || !S.lic.bids.length) return;
  S.lic.bids.pop();
  commit();
}
function licClose() {
  if (!licTop()) { localWarn = 'Nikt jeszcze nie licytował.'; return render(); }
  S.lic.phase = 'singing';
  localWarn = null;
  commit();
}
function licResult(ok) {
  const top = licTop(), song = licSong();
  if (!top || S.lic.phase !== 'singing') return;
  const team = ok ? top.team : 1 - top.team;
  S.lic.phase = 'done';
  S.lic.msg = ok
    ? { id: Date.now(), text: `${S.teams[top.team].name} śpiewa bez pomyłki! +${top.n} pkt`, kind: 'hit' }
    : { id: Date.now(), text: `Pomyłka! ${S.teams[team].name} dostaje +${top.n} pkt`, kind: 'miss' };
  addEntry(team, top.n, licComp(), `${song ? song.tytul : '?'}: ${top.n} wersów – ${ok ? 'zaśpiewane' : `pomyłka (${S.teams[top.team].name})`}`,
    { lic: { round: S.lic.round, song: S.lic.song, bids: S.lic.bids.slice() } });
  localWarn = null;
  commit();
}
function licNext() {
  const songs = licSongs();
  if (!songs.length) return;
  const pos = songs.findIndex(s => s.i === S.lic.song);
  const order = songs.map((_, k) => songs[(pos + 1 + k) % songs.length]);
  const fresh = order.find(s => !S.lic.seen.includes(s.i)) || order[0];
  licSelect(fresh.i);
}

// ---------- Zdjęcia mamy ----------
function zdjSelect(i) {
  if (i < 0 || i >= DATA.zdjecia.length) return;
  S.zdj.index = i;
  S.zdj.caption = false;
  commit();
}
function zdjToggleTile(k) {
  const i = S.zdj.index;
  S.zdj.revealed[i] = toggleIn(zdjRevealed(S, i), k);
  commit();
}
function zdjRandom() {
  const i = S.zdj.index, g = zdjGrid(S, i), open = zdjRevealed(S, i);
  const hidden = Array.from({ length: g.cols * g.rows }, (_, k) => k).filter(k => !open.includes(k));
  if (!DATA.zdjecia[i] || !hidden.length) return;
  S.zdj.revealed[i] = [...open, hidden[Math.floor(Math.random() * hidden.length)]];
  commit();
}
function zdjRevealAll() {
  const i = S.zdj.index, g = zdjGrid(S, i);
  if (!DATA.zdjecia[i]) return;
  S.zdj.revealed[i] = Array.from({ length: g.cols * g.rows }, (_, k) => k);
  commit();
}
function zdjHideAll() {
  S.zdj.revealed[S.zdj.index] = [];
  S.zdj.caption = false;
  commit();
}
function zdjSetGrid(cols, rows) {
  const i = S.zdj.index;
  if (!DATA.zdjecia[i]) return;
  const old = zdjGrid(S, i);
  S.zdj.grids[i] = { cols, rows };
  const g = zdjGrid(S, i);
  if (g.cols === old.cols && g.rows === old.rows) return render();
  if (zdjRevealed(S, i).length && !confirm('Zmiana siatki zakryje z powrotem wszystkie kafelki tego zdjęcia. Kontynuować?')) {
    S.zdj.grids[i] = old;
    return render();
  }
  S.zdj.revealed[i] = [];
  commit();
}

// ---------- Bomba ----------
function bombaCurrent() {
  const b = S.bomba;
  for (let i = 0; i < DATA.bomba.length; i++) if (!b.results[i] && !b.used.includes(i)) return i;
  return -1;
}
function bombaMark(i, status) {
  const b = S.bomba;
  if (i < 0 || i >= DATA.bomba.length) return;
  if (status) { b.results[i] = status; b.used = b.used.filter(x => x !== i); }
  else { delete b.results[i]; b.used = b.used.filter(x => x !== i); }
  localWarn = null;
  commit();
}
// Punkty za poprawną odpowiedź (może być ułamek, np. 0,5); nagroda zaokrąglona w dół
const bombaPts = () => Math.max(0, Number(S.bomba.points) || 0);
const bombaAward = n => Math.floor(n * bombaPts() + 1e-9);
const fmtNum = x => String(x).replace('.', ',');
function bombaBoom(loser) {
  const b = S.bomba;
  if (b.phase === 'boom') { localWarn = 'Bomba już wybuchła – cofnij (Ctrl+Z) albo zacznij nową rundę.'; return render(); }
  const count = Game.bombaCount(S), winner = 1 - loser, award = bombaAward(count);
  b.phase = 'boom';
  b.loser = loser;
  b.award = award;
  addEntry(winner, award, 'Bomba', `wybuch u: ${S.teams[loser].name}, ${count} poprawnych × ${fmtNum(bombaPts())} pkt`, { bomba: true });
  localWarn = null;
  commit();
}
function bombaNewRound() {
  const b = S.bomba;
  if (!confirm('Zacząć nową rundę bomby? Licznik poprawnych odpowiedzi się wyzeruje (punkty zostają), a zadane pytania nie wrócą.')) return;
  b.used = [...new Set([...b.used, ...Object.keys(b.results).map(Number)])];
  b.results = {};
  b.phase = 'play';
  b.loser = null;
  b.award = 0;
  commit();
}

// ---------- Przysłowia ----------
const currentProverb = () => DATA.przyslowia[S.prz.index] || '';

function przSetTeam(i) { S.prz.team = i; commit(); }

function przGuess(letter) {
  const L = T.upper(letter);
  if (!T.isLetter(L)) return;
  const p = S.prz, text = currentProverb();
  if (!text) return;
  if (p.solved) { localWarn = 'Hasło jest już odsłonięte – przejdź do następnego.'; return render(); }
  if (!T.isGuessable(L)) { localWarn = `⚠ Samogłosek A, E, I, O, U, Y nie zgadujemy (wpisano ${L}). Można: spółgłoski oraz Ą, Ę, Ó.`; return render(); }
  if (p.guessed.includes(L)) { localWarn = `⚠ Litera ${L} już była!`; return render(); }

  const team = p.team, teamName = S.teams[team].name;
  const n = T.count(text, L);
  let pts = 0, msg, kind;
  if (n === 0) { msg = `Brak litery ${L}`; kind = 'miss'; }
  else { pts = n * (Number(p.pointValue) || 0); msg = `${L} × ${n}  →  ${fmtPts(pts)} pkt dla: ${teamName}`; kind = 'hit'; }

  p.guessed.push(L);
  const solvedNow = [...T.lettersOf(text)].filter(T.isGuessable).every(l => p.guessed.includes(l));
  if (solvedNow) { p.solved = true; msg += ' – hasło odsłonięte!'; }
  p.msg = { id: Date.now(), text: msg, kind };

  const extra = { letter: L, prz: p.index };
  if (solvedNow) extra.solvedNow = true;
  addEntry(team, pts, 'Przysłowia', `litera ${L} (${n}×)`, extra);
  localWarn = null;
  commit();
}

function przSolve(team) {
  const bonus = Number(S.prz.solveBonus) || 0;
  S.prz.solved = true;
  S.prz.msg = { id: Date.now(), text: `${S.teams[team].name} odgaduje hasło! ${fmtPts(bonus)} pkt`, kind: 'solve' };
  if (bonus) addEntry(team, bonus, 'Przysłowia', `odgadnięte hasło nr ${S.prz.index + 1}`);
  localWarn = null;
  commit();
}

function przReveal() {
  S.prz.solved = true;
  S.prz.msg = { id: Date.now(), text: 'Odsłaniamy hasło', kind: 'reveal' };
  commit();
}

function przSelect(i) {
  if (!DATA.przyslowia.length) return;
  S.prz.index = i;
  S.prz.guessed = [];
  S.prz.solved = false;
  S.prz.msg = null;
  if (!S.prz.seen.includes(i)) S.prz.seen.push(i);
  localWarn = null;
  commit();
}

// ---------- Kalambury ----------
function kalToggle() {
  const t = S.kal.timer;
  if (t.running && Timer.remaining(t) > 0) Timer.pause(t);
  else { if (t.running) Timer.reset(t); Timer.start(t); }
  commit();
}
function kalReset() { Timer.reset(S.kal.timer); commit(); }

const kalSet = () => S.kal.sets[S.kal.team];
const kalWords = () => DATA.kalambury[kalSet()] || [];
function kalResults(set = kalSet()) {
  if (!S.kal.results[set]) S.kal.results[set] = {};
  return S.kal.results[set];
}
// Pierwsze hasło bez oznaczenia
function kalCurrent() {
  const words = kalWords(), r = kalResults();
  for (let i = 0; i < words.length; i++) if (!r[i]) return i;
  return -1;
}
// status: 'ok' | 'fail' | null (wyczyść)
function kalMark(i, status) {
  const set = kalSet(), r = kalResults(set), team = S.kal.team, word = kalWords()[i];
  if (i < 0 || word == null) return;
  if (r[i] === status) return;
  if (r[i] === 'ok') {   // zdejmujemy wcześniejsze punkty za to hasło
    const k = S.log.findIndex(e => e.kal && e.kal.set === set && e.kal.i === i);
    if (k >= 0) S.log.splice(k, 1);
  }
  if (status) r[i] = status; else delete r[i];
  if (status === 'ok') addEntry(team, Number(S.kal.points) || 0, 'Kalambury', `hasło: ${word}`, { kal: { set, i } });
  localWarn = null;
  commit();
}
function kalSetTeam(i) {
  if (S.kal.team === i) return;
  S.kal.team = i;
  if (!S.kal.timer.running || Timer.remaining(S.kal.timer) <= 0) Timer.reset(S.kal.timer);
  S.kal.showSummary = false;
  commit();
}
function kalSwap() {
  S.kal.sets = [S.kal.sets[1], S.kal.sets[0]];
  commit();
}
function kalSummary() {
  S.kal.showSummary = !S.kal.showSummary;
  commit();
}

// ---------- Czółko ----------
function shuffled(n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function czoEnsureOrder() {
  if (S.czo.order.length !== DATA.czolko.length) {
    S.czo.order = shuffled(DATA.czolko.length);
    return true;
  }
  return false;
}
const czoSong = n => DATA.czolko[S.czo.order[n - 1]];

function czoSetTeam(i) { S.czo.team = i; commit(); }

function czoPick(n) {
  const c = S.czo;
  if (c.phase === 'song' && !confirm('Trwa piosenka. Przerwać ją bez wyniku i wybrać inny numer?')) return;
  if (c.results[n] && !confirm(`Piosenka nr ${n} już była. Wybrać ją mimo to?`)) return;
  c.current = n;
  c.phase = 'ready';
  Timer.reset(c.timer);
  c.msg = null;
  commit();
}
function czoShow() {
  const c = S.czo;
  if (c.current == null) return;
  c.phase = 'song';
  Timer.reset(c.timer);
  Timer.start(c.timer);
  commit();
}
function czoPause() {
  const t = S.czo.timer;
  if (t.running && Timer.remaining(t) > 0) Timer.pause(t);
  else if (!t.running && t.left > 0) Timer.start(t);
  commit();
}
function czoResult(ok) {
  const c = S.czo, n = c.current;
  if (n == null) return;
  const song = czoSong(n), team = c.team, pts = ok ? (Number(c.points) || 0) : 0;
  c.results[n] = { team, ok };
  addEntry(team, pts, 'Czółko', `piosenka nr ${n}: ${song ? song.tytul : '?'} – ${ok ? 'odgadnięta' : 'nieodgadnięta'}`, { czo: n });
  c.msg = ok
    ? { id: Date.now(), text: `${S.teams[team].name} odgaduje! ${fmtPts(pts)} pkt`, kind: 'hit' }
    : { id: Date.now(), text: `Nie udało się – ${song ? song.tytul : ''}`, kind: 'miss' };
  c.current = null;
  c.phase = 'board';
  Timer.reset(c.timer);
  c.team = 1 - team;   // kolej drugiej drużyny
  localWarn = null;
  commit();
}
function czoCancel() {
  const c = S.czo;
  c.current = null;
  c.phase = 'board';
  Timer.reset(c.timer);
  commit();
}
function czoUnmark(n) {
  const r = S.czo.results[n];
  if (!r) return;
  const msg = r.ok
    ? `Przywrócić piosenkę nr ${n} jako „do wzięcia”?\nPrzyznane za nią punkty zostają – w razie potrzeby cofnij je w historii.`
    : `Przywrócić piosenkę nr ${n} jako „do wzięcia”?`;
  if (!confirm(msg)) return;
  delete S.czo.results[n];
  commit();
}
function czoShuffle() {
  if (Object.keys(S.czo.results).length && !confirm('Część piosenek już była. Przetasować mimo to? (Oznaczenia zostaną wyczyszczone, punkty zostają.)')) return;
  S.czo.order = shuffled(DATA.czolko.length);
  S.czo.results = {};
  S.czo.current = null;
  S.czo.phase = 'board';
  commit();
}

// ---------- Renderowanie ----------
function render() {
  const sc = Game.scores(S);
  $('#a-title').textContent = S.title ? `– ${S.title}` : '';
  $$('.team-card').forEach(card => {
    const i = +card.dataset.team;
    card.style.setProperty('--team', S.teams[i].color);
    card.querySelector('.team-name').textContent = S.teams[i].name;
    card.querySelector('.team-score').textContent = sc[i];
  });
  $$('.tabs [data-view]').forEach(b => b.classList.toggle('active',
    b.dataset.view === S.view && (!b.dataset.round || +b.dataset.round === S.lic.round)));
  $$('.panel').forEach(p => { p.hidden = p.id !== `panel-${S.view}`; });
  if (document.activeElement !== $('#set-title')) $('#set-title').value = S.title;
  $('#set-theme').value = S.theme;
  renderLog();
  renderTable();
  renderAkr();
  renderLic();
  renderBomba();
  renderPrz();
  renderKal();
  renderCzo();
  renderZdj();
  renderSave();
  tick();
}

function renderLog() {
  const items = S.log.slice().reverse().map(e => `
    <li style="--team:${T.esc(S.teams[e.team].color)}">
      <span class="log-time">${T.time(e.t)}</span>
      <span class="log-team">${T.esc(S.teams[e.team].name)}</span>
      <span class="log-pts ${e.pts > 0 ? 'pos' : e.pts < 0 ? 'neg' : 'zero'}">${fmtPts(e.pts)}</span>
      <span class="log-desc">${T.esc(e.comp)} · ${T.esc(e.desc)}</span>
    </li>`);
  $('#log').innerHTML = items.join('') || '<li class="empty">Brak wpisów</li>';
  $('#btn-undo').disabled = !S.log.length;
}

const seenBtn = (i, seen) => `<button class="mini" data-toggle="${i}" title="${seen ? 'Przywróć jako „do wzięcia”' : 'Oznacz jako wykorzystany'}">${seen ? '↺ do wzięcia' : '✓ było'}</button>`;

function renderTable() {
  const rows = Game.table(S), sc = Game.scores(S);
  $('#score-table').innerHTML = `
    <thead><tr><th>Konkurencja</th>${[0, 1].map(i => `<th style="--team:${T.esc(S.teams[i].color)}">${T.esc(S.teams[i].name)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr><td>${T.esc(r.name)}</td><td>${r.pts[0]}</td><td>${r.pts[1]}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Suma</td><td>${sc[0]}</td><td>${sc[1]}</td></tr></tfoot>`;
  $('#btn-table').textContent = S.showTable ? '🏆 Pokaż na TV duże wyniki' : '📋 Pokaż tabelę na TV';
}

function renderLic() {
  const l = S.lic, song = licSong(), top = licTop();
  const roman = l.round === 2 ? 'II' : 'I';
  $('#lic-title').textContent = `🎤 Licytacja wersów – runda ${roman}`;
  $('#lic-song').innerHTML = song ? `<b>${T.esc(song.tytul)}</b> – ${T.esc(song.autor)}` : '(brak piosenek dla tej rundy w data/pytania.js)';
  $('#lic-max').textContent = song ? `maks. ${licMax(song)} wersów` : '';
  const st = licStartTeam(), sc = Game.scores(S);
  $('#lic-start-info').innerHTML = `Licytację zaczyna: <b style="color:${T.esc(S.teams[st].color)}">${T.esc(S.teams[st].name)}</b>` +
    (l.startManual != null ? ' (wybrane ręcznie)' : sc[0] === sc[1] ? ' (remis – wybierz)' : ' (mniej punktów)');
  renderTeamPicks('.lic-start-pick', l.startManual);

  $$('.lic-bidbox').forEach(box => {
    const i = +box.dataset.team;
    box.style.setProperty('--team', S.teams[i].color);
    box.querySelector('.lic-bidname').textContent = S.teams[i].name;
    const input = box.querySelector('input');
    if (document.activeElement !== input) input.value = top ? Math.min(top.n + 1, licMax(song)) : 1;
    input.max = licMax(song);
    input.disabled = box.querySelector('button').disabled = l.phase !== 'bidding' || !song;
  });
  $('#lic-bids').innerHTML = l.bids.length
    ? l.bids.map((b, k) => `<span class="tag ${k === l.bids.length - 1 ? 'top' : ''}" style="--team:${T.esc(S.teams[b.team].color)}">${T.esc(S.teams[b.team].name)}: ${b.n}</span>`).join(' → ')
    : '<span class="hint">Brak ofert</span>';

  const msgEl = $('#lic-msg');
  if (localWarn && S.view === 'licytacja') { msgEl.textContent = localWarn; msgEl.className = 'prz-msg warn'; }
  else if (l.phase === 'singing' && top) { msgEl.textContent = `Śpiewa: ${S.teams[top.team].name} – ${top.n} wersów bez pomyłki`; msgEl.className = 'prz-msg vowel'; }
  else if (l.msg && l.phase === 'done') { msgEl.textContent = l.msg.text; msgEl.className = `prz-msg ${l.msg.kind}`; }
  else { msgEl.textContent = 'Drużyny licytują, ile wersów zaśpiewają. Wpisz ofertę i kliknij „Licytuj”.'; msgEl.className = 'prz-msg'; }

  $('#lic-undo-bid').hidden = l.phase !== 'bidding';
  $('#lic-close').hidden = l.phase !== 'bidding';
  $('#lic-close').disabled = !top;
  $('#lic-ok').hidden = $('#lic-fail').hidden = l.phase !== 'singing';
  if (top) {
    $('#lic-ok').textContent = `✔ Bez pomyłki (+${top.n} dla: ${S.teams[top.team].name})`;
    $('#lic-fail').textContent = `✖ Pomyłka (+${top.n} dla: ${S.teams[1 - top.team].name})`;
  }
  renderLicLyrics(song, top);
  renderKaraoke();
  LicAudio.load(song);
  $('#lic-play').textContent = LicAudio.el().paused ? '▶ Puść' : '⏸ Pauza';

  $('#lic-list').innerHTML = licSongs().map(s => {
    const seen = l.seen.includes(s.i);
    return `<li data-i="${s.i}" class="${s.i === l.song ? 'current' : ''} ${seen && s.i !== l.song ? 'seen' : ''}"><span class="txt"><b>${T.esc(s.tytul)}</b> – ${T.esc(s.autor)} <small>(maks. ${licMax(s)})</small></span>${seenBtn(s.i, seen)}</li>`;
  }).join('');
}

// Tekst piosenki: numerowane wersy, podświetlone te, które trzeba zaśpiewać
function renderLicLyrics(song, top) {
  const box = $('#lic-lyrics'), lines = licLines(song), max = licMax(song);
  const n = top ? top.n : 0, firm = S.lic.phase !== 'bidding';
  $('#lic-lyrics-info').textContent = !song ? '' : lines.length
    ? `(${lines.length} wersów${n ? ` · ${firm ? 'do zaśpiewania' : 'oferta'}: ${n}` : ''})`
    : '';
  if (!song) { box.innerHTML = ''; return; }
  if (!lines.length) { box.innerHTML = '<p class="hint">Brak tekstu – wpisz go w <code>data/pytania.js</code> (pole <code>tekst</code>).</p>'; return; }
  let k = 0;
  box.innerHTML = String(song.tekst).trim().split(/\r?\n/).map(raw => {
    const t = raw.trim();
    if (!t) return '<div class="lic-gap"></div>';
    k++;
    const onTv = S.lic.karaoke && k - 1 >= S.lic.kpos && k - 1 < S.lic.kpos + KARAOKE_STEP;
    const cls = [k <= n ? (firm ? 'sing' : 'bid') : '', k > max ? 'over' : '', k === n ? 'last' : '', onTv ? 'tv' : ''].join(' ');
    return `<div class="lic-line ${cls}" data-line="${k - 1}"><span class="n">${k}</span><span>${T.esc(t)}</span></div>`;
  }).join('');
}

function renderKaraoke() {
  const avail = karAvailable(), on = S.lic.karaoke && avail;
  $('#kar-bar').hidden = !avail;
  $('#lic-lyrics').classList.toggle('clickable', on);
  if (!avail) return;
  const n = licLines(licSong()).length, p = S.lic.kpos;
  $('#kar-toggle').textContent = on ? '⏹ Schowaj tekst z TV' : '🎶 Śpiewamy razem – tekst na TV';
  $('#kar-toggle').classList.toggle('primary', !on);
  $('#kar-prev').hidden = $('#kar-next').hidden = !on;
  $('#kar-prev').disabled = p <= 0;
  $('#kar-next').disabled = p + KARAOKE_STEP >= n;
  $('#kar-info').textContent = on
    ? `Na TV: wersy ${p + 1}–${Math.min(n, p + KARAOKE_STEP)} z ${n} · strzałki ← / → · kliknięcie wersu = skok`
    : 'Po licytacji możesz wyświetlić tekst na TV i zaśpiewać wszyscy razem.';
  const cur = $('#lic-lyrics .lic-line.tv');
  if (on && cur) {
    const box = $('#lic-lyrics');
    const top = cur.offsetTop - box.offsetTop;
    if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 60) box.scrollTop = top - 40;
  }
}

function renderBomba() {
  const b = S.bomba, cur = bombaCurrent(), q = DATA.bomba[cur];
  $('#bomba-label').textContent = q ? `Pytanie nr ${cur + 1}:` : 'Pytanie:';
  $('#bomba-q').textContent = q ? q.pytanie : (DATA.bomba.length ? '🎉 Koniec pytań' : '(brak pytań w data/pytania.js)');
  $('#bomba-a').innerHTML = q ? `Odpowiedź: <b>${T.esc(q.odpowiedz)}</b>` : '';
  $('#bomba-ok').disabled = $('#bomba-fail').disabled = !q;
  const n = Game.bombaCount(S);
  $('#bomba-count').innerHTML = `Poprawne odpowiedzi w tej rundzie: <b>${n}</b> × ${fmtNum(bombaPts())} pkt = <b>${bombaAward(n)} pkt</b>`;
  if (document.activeElement !== $('#bomba-points')) $('#bomba-points').value = fmtNum(bombaPts());
  $$('.bomba-boom-btn').forEach(btn => {
    const i = +btn.dataset.team;
    btn.textContent = `💥 ${S.teams[i].name} (rywale +${bombaAward(n)})`;
    btn.style.setProperty('--team', S.teams[i].color);
    btn.disabled = b.phase === 'boom';
  });
  const msgEl = $('#bomba-msg');
  if (localWarn && S.view === 'bomba') { msgEl.textContent = localWarn; msgEl.className = 'prz-msg warn'; }
  else if (b.phase === 'boom') { msgEl.textContent = `💥 Bomba wybuchła u: ${S.teams[b.loser].name} (0 pkt). ${S.teams[1 - b.loser].name} dostaje +${b.award} pkt.`; msgEl.className = 'prz-msg miss'; }
  else { msgEl.textContent = 'Zadawaj pytania osobie, która trzyma prezent. Po wybuchu kliknij drużynę, u której wybuchła bomba.'; msgEl.className = 'prz-msg'; }

  $('#bomba-list').innerHTML = DATA.bomba.map((x, i) => {
    const st = b.results[i] || (b.used.includes(i) ? 'used' : null);
    const btns = st
      ? `${st === 'ok' ? `<button class="mini show fail" data-mark="fail" data-i="${i}">✖</button>` : st === 'fail' ? `<button class="mini show ok" data-mark="ok" data-i="${i}">✔</button>` : ''}<button class="mini show" data-mark="clear" data-i="${i}">↺</button>`
      : `<button class="mini show ok" data-mark="ok" data-i="${i}">✔</button><button class="mini show fail" data-mark="fail" data-i="${i}">✖</button>`;
    const mark = st === 'ok' ? '✔ ' : st === 'fail' ? '✖ ' : st === 'used' ? '(poprzednia runda) ' : '';
    return `<li class="${st === 'used' ? 'seen' : st || ''} ${i === cur ? 'current' : ''}" title="${T.esc(x.odpowiedz)}"><span class="txt">${mark}${i + 1}. ${T.esc(x.pytanie)}</span>${btns}</li>`;
  }).join('');
}

function renderAkr() {
  const list = DATA.akronimy, a = list[S.akr.index];
  [0, 1].forEach(i => {
    const btn = $(`#akr-award-${i}`);
    btn.textContent = `✔ ${S.teams[i].name} (+${Number(S.akr.points) || 0})`;
    btn.style.setProperty('--team', S.teams[i].color);
    btn.disabled = !a;
  });
  if (document.activeElement !== $('#akr-points')) $('#akr-points').value = S.akr.points;
  $('#akr-skrot').textContent = a ? a.skrot : '(brak akronimów w data/pytania.js)';
  $('#akr-full').innerHTML = a ? T.acronymHTML(a) : '';
  $('#akr-state').textContent = !S.akr.showSkrot ? 'TV: ukryte' : S.akr.showFull ? 'TV: skrót + rozwinięcie' : 'TV: tylko skrót';
  $('#akr-state').className = 'akr-state ' + (!S.akr.showSkrot ? 'off' : 'on');
  $('#akr-list').innerHTML = list.map((x, i) => {
    const seen = S.akr.seen.includes(i);
    return `<li data-i="${i}" class="${i === S.akr.index ? 'current' : ''} ${seen ? 'seen' : ''}">
      <span class="txt"><b>${T.esc(x.skrot)}</b> – ${T.esc(x.rozwiniecie)}</span>${seenBtn(i, seen)}</li>`;
  }).join('');
}

function renderTeamPicks(cls, active) {
  $$(cls).forEach(b => {
    const i = +b.dataset.team;
    b.textContent = S.teams[i].name;
    b.style.setProperty('--team', S.teams[i].color);
    b.classList.toggle('active', i === active);
  });
}

function renderPrz() {
  const p = S.prz, text = currentProverb();
  const revealed = p.solved ? T.lettersOf(text) : new Set(p.guessed);
  $('#prz-text').textContent = text || '(brak przysłów w data/pytania.js)';
  $('#prz-mask').innerHTML = [...text].map(ch => {
    if (!T.isLetter(ch)) return ch === ' ' ? '<span class="gap"></span>' : `<span class="p">${T.esc(ch)}</span>`;
    const U = T.upper(ch);
    return revealed.has(U) ? `<span class="l on">${T.esc(U)}</span>` : '<span class="l"></span>';
  }).join('');

  renderTeamPicks('.prz-pick', p.team);

  const inText = T.lettersOf(text);
  $('#prz-keys').innerHTML = T.ALPHABET.map(L => {
    const used = p.guessed.includes(L);
    const ok = T.isGuessable(L);
    const cls = ['key', T.isVowel(L) ? 'vowel' : 'cons', ok ? '' : 'blocked', used ? (inText.has(L) ? 'hit' : 'miss') : ''].join(' ');
    return `<button class="${cls}" data-letter="${L}" ${used || p.solved || !ok ? 'disabled' : ''} title="${ok ? '' : 'Samogłosek A, E, I, O, U, Y nie zgadujemy'}">${L}</button>`;
  }).join('');
  $('#prz-round').textContent = `Runda ${p.index + 1}${p.index >= 2 ? ' (zapas)' : ''}`;

  const msgEl = $('#prz-msg');
  if (localWarn && S.view === 'przyslowia') { msgEl.textContent = localWarn; msgEl.className = 'prz-msg warn'; }
  else if (p.msg) { msgEl.textContent = p.msg.text; msgEl.className = `prz-msg ${p.msg.kind}`; }
  else { msgEl.textContent = 'Wybierz drużynę i wpisz spółgłoskę lub Ą / Ę / Ó (klawiatura lub przyciski powyżej).'; msgEl.className = 'prz-msg'; }

  if (document.activeElement !== $('#prz-value')) $('#prz-value').value = p.pointValue;
  if (document.activeElement !== $('#prz-bonus')) $('#prz-bonus').value = p.solveBonus;
  [0, 1].forEach(i => {
    const b = $(`#prz-solve-${i}`);
    b.textContent = `✔ ${S.teams[i].name} odgaduje (${fmtPts(Number(p.solveBonus) || 0)})`;
    b.style.setProperty('--team', S.teams[i].color);
    b.classList.add('team-btn');
    b.disabled = p.solved || !text;
  });
  $('#prz-reveal').disabled = p.solved || !text;

  $('#prz-list').innerHTML = DATA.przyslowia.map((x, i) => {
    const seen = p.seen.includes(i);
    return `<li data-i="${i}" class="${i === p.index ? 'current' : ''} ${seen ? 'seen' : ''}"><span class="txt">${T.esc(x)}</span>${seenBtn(i, seen)}</li>`;
  }).join('');
}

function renderKal() {
  const k = S.kal;
  if (document.activeElement !== $('#kal-dur')) $('#kal-dur').value = k.timer.duration;
  if (document.activeElement !== $('#kal-points')) $('#kal-points').value = k.points;
  renderTeamPicks('.kal-pick', k.team);
  $('#kal-setinfo').textContent = `(zestaw ${kalSet()})`;

  $('#kal-counts').innerHTML = [0, 1].map(i => {
    const n = Game.kalCount(S, i);
    return `<span style="--team:${T.esc(S.teams[i].color)}"><b>${T.esc(S.teams[i].name)}</b> (zestaw ${k.sets[i]}): odgadnięte ${n} → ${fmtPts(n * (Number(k.points) || 0))} pkt</span>`;
  }).join('');

  const words = kalWords(), r = kalResults(), cur = kalCurrent();
  $('#kal-word').textContent = cur >= 0 ? words[cur] : (words.length ? '🎉 Koniec haseł w tym zestawie' : '(brak haseł w data/pytania.js)');
  $('#kal-ok').disabled = $('#kal-fail').disabled = cur < 0;
  $('#kal-summary').textContent = k.showSummary ? '🙈 Ukryj podsumowanie na TV' : '📊 Pokaż podsumowanie na TV';
  $('#kal-summary').classList.toggle('primary', !k.showSummary);

  $('#kal-list-title').textContent = `Zestaw ${kalSet()} – ${S.teams[k.team].name}`;
  $('#kal-list').innerHTML = words.map((w, i) => {
    const st = r[i];
    const btns = st
      ? `<button class="mini show" data-mark="clear" data-i="${i}">↺</button>`
      : `<button class="mini show ok" data-mark="ok" data-i="${i}">✔</button><button class="mini show fail" data-mark="fail" data-i="${i}">✖</button>`;
    const swap = st === 'ok' ? `<button class="mini show fail" data-mark="fail" data-i="${i}">✖</button>` : st === 'fail' ? `<button class="mini show ok" data-mark="ok" data-i="${i}">✔</button>` : '';
    return `<li class="${st || ''} ${i === cur ? 'current' : ''}"><span class="txt">${st === 'ok' ? '✔ ' : st === 'fail' ? '✖ ' : ''}${T.esc(w)}</span>${swap}${btns}</li>`;
  }).join('');
}

// Podgląd w panelu: zdjęcie na całą szerokość kolumny (maks. 460 px wysokości)
function zdjFitAdmin() {
  const box = $('#zdj-preview');
  if (box.offsetParent) fitImage(box.querySelector('img'), box.clientWidth, 460);
}
window.addEventListener('resize', zdjFitAdmin);

function renderZdj() {
  const i = S.zdj.index, z = DATA.zdjecia[i], n = DATA.zdjecia.length;
  const box = $('#zdj-preview');
  $('#zdj-empty').hidden = n > 0;
  $('#zdj-work').hidden = n === 0;
  if (!z) return;
  const g = zdjGrid(S, i), open = zdjRevealed(S, i), total = g.cols * g.rows;
  $('#zdj-title').textContent = `Zdjęcie ${i + 1} z ${n}`;
  $('#zdj-podpis').textContent = z.podpis || '(bez podpisu)';
  $('#zdj-status').textContent = `Odkryte: ${open.length} z ${total}`;
  if (document.activeElement !== $('#zdj-cols')) $('#zdj-cols').value = g.cols;
  if (document.activeElement !== $('#zdj-rows')) $('#zdj-rows').value = g.rows;
  $('#zdj-random').disabled = open.length >= total;
  $('#zdj-prev').disabled = i <= 0;
  $('#zdj-next').disabled = i >= n - 1;
  $('#zdj-caption').textContent = S.zdj.caption ? '🙈 Schowaj podpis z TV' : '🏷 Pokaż podpis na TV';
  // Zdjęcie podmieniamy tylko przy zmianie pliku (bez migania)
  const img = box.querySelector('img');
  if (img.getAttribute('src') !== z.plik) {
    img.setAttribute('src', z.plik);
    $('#zdj-missing').hidden = true;
  }
  zdjFitAdmin();
  const grid = box.querySelector('.zdj-grid');
  grid.style.gridTemplateColumns = `repeat(${g.cols},1fr)`;
  grid.style.gridTemplateRows = `repeat(${g.rows},1fr)`;
  grid.innerHTML = Array.from({ length: total }, (_, k) =>
    `<button class="zdj-tile ${open.includes(k) ? 'open' : ''}" data-k="${k}" title="${open.includes(k) ? 'Zakryj' : 'Odkryj'} kafelek ${k + 1}"><span>${k + 1}</span></button>`).join('');
  $('#zdj-list').innerHTML = DATA.zdjecia.map((x, j) => {
    const gg = zdjGrid(S, j), o = zdjRevealed(S, j).length, t = gg.cols * gg.rows;
    return `<button class="zdj-thumb ${j === i ? 'current' : ''} ${o >= t ? 'done' : o ? 'started' : ''}" data-i="${j}">
      <img src="${T.esc(x.plik)}" alt="" loading="lazy"><span><b>${j + 1}.</b> ${T.esc(x.podpis || x.plik)}<br><small>${o}/${t} · ${gg.cols}×${gg.rows}</small></span></button>`;
  }).join('');
}

function renderCzo() {
  const c = S.czo, n = DATA.czolko.length;
  renderTeamPicks('.czo-pick', c.team);

  const perTeam = Math.ceil(n / 2);
  const res = Object.values(c.results);
  $('#czo-counts').innerHTML = [0, 1].map(i => {
    const mine = res.filter(r => r.team === i);
    return `<span style="--team:${T.esc(S.teams[i].color)}"><b>${T.esc(S.teams[i].name)}</b>: ${mine.length}/${perTeam} piosenek, odgadnięte ${mine.filter(r => r.ok).length}</span>`;
  }).join('');

  const song = c.current != null ? czoSong(c.current) : null;
  let stage;
  if (!n) stage = '(brak piosenek w data/pytania.js)';
  else if (c.phase === 'board') stage = `<b>${T.esc(S.teams[c.team].name)}</b> wybiera numer – kliknij go poniżej.`;
  else if (c.phase === 'ready') stage = `Nr <b>${c.current}</b>: <b>${T.esc(song?.tytul)}</b> – ${T.esc(song?.autor)}<br><span class="hint">TV: „odwróćcie się tyłem”. Gdy drużyna stoi tyłem, kliknij „Pokaż piosenkę” (<kbd>Spacja</kbd>).</span>`;
  else stage = `Nr <b>${c.current}</b>: <b>${T.esc(song?.tytul)}</b> – ${T.esc(song?.autor)} <span class="timer-inline" id="czo-time"></span>`;
  $('#czo-stage').innerHTML = stage;
  if (localWarn && S.view === 'czolko') $('#czo-stage').innerHTML += `<div class="prz-msg warn">${T.esc(localWarn)}</div>`;

  $('#czo-show').hidden = c.phase !== 'ready';
  $('#czo-pause').hidden = c.phase !== 'song';
  $('#czo-ok').hidden = c.phase !== 'song';
  $('#czo-fail').hidden = c.phase !== 'song';
  $('#czo-cancel').hidden = c.phase === 'board';
  $('#czo-ok').textContent = `✔ Odgadli (${fmtPts(Number(c.points) || 0)})`;

  $('#czo-grid').innerHTML = Array.from({ length: n }, (_, k) => {
    const num = k + 1, r = c.results[num];
    const style = r ? `style="--team:${T.esc(S.teams[r.team].color)}"` : '';
    return `<button class="czo-num ${r ? (r.ok ? 'done ok' : 'done fail') : ''} ${num === c.current ? 'current' : ''}" data-n="${num}" ${style}>${num}${r ? `<small>${r.ok ? '✓' : '✗'}</small>` : ''}</button>`;
  }).join('');

  if (document.activeElement !== $('#czo-points')) $('#czo-points').value = c.points;
  if (document.activeElement !== $('#czo-dur')) $('#czo-dur').value = c.timer.duration;

  $('#czo-list').innerHTML = Array.from({ length: n }, (_, k) => {
    const num = k + 1, s = czoSong(num), r = c.results[num];
    const status = r ? `<span class="tag" style="--team:${T.esc(S.teams[r.team].color)}">${T.esc(S.teams[r.team].name)} ${r.ok ? '✓' : '✗'}</span>` : '';
    return `<li class="${r ? 'seen' : ''} ${num === c.current ? 'current' : ''}"><span class="txt"><b>${num}.</b> ${T.esc(s?.tytul)} – ${T.esc(s?.autor)} ${status}</span>${r ? `<button class="mini" data-unmark="${num}">↺ do wzięcia</button>` : ''}</li>`;
  }).join('');
}

// Odświeżanie zegarów w panelu
function tick() {
  const kt = S.kal.timer, kms = Timer.remaining(kt);
  const kel = $('#kal-time');
  kel.textContent = kms <= 0 ? 'KONIEC' : Timer.fmt(kms);
  kel.classList.toggle('low', kms > 0 && kms <= 10000);
  $('#kal-start').textContent = kt.running && kms > 0 ? '⏸ Pauza' : kms <= 0 ? '▶ Start od nowa' : kms < kt.duration * 1000 ? '▶ Wznów' : '▶ Start';

  const ct = S.czo.timer, cms = Timer.remaining(ct);
  const cel = $('#czo-time');
  if (cel) {
    cel.textContent = cms <= 0 ? 'koniec czasu!' : Timer.fmt(cms);
    cel.classList.toggle('low', cms <= 10000);
  }
  $('#czo-pause').textContent = ct.running && cms > 0 ? '⏸ Pauza' : '▶ Wznów';
  $('#czo-pause').disabled = cms <= 0;
}

function renderSave() {
  const el = $('#save-status'), badge = $('#save-badge');
  const dirName = Zapis.dir ? `„${T.esc(Zapis.dir.name)}”` : '';
  let html, b, cls;
  switch (Zapis.status) {
    case 'nieobslugiwane':
      html = '⚠ Ta przeglądarka nie zapisuje do folderu. Użyj Edge lub Chrome albo pobieraj kopie przyciskiem „Pobierz CSV”.';
      b = 'Zapis: tylko w przeglądarce'; cls = 'warn'; break;
    case 'wymaga-zgody':
      html = `⚠ Kliknij <b>„Wznów zapis”</b>, żeby przeglądarka znów mogła zapisywać do folderu ${dirName}.`;
      b = 'Zapis wstrzymany – kliknij „Wznów zapis”'; cls = 'warn'; break;
    case 'ok':
      html = `✔ Każda zmiana zapisuje się w folderze ${dirName} (pliki <code>wyniki.csv</code> i <code>stan.json</code>).` +
        (Zapis.lastSaved ? ` Ostatni zapis: ${T.time(Zapis.lastSaved)}.` : '');
      b = `✔ Zapis do ${Zapis.dir.name}`; cls = 'ok'; break;
    case 'blad':
      html = `✖ Błąd zapisu: ${T.esc(Zapis.error)}. Kliknij „Wznów zapis” albo wybierz folder ponownie.`;
      b = '✖ Błąd zapisu'; cls = 'err'; break;
    default:
      html = '⚠ Nie wybrano folderu zapisu. Kliknij <b>„Wybierz folder zapisu”</b> (np. <code>urodziny_mamy\\zapis</code>). Do tego czasu stan jest tylko w przeglądarce.';
      b = 'Brak folderu zapisu'; cls = 'warn';
  }
  el.innerHTML = html;
  badge.textContent = b;
  badge.className = `badge ${cls}`;
  $('#btn-resume').hidden = !(Zapis.dir && (Zapis.status === 'wymaga-zgody' || Zapis.status === 'blad'));
  $('#btn-choose-dir').hidden = Zapis.status === 'nieobslugiwane';
}

// ---------- Wczytywanie / reset ----------
function replaceState(obj) {
  const rev = S.rev;
  S = Game.normalize(obj);
  S.rev = rev;
  localWarn = null;
  czoEnsureOrder();
}

async function loadFile(file) {
  const text = await file.text();
  if (file.name.toLowerCase().endsWith('.json')) {
    const obj = JSON.parse(text);
    if (!obj || !Array.isArray(obj.log)) throw new Error('Plik JSON nie zawiera stanu gry.');
    if (!confirm(`Wczytać stan gry z pliku (${obj.log.length} wpisów historii)? Obecny stan zostanie zastąpiony.`)) return;
    replaceState(obj);
  } else {
    const { log, names } = Zapis.logFromCSV(text);
    if (!confirm(`Wczytać ${log.length} wpisów historii z CSV? Obecne punkty zostaną zastąpione.`)) return;
    S.log = log;
    names.forEach((n, i) => { if (n) S.teams[i].name = n; });
  }
  commit();
}

async function chooseDir() {
  await Zapis.choose();
  const existing = await Zapis.readExisting();
  if (existing && Array.isArray(existing.obj.log) && existing.obj.log.length &&
      JSON.stringify(existing.obj.log) !== JSON.stringify(S.log)) {
    const sc = Game.scores(Game.normalize(existing.obj));
    if (confirm(`W tym folderze jest już zapis gry (${existing.obj.log.length} wpisów, wynik ${sc[0]} : ${sc[1]}).\n\nOK – wczytaj ten zapis\nAnuluj – zostaw obecną grę (stary zapis trafi do pliku archiwum)`)) {
      replaceState(existing.obj);
    } else {
      await Zapis.archive(Game.normalize(existing.obj));
    }
  }
  commit();
}

async function resetGame() {
  if (!confirm('Na pewno zresetować grę? Punkty i historia zostaną wyzerowane.\n(Wcześniej pobierze się kopia CSV, a w folderze zapisu powstanie archiwum.)')) return;
  if (S.log.length) {
    Zapis.download(S);
    await Zapis.archive(S);
  }
  const old = S;
  S = Game.defaultState();
  S.rev = old.rev;
  S.title = old.title;
  S.teams = old.teams;
  S.prz.pointValue = old.prz.pointValue;
  S.prz.solveBonus = old.prz.solveBonus;
  S.kal.timer = Timer.make(old.kal.timer.duration);
  S.kal.points = old.kal.points;
  S.akr.points = old.akr.points;
  S.czo.points = old.czo.points;
  S.czo.timer = Timer.make(old.czo.timer.duration);
  czoEnsureOrder();
  licEnsureSong();
  localWarn = 'Gra zresetowana.';
  commit();
  openNames();
}

// ---------- Zdarzenia ----------
function bind() {
  $$('.team-card').forEach(card => {
    const team = +card.dataset.team;
    card.querySelectorAll('[data-pts]').forEach(b => b.addEventListener('click', () => manualPoints(team, +b.dataset.pts)));
    const input = card.querySelector('.custom-pts input');
    card.querySelector('.btn-custom').addEventListener('click', () => manualPoints(team, +input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') manualPoints(team, +input.value); });
    card.querySelector('.team-name').addEventListener('click', openNames);
  });

  $('#btn-undo').addEventListener('click', undo);
  $$('.tabs [data-view]').forEach(b => b.addEventListener('click', () => {
    S.view = b.dataset.view;
    if (b.dataset.round) {
      S.lic.round = +b.dataset.round;
      licEnsureSong();
    }
    localWarn = null;
    commit();
  }));

  $('#btn-open-tv').addEventListener('click', () => {
    window.open('screen.html', 'teleturniej_tv', 'popup,width=1280,height=720');
  });

  // Nazwy drużyn
  $('#btn-names').addEventListener('click', openNames);
  $('#names-dialog').addEventListener('close', () => closeNames($('#names-dialog').returnValue === 'ok'));

  // Akronimy
  $('#akr-show').addEventListener('click', akrShow);
  $('#akr-reveal').addEventListener('click', akrReveal);
  $('#akr-hide').addEventListener('click', akrHide);
  $('#akr-next').addEventListener('click', akrNext);
  $('#akr-list').addEventListener('click', e => {
    const t = e.target.closest('[data-toggle]');
    if (t) { S.akr.seen = toggleIn(S.akr.seen, +t.dataset.toggle); return commit(); }
    const li = e.target.closest('li[data-i]');
    if (li) akrSelect(+li.dataset.i);
  });

  $$('[id^="akr-award-"]').forEach(b => b.addEventListener('click', () => akrAward(+b.id.slice(-1))));
  $('#akr-points').addEventListener('change', e => { S.akr.points = Math.max(0, Number(e.target.value) || 0); commit(); });

  // Wyniki – tabela
  $('#btn-table').addEventListener('click', () => { S.showTable = !S.showTable; commit(); });

  // Licytacja
  $$('.lic-start-pick').forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.team;
    S.lic.startManual = S.lic.startManual === i ? null : i;
    commit();
  }));
  $$('.lic-bidbox').forEach(box => {
    const team = +box.dataset.team, input = box.querySelector('input');
    box.querySelector('button').addEventListener('click', () => licBid(team, input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') licBid(team, input.value); });
  });
  $('#lic-undo-bid').addEventListener('click', licUndoBid);
  $('#lic-close').addEventListener('click', licClose);
  $('#lic-ok').addEventListener('click', () => licResult(true));
  $('#lic-fail').addEventListener('click', () => licResult(false));
  $('#lic-next').addEventListener('click', licNext);
  $('#kar-toggle').addEventListener('click', karToggle);
  $('#kar-prev').addEventListener('click', () => karMove(-1));
  $('#kar-next').addEventListener('click', () => karMove(1));
  $('#lic-lyrics').addEventListener('click', e => {
    const ln = e.target.closest('[data-line]');
    if (ln) karJump(+ln.dataset.line);
  });
  $('#lic-play').addEventListener('click', () => LicAudio.toggle());
  $('#lic-stop').addEventListener('click', () => LicAudio.stop());
  $('#lic-mp3').addEventListener('change', e => { LicAudio.upload(e.target.files[0]); e.target.value = ''; });
  $('#lic-mp3-del').addEventListener('click', () => LicAudio.remove());
  ['play', 'pause', 'ended'].forEach(ev => LicAudio.el().addEventListener(ev, () => {
    $('#lic-play').textContent = LicAudio.el().paused ? '▶ Puść' : '⏸ Pauza';
  }));
  $('#lic-list').addEventListener('click', e => {
    const t = e.target.closest('[data-toggle]');
    if (t) { S.lic.seen = toggleIn(S.lic.seen, +t.dataset.toggle); return commit(); }
    const li = e.target.closest('li[data-i]');
    if (li && (+li.dataset.i === S.lic.song || !S.lic.bids.length || S.lic.phase === 'done' || confirm('Zmienić piosenkę? Bieżąca licytacja zostanie przerwana.'))) licSelect(+li.dataset.i);
  });

  // Zdjęcia mamy
  $('#zdj-preview .zdj-grid').addEventListener('click', e => {
    const t = e.target.closest('[data-k]');
    if (t) zdjToggleTile(+t.dataset.k);
  });
  $('#zdj-preview img').addEventListener('error', () => { $('#zdj-missing').hidden = false; });
  $('#zdj-preview img').addEventListener('load', zdjFitAdmin);
  $('#zdj-random').addEventListener('click', zdjRandom);
  $('#zdj-all').addEventListener('click', zdjRevealAll);
  $('#zdj-hide').addEventListener('click', zdjHideAll);
  $('#zdj-prev').addEventListener('click', () => zdjSelect(S.zdj.index - 1));
  $('#zdj-next').addEventListener('click', () => zdjSelect(S.zdj.index + 1));
  $('#zdj-caption').addEventListener('click', () => { S.zdj.caption = !S.zdj.caption; commit(); });
  ['#zdj-cols', '#zdj-rows'].forEach(id => $(id).addEventListener('change', () => zdjSetGrid(+$('#zdj-cols').value, +$('#zdj-rows').value)));
  $('#zdj-list').addEventListener('click', e => {
    const b = e.target.closest('[data-i]');
    if (b) zdjSelect(+b.dataset.i);
  });

  // Bomba
  $('#bomba-ok').addEventListener('click', () => bombaMark(bombaCurrent(), 'ok'));
  $('#bomba-fail').addEventListener('click', () => bombaMark(bombaCurrent(), 'fail'));
  $$('.bomba-boom-btn').forEach(b => b.addEventListener('click', () => bombaBoom(+b.dataset.team)));
  $('#bomba-new').addEventListener('click', bombaNewRound);
  $('#bomba-points').addEventListener('change', e => {
    const v = Number(String(e.target.value).replace(',', '.').trim());
    if (!Number.isFinite(v) || v < 0) { e.target.value = fmtNum(bombaPts()); return; }
    S.bomba.points = v;
    commit();
  });
  $('#bomba-points').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
  $('#bomba-list').addEventListener('click', e => {
    const b = e.target.closest('[data-mark]');
    if (b) bombaMark(+b.dataset.i, b.dataset.mark === 'clear' ? null : b.dataset.mark);
  });

  // Przysłowia
  $$('.prz-pick').forEach(b => b.addEventListener('click', () => przSetTeam(+b.dataset.team)));
  $('#prz-keys').addEventListener('click', e => {
    const b = e.target.closest('[data-letter]');
    if (b) przGuess(b.dataset.letter);
  });
  $('#prz-value').addEventListener('change', e => { S.prz.pointValue = Math.max(0, Number(e.target.value) || 0); commit(); });
  $('#prz-bonus').addEventListener('change', e => { S.prz.solveBonus = Math.max(0, Number(e.target.value) || 0); commit(); });
  $('#prz-solve-0').addEventListener('click', () => przSolve(0));
  $('#prz-solve-1').addEventListener('click', () => przSolve(1));
  $('#prz-reveal').addEventListener('click', przReveal);
  $('#prz-next').addEventListener('click', () => {
    if (DATA.przyslowia.length) przSelect(nextUnseen(S.prz.index, DATA.przyslowia.length, S.prz.seen));
  });
  $('#prz-list').addEventListener('click', e => {
    const t = e.target.closest('[data-toggle]');
    if (t) { S.prz.seen = toggleIn(S.prz.seen, +t.dataset.toggle); return commit(); }
    const li = e.target.closest('li[data-i]');
    if (li && (+li.dataset.i === S.prz.index || !S.prz.guessed.length || confirm('Zmienić przysłowie? Odsłonięte litery bieżącego zostaną wyczyszczone.'))) przSelect(+li.dataset.i);
  });

  // Kalambury
  $('#kal-start').addEventListener('click', kalToggle);
  $('#kal-reset').addEventListener('click', kalReset);
  $$('.kal-pick').forEach(b => b.addEventListener('click', () => kalSetTeam(+b.dataset.team)));
  $('#kal-swap').addEventListener('click', kalSwap);
  $('#kal-ok').addEventListener('click', () => kalMark(kalCurrent(), 'ok'));
  $('#kal-fail').addEventListener('click', () => kalMark(kalCurrent(), 'fail'));
  $('#kal-summary').addEventListener('click', kalSummary);
  $('#kal-list').addEventListener('click', e => {
    const b = e.target.closest('[data-mark]');
    if (b) kalMark(+b.dataset.i, b.dataset.mark === 'clear' ? null : b.dataset.mark);
  });
  $('#kal-points').addEventListener('change', e => { S.kal.points = Math.max(0, Number(e.target.value) || 0); commit(); });
  $('#kal-dur').addEventListener('change', e => {
    const sec = Math.max(10, Number(e.target.value) || 120);
    S.kal.timer.duration = sec;
    if (!S.kal.timer.running) Timer.reset(S.kal.timer);
    commit();
  });

  // Czółko
  $$('.czo-pick').forEach(b => b.addEventListener('click', () => czoSetTeam(+b.dataset.team)));
  $('#czo-grid').addEventListener('click', e => {
    const b = e.target.closest('[data-n]');
    if (b) czoPick(+b.dataset.n);
  });
  $('#czo-show').addEventListener('click', czoShow);
  $('#czo-pause').addEventListener('click', czoPause);
  $('#czo-ok').addEventListener('click', () => czoResult(true));
  $('#czo-fail').addEventListener('click', () => czoResult(false));
  $('#czo-cancel').addEventListener('click', czoCancel);
  $('#czo-shuffle').addEventListener('click', czoShuffle);
  $('#czo-list').addEventListener('click', e => {
    const b = e.target.closest('[data-unmark]');
    if (b) czoUnmark(+b.dataset.unmark);
  });
  $('#czo-points').addEventListener('change', e => { S.czo.points = Math.max(0, Number(e.target.value) || 0); commit(); });
  $('#czo-dur').addEventListener('change', e => {
    const sec = Math.max(5, Number(e.target.value) || 45);
    S.czo.timer.duration = sec;
    if (!S.czo.timer.running) Timer.reset(S.czo.timer);
    commit();
  });

  // Zapis
  $('#btn-choose-dir').addEventListener('click', () => chooseDir().catch(e => { if (e.name !== 'AbortError') alert('Błąd: ' + e.message); }));
  $('#btn-resume').addEventListener('click', async () => {
    try { await Zapis.resume(); Zapis.schedule(S); } catch (e) { alert('Błąd: ' + e.message); }
  });
  $('#btn-download').addEventListener('click', () => Zapis.download(S));
  $('#file-load').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try { await loadFile(f); } catch (err) { alert('Nie udało się wczytać pliku: ' + err.message); }
  });
  $('#btn-reset').addEventListener('click', resetGame);

  // Ustawienia
  $('#set-title').addEventListener('change', e => { S.title = e.target.value; commit(); });
  $('#set-theme').addEventListener('change', e => { S.theme = e.target.value; e.target.blur(); commit(); });

  // Po kliknięciu przycisku zdejmij z niego fokus, żeby Spacja/litery nie "klikały" go ponownie
  document.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b && !b.closest('dialog')) b.blur();
  });

  // Skróty klawiszowe
  document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if ($('#names-dialog').open) return;
    if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if ((e.ctrlKey && !e.altKey) || e.metaKey) return;   // inne skróty przeglądarki (AltGr = Ctrl+Alt przepuszczamy)
    if ((e.code === 'Digit1' || e.code === 'Digit2') && !e.shiftKey) {
      e.preventDefault();
      manualPoints(e.code === 'Digit1' ? 0 : 1, 1);
      return;
    }
    if (S.view === 'akronimy' && e.code === 'Space') { e.preventDefault(); akrStep(); return; }
    if (S.view === 'licytacja' && e.code === 'KeyM') { e.preventDefault(); LicAudio.toggle(); return; }
    if (S.view === 'licytacja' && S.lic.karaoke) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); karMove(-1); return; }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); karMove(1); return; }
    }
    if (S.view === 'zdjecia') {
      if (e.code === 'Space') { e.preventDefault(); zdjRandom(); return; }
      if (e.key === 'Enter') { e.preventDefault(); zdjRevealAll(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); zdjSelect(S.zdj.index - 1); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); zdjSelect(S.zdj.index + 1); return; }
    }
    if (S.view === 'bomba') {
      if (e.key === 'Enter') { e.preventDefault(); bombaMark(bombaCurrent(), 'ok'); return; }
      if (e.key === 'Backspace') { e.preventDefault(); bombaMark(bombaCurrent(), 'fail'); return; }
    }
    if (S.view === 'kalambury') {
      if (e.code === 'Space') { e.preventDefault(); kalToggle(); return; }
      if (e.key === 'Enter') { e.preventDefault(); kalMark(kalCurrent(), 'ok'); return; }
      if (e.key === 'Backspace') { e.preventDefault(); kalMark(kalCurrent(), 'fail'); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); kalSetTeam(0); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); kalSetTeam(1); return; }
    }
    if (S.view === 'czolko') {
      if (e.code === 'Space') {
        e.preventDefault();
        if (S.czo.phase === 'ready') czoShow();
        else if (S.czo.phase === 'song') czoPause();
        return;
      }
      if (e.key === 'ArrowLeft') { e.preventDefault(); czoSetTeam(0); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); czoSetTeam(1); return; }
    }
    if (S.view === 'przyslowia') {
      if (e.key === 'ArrowLeft') { e.preventDefault(); przSetTeam(0); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); przSetTeam(1); return; }
      if (e.key.length === 1 && T.isLetter(e.key)) { e.preventDefault(); przGuess(e.key); }
    }
  });

  Zapis.onStatus = renderSave;
  setInterval(tick, 200);
}

// ---------- Start ----------
bind();
czoEnsureOrder();
licEnsureSong();
commit();   // zapisuje ewentualną migrację i losowanie numerków, synchronizuje TV
if (!S.namesConfirmed) openNames();
Zapis.init().then(() => { if (Zapis.status === 'ok') Zapis.schedule(S); });
