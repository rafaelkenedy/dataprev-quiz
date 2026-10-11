// Roda no renderer do Electron (com Node habilitado): pdf.js localiza cada questão,
// detecta lacunas sem texto entre o enunciado e a alternativa (A) e recorta essas áreas.
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..', '..');
const log = (m) => ipcRenderer.send('log', m);
const provasDir = new URLSearchParams(location.search).get('provas');

const pdfjs = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/build/pdf.mjs')).href);
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/build/pdf.worker.mjs')).href;

const FILES = {
  'Dev Software': 'FGV2024_DATAPREV_DevSoftware_Tipo1.pdf',
  Arquitetura: 'FGV2024_DATAPREV_ArquiteturaEngenharia_Tipo1.pdf',
  'Análise de Negócio': 'FGV2024_DATAPREV_AnaliseNegocioTI_Tipo1.pdf',
  'Segurança Cibernética': 'FGV2024_DATAPREV_SegurancaCibernetica_Tipo1.pdf',
  'Gestão de Serviços TIC': 'FGV2024_DATAPREV_GestaoServicosTIC_Tipo1.pdf',
  'Inteligência da Informação': 'FGV2024_DATAPREV_InteligenciaInformacao_Tipo1.pdf',
  'Analista de Processamento': 'FGV2024_DATAPREV_AnalistaProcessamento_Tipo1.pdf',
};
const SCALE = 3; // ~216 dpi
const GAP = 22; // lacuna vertical (pt) que indica figura entre linhas de texto
const OUT_DIR = path.join(ROOT, 'public', 'figuras');
const MANIFEST = path.join(ROOT, 'src', 'figuras.json');

// Carrega páginas com itens de texto agrupados em linhas por coluna
async function loadDoc(file) {
  const doc = await pdfjs.getDocument({ url: pathToFileURL(path.join(provasDir, file)).href }).promise;
  const pages = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const items = tc.items
      .filter((it) => it.str.trim())
      .map((it) => ({ str: it.str, x: it.transform[4], y: vp.height - it.transform[5], h: it.height || 8, w: it.width }));
    pages.push({ page, vp, items, mid: vp.width / 2 });
  }
  return pages;
}

const colOf = (pg, x) => (x < pg.mid ? 0 : 1);
// Ignora cabeçalho e rodapé da página
const inBody = (pg, it) => it.y > 52 && it.y < pg.vp.height - 45;
// Número da questão fica na margem esquerda da coluna (x≈43 ou x≈312)
const atColLeft = (pg, it) => it.x < 55 || (it.x > pg.mid && it.x < pg.mid + 25);

const isQuestionStart = (pg, it, n) =>
  inBody(pg, it) && atColLeft(pg, it) && (it.str.trim() === String(n) || it.str.startsWith(`${n} `));

// Segmentos (página, coluna) a partir de um ponto até o primeiro item que satisfaz isEnd,
// seguindo o fluxo coluna esquerda → coluna direita → próxima página
function walk(pages, page, col, top, isEnd) {
  const segs = [];
  for (let hop = 0; hop < 4; hop++) {
    const cur = pages[page];
    const colItems = cur.items.filter((it) => inBody(cur, it) && colOf(cur, it.x) === col && it.y > top).sort((a, b) => a.y - b.y);
    const end = colItems.find((it) => isEnd(cur, it));
    if (end) {
      segs.push({ page, col, top, bottom: end.y - end.h, lines: colItems.filter((it) => it.y < end.y - end.h / 2) });
      return segs;
    }
    segs.push({ page, col, top, bottom: cur.vp.height - 53, lines: colItems, continues: true });
    if (col === 0) col = 1; else { col = 0; page++; }
    if (page >= pages.length) return null;
    top = 52;
  }
  return null;
}

// Do número da questão até a alternativa (A)
function locate(pages, n) {
  for (let p = 1; p < pages.length; p++) { // página 0 é a capa
    const pg = pages[p];
    for (const st of pg.items.filter((it) => isQuestionStart(pg, it, n))) {
      const segs = walk(pages, p, colOf(pg, st.x), st.y - st.h, (_pg, it) => /^\(A\)/.test(it.str.trim()));
      if (segs) return segs;
    }
  }
  return null;
}

