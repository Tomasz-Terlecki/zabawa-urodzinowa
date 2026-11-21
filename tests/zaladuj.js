'use strict';
// Ładuje data/pytania.js + js/state.js tak jak przeglądarka (wspólny zasięg skryptów),
// ale w piaskownicy Node – bez DOM. Zwraca obiekty używane przez panel i ekran TV.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function zaladuj({ pytania } = {}) {
  const store = new Map();
  const ctx = {
    console,
    window: {},
    localStorage: {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
    },
    addEventListener() {},
    // BroadcastChannel celowo brak – state.js ma na to try/catch
  };
  ctx.window.addEventListener = () => {};
  vm.createContext(ctx);
  const dane = pytania !== undefined
    ? `window.PYTANIA = ${JSON.stringify(pytania)};`
    : fs.readFileSync(path.join(ROOT, 'data', 'pytania.js'), 'utf8');
  const state = fs.readFileSync(path.join(ROOT, 'js', 'state.js'), 'utf8');
  // `const` z najwyższego poziomu skryptu nie trafia do obiektu globalnego – zwracamy je jawnie
  const wynik = `;({ DATA, T, Game, Timer, licLines, zdjGrid, czoGrid, COMP_ORDER, OPTIONAL_COMPS, KARAOKE_STEP })`;
  const out = vm.runInContext(`${dane}\n;\n${state}\n${wynik}`, ctx, { filename: 'pytania.js+state.js' });
  return Object.assign(out, { store, ROOT });
}

// assert/strict z porównaniem deepEqual odpornym na obiekty z piaskownicy vm
// (mają inne prototypy Array/Object, więc zwykły deepStrictEqual uznałby je za różne)
const strict = require('node:assert/strict');
const plain = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const assert = Object.assign((...a) => strict(...a), strict, {
  deepEqual: (a, b, msg) => strict.deepEqual(plain(a), plain(b), msg),
});

module.exports = { zaladuj, ROOT, assert };
