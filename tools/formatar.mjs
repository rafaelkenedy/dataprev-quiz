// Converte linhas posicionadas (pdf-layout.mjs) em texto com marcação leve, entendida pelo app (src/RichText.jsx):
//   parágrafos separados por linha em branco · itens de lista (I., a), 1., •, ( )) em parágrafos próprios
//   ```bloco de código``` · tabelas "| a | b |" · **negrito** · *itálico* · `código` · ![figura](arquivo)
// Caracteres * ` \ do texto original são escapados com barra invertida.

export const LIST_ITEM = /^(?:(?:I|II|III|IV|V|VI|VII|VIII|IX|X)\s*[.)–-]\s|[a-h]\)\s|\d{1,2}[.)]\s|\d{1,2}\s[–-]\s|[•▪●◦]\s?|[–-]\s|\(\s*\)\s+(?=[A-Za-zÀ-ú])|[A-Z]\s[–-]\s)/;
const CODE_START = /^(public|private|protected|class|interface|enum|import|package|def|return|if|else|elif|for|while|try|catch|finally|var|let|const|function|async|await|print|SELECT|FROM|WHERE|UPDATE|INSERT|DELETE|CREATE|ALTER|DROP|GROUP BY|ORDER BY|HAVING|JOIN|INNER|LEFT|VALUES|SET|BEGIN|END|@\w+|#include|<\/?[A-Za-z][\w-]*[ >]|\$ |git |docker |kubectl |npm |mvn |#!|echo |done$|fi$|esac$|then$|\[ |\.\/|sudo |chmod |grep |cat |exit\b)/;
const CODE_END = /[{};(,]$|^[}\])]+;?$|=>$|:$/;

