// Extrai as linhas de um caderno de prova da FGV com posição, coluna e estilo de fonte (pdf.js).
// É a base do importador: a geometria permite reconstruir parágrafos, listas, código e figuras.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const pdfjs = await import(pathToFileURL(path.join(import.meta.dirname, '..', 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);

const HEADER_Y = 55; // cabeçalho da página (y < 55)
const FOOTER_GAP = 48; // rodapé (y > altura - 48)

// Estilo de cada fonte do documento: corpo, destaque (negrito/itálico) ou monoespaçada (código).
// Nas provas de 2026 os nomes das fontes são anônimos (CIDFont+F7), então o estilo é inferido
// pela largura dos caracteres: monoespaçada tem largura por caractere constante; negrito é mais largo.
function fontStyles(items) {
  const byFont = new Map();
  for (const it of items) {
    const f = byFont.get(it.font) || { chars: 0, ratios: [] };
    const len = it.str.length;
    f.chars += len;
    if (len >= 4 && it.h > 0) f.ratios.push(it.w / (len * it.h));
    byFont.set(it.font, f);
  }
  const body = [...byFont.entries()].sort((a, b) => b[1].chars - a[1].chars)[0][0];
  const avg = (r) => r.reduce((s, x) => s + x, 0) / (r.length || 1);
  const bodyRatio = avg(byFont.get(body).ratios);
  const styles = {};
  for (const [font, f] of byFont) {
    if (font === body) { styles[font] = ''; continue; }
    const m = avg(f.ratios);
    const sd = Math.sqrt(avg(f.ratios.map((x) => (x - m) ** 2)));
    if (/courier|mono|consol/i.test(font) || (f.ratios.length >= 3 && sd / m < 0.035 && m > 0.5)) styles[font] = 'code';
    else if (/bold|black|heavy/i.test(font)) styles[font] = 'b';
    else if (/italic|oblique/i.test(font)) styles[font] = 'i';
    else if (/\+F\d+$|^g_d/.test(font)) styles[font] = m > bodyRatio * 1.04 ? 'b' : 'i'; // nome anônimo
    else styles[font] = ''; // outra família comum (ex.: Calibri vs. Calibri subset): trata como corpo
  }
  return styles;
}

export async function loadLines(file) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), verbosity: 0 }).promise;
  const pages = [];
  const all = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    await page.getOperatorList(); // carrega as fontes para ler o nome real
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const items = [];
    for (const it of tc.items) {
      if (!it.str.trim()) continue;
      let font = it.fontName;
      try { font = page.commonObjs.get(it.fontName).name || font; } catch { /* fonte sem nome */ }
      const x = it.transform[4];
      const y = vp.height - it.transform[5];
      if (y < HEADER_Y || y > vp.height - FOOTER_GAP) continue;
      items.push({ str: it.str, x, y, w: it.width, h: it.height || 9, font });
    }
    all.push(...items);
    pages.push({ width: vp.width, height: vp.height, items });
  }
  const styles = fontStyles(all);
  for (const it of all) it.st = styles[it.font] || '';

  const lines = [];
  for (let p = 1; p < pages.length; p++) { // página 0 é a capa
    const pg = pages[p];
    const mid = pg.width / 2;
    for (const col of [0, 1]) {
      const its = pg.items.filter((it) => (it.x < mid ? 0 : 1) === col).sort((a, b) => a.y - b.y || a.x - b.x);
      const rows = [];
      const small = (it) => it.h < 7.2 && it.str.trim().length <= 3; // sobrescrito/subscrito ("1st", "x²")
      for (const it of its.filter((it) => !small(it))) {
        const row = rows.find((r) => Math.abs(r.y - it.y) < 2.5);
        if (row) row.items.push(it);
        else rows.push({ y: it.y, items: [it] });
      }
      for (const it of its.filter(small)) {
        const near = rows.filter((r) => Math.abs(r.y - it.y) < 6).sort((a, b) => Math.abs(a.y - it.y) - Math.abs(b.y - it.y))[0];
        if (near) near.items.push(it);
        else rows.push({ y: it.y, items: [it] });
      }
      for (const r of rows.sort((a, b) => a.y - b.y)) {
        r.items.sort((a, b) => a.x - b.x);
        // Junta pedaços colados do mesmo estilo ("co"+"nforme", "(E"+")")
        const merged = [];
        for (const it of r.items) {
          const last = merged[merged.length - 1];
          if (last && last.st === it.st && it.x - (last.x + last.w) < 0.9 && it.x >= last.x) {
            merged[merged.length - 1] = { ...last, str: last.str + it.str, w: it.x + it.w - last.x, h: Math.max(last.h, it.h) };
          } else merged.push(it);
        }
        lines.push(makeLine(merged, p, col));
      }
    }
  }
  // Margem esquerda de cada coluna: o x mais frequente
  const colLeft = [0, 1].map((c) => {
    const freq = {};
    for (const l of lines.filter((l) => l.col === c)) freq[Math.round(l.x)] = (freq[Math.round(l.x)] || 0) + 1;
    return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
  });
  const colWidth = Math.max(...lines.filter((l) => l.col === 0).map((l) => l.w));
  for (const l of lines) l.xRel = l.x - colLeft[l.col];
  const bodyTop = Math.min(...lines.map((l) => l.y - l.h));
  const bodyBottom = Math.max(...lines.map((l) => l.y));
  // Espaçamento típico entre linhas de um mesmo parágrafo
  const diffs = [];
  for (let i = 1; i < lines.length; i++) {
    const a = lines[i - 1], b = lines[i];
    if (a.page === b.page && a.col === b.col && b.y - a.y > 5 && b.y - a.y < 20) diffs.push(b.y - a.y);
  }
  diffs.sort((a, b) => a - b);
  const lineGap = diffs[Math.floor(diffs.length * 0.3)] || 11;
  return { lines, colLeft, colWidth, lineGap, bodyTop, bodyBottom, pages: pages.map((p) => ({ width: p.width, height: p.height })) };
}

export function makeLine(items, page, col) {
  const runs = [];
  const cells = [items[0].x];
  let text = '';
  let prev = null;
  const charW = [];
  for (const it of items) {
    let s = it.str;
    if (prev) {
      const gap = it.x - (prev.x + prev.w);
      if (gap > 14) cells.push(it.x);
      if (gap > 0.9 && !/\s$/.test(text) && !/^\s/.test(s)) s = ' ' + s;
    }
    const st = it.st;
    if (st === 'code' && it.str.length >= 2) charW.push(it.w / it.str.length);
    const last = runs[runs.length - 1];
    if (last && last.st === st) last.t += s;
    else runs.push({ t: s, st });
    text += s;
    prev = it;
  }
  const end = Math.max(...items.map((it) => it.x + it.w));
  const codeChars = runs.filter((r) => r.st === 'code').reduce((n, r) => n + r.t.trim().length, 0);
  return {
    page, col, x: items[0].x, y: items[0].y, h: Math.max(...items.map((it) => it.h)), w: end - items[0].x,
    text: text.replace(/\s+/g, ' ').trim(), runs, cells, items,
    mono: codeChars > 0 && codeChars >= text.replace(/\s/g, '').length * 0.6,
    charW: charW.length ? charW.sort((a, b) => a - b)[charW.length >> 1] : null,
  };
}
