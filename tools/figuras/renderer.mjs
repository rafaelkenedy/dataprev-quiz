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

// Sequência de segmentos (página, coluna) a partir do número da questão até a alternativa (A)
function locate(pages, n) {
  for (let p = 1; p < pages.length; p++) { // página 0 é a capa
    const pg = pages[p];
    const starts = pg.items.filter((it) => inBody(pg, it) && atColLeft(pg, it) && (it.str.trim() === String(n) || it.str.startsWith(`${n} `)));
    for (const st of starts) {
      const segs = [];
      let page = p, col = colOf(pg, st.x), top = st.y - st.h;
      for (let hop = 0; hop < 4; hop++) {
        const cur = pages[page];
        const colItems = cur.items.filter((it) => inBody(cur, it) && colOf(cur, it.x) === col && it.y > top).sort((a, b) => a.y - b.y);
        const a = colItems.find((it) => /^\(A\)/.test(it.str.trim()));
        if (a) {
          segs.push({ page, col, top, bottom: a.y - a.h, lines: colItems.filter((it) => it.y < a.y - a.h / 2) });
          return segs;
        }
        segs.push({ page, col, top, bottom: cur.vp.height - 45, lines: colItems, continues: true });
        if (col === 0) col = 1; else { col = 0; page++; }
        if (page >= pages.length) break;
        top = 52;
      }
    }
  }
  return null;
}

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
  const manifest = {};
  const cache = {};
  const only = process.env.FIG_IDS ? new Set(process.env.FIG_IDS.split(',')) : null;

  for (const q of questions) {
    if (only && !only.has(q.id)) continue;
    const m = q.id.match(/^fgv24-(.+)-(\d+)$/);
    const label = m[1].replace(/_/g, ' ');
    const n = Number(m[2]);
    const file = FILES[label];
    cache[file] ||= await loadDoc(file);
    const pages = cache[file];
    const segs = locate(pages, n);
    if (!segs) { log(`?? ${q.id}: não localizada`); continue; }
    const parts = [];
    for (const seg of segs) {
      for (const [y0, y1] of gaps(seg)) parts.push(await crop(pages[seg.page], seg.col, y0 + 3, y1 - 4));
    }
    if (!parts.length) continue;
    const img = stack(parts);
    const name = `${q.id}.png`;
    fs.writeFileSync(path.join(OUT_DIR, name), Buffer.from(img.toDataURL('image/png').split(',')[1], 'base64'));
    manifest[q.id] = `figuras/${name}`;
    log(`ok ${q.id}: ${parts.length} recorte(s), ${img.width}x${img.height}`);
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
  log(`\n${Object.keys(manifest).length} questões com figura → public/figuras/`);
  ipcRenderer.send('done', 0);
} catch (e) {
  log('ERRO: ' + (e.stack || e));
  ipcRenderer.send('done', 1);
}
