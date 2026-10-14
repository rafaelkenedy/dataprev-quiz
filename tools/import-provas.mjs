// Importa provas FGV (PDF) + gabaritos para o banco de questões do app.
// Uso: node tools/import-provas.mjs [pasta-das-provas]   (padrão: ../provas, com as de 2026 em ../provas/2026)
// Gera src/provas.json e tools/figuras/regioes.json (áreas de figura a recortar; ver tools/figuras).
// Fontes: FGV Conhecimento – DATAPREV 2024 (gabarito definitivo) e DATAPREV 2026 (gabarito preliminar de 13/10/2026).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadLines, makeLine } from './pdf-layout.mjs';
import { formatBlocks, inline } from './formatar.mjs';

const PDFTOTEXT = process.env.PDFTOTEXT || 'C:\\Program Files\\Git\\mingw64\\bin\\pdftotext.exe';
const dir = path.resolve(process.argv[2] || '../provas');
const OUT = path.join(import.meta.dirname, '..', 'src', 'provas.json');
const REGIOES = path.join(import.meta.dirname, 'figuras', 'regioes.json');

// Modo de importação:
//   all    = todas as 70 questões (gerais deduplicadas entre cadernos)
//   filtro = gerais + específicas que batem com o edital do Perfil 3 (curadoria de 2024)
const EXAMES = [
  {
    ano: 2024,
    source: 'fgv2024',
    pasta: dir,
    gabarito: { file: 'FGV2024_DATAPREV_Gabarito_Definitivo.pdf', tipo: 'definitivo' },
    provas: [
      ['FGV2024_DATAPREV_DevSoftware_Tipo1.pdf', 'Desenvolvimento de Software', 'Dev Software', 'all'],
      ['FGV2024_DATAPREV_ArquiteturaEngenharia_Tipo1.pdf', 'Arquitetura, Engenharia e Sustentação Tecnológica', 'Arquitetura', 'filtro'],
      ['FGV2024_DATAPREV_AnaliseNegocioTI_Tipo1.pdf', 'Análise de Negócio de TI', 'Análise de Negócio', 'filtro'],
      ['FGV2024_DATAPREV_SegurancaCibernetica_Tipo1.pdf', 'Segurança Cibernética e Proteção de Dados', 'Segurança Cibernética', 'filtro'],
      ['FGV2024_DATAPREV_GestaoServicosTIC_Tipo1.pdf', 'Gestão de Serviços de TIC', 'Gestão de Serviços TIC', 'filtro'],
      ['FGV2024_DATAPREV_InteligenciaInformacao_Tipo1.pdf', 'Inteligência da Informação', 'Inteligência da Informação', 'filtro'],
      ['FGV2024_DATAPREV_AnalistaProcessamento_Tipo1.pdf', 'Analista de Processamento', 'Analista de Processamento', 'filtro'],
    ],
  },
  {
    // Prova aplicada em 11/10/2026: todos os cadernos de TI, completos.
    // Administração e Governança e Engenharia (estatística) não são de TI e ficam de fora.
    ano: 2026,
    source: 'fgv2026',
    pasta: path.join(dir, '2026'),
    gabarito: { file: 'dataprev2026-gabaritos-para-publicacao.pdf', tipo: 'preliminar' },
    provas: [
      ['analista-de-tecnologia-da-informacao-desenvolvimento-de-software-cns003-tipo-1.pdf', 'DESENVOLVIMENTO DE SOFTWARE', 'Dev Software', 'all'],
      ['analista-de-tecnologia-da-informacao-arquitetura-engenharia-e-sustentacao-tecnologica-cns002-tipo-1.pdf', 'ARQUITETURA, ENGENHARIA E SUSTENTAÇÃO TECNOLÓGICA', 'Arquitetura', 'all'],
      ['analista-de-tecnologia-da-informacao-analise-de-negocio-de-ti-cns001-tipo-1.pdf', 'ANÁLISE DE NEGÓCIO DE TI', 'Análise de Negócio', 'all'],
      ['analista-de-tecnologia-da-informacao-seguranca-cibernetica-e-protecao-de-dados-cns005-tipo-1.pdf', 'SEGURANÇA CIBERNÉTICA E PROTEÇÃO DE DADOS', 'Segurança Cibernética', 'all'],
      ['analista-de-tecnologia-da-informacao-gestao-de-servicos-de-tic-cns006-tipo-1.pdf', 'GESTÃO DE SERVIÇOS DE TIC', 'Gestão de Serviços TIC', 'all'],
      ['analista-de-tecnologia-da-informacao-inteligencia-da-informacao-cns004-tipo-1.pdf', 'INTELIGÊNCIA DA INFORMAÇÃO', 'Inteligência da Informação', 'all'],
      ['analista-de-processamento-cns013-tipo-1.pdf', 'ANALISTA DE PROCESSAMENTO', 'Analista de Processamento', 'all'],
    ],
  },
];

