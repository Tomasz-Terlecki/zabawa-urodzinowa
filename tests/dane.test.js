'use strict';
// Testy treści z data/pytania.js – wyłapują literówki i rzeczy, które zepsują rozgrywkę.
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { zaladuj, assert } = require('./zaladuj');

const { DATA, T, licLines, czoGrid, ROOT } = zaladuj();
const norm = s => T.upper(String(s).trim()).replace(/[„”"'.,!?]/g, '').replace(/\s+/g, ' ');
const duplikaty = arr => arr.filter((x, i) => arr.indexOf(x) !== i);
const niepusty = (v, opis) => assert.ok(typeof v === 'string' && v.trim(), `${opis}: puste pole`);

test('plik danych ma wszystkie sekcje', () => {
  for (const k of ['akronimy', 'przyslowia', 'licytacja', 'bomba', 'czolko', 'zdjecia']) {
    assert.ok(Array.isArray(DATA[k]), `brak sekcji ${k}`);
    assert.ok(DATA[k].length > 0, `sekcja ${k} jest pusta`);
  }
  assert.ok(Array.isArray(DATA.kalambury.A) && Array.isArray(DATA.kalambury.B), 'kalambury: potrzebne zestawy A i B');
});

test('akronimy: pola wypełnione, skróty bez powtórzeń', () => {
  DATA.akronimy.forEach((a, i) => {
    niepusty(a.skrot, `akronim nr ${i + 1}`);
    niepusty(a.rozwiniecie, `akronim ${a.skrot}`);
  });
  assert.deepEqual(duplikaty(DATA.akronimy.map(a => T.upper(a.skrot))), [], 'powtórzony skrót');
});

test('akronimy: każde słowo z wielkiej litery jest podświetlone na TV (wyłapuje literówki w skrócie)', () => {
  for (const a of DATA.akronimy) {
    const parts = T.acronymParts(a.skrot, a.rozwiniecie);
    const words = parts.filter(p => !/^(\s+|-)$/.test(p.text ?? ''));
    const capital = words.filter(p => { const f = p.first ?? [...p.text][0]; return f !== f.toLowerCase(); });
    const missed = capital.filter(p => !p.first).map(p => p.text);
    assert.deepEqual(missed, [], `${a.skrot} – „${a.rozwiniecie}”: niepodświetlone słowa`);
    assert.equal(T.upper(words[0].first || ''), T.upper([...a.skrot][0]), `${a.skrot}: pierwsza litera skrótu nie pasuje do pierwszego słowa`);
  }
});

test('przysłowia: co najmniej 2 (dwie rundy), każde ma litery do zgadywania', () => {
  assert.ok(DATA.przyslowia.length >= 2, 'potrzebne 2 przysłowia na 2 rundy');
  DATA.przyslowia.forEach((p, i) => {
    niepusty(p, `przysłowie nr ${i + 1}`);
    const guessable = [...T.lettersOf(p)].filter(T.isGuessable);
    assert.ok(guessable.length >= 3, `„${p}”: za mało spółgłosek do zgadywania`);
    const unknown = [...T.lettersOf(p)].filter(L => !T.ALPHABET.includes(L));
    assert.deepEqual(unknown, [], `„${p}”: litery spoza polskiego alfabetu (nie da się ich odgadnąć)`);
  });
  assert.deepEqual(duplikaty(DATA.przyslowia.map(norm)), [], 'powtórzone przysłowie');
});

test('licytacja: pola, tekst i limit wersów mają sens', () => {
  for (const s of DATA.licytacja) {
    niepusty(s.tytul, 'piosenka w licytacji');
    niepusty(s.autor, `licytacja „${s.tytul}”`);
    const lines = licLines(s);
    assert.ok(lines.length > 0, `„${s.tytul}”: brak tekstu – nie będzie karaoke na TV`);
    if (s.maxWersow != null) {
      assert.ok(Number.isInteger(s.maxWersow) && s.maxWersow > 0, `„${s.tytul}”: maxWersow musi być dodatnią liczbą całkowitą`);
      assert.ok(s.maxWersow <= lines.length, `„${s.tytul}”: maxWersow (${s.maxWersow}) > liczba wersów w tekście (${lines.length})`);
    }
    assert.ok(!('runda' in s), `„${s.tytul}”: pole runda nie jest już używane`);
  }
});

test('licytacja: w tekstach nie ma śmieci po kopiowaniu (przypisy *, [Ref], HTML)', () => {
  for (const s of DATA.licytacja) {
    licLines(s).forEach((line, i) => {
      assert.ok(!/[*<>]|\[\w+\]|\[\d+\]/.test(line), `„${s.tytul}”, wers ${i + 1}: „${line}”`);
    });
  }
});

test('licytacja: tytuły bez powtórzeń (wgrane mp3 są przypisane do tytułu)', () => {
  assert.deepEqual(duplikaty(DATA.licytacja.map(s => norm(s.tytul))), []);
});

test('licytacja: ścieżki mp3 (jeśli podane) wskazują istniejące pliki', () => {
  for (const s of DATA.licytacja.filter(s => s.mp3)) {
    assert.ok(fs.existsSync(path.join(ROOT, s.mp3)), `„${s.tytul}”: brak pliku ${s.mp3}`);
  }
});

test('bomba: pytania i odpowiedzi wypełnione, bez powtórzeń', () => {
  DATA.bomba.forEach((b, i) => {
    niepusty(b.pytanie, `bomba nr ${i + 1}`);
    niepusty(b.odpowiedz, `bomba „${b.pytanie}”`);
  });
  assert.deepEqual(duplikaty(DATA.bomba.map(b => norm(b.pytanie))), []);
});

test('czółko: pola wypełnione, bez powtórzeń', () => {
  for (const s of DATA.czolko) {
    niepusty(s.tytul, 'piosenka w czółku');
    niepusty(s.autor, `czółko „${s.tytul}”`);
  }
  assert.deepEqual(duplikaty(DATA.czolko.map(s => norm(s.tytul))), []);
});

test('czółko: parzysta liczba piosenek (drużyny wybierają na zmianę)', () => {
  assert.equal(DATA.czolko.length % 2, 0, `jest ${DATA.czolko.length} – jedna drużyna dostałaby więcej piosenek`);
});

test('czółko: nie powtarza piosenek z licytacji (po wspólnym śpiewaniu byłyby za łatwe)', () => {
  const lic = new Set(DATA.licytacja.map(s => norm(s.tytul)));
  assert.deepEqual(DATA.czolko.filter(s => lic.has(norm(s.tytul))).map(s => s.tytul), []);
});

test('czółko: numerki mieszczą się na ekranie TV (maks. 3 rzędy)', () => {
  const g = czoGrid(DATA.czolko.length);
  assert.ok(g.rows <= 3, `${DATA.czolko.length} piosenek → ${g.rows} rzędy kafelków`);
});

test('kalambury: oba zestawy równej długości, bez powtórzeń w zestawie i między zestawami', () => {
  const { A, B } = DATA.kalambury;
  assert.equal(A.length, B.length, `zestaw A ma ${A.length} haseł, B ma ${B.length}`);
  assert.deepEqual(duplikaty(A.map(norm)), [], 'powtórzenia w A');
  assert.deepEqual(duplikaty(B.map(norm)), [], 'powtórzenia w B');
  const setA = new Set(A.map(norm));
  assert.deepEqual(B.filter(x => setA.has(norm(x))), [], 'to samo hasło w A i B');
  [...A, ...B].forEach(x => niepusty(x, 'hasło kalamburów'));
});

test('zdjęcia: pliki istnieją, siatka kafelków 1–15', () => {
  for (const z of DATA.zdjecia) {
    niepusty(z.plik, 'zdjęcie');
    assert.ok(fs.existsSync(path.join(ROOT, z.plik)), `brak pliku ${z.plik} (wrzuć go do folderu zdjecia/)`);
    for (const k of ['kolumny', 'wiersze']) {
      if (z[k] != null) assert.ok(Number.isInteger(z[k]) && z[k] >= 1 && z[k] <= 15, `${z.plik}: ${k} = ${z[k]} (dozwolone 1–15)`);
    }
  }
});

test('treści bez przypadkowych spacji na początku/końcu i podwójnych spacji', () => {
  const teksty = [
    ...DATA.akronimy.flatMap(a => [a.skrot, a.rozwiniecie]),
    ...DATA.przyslowia,
    ...DATA.licytacja.flatMap(s => [s.tytul, s.autor]),
    ...DATA.bomba.flatMap(b => [b.pytanie, b.odpowiedz]),
    ...DATA.czolko.flatMap(s => [s.tytul, s.autor]),
    ...DATA.kalambury.A, ...DATA.kalambury.B,
  ];
  const zle = teksty.filter(t => t !== t.trim() || / {2}/.test(t));
  assert.deepEqual(zle, []);
});
