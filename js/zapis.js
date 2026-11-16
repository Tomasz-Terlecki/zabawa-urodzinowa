'use strict';
// Zapis gry na dysk: folder wybrany przez prowadzącego (File System Access API),
// pliki wyniki.csv (historia punktów) i stan.json (pełny stan), plus eksport/import CSV.

const Zapis = (() => {
  // ---------- IndexedDB: pamiętamy wybrany folder między uruchomieniami ----------
  function idb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('teleturniej_mama', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function idbGet(k) {
    const db = await idb();
    return new Promise((res, rej) => {
      const q = db.transaction('kv').objectStore('kv').get(k);
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    });
  }
  async function idbSet(k, v) {
    const db = await idb();
    return new Promise((res, rej) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(v, k);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }

  // ---------- CSV ----------
  const csvField = v => {
    v = String(v ?? '');
    return /[;"\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  };
  function stamp(ms = Date.now(), forFile = false) {
    const d = new Date(ms), p = n => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    return forFile
      ? `${date}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`
      : `${date} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
  function toCSV(S) {
    const rows = [['czas', 'nr_druzyny', 'druzyna', 'punkty', 'konkurencja', 'opis', 'suma_1', 'suma_2']];
    const s = [0, 0];
    for (const e of S.log) {
      s[e.team] += Number(e.pts) || 0;
      rows.push([stamp(e.t), e.team + 1, S.teams[e.team].name, e.pts, e.comp, e.desc, s[0], s[1]]);
    }
    // BOM, żeby Excel poprawnie pokazał polskie znaki; średnik = separator w polskim Excelu
    return '﻿' + rows.map(r => r.map(csvField).join(';')).join('\r\n') + '\r\n';
  }
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const sep = (text.split(/\r?\n/)[0].match(/;/g) || []).length ? ';' : ',';
    const rows = [];
    let row = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === sep) { row.push(f); f = ''; }
      else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
      else if (c !== '\r') f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function logFromCSV(text) {
    const rows = parseCSV(text);
    const head = rows.shift();
    if (!head || head[0].trim() !== 'czas') throw new Error('To nie wygląda na plik zapisu teleturnieju (brak nagłówka "czas").');
    const names = [null, null];
    const log = rows.filter(r => r.length >= 6 && r[0].trim()).map((r, i) => {
      const team = parseInt(r[1], 10) - 1;
      if (team !== 0 && team !== 1) throw new Error(`Wiersz ${i + 2}: nieprawidłowy numer drużyny "${r[1]}".`);
      names[team] = r[2];
      const t = Date.parse(r[0].trim().replace(' ', 'T'));
      return { id: `csv-${i}`, t: isNaN(t) ? Date.now() : t, team, pts: Number(String(r[3]).replace(',', '.')) || 0, comp: r[4], desc: r[5] };
    });
    return { log, names };
  }

  function download(S) {
    const blob = new Blob([toCSV(S)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `teleturniej_${stamp(Date.now(), true)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---------- Zapis do folderu ----------
  async function writeFile(dir, name, content) {
    const fh = await dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(content);
    await w.close();
  }

  const Z = {
    supported: 'showDirectoryPicker' in window,
    dir: null,
    status: 'brak',          // 'nieobslugiwane' | 'brak' | 'wymaga-zgody' | 'ok' | 'blad'
    error: '',
    lastSaved: null,
    onStatus: null,
    pending: null,
    busy: false,

    toCSV, logFromCSV, download, stamp,

    notify() { if (this.onStatus) this.onStatus(); },

    async init() {
      if (!this.supported) { this.status = 'nieobslugiwane'; return this.notify(); }
      try {
        const h = await idbGet('dir');
        if (h) {
          this.dir = h;
          const p = await h.queryPermission({ mode: 'readwrite' });
          this.status = p === 'granted' ? 'ok' : 'wymaga-zgody';
        }
      } catch (e) { console.warn(e); }
      this.notify();
    },

    async choose() {
      const h = await window.showDirectoryPicker({ id: 'teleturniej', mode: 'readwrite' });
      this.dir = h;
      this.status = 'ok';
      try { await idbSet('dir', h); } catch (e) { console.warn(e); }
      this.notify();
    },

    async resume() {
      if (!this.dir) return;
      const p = await this.dir.requestPermission({ mode: 'readwrite' });
      this.status = p === 'granted' ? 'ok' : 'wymaga-zgody';
      this.notify();
    },

    // Odczyt istniejącego stan.json z folderu (np. po awarii)
    async readExisting() {
      if (this.status !== 'ok') return null;
      try {
        const fh = await this.dir.getFileHandle('stan.json');
        const raw = await (await fh.getFile()).text();
        return { raw, obj: JSON.parse(raw) };
      } catch (e) { return null; }
    },

    async writeExtra(name, content) {
      if (this.status !== 'ok') return;
      try { await writeFile(this.dir, name, content); } catch (e) { console.warn(e); }
    },

    // Kopia archiwalna (przed resetem / nadpisaniem)
    async archive(S) {
      const s = stamp(Date.now(), true);
      await this.writeExtra(`archiwum_${s}_wyniki.csv`, toCSV(S));
      await this.writeExtra(`archiwum_${s}_stan.json`, JSON.stringify(S, null, 2));
    },

    schedule(S) {
      this.pending = JSON.parse(JSON.stringify(S));
      if (!this.busy) this.flush();
    },

    async flush() {
      this.busy = true;
      while (this.pending) {
        const s = this.pending;
        this.pending = null;
        if (this.status !== 'ok') continue;
        try {
          await writeFile(this.dir, 'wyniki.csv', toCSV(s));
          await writeFile(this.dir, 'stan.json', JSON.stringify(s, null, 2));
          this.lastSaved = Date.now();
        } catch (e) {
          console.error(e);
          this.status = 'blad';
          this.error = e.message || String(e);
        }
      }
      this.busy = false;
      this.notify();
    },
  };
  return Z;
})();