const SPEC = new Set(['dev', 'arq', 'proc', 'seg', 'bd', 'gov', 'outros']);

// Tópicos do edital do Perfil 3 (Anexo I) → disciplina do app. Pesos por palavra-chave.
const TOPICS = {
  dev: /\b(java|jakarta|java ?ee|jpa|hibernate|spring|junit|jsf|primefaces|javascript|typescript|android|ios|kotlin|swift|flutter|react native|xamarin|ionic|low-?code|no-?code|clean code|sonarqube|code smell|html|css|ajax|vue|angular|react|spa\b|pwa|single page|progressive web|padr(ão|ões) de projeto|design pattern|singleton|factory|observer|strategy|decorator|adapter|solid|liskov|orientação a objetos|polimorfismo|herança|encapsulamento|classe abstrata|interface|python|lambda|thread)/gi,
  arq: /\b(arquitetura de software|design de software|microsservi|hexagonal|portas e adaptadores|orientad[ao] a servi|soa\b|web ?services?|soap|wsdl|uddi|restful|\brest\b|\bapi\b|apis|swagger|openapi|api gateway|mensageria|message broker|kafka|rabbitmq|fila de mensagens|xml|xslt|json|servidor de aplica|servidor web|intranet|extranet|portal corporativo|blockchain|contêiner|container|docker|kubernetes|https|tls|ssl|transaç(ão|ões) distribuída|two-phase|saga|interoperabilidade)/gi,
  proc: /\b(teste|testes|tdd|bdd|test-driven|scrum|sprint|kanban|extreme programming|\bxp\b|ágil|ágeis|devops|integração contínua|entrega contínua|implantação contínua|ci\/cd|pipeline|\bgit\b|commit|branch|merge|rebase|rpa|robotic process|ponto(s)? de função|story points?|requisito|elicitação|user stor|história(s)? de usuário|usabilidade|acessibilidade|user experience|\bux\b|gestão de conteúdo|\bcms\b|workflow|arquitetura da informação)/gi,
  seg: /\b(segurança da informação|27001|27002|owasp|oauth|openid|single sign|\bsso\b|controle de acesso|ameaça|vulnerabilidade|sast|dast|sdl|security development|criptogra|confidencialidade|integridade|disponibilidade|x\.800|autenticação|autorização|malware|injeção|injection|xss|cross-site|ataque|incidente)/gi,
  bd: /\b(banco(s)? de dados|\bsql\b|select|nosql|mongodb|normaliza|forma normal|modelagem (de dados|conceitual|lógica|física|dimensional)|entidade-relacionamento|\bddl\b|\bdml\b|sgbd|data ?warehouse|data ?lake|data ?mart|\bolap\b|\betl\b|\belt\b|dimensional|data mining|mineração de dados|business intelligence|\bbi\b|suporte à decisão|big data|chave (primária|estrangeira)|integridade referencial|\bacid\b|metadados|cubo|fato|dimensão|ingestão)/gi,
  gov: /\b(itil|cobit|bpmn|pmbok|gerenciamento de projetos|gestão de projetos|portfólio|governança de ti|gerenciamento de serviços|gestão de serviços|lean|processos de negócio|gestão de riscos)/gi,
};
// Temas fora do edital do Perfil 3
const OFF_TOPIC = /\b(tcp|udp|ipv4|ipv6|roteador|roteamento|switch|vlan|camada de rede|modelo osi|cabeamento|802\.\d+|dns|dhcp|sistema operacional|kernel|linux|windows server|raid|backup|estatística|probabilidade|variância|desvio padrão|regressão|derivada|integral|matriz de covariância|contábil|contabilidade|balanço|ativo circulante|direito|licitação|contrato administrativo|firewall|ids\b|ips\b|siem|pentest|forense|nist csf|itsm|cmdb|service desk|nuvem|cloud|iaas|paas|saas|virtualiza)\b/gi;