const escape = (s) => s.replace(/[\\*`]/g, '\\$&');

// Linha que parece código (sem considerar a fonte)
function codeish(l, ctx) {
  const t = l.text;
  if (l.mono) return true;
  if (LIST_ITEM.test(t)) return false; // "I. …;" é item de lista, não código
  const fullProse = l.w > ctx.colWidth * 0.9 && t.split(' ').length >= 7 && !/[{};=]/.test(t);
  if (fullProse) return false;
  if (CODE_START.test(t) && !/^(Se|O|A|Os|As)\b/.test(t)) return true;
  if (/[{};]$|^[}\])]+;?$/.test(t)) return true;
  if (/^[A-Z][a-z]+[A-Z]\w*\s+["/\w]/.test(t) && t.split(' ').length <= 4) return true; // diretiva de configuração (ServerName x)
  if (/^\w[\w.]*\s*=\s*\S/.test(t) && !/\s(é|são|de)\s/.test(t)) return true;
  if (/^[\w.]+\(.*\)\s*;?$/.test(t)) return true;
  return false;
}

// Marca blocos de código: sementes "codeish" que crescem para vizinhas indentadas ou também codeish
function markCode(lines, ctx) {
  const isC = lines.map((l) => codeish(l, ctx));
  const code = lines.map(() => false);
  for (let i = 0; i < lines.length; i++) {
    if (!isC[i]) continue;
    let a = i, b = i;
    const shortCode = (t, w) => w < ctx.colWidth * 0.5 && !/[.?!:]$/.test(t) && !/^[A-ZÀ-Ú]?[a-zà-ú]+ [a-zà-ú]+ [a-zà-ú]+/.test(t);
    const grow = (j) =>
      isC[j] || lines[j].mono ||
      (!LIST_ITEM.test(lines[j].text) && ((lines[j].xRel > 4 && CODE_END.test(lines[j].text)) || shortCode(lines[j].text, lines[j].w)));
    while (a > 0 && grow(a - 1) && !(lines[a - 1].text.endsWith(':') && !isC[a - 1])) a--;
    while (b < lines.length - 1 && grow(b + 1)) b++;
    const size = b - a + 1;
    const monos = lines.slice(a, b + 1).filter((l) => l.mono).length;
    const seeds = isC.slice(a, b + 1).filter(Boolean).length;
    // linha de comando isolada ("./processa.sh srv01 srv02") também vira bloco
    const lone = size === 1 && CODE_START.test(lines[a].text) && lines[a].w < ctx.colWidth * 0.7 && !/[.?!]$/.test(lines[a].text);
    if (monos > 0 || (size >= 2 && seeds >= 2) || lone) for (let k = a; k <= b; k++) code[k] = true;
    i = b;
  }
  return code;
}

// Tabelas: ≥ 2 linhas seguidas com ≥ 2 células separadas por espaço largo
function markTable(lines, code) {
  const t = lines.map((l, i) => !code[i] && l.cells.length >= 2);
  return t.map((v, i) => v && (t[i - 1] || t[i + 1]));
}

// Junta os trechos (runs) de várias linhas num parágrafo com marcação inline
export function inline(lineList) {
  const runs = [];
  for (const l of lineList) {
    const prevT = runs.length ? runs[runs.length - 1].t : '';
    // Hifenização de fim de linha: "recém-" + "adquiridos" → "recém-adquiridos"
    const sep = !runs.length || /[-/]$/.test(prevT) ? '' : ' ';
    l.runs.forEach((r, k) => runs.push({ t: (k === 0 ? sep : '') + r.t, st: r.st }));
  }
  // Funde runs iguais e decide o estilo final
  const merged = [];
  for (const r of runs) {
    let st = r.st;
    if (st && st !== 'code' && !/[A-Za-zÀ-ú]{2}/.test(r.t)) st = ''; // símbolos, pontuação: sem destaque
    if (st === 'code' && !/\w/.test(r.t)) st = '';
    const last = merged[merged.length - 1];
    if (last && (last.st === st || (!r.t.trim() && st !== 'code'))) last.t += r.t;
    else merged.push({ t: r.t, st });
  }
  return merged
    .map(({ t, st }) => {
      t = t.replace(/\s+/g, ' ');
      if (!st || !t.trim()) return escape(t);
      const [, pre, core, post] = t.match(/^(\s*)(.*?)(\s*)$/);
      const mark = st === 'code' ? '`' : st === 'b' ? '**' : '*';
      return pre + mark + (st === 'code' ? core.replace(/`/g, "'") : escape(core)) + mark + post;
    })
    .join('')
    .replace(/\s+([,.;:?!)])/g, (m, p, off, s) => (s[off - 1] === '`' ? m : p)) // espaço antes de pontuação
    .replace(/\((?!\s*\))\s+/g, '(') // "( texto" → "(texto", mas mantém o "( )" das questões de associação
    .replace(/^\(\s*\)\s*/, '( ) ')
    .trim();
}

function codeBlock(lines) {
  const minX = Math.min(...lines.map((l) => l.x));
  const unit = lines.find((l) => l.charW)?.charW || 2.05; // proporcional: ~8pt = 4 espaços
  const body = lines.map((l) => ' '.repeat(Math.max(0, Math.round((l.x - minX) / unit))) + l.items.reduce((s, it, k) => {
    if (!k) return it.str;
    const prev = l.items[k - 1];
    const gap = it.x - (prev.x + prev.w);
    return s + (gap > 0.9 && !/\s$/.test(s) && !/^\s/.test(it.str) ? ' ' : '') + it.str;
  }, '').trimEnd());
  // espaço vertical bem maior que o normal entre linhas de código = linha em branco
  const steps = lines.slice(1).map((l, k) => (l.page === lines[k].page && l.col === lines[k].col ? l.y - lines[k].y : 0)).filter((d) => d > 0).sort((a, b) => a - b);
  const step = steps[Math.floor(steps.length / 2)] || 13;
  const out = [];
  body.forEach((t, k) => {
    const prev = lines[k - 1];
    if (prev && prev.page === lines[k].page && prev.col === lines[k].col && lines[k].y - prev.y > step * 1.6) out.push('');
    out.push(t);
  });
  return '```\n' + out.join('\n') + '\n```';
}

function tableBlock(lines) {
  // Colunas: agrupa os x de início de célula de todas as linhas
  const xs = [...new Set(lines.flatMap((l) => l.cells.map(Math.round)))].sort((a, b) => a - b);
  const cols = [];
  for (const x of xs) if (!cols.length || x - cols[cols.length - 1] > 10) cols.push(x);
  const rows = lines.map((l) => {
    const cells = cols.map(() => []);
    for (const it of l.items) {
      let c = 0;
      for (let k = 0; k < cols.length; k++) if (it.x >= cols[k] - 6) c = k;
      cells[c].push(it.str);
    }
    return '| ' + cells.map((c) => escape(c.join(' ').replace(/\s+/g, ' ').trim()).replace(/\|/g, '/')).join(' | ') + ' |';
  });
  return rows.join('\n');
}

/**
 * Formata as linhas de um enunciado/texto-base em blocos.
 * figs: [{ after: índice da linha após a qual a figura entra (-1 = antes de tudo), src }]
 */
export function formatBlocks(lines, ctx, figs = []) {
  const code = markCode(lines, ctx);
  const table = markTable(lines, code);
  const blocks = [];
  const figAt = (i) => figs.filter((f) => f.after === i).forEach((f) => blocks.push(`![figura](${f.src})`));
  figAt(-1);
  let para = [];
  const flush = () => {
    if (para.length) blocks.push(inline(para));
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (code[i] || table[i]) {
      flush();
      let j = i;
      while (j + 1 < lines.length && (code[i] ? code[j + 1] : table[j + 1]) && !figs.some((f) => f.after === j)) j++;
      blocks.push(code[i] ? codeBlock(lines.slice(i, j + 1)) : tableBlock(lines.slice(i, j + 1)));
      for (let k = i; k <= j; k++) if (k < j) figAt(k);
      figAt(j);
      i = j;
      continue;
    }
    const prev = lines[i - 1];
    if (para.length && prev) {
      const sameCol = prev.page === l.page && prev.col === l.col;
      const gap = sameCol ? l.y - prev.y : 0;
      const ends = /[.:?!;”"]$/.test(prev.text);
      const brk =
        (sameCol && gap > ctx.lineGap * 1.1) ||
        (l.xRel < 3 && LIST_ITEM.test(l.text)) ||
        (ends && prev.w < ctx.colWidth * 0.72) || // linha curta terminada em pontuação: fim de parágrafo
        (ends && l.xRel > 8 && l.xRel < 30 && prev.xRel < 3); // recuo de primeira linha
      if (brk) flush();
    }
    para.push(l);
    if (figs.some((f) => f.after === i)) {
      flush();
      figAt(i);
    }
  }
  flush();
  return blocks.filter(Boolean).join('\n\n');
}
