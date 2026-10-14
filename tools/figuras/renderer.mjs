// Roda no renderer do Electron (com Node habilitado): recorta as figuras das questões oficiais direto dos PDFs.
// As áreas (lacunas sem texto entre as linhas da questão) vêm de tools/figuras/regioes.json, gerado pelo
// importador. Recortes que só têm espaço em branco são descartados e a marcação some de src/provas.json.
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..', '..');
const log = (m) => ipcRenderer.send('log', m);

const pdfjs = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/build/pdf.mjs')).href);
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/build/pdf.worker.mjs')).href;

const SCALE = 3; // ~216 dpi
const OUT_DIR = path.join(ROOT, 'public', 'figuras');
const BANK = path.join(ROOT, 'src', 'provas.json');
const REGIOES = path.join(__dirname, 'regioes.json');

const docs = {};
const rendered = {};
async function pageCanvas(pdf, pageIdx) {
  const key = `${pdf}#${pageIdx}`;
  if (rendered[key]) return rendered[key];
  docs[pdf] ||= await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(pdf)) }).promise;
  const page = await docs[pdf].getPage(pageIdx + 1);
  const vp = page.getViewport({ scale: SCALE });
  const canvas = document.createElement('canvas');
  canvas.width = vp.width;
  canvas.height = vp.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
  rendered[key] = { canvas, width: vp.width / SCALE };
  return rendered[key];
}

// Recorta a área da coluna e apara as margens brancas; null se não houver nada desenhado
async function crop(pdf, { page, col, y0, y1 }) {
  const { canvas, width } = await pageCanvas(pdf, page);
  const mid = width / 2;
  // sem a linha divisória entre as colunas (no meio da página)
  const x0 = (col === 0 ? 30 : mid + 4) * SCALE;
  const x1 = (col === 0 ? mid - 4 : width - 30) * SCALE;
  const w = Math.round(x1 - x0);
  const h = Math.round((y1 - y0) * SCALE);
  if (h <= 0) return null;
  const data = canvas.getContext('2d').getImageData(Math.round(x0), Math.round(y0 * SCALE), w, h).data;
  let top = h, bottom = -1, left = w, right = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] > 0 && data[i] + data[i + 1] + data[i + 2] < 720) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (bottom < 0 || bottom - top < 12 || right - left < 12) return null; // vazio (ou só um fio)
  const pad = 12;
  const out = document.createElement('canvas');
  out.width = right - left + 2 * pad;
  out.height = bottom - top + 2 * pad;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, x0 + left, y0 * SCALE + top, right - left + 1, bottom - top + 1, pad, pad, right - left + 1, bottom - top + 1);
  return out;
}

function stack(canvases) {
  const w = Math.max(...canvases.map((c) => c.width));
  const h = canvases.reduce((s, c) => s + c.height, 0);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  let y = 0;
  for (const c of canvases) { ctx.drawImage(c, 0, y); y += c.height; }
  return out;
}

try {
  const regioes = JSON.parse(fs.readFileSync(REGIOES, 'utf8'));
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const empty = new Set();
  for (const [src, { pdf, parts }] of Object.entries(regioes)) {
    const imgs = [];
    for (const p of parts) {
      const c = await crop(pdf, p);
      if (c) imgs.push(c);
    }
    if (!imgs.length) { empty.add(src); continue; }
    const img = stack(imgs);
    fs.writeFileSync(path.join(ROOT, 'public', src), Buffer.from(img.toDataURL('image/png').split(',')[1], 'base64'));
    log(`ok ${src}: ${img.width}x${img.height}`);
  }
  // Remove do banco as marcações de figuras vazias
  const bank = JSON.parse(fs.readFileSync(BANK, 'utf8'));
  const strip = (s) => s && s.replace(/(?:\n\n)?!\[figura\]\(([^)]+)\)/g, (m, src) => (empty.has(src) ? '' : m)).trim();
  for (const q of bank) {
    q.q = strip(q.q);
    if (q.ctx) q.ctx = strip(q.ctx);
  }
  fs.writeFileSync(BANK, JSON.stringify(bank, null, 1));
  log(`\n${Object.keys(regioes).length - empty.size} figuras → public/figuras/ (${empty.size} áreas em branco descartadas)`);
  ipcRenderer.send('done', 0);
} catch (e) {
  log('ERRO: ' + (e.stack || e));
  ipcRenderer.send('done', 1);
}