// Curadoria manual de 2024 (revisada questão a questão) para os casos em que as palavras-chave erram.
// Valor = disciplina do app; null = fora do edital do Perfil 3 (descartar).
const OVERRIDES = {
  // LGPD nas específicas de outros perfis: cai em Legislação no edital 2026
  '2024 Arquitetura Q58': 'leg', '2024 Arquitetura Q61': 'leg', '2024 Segurança Cibernética Q50': 'leg', '2024 Analista de Processamento Q43': 'leg',
  // dentro do edital, mas não pegos pelas palavras-chave
  '2024 Arquitetura Q55': 'proc', // IaC → DevOps
  '2024 Arquitetura Q69': 'dev', // código
  '2024 Análise de Negócio Q42': 'gov', '2024 Análise de Negócio Q47': 'gov', '2024 Análise de Negócio Q49': 'gov', // gestão de processos
  '2024 Análise de Negócio Q51': 'proc', // métodos ágeis
  '2024 Análise de Negócio Q55': 'arq', // arquitetura de software
  '2024 Análise de Negócio Q57': 'proc', // prototipação (requisitos)
  '2024 Gestão de Serviços TIC Q42': 'gov', // gerenciamento de projetos
  '2024 Inteligência da Informação Q58': 'bd', '2024 Inteligência da Informação Q59': 'bd', // IA/análise de dados (item 20)
  // fora do edital do Perfil 3 (nuvem, infraestrutura, diretório, NIST, ESG, estatística avançada)
  '2024 Arquitetura Q63': null, '2024 Arquitetura Q66': null, '2024 Arquitetura Q68': null,
  '2024 Análise de Negócio Q46': null,
  '2024 Segurança Cibernética Q49': null, '2024 Segurança Cibernética Q53': null, '2024 Segurança Cibernética Q58': null,
  '2024 Segurança Cibernética Q65': null, '2024 Segurança Cibernética Q68': null, '2024 Segurança Cibernética Q70': null,
  '2024 Gestão de Serviços TIC Q54': null, '2024 Gestão de Serviços TIC Q55': null,
  '2024 Analista de Processamento Q48': null, '2024 Analista de Processamento Q53': null, '2024 Analista de Processamento Q54': null,
  '2024 Analista de Processamento Q55': null, '2024 Analista de Processamento Q70': null,
};

function classify(text) {
  const score = {};
  for (const [disc, re] of Object.entries(TOPICS)) score[disc] = (text.match(re) || []).length;
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  const off = (text.match(OFF_TOPIC) || []).length;
  return { disc: best[1] > 0 ? best[0] : null, score: best[1], off };
}

// Chave de deduplicação tolerante a diferenças de espaçamento/hifenização entre cadernos
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9à-ú]/g, '');
const dedupKeys = (stem, opts) => {
  const o = opts.map((x) => norm(x).slice(0, 30)).join(''); // início de cada alternativa (tolera erro de digitação no fim)
  return ['h' + norm(stem).slice(0, 150) + o, 't' + norm(stem).slice(-150) + o];
};

// ───────────────────────────── gabaritos ─────────────────────────────
const pdfText = (file) => execFileSync(PDFTOTEXT, ['-layout', '-enc', 'UTF-8', file, '-'], { encoding: 'utf8', maxBuffer: 1 << 26 });

