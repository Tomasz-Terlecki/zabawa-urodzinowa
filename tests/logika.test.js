'use strict';
// Testy logiki gry z js/state.js (wspólnej dla panelu i ekranu TV).
const test = require('node:test');
const { zaladuj, assert } = require('./zaladuj');

const hl = (T, skrot, full) => T.acronymParts(skrot, full).filter(p => p.first).map(p => p.first + p.rest);

test('akronimy: podświetlanie pierwszych liter', async t => {
  const { T } = zaladuj();
  await t.test('zwykły skrót', () => assert.deepEqual(hl(T, 'PKP', 'Polskie Koleje Państwowe'), ['Polskie', 'Koleje', 'Państwowe']));
  await t.test('litera skrótu bez słowa (V w TVP) nie blokuje dalszych', () => assert.deepEqual(hl(T, 'TVP', 'Telewizja Polska'), ['Telewizja', 'Polska']));
  await t.test('skrót z sylab (REGON)', () => assert.deepEqual(hl(T, 'REGON', 'Rejestr Gospodarki Narodowej'), ['Rejestr', 'Gospodarki', 'Narodowej']));
  await t.test('spójnik „i” spoza skrótu nie jest podświetlany', () => assert.deepEqual(hl(T, 'BHP', 'Bezpieczeństwo i Higiena Pracy'), ['Bezpieczeństwo', 'Higiena', 'Pracy']));
  await t.test('małe „i” w skrócie jest podświetlane', () => assert.deepEqual(hl(T, 'UOKiK', 'Urząd Ochrony Konkurencji i Konsumentów'), ['Urząd', 'Ochrony', 'Konkurencji', 'i', 'Konsumentów']));
  await t.test('słowo po myślniku', () => assert.deepEqual(hl(T, 'PTTK', 'Polskie Towarzystwo Turystyczno-Krajoznawcze'), ['Polskie', 'Towarzystwo', 'Turystyczno', 'Krajoznawcze']));
  await t.test('polskie znaki', () => assert.deepEqual(hl(T, 'WOŚP', 'Wielka Orkiestra Świątecznej Pomocy'), ['Wielka', 'Orkiestra', 'Świątecznej', 'Pomocy']));
  await t.test('tekst po złożeniu jest identyczny z oryginałem', () => {
    const full = 'Grupa Reagowania Operacyjno-Manewrowego';
    assert.equal(T.acronymParts('GROM', full).map(p => p.first ? p.first + p.rest : p.text).join(''), full);
  });
  await t.test('HTML jest escapowany', () => assert.match(T.acronymHTML({ skrot: 'A', rozwiniecie: 'A<b>' }), /&lt;b&gt;/));
});

test('przysłowia: zgadywane są spółgłoski oraz Ą, Ę, Ó', () => {
  const { T } = zaladuj();
  for (const L of 'AEIOUY') assert.equal(T.isGuessable(L), false, L);
  for (const L of 'ĄĘÓBŚŻŹĆŃŁ') assert.equal(T.isGuessable(L), true, L);
  assert.equal(T.count('Gdzie kucharek sześć, tam nie ma co jeść', 'Ś'), 2);
  assert.equal(T.count('Bez pracy nie ma kołaczy', 'C'), 2);
});

test('licytacja: wersy bez pustych linii i spacji', () => {
  const { licLines } = zaladuj();
  assert.deepEqual(licLines({ tekst: '\n  Raz \r\n\nDwa\n\n' }), ['Raz', 'Dwa']);
  assert.deepEqual(licLines({ tekst: '' }), []);
  assert.deepEqual(licLines(undefined), []);
});

test('czółko: siatka numerków na TV', () => {
  const { czoGrid } = zaladuj();
  assert.deepEqual(czoGrid(12), { cols: 6, rows: 2, size: 15 });   // dotychczasowy wygląd bez zmian
  assert.deepEqual(czoGrid(22), { cols: 8, rows: 3, size: 13 });
  for (let n = 1; n <= 30; n++) {
    const g = czoGrid(n);
    assert.ok(g.cols * g.rows >= n, `n=${n}: za mało miejsc`);
    // wysokość kafelków + odstępy (≈ size/6) w % wysokości ekranu – zostaje miejsce na pasek drużyn i napis „Wybiera”
    const h = g.rows * g.size + (g.rows - 1) * g.size / 6;
    assert.ok(h <= 50, `n=${n}: kafelki zajmują ${h.toFixed(1)}% wysokości`);
  }
});

test('zdjęcia: siatka z pliku, z panelu i przycinanie do 1–15', () => {
  const { Game, zdjGrid } = zaladuj({ pytania: { zdjecia: [{ plik: 'x.jpg', kolumny: 5, wiersze: 2 }, { plik: 'y.jpg' }] } });
  const s = Game.defaultState();
  assert.deepEqual(zdjGrid(s, 0), { cols: 5, rows: 2 });
  assert.deepEqual(zdjGrid(s, 1), { cols: 4, rows: 3 });   // domyślnie
  s.zdj.grids[0] = { cols: 99, rows: 0 };
  assert.deepEqual(zdjGrid(s, 0), { cols: 15, rows: 1 });
});

