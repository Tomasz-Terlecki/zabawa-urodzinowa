'use strict';
// Scenariusz prowadzącego: konwerter markdowna i aktualność wygenerowanych plików.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { md, SRC, HTML } = require('../tools/scenariusz');

test('konwerter: nagłówki, akapity, wyróżnienia, kod', () => {
  assert.equal(md('# Tytuł'), '<h1>Tytuł</h1>');
  assert.equal(md('## Konkurencja 1: X'), '<h2 class="new-page">Konkurencja 1: X</h2>');
  assert.equal(md('## Plan'), '<h2>Plan</h2>');
  assert.equal(md('raz\ndwa'), '<p>raz dwa</p>');
  assert.equal(md('**gruby** i *pochyły* i `kod`'), '<p><strong>gruby</strong> i <em>pochyły</em> i <code>kod</code></p>');
  assert.equal(md('2 * 3 = 6, a 4 * 5 = 20'), '<p>2 * 3 = 6, a 4 * 5 = 20</p>');   // gwiazdki w tekście to nie kursywa
});

test('konwerter: escapuje HTML', () => {
  assert.equal(md('a <b> & c'), '<p>a &lt;b&gt; &amp; c</p>');
});

test('konwerter: ramka z tekstem do czytania zawiera listy', () => {
  const html = md('> Zasady:\n>\n> - jeden\n> - dwa\n>\n> Koniec.');
  assert.equal(html, '<blockquote><p>Zasady:</p>\n<ul><li>jeden</li><li>dwa</li></ul>\n<p>Koniec.</p></blockquote>');
});

test('konwerter: listy numerowane, checklista, tabela', () => {
  assert.equal(md('1. a\n2. b'), '<ol><li>a</li><li>b</li></ol>');
  assert.equal(md('- ☐ a\n- ☐ b'), '<ul class="checklist"><li>☐ a</li><li>☐ b</li></ul>');
  assert.equal(md('| A | B |\n|---|---|\n| 1 | **2** |'),
    '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td><strong>2</strong></td></tr></tbody></table>');
});

test('konwerter: podpowiedzi i instrukcje panelu dostają własny styl', () => {
  assert.match(md('🖥 **Panel:** klik'), /^<p class="panel">/);
  assert.match(md('💡 uwaga'), /^<p class="tip">/);
});

test('scenariusz.html jest aktualny względem SCENARIUSZ.md (inaczej: node tools/scenariusz.js)', () => {
  const src = fs.readFileSync(SRC, 'utf8').replace(/\r\n?/g, '\n');
  const hash = crypto.createHash('sha1').update(src).digest('hex');
  assert.ok(fs.existsSync(HTML), 'brak scenariusz.html');
  assert.match(fs.readFileSync(HTML, 'utf8'), new RegExp(`zrodlo-sha1: ${hash}`), 'SCENARIUSZ.md zmienił się od ostatniego wygenerowania');
});

test('scenariusz omawia wszystkie konkurencje z panelu', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const tabs = fs.readFileSync(require('node:path').join(__dirname, '..', 'admin.html'), 'utf8')
    .match(/data-view="[^"]+">[^<]+</g).map(t => t.replace(/^.*>/, '').replace(/<$/, '').trim());
  for (const tab of tabs) assert.ok(src.includes(tab), `brak zakładki „${tab}” w scenariuszu`);
});