// { 'TÍTULO DO CADERNO': ['E','D',...] } — apenas o TIPO 1. Anuladas aparecem como '*'.
function parseGabarito(file) {
  const lines = pdfText(file).split(/\r?\n/).map((l) => l.trim());
  const result = {};
  let title = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l || /^(CONCURSO|INFORMAÇÕES|DATAPREV$|GABARITO|EMPRESA|Página)/i.test(l)) { if (/^(CONCURSO|GABARITO)/i.test(l)) title = []; continue; }
    const tipo = l.match(/(?:^|\s-\s)(?:PROVA\s+)?TIPO\s+(\d)\s*$/i);
    if (!tipo && /^[A-ZÀ-Ú,\- ]+$/i.test(l) && !/^[A-E*](\s+[A-E*])+$/.test(l) && !/^\d/.test(l)) { title.push(l); continue; }
    if (!tipo) continue;
    const name = [...title, l.replace(/\s*-?\s*(PROVA\s+)?TIPO\s+\d\s*$/i, '')].join(' - ').replace(/\s+/g, ' ').trim();
    title = [];
    if (tipo[1] !== '1') continue;
    const answers = [];
    for (let j = i + 1; j < lines.length && answers.length < 70; j++) {
      if (/^\d+(\s+\d+)+$/.test(lines[j])) {
        answers.push(...lines[j + 1].replace(/\s+/g, '').split(''));
        j++;
      }
    }
    result[name.toUpperCase()] = answers;
  }
  return result;
}

// ───────────────────────────── cadernos ─────────────────────────────
const SECTIONS = [
  [/^(Conhecimentos Gerais\s*)?Língua Portuguesa/i, 'port'],
  [/^Língua Inglesa/i, 'ing'],
  [/^Raciocínio Lógico/i, 'rlm'],
  [/^Atualidades/i, 'atu'],
  [/^(Legislação|Segurança da Informação e|Noções de)/i, 'leg'],
  [/^Conhecimentos Específicos/i, 'esp'],
];
const sectionOf = (l) => (l.text.length < 110 ? SECTIONS.find(([re]) => re.test(l.text))?.[1] : null);
const GERAIS_DISC = { port: 'ling', ing: 'ling', rlm: 'rlm', atu: 'ia', leg: 'leg' };
const isJunk = (l) => /^(Conhecimentos Gerais|Realização|RASCUNHO)$/i.test(l.text);

// "…as próximas três questões", "…às duas próximas questões", "…NEXT SEVEN QUESTIONS" → número
const NUMS = { duas: 2, two: 2, três: 3, three: 3, quatro: 4, four: 4, cinco: 5, five: 5, seis: 6, six: 6, sete: 7, seven: 7 };
function contextCount(text) {
  const m = text.match(/(?:próximas|next)\s+([a-zà-ú]+)\s+(?:questões|questions)|([a-zà-ú]+)\s+próximas\s+questões/i);
  return (m && NUMS[(m[1] || m[2]).toLowerCase()]) || Infinity;
}
// Instruções sobre o texto-base que não fazem sentido dentro de uma questão isolada
const stripMeta = (s) =>
  s
    .replace(/^(\*\*)?ATENÇÃO:?(\*\*)?\s*(\*\*)?[^\n]*?questões\.?(\*\*)?\s*/i, '')
    .replace(/^(\*\*)?(READ TEXT \w+ AND ANSWER|Use the following TEXT to answer|Read the (following )?TEXT)[^\n]*?questions\.?(\*\*)?\s*/i, '')
    .trim();

const FIG_GAP = 22; // lacuna vertical (pt) sem texto = figura

// Recorta um pedaço de linha (itens i0..i1-1) mantendo a geometria
function sub(line, i0, i1, L) {
  const items = line.items.slice(i0, i1);
  if (!items.length) return null;
  const s = makeLine(items, line.page, line.col);
  s.xRel = s.x - L.colLeft[s.col];
  return s;
}

