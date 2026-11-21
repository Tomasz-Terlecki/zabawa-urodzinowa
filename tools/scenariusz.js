'use strict';
// Buduje scenariusz prowadzącego do druku:  SCENARIUSZ.md  →  scenariusz.html
// Uruchom w folderze projektu po każdej zmianie SCENARIUSZ.md:  node tools/scenariusz.js
// Panel otwiera scenariusz.html przyciskiem „📄 Scenariusz”; drukujesz go z przeglądarki (Ctrl+P – drukarka albo „Zapisz jako PDF”).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'SCENARIUSZ.md');
const HTML = path.join(ROOT, 'scenariusz.html');

// ---------- Prosty konwerter markdowna (tylko to, czego używa scenariusz) ----------
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?![*\w])/g, '$1<em>$2</em>');

const isTableRow = l => /^\s*\|.*\|\s*$/.test(l);
const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());

function md(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }

    let m;
    if ((m = l.match(/^(#{1,4})\s+(.*)$/))) {
      const lvl = m[1].length, txt = m[2].trim();
      const cls = lvl === 2 && /^(Konkurencja|Wyniki)/.test(txt) ? ' class="new-page"' : '';
      out.push(`<h${lvl}${cls}>${inline(txt)}</h${lvl}>`);
      i++;
    } else if (/^\s*>/.test(l)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ''));
      out.push(`<blockquote>${md(buf.join('\n'))}</blockquote>`);
    } else if (isTableRow(l) && isTableRow(lines[i + 1] || '') && /^[\s|:-]+$/.test(lines[i + 1])) {
      const head = cells(l);
      i += 2;
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) rows.push(cells(lines[i++]));
      out.push(`<table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${
        rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
    } else if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const re = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/;
      const items = [];
      while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(re, ''));
      const tag = ordered ? 'ol' : 'ul';
      const check = items.every(x => x.startsWith('☐')) ? ' class="checklist"' : '';
      out.push(`<${tag}${check}>${items.map(x => `<li>${inline(x)}</li>`).join('')}</${tag}>`);
    } else {
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*>|\s*([-*]|\d+\.)\s+)/.test(lines[i]) && !isTableRow(lines[i])) buf.push(lines[i++].trim());
      const txt = buf.join(' ');
      const cls = /^🖥/.test(txt) ? ' class="panel"' : /^💡/.test(txt) ? ' class="tip"' : '';
      out.push(`<p${cls}>${inline(txt)}</p>`);
    }
  }
  return out.join('\n');
}

const CSS = `
@page { size: A4; margin: 14mm 15mm 16mm; }
:root { --ink: #1d1d1f; --dim: #5b5b66; --quote: #fff7e0; --bar: #e0a100; --panel: #eef4ff; --line: #d0d4dc; }
* { box-sizing: border-box; }
body { margin: 0; background: #fff; color: var(--ink); font: 11.5pt/1.45 "Segoe UI", Arial, sans-serif; }
main { max-width: 820px; margin: 0 auto; padding: 24px 16px 48px; }
h1 { font-size: 21pt; margin: 0 0 10px; }
h2 { font-size: 16pt; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 2px solid var(--ink); break-after: avoid; }
h3 { font-size: 13pt; margin: 16px 0 6px; break-after: avoid; }
p { margin: 6px 0; }
blockquote { margin: 8px 0; padding: 8px 12px; background: var(--quote); border-left: 5px solid var(--bar); border-radius: 4px; font-size: 12.5pt; break-inside: avoid; }
blockquote p, blockquote ul, blockquote ol { margin: 4px 0; }
blockquote li { margin: 3px 0; }
p.panel { background: var(--panel); padding: 5px 10px; border-radius: 4px; font-size: 10.5pt; }
p.tip { color: var(--dim); font-size: 10.5pt; font-style: italic; }
ul, ol { margin: 6px 0; padding-left: 24px; }
li { margin: 2px 0; }
ul.checklist { list-style: none; padding-left: 4px; }
code { font: 10pt Consolas, monospace; background: #f1f1f4; padding: 0 3px; border-radius: 3px; }
table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10.5pt; break-inside: avoid; }
th, td { border: 1px solid var(--line); padding: 4px 6px; text-align: left; vertical-align: top; }
th { background: #f3f4f7; }
.src { color: var(--dim); font-size: 8.5pt; margin-top: 24px; }
.no-print { text-align: right; }
.no-print button { font: 600 12pt "Segoe UI", Arial, sans-serif; padding: 8px 16px; border-radius: 8px; border: 1px solid #c4c7cf; background: #fff; cursor: pointer; }
@media print {
  .no-print { display: none; }
  main { max-width: none; padding: 0; }
  h2.new-page { break-before: page; margin-top: 0; }
}`;

function build() {
  const src = fs.readFileSync(SRC, 'utf8');
  const hash = crypto.createHash('sha1').update(src.replace(/\r\n?/g, '\n')).digest('hex');
  const title = (src.match(/^#\s+(.*)$/m) || [, 'Scenariusz'])[1];
  const html = `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Plik generowany z SCENARIUSZ.md poleceniem: node tools/scenariusz.js – nie edytuj ręcznie. zrodlo-sha1: ${hash} -->
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<main>
<div class="no-print"><button onclick="window.print()">🖨 Drukuj / zapisz jako PDF</button></div>
${md(src)}
<p class="src">Wygenerowano z SCENARIUSZ.md · ${new Date().toLocaleString('pl-PL')}</p>
</main>
</body>
</html>
`;
  fs.writeFileSync(HTML, html);
  return hash;
}

if (require.main === module) {
  build();
  console.log('✔ scenariusz.html gotowy – otwórz go przyciskiem „📄 Scenariusz” w panelu.');
}

module.exports = { md, build, SRC, HTML };