test('punkty: suma i tabela konkurencji', () => {
  const { Game } = zaladuj();
  const s = Game.defaultState();
  s.log = [
    { team: 0, pts: 2, comp: 'Akronimy' },
    { team: 1, pts: 8, comp: 'Licytacja' },
    { team: 1, pts: 3, comp: 'Licytacja I' },   // stary zapis sprzed połączenia licytacji
    { team: 0, pts: 4, comp: 'Licytacja II' },
    { team: 0, pts: -1, comp: 'Coś innego' },
    { team: 1, pts: '5', comp: 'Czółko' },      // liczba jako tekst (np. z CSV)
  ];
  assert.deepEqual(Game.scores(s), [5, 16]);
  const tab = Object.fromEntries(Game.table(s).map(r => [r.name, r.pts]));
  assert.deepEqual(tab['Licytacja'], [4, 11]);
  assert.deepEqual(tab['Akronimy'], [2, 0]);
  assert.deepEqual(tab['Inne / ręczne'], [-1, 0]);
  assert.ok(!('Licytacja I' in tab) && !('Licytacja II' in tab));
});

test('tabela konkurencji: nazwy zgodne z zakładkami panelu', () => {
  const { COMP_ORDER, OPTIONAL_COMPS } = zaladuj();
  assert.deepEqual(COMP_ORDER, ['Przysłowia', 'Licytacja', 'Bomba', 'Akronimy', 'Kalambury', 'Czółko', 'Zdjęcia mamy']);
  for (const c of OPTIONAL_COMPS.filter(c => c !== 'Inne / ręczne')) assert.ok(COMP_ORDER.includes(c), c);
});

test('kalambury: licznik odgadniętych haseł drużyny', () => {
  const { Game } = zaladuj();
  const s = Game.defaultState();
  s.kal.results = { A: { 0: 'ok', 1: 'fail', 2: 'ok' }, B: { 0: 'ok' } };
  assert.equal(Game.kalCount(s, 0), 2);
  assert.equal(Game.kalCount(s, 1), 1);
  s.kal.sets = ['B', 'A'];   // zamiana zestawów „⇄”
  assert.equal(Game.kalCount(s, 0), 1);
});

test('bomba: licznik poprawnych odpowiedzi', () => {
  const { Game } = zaladuj();
  const s = Game.defaultState();
  s.bomba.results = { 0: 'ok', 3: 'fail', 5: 'ok' };
  assert.equal(Game.bombaCount(s), 2);
});

test('timer: start, pauza, wznowienie, reset', () => {
  const { Timer } = zaladuj();
  const t = Timer.make(45);
  assert.equal(Timer.remaining(t), 45000);
  Timer.start(t);
  assert.ok(t.running && Timer.remaining(t, t.endsAt - 30000) === 30000);
  t.endsAt = Date.now() + 10000;   // „minęło” 35 s
  Timer.pause(t);
  assert.ok(!t.running && t.left <= 10000 && t.left > 9000);
  Timer.start(t);                   // wznowienie od miejsca pauzy
  assert.ok(Timer.remaining(t) <= 10000);
  Timer.reset(t, 120);
  assert.deepEqual([t.running, t.duration, t.left], [false, 120, 120000]);
  assert.equal(Timer.remaining({ running: true, endsAt: Date.now() - 5 }), 0);
  assert.equal(Timer.fmt(45000), '0:45');
  assert.equal(Timer.fmt(120000), '2:00');
  assert.equal(Timer.fmt(1), '0:01');   // zaokrąglenie w górę – zero dopiero na końcu
});

test('stan: zapis i odczyt z localStorage, licznik wersji', () => {
  const { Game, store } = zaladuj();
  const s = Game.defaultState();
  s.teams[0].name = 'Żółwie';
  s.log.push({ team: 0, pts: 3, comp: 'Czółko' });
  Game.save(s);
  assert.equal(s.rev, 1);
  assert.equal(store.size, 1);
  const back = Game.load();
  assert.equal(back.teams[0].name, 'Żółwie');
  assert.deepEqual(Game.scores(back), [3, 0]);
});

test('stan: uszkodzony zapis nie wywraca aplikacji', () => {
  const { Game, store } = zaladuj();
  store.set('teleturniej_mama_v1', '{to nie jest json');
  const orig = console.warn; console.warn = () => {};
  try { assert.equal(Game.load().ver, 3); } finally { console.warn = orig; }
});

test('stan: migracja starego zapisu (v1) i uzupełnienie brakujących pól', () => {
  const { Game } = zaladuj();
  const s = Game.normalize({
    title: 'Kocham Cię, Mamo!', log: [{ team: 0, pts: 1, comp: 'Akronimy' }],
    prz: { pointValue: 1, solveBonus: 5 }, kal: { points: 2 },
  });
  assert.equal(s.ver, 3);
  assert.equal(s.title, 'Teleturniej urodzinowy');
  assert.equal(s.prz.pointValue, 2);
  assert.equal(s.prz.solveBonus, 7);
  assert.equal(s.kal.points, 1);
  assert.equal(s.namesConfirmed, true);
  assert.ok(s.czo && s.zdj && s.lic, 'nowe sekcje dodane z wartościami domyślnymi');
  assert.equal(s.czo.points, 3);
});

test('stan: aktualny zapis (v3) nie jest zmieniany przez migrację', () => {
  const { Game } = zaladuj();
  const s = Game.normalize({ ver: 3, title: 'Kocham Cię, Mamo!', kal: { points: 2 }, namesConfirmed: false });
  assert.equal(s.title, 'Kocham Cię, Mamo!');
  assert.equal(s.kal.points, 2);
  assert.equal(s.namesConfirmed, false);
});

test('brak pliku z pytaniami: aplikacja startuje z pustymi listami', () => {
  const { DATA } = zaladuj({ pytania: null });
  assert.deepEqual([DATA.akronimy, DATA.czolko, DATA.licytacja], [[], [], []]);
  assert.deepEqual(DATA.kalambury, { A: [], B: [] });
});