// Lacunas sem texto entre linhas consecutivas → figuras. seq[0] e seq[seq.length-1] são âncoras (não fazem parte do texto).
// Retorna [{ after (índice no texto), parts: [{page,col,y0,y1}] }]
function findFigs(seq, L, { endBreak = false } = {}) {
  const figs = [];
  for (let i = 1; i < seq.length; i++) {
    const a = seq[i - 1], b = seq[i];
    if (!a || !b) continue;
    const parts = [];
    if (a.page === b.page && a.col === b.col) {
      if (b.y - b.h - a.y > FIG_GAP) parts.push({ page: a.page, col: a.col, y0: a.y + 2, y1: b.y - b.h - 1 });
    } else if ((i > 1 && i < seq.length - 1) || (endBreak && i === seq.length - 1)) {
      // quebra de coluna no meio do texto: espaço vazio no fim da coluna ou no topo da seguinte.
      // Nas âncoras (número da questão, alternativas) o espaço no fim da coluna é só diagramação.
      if (L.bodyBottom - a.y > FIG_GAP * 2) parts.push({ page: a.page, col: a.col, y0: a.y + 2, y1: L.bodyBottom + 2 });
      if (b.y - b.h - L.bodyTop > FIG_GAP) parts.push({ page: b.page, col: b.col, y0: L.bodyTop - 2, y1: b.y - b.h - 1 });
    }
    // descarta áreas que contêm alguma linha de texto (ex.: título de seção fora do fluxo da questão)
    const free = parts.filter((r) => !L.lines.some((l) => l.page === r.page && l.col === r.col && l.y > r.y0 + 1 && l.y - l.h < r.y1 - 1));
    if (free.length) figs.push({ after: i - 2, parts: free });
  }
  return figs;
}

async function parseProva(file) {
  const L = await loadLines(file);
  const { lines } = L;
  const atLeft = (l) => Math.abs(l.xRel) < 3;

  // Início de cada questão: linha só com o número, na margem da coluna (de preferência em negrito)
  const starts = [];
  let from = lines.findIndex((l) => /^(Conhecimentos Gerais|Língua Portuguesa)/i.test(l.text));
  for (let n = 1; n <= 70; n++) {
    const cand = (bold) => lines.findIndex((l, i) => i > from && atLeft(l) && l.text === String(n) && (!bold || l.runs[0].st));
    const k = cand(true) >= 0 ? cand(true) : cand(false);
    if (k < 0) throw new Error(`não achei a questão ${n}`);
    starts[n] = k;
    from = k;
  }

  const qs = [];
  let section = 'port';
  let ctx = null; // { text, left, lines }
  for (let n = 1; n <= 70; n++) {
    const end = n < 70 ? starts[n + 1] : lines.length;
    const seg = lines.slice(starts[n] + 1, end);

    // Alternativas: itens que começam com (A)…(E), em ordem
    const marks = [];
    const findMark = (L_, fromLi, fromIi) => {
      for (let li = fromLi; li < seg.length; li++) {
        for (let ii = li === fromLi ? fromIi : 0; ii < seg[li].items.length; ii++) {
          if (seg[li].items[ii].str.trimStart().startsWith(`(${L_})`)) return [li, ii];
        }
      }
      return null;
    };
    let pos = [0, 0];
    for (const letter of 'ABCDE') {
      const m = findMark(letter, pos[0], pos[1]);
      if (!m) break;
      marks.push(m);
      pos = [m[0], m[1] + 1];
    }
    if (marks.length < 5) {
      qs.push({ n, broken: true });
      if (ctx) ctx.left--;
      continue;
    }

    // Enunciado (antes da (A)) e alternativas (sub-linhas entre marcadores)
    const [aLi, aIi] = marks[0];
    const stemLines = seg.slice(0, aLi).filter((l) => !sectionOf(l) && !isJunk(l));
    if (aIi > 0) stemLines.push(sub(seg[aLi], 0, aIi, L));
    const optLines = [];
    let trailing = [];
    for (let k = 0; k < 5; k++) {
      const [li, ii] = marks[k];
      const nextM = marks[k + 1];
      const out = [];
      if (nextM) {
        if (nextM[0] === li) out.push(sub(seg[li], ii, nextM[1], L));
        else {
          out.push(sub(seg[li], ii, seg[li].items.length, L));
          for (let j = li + 1; j < nextM[0]; j++) out.push(seg[j]);
          if (nextM[1] > 0) out.push(sub(seg[nextM[0]], 0, nextM[1], L));
        }
      } else {
        // (E): continua nas linhas com recuo pendente; a primeira linha na margem já é outra coisa
        out.push(sub(seg[li], ii, seg[li].items.length, L));
        // (recuo pendente ≈ 14pt e espaçamento normal; títulos centralizados como "ATENÇÃO:" não entram)
        let j = li + 1;
        const allBold = (l) => l.runs.every((r) => r.st === 'b' || !r.t.trim());
        const cont = (l, prev) =>
          l.xRel > 9 && l.xRel < 19 && !sectionOf(l) && !(allBold(l) && !allBold(prev)) &&
          (l.page !== prev.page || l.col !== prev.col || l.y - prev.y < L.lineGap * 1.12);
        while (j < seg.length && cont(seg[j], seg[j - 1])) out.push(seg[j++]);
        trailing = seg.slice(j);
      }
      // remove o marcador "(A)" do primeiro item
      const first = out[0];
      const it0 = { ...first.items[0], str: first.items[0].str.replace(/^\s*\([A-E]\)\s*/, '') };
      const rest = it0.str ? [it0, ...first.items.slice(1)] : first.items.slice(1);
      out[0] = rest.length ? makeLine(rest, first.page, first.col) : null;
      optLines.push(out.filter(Boolean));
    }

    // Figuras do enunciado: entre o número, as linhas do enunciado e a (A)
    const numLine = lines[starts[n]];
    const firstOpt = seg[aLi];
    const figs = findFigs([numLine, ...stemLines, firstOpt], L);

    // Depois da (E): cabeçalho de seção e/ou texto-base das próximas questões.
    // Texto-base de verdade sempre anuncia "as próximas N questões"; sem isso, o trecho é o fim
    // da própria (E) (ex.: linha de código na margem) ou a 2ª linha de um título de seção quebrado.
    const curCtx = ctx && ctx.left > 0 ? ctx : null;
    const curSection = section;
    if (ctx) ctx.left--;
    if (n < 70) {
      const secLine = trailing.find((l) => sectionOf(l));
      if (secLine) {
        section = sectionOf(secLine);
        ctx = null;
        optLines[4].push(...trailing.slice(0, trailing.indexOf(secLine)).filter((l) => !isJunk(l)));
        trailing = trailing.slice(trailing.indexOf(secLine) + 1);
      }
      trailing = trailing.filter((l) => !isJunk(l) && !sectionOf(l));
      if (trailing.length) {
        const text = trailing.map((l) => l.text).join(' ');
        if (contextCount(text) < Infinity) {
          const lastOpt = optLines[4][optLines[4].length - 1];
          ctx = { lines: trailing, left: contextCount(text), figs: findFigs([lastOpt, ...trailing, lines[starts[n + 1]]], L, { endBreak: true }) };
        } else if (!secLine) optLines[4].push(...trailing);
      }
    }

    qs.push({
      n,
      section: curSection,
      ctx: curCtx,
      stemLines,
      figs,
      opts: optLines.map((ls) => inline(ls)),
    });
  }
  return { qs, L };
}