// Texto-base compartilhado ("ATENÇÃO: …") cuja figura fica entre o texto e a 1ª questão do bloco
const CONTEXT_FIGS = [
  { label: 'Arquitetura', after: 'atenderá às consultas', firstN: 47, ids: ['fgv24-Arquitetura-47', 'fgv24-Arquitetura-48'] },
];
function locateContext(pages, after, firstN) {
  for (let p = 1; p < pages.length; p++) {
    const pg = pages[p];
    const st = pg.items.find((it) => inBody(pg, it) && it.str.includes(after));
    if (!st) continue;
    const segs = walk(pages, p, colOf(pg, st.x), st.y, (cur, it) => isQuestionStart(cur, it, firstN));
    // aqui a figura costuma ocupar o fim da coluna, então o espaço final conta
    segs?.forEach((s) => (s.continues = false));
    return segs;
  }
  return null;
}

// Recorta as lacunas (figuras) de uma lista de segmentos e junta numa imagem só
async function cropSegs(pages, segs) {
  const parts = [];
  for (const seg of segs) {
    for (const [y0, y1] of gaps(seg)) parts.push(await crop(pages[seg.page], seg.col, y0 + 3, y1 - 4));
  }
  return parts.length ? stack(parts) : null;
}

const savePng = (canvas, name) => {
  fs.writeFileSync(path.join(OUT_DIR, name), Buffer.from(canvas.toDataURL('image/png').split(',')[1], 'base64'));
  return `figuras/${name}`;
};

// Lacunas sem texto dentro de um segmento (onde estão as figuras)
function gaps(seg) {
  const ys = [...new Set(seg.lines.map((l) => Math.round(l.y)))].sort((a, b) => a - b);
  const res = [];
  let prev = seg.top;
  for (const y of ys) {
    const lineH = seg.lines.find((l) => Math.round(l.y) === y)?.h || 9;
    if (y - lineH - prev > GAP) res.push([prev, y - lineH]);
    prev = y;
  }
  if (!seg.continues && seg.bottom - prev > GAP) res.push([prev, seg.bottom]);
  return res;
}

async function crop(pg, col, y0, y1) {
  const vp = pg.page.getViewport({ scale: SCALE });
  const canvas = document.createElement('canvas');
  canvas.width = vp.width;
  canvas.height = vp.height;
  await pg.page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
  const x0 = col === 0 ? 30 : pg.mid - 2;
  const x1 = col === 0 ? pg.mid + 2 : pg.vp.width - 30;
  const out = document.createElement('canvas');
  out.width = Math.round((x1 - x0) * SCALE);
  out.height = Math.round((y1 - y0 + 8) * SCALE);
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, x0 * SCALE, (y0 - 2) * SCALE, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

// Junta vários recortes em uma imagem vertical
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
  const questions = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'provas-fgv2024.json'), 'utf8'));
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = {}; // id → [imagens], na ordem: texto-base, depois a da própria questão
  const add = (id, src) => (manifest[id] ||= []).push(src);
  const cache = {};
  const pagesOf = async (label) => (cache[label] ||= await loadDoc(FILES[label]));

  // 1) Figuras de textos-base compartilhados
  for (const c of CONTEXT_FIGS) {
    const pages = await pagesOf(c.label);
    const segs = locateContext(pages, c.after, c.firstN);
    const img = segs && (await cropSegs(pages, segs));
    if (!img) { log(`?? texto-base "${c.after}": figura não encontrada`); continue; }
    const src = savePng(img, `contexto-${c.ids[0]}.png`);
    for (const id of c.ids) add(id, src);
    log(`ok texto-base de ${c.ids.join(', ')}: ${img.width}x${img.height}`);
  }

  // 2) Figuras dentro de cada questão
  for (const q of questions) {
    const m = q.id.match(/^fgv24-(.+)-(\d+)$/);
    const pages = await pagesOf(m[1].replace(/_/g, ' '));
    const segs = locate(pages, Number(m[2]));
    if (!segs) { log(`?? ${q.id}: não localizada`); continue; }
    const img = await cropSegs(pages, segs);
    if (!img) continue;
    add(q.id, savePng(img, `${q.id}.png`));
    log(`ok ${q.id}: ${img.width}x${img.height}`);
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
  log(`\n${Object.keys(manifest).length} questões com figura → public/figuras/`);
  ipcRenderer.send('done', 0);
} catch (e) {
  log('ERRO: ' + (e.stack || e));
  ipcRenderer.send('done', 1);
}
