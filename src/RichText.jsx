// Renderiza a marcação leve gerada pelo importador (tools/formatar.mjs):
//   parágrafos separados por linha em branco · itens de lista (I., a), 1., •, ( )) · ```código``` ·
//   tabelas "| a | b |" · ![figura](arquivo) · **negrito** · *itálico* · `código` · \* escapado
import React from 'react';

const LIST_ITEM = /^((?:I|II|III|IV|V|VI|VII|VIII|IX|X)\s*[.)–-]|[a-h]\)|\d{1,2}[.)]|\d{1,2}\s[–-]|[•▪●◦]|[–-]|\(\s*\)|[A-Z]\s[–-])\s*(.*)$/s;

// Texto simples (questões autorais) → mesma marcação, com os caracteres especiais escapados
export const escapeMarkup = (s) => s.replace(/[\\*`]/g, '\\$&');

// Remove a marcação (para resumos de uma linha)
export const plainText = (s = '') =>
  s
    .replace(/```[\s\S]*?```/g, ' [código] ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' [figura] ')
    .replace(/\\([\\*`])|[*`]/g, (m, esc) => esc || '')
    .replace(/\s+/g, ' ')
    .trim();

// Blocos: separa por linha em branco, sem quebrar os blocos de código (que podem ter linhas em branco)
function parseBlocks(text) {
  const blocks = [];
  const lines = text.split('\n');
  let buf = [];
  const flush = () => {
    if (buf.length) blocks.push({ type: 'p', text: buf.join('\n') });
    buf = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      flush();
      const code = [];
      while (++i < lines.length && !lines[i].startsWith('```')) code.push(lines[i]);
      blocks.push({ type: 'code', text: code.join('\n') });
    } else if (!line.trim()) flush();
    else buf.push(line);
  }
  flush();
  return blocks.map((b) => {
    if (b.type !== 'p') return b;
    const fig = b.text.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (fig) return { type: 'fig', alt: fig[1], src: fig[2] };
    const rows = b.text.split('\n');
    if (rows.every((r) => r.startsWith('|'))) return { type: 'table', rows: rows.map((r) => r.replace(/^\||\|$/g, '').split(' | ').map((c) => c.trim())) };
    const item = b.text.match(LIST_ITEM);
    if (item && item[2]) return { type: 'item', marker: item[1].replace(/\(\s*\)/, '( )'), text: item[2] };
    return b;
  });
}

// Inline: **negrito**, *itálico*, `código`, \escape
export function Inline({ text }) {
  const out = [];
  let buf = '';
  let key = 0;
  const push = (node) => {
    if (buf) out.push(buf);
    buf = '';
    out.push(node);
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\\' && i + 1 < text.length) {
      buf += text[++i];
    } else if (c === '`') {
      const end = text.indexOf('`', i + 1);
      if (end < 0) { buf += c; continue; }
      push(<code key={key++}>{text.slice(i + 1, end)}</code>);
      i = end;
    } else if (c === '*') {
      const strong = text[i + 1] === '*';
      const mark = strong ? '**' : '*';
      let end = i + mark.length;
      // procura o fechamento não escapado
      while ((end = text.indexOf(mark, end)) >= 0 && text[end - 1] === '\\') end += mark.length;
      if (end < 0 || end === i + mark.length) { buf += c; continue; }
      const inner = <Inline text={text.slice(i + mark.length, end)} />;
      push(strong ? <strong key={key++}>{inner}</strong> : <em key={key++}>{inner}</em>);
      i = end + mark.length - 1;
    } else buf += c;
  }
  if (buf) out.push(buf);
  return <>{out}</>;
}

export default function RichText({ text, className = '' }) {
  if (!text) return null;
  const blocks = parseBlocks(text);
  const out = [];
  for (let k = 0; k < blocks.length; k++) {
    const b = blocks[k];
    if (b.type === 'item') {
      // itens consecutivos formam uma lista
      const items = [];
      while (k < blocks.length && blocks[k].type === 'item') items.push(blocks[k++]);
      k--;
      out.push(
        <ul key={k} className="items">
          {items.map((it, j) => (
            <li key={j}>
              <span className="marker">{it.marker}</span>
              <span><Inline text={it.text} /></span>
            </li>
          ))}
        </ul>,
      );
    } else if (b.type === 'code') out.push(<pre key={k} className="code"><code>{b.text}</code></pre>);
    else if (b.type === 'fig') out.push(<img key={k} className="fig" src={b.src} alt="Figura da questão original (FGV)" loading="lazy" />);
    else if (b.type === 'table')
      out.push(
        <div key={k} className="table-wrap">
          <table>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j}><Inline text={c} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    else out.push(<p key={k}><Inline text={b.text} /></p>);
  }
  return <div className={`rich ${className}`}>{out}</div>;
}