// ───────────────────────────── principal ─────────────────────────────
const all = [];
const seen = new Map(); // dedup das gerais repetidas entre cadernos
const regioes = {}; // arquivo da figura → { pdf, parts }
const dropped = [];
const report = [];
let anuladas = 0;

for (const ex of EXAMES) {
  const gabFile = path.join(ex.pasta, ex.gabarito.file);
  if (!fs.existsSync(gabFile)) { console.warn(`(pulando ${ex.ano}: gabarito não encontrado)`); continue; }
  const gab = parseGabarito(gabFile);
  const tag = String(ex.ano).slice(2);
  for (const [file, gabName, label, mode] of ex.provas) {
    const pdf = path.join(ex.pasta, file);
    if (!fs.existsSync(pdf)) { console.warn(`(pulando ${file}: não encontrado)`); continue; }
    const up = (t) => t.toUpperCase().replace(/[^A-ZÀ-Ú]/g, '');
    const key = Object.keys(gab).find((k) => up(k).endsWith(up(gabName)));
    const answers = gab[key];
    if (!answers || answers.length !== 70) throw new Error(`gabarito de "${gabName}" inválido (${answers?.length}) — títulos: ${Object.keys(gab).join(' | ')}`);
    let parsed;
    try {
      parsed = await parseProva(pdf);
    } catch (e) {
      console.warn(`⚠️  ${ex.ano} ${label}: ${e.message} (caderno pulado)`);
      continue;
    }
    const { qs, L } = parsed;
    let added = 0;
    for (const q of qs) {
      const ans = answers[q.n - 1];
      if (!'ABCDE'.includes(ans)) { anuladas++; continue; }
      const ref = `${label} Q${q.n}`;
      if (q.broken) { dropped.push(`${ex.ano} ${ref}: incompleta no PDF (alternativas em imagem)`); continue; }
      const id = `fgv${tag}-${label}-${q.n}`.replace(/\s+/g, '_');

      // Figuras → nomes de arquivo; o recorte é feito depois por tools/figuras (Electron + pdf.js)
      const pend = {}; // só entram em regioes se a questão ficar no banco (não for duplicada)
      const figSrc = (name, f) => {
        const src = `figuras/${name}.png`;
        pend[src] = { pdf, parts: f.parts };
        return { after: f.after, src };
      };
      const stemFigs = q.figs.map((f, k) => figSrc(`${id}${q.figs.length > 1 ? '-' + (k + 1) : ''}`, f));
      const stem = formatBlocks(q.stemLines, L, stemFigs);
      let ctxText = '';
      if (q.ctx) {
        q.ctx.id ||= id; // figuras do texto-base: nomeadas pela 1ª questão que o usa
        const ctxFigs = q.ctx.figs.map((f, k) => figSrc(`contexto-${q.ctx.id}${q.ctx.figs.length > 1 ? '-' + (k + 1) : ''}`, f));
        ctxText = stripMeta(formatBlocks(q.ctx.lines, L, ctxFigs));
      }

      const isEsp = q.section === 'esp';
      let disc;
      if (!isEsp) disc = GERAIS_DISC[q.section] || 'ling';
      else {
        const c = classify(`${stem} ${q.opts.join(' ')}`);
        const ov = `${ex.ano} ${ref}`;
        if (ov in OVERRIDES) disc = OVERRIDES[ov];
        else if (mode === 'all' && label === 'Dev Software') disc = c.disc || 'arq';
        else if (c.disc && c.score > c.off) disc = c.disc;
        else if (mode === 'all') disc = 'outros';
        if (!disc) { dropped.push(`${ex.ano} ${ref}: ${stem.slice(0, 90)}`); continue; }
      }
      const keys = dedupKeys(stem, q.opts).map((k) => ex.ano + k);
      const dup = keys.map((k) => seen.get(k)).find(Boolean);
      if (dup && dup.ans === ans) { dup.ref += `, ${ref}`; continue; }
      if (dup) console.warn(`⚠️  ${ex.ano} ${ref} igual a ${dup.ref}, mas com gabarito diferente (${ans} × ${dup.ans}): mantidas as duas`);
      const item = {
        id,
        disc,
        source: ex.source,
        prova: label,
        ...(ctxText ? { ctx: ctxText } : {}),
        q: stem,
        opts: q.opts,
        ans,
        ...(ex.gabarito.tipo === 'preliminar' ? { gab: 'preliminar' } : {}),
        ref: `FGV ${ex.ano} · ${ref}`,
      };
      for (const k of keys) seen.set(k, item);
      Object.assign(regioes, pend);
      all.push(item);
      added++;
    }
    report.push(`${ex.ano} ${label}: ${added} questões novas`);
  }
}

fs.writeFileSync(OUT, JSON.stringify(all, null, 1));
fs.writeFileSync(REGIOES, JSON.stringify(regioes, null, 1));
console.log(report.join('\n'));
if (process.env.VERBOSE) console.log('\nDescartadas:\n' + dropped.join('\n'));
const count = {};
for (const q of all) count[`${q.source} ${q.disc}`] = (count[`${q.source} ${q.disc}`] || 0) + 1;
console.log('Por fonte/disciplina:', count);
console.log(`Figuras a recortar: ${Object.keys(regioes).length} (node_modules/electron/dist/electron tools/figuras/main.cjs)`);
console.log(`\nTotal: ${all.length} questões (${anuladas} anuladas puladas, ${dropped.length} descartadas) → ${path.relative(process.cwd(), OUT)}`);
