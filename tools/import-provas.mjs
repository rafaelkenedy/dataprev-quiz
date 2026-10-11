// Importa provas FGV (PDF) + gabarito definitivo para o banco de questões do app.
// Uso: node tools/import-provas.mjs <pasta-das-provas>
// Gera src/provas-fgv2024.json. Fonte: FGV Conhecimento – DATAPREV, Edital 01/2024 (provas e gabarito definitivo).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PDFTOTEXT = process.env.PDFTOTEXT || 'C:\\Program Files\\Git\\mingw64\\bin\\pdftotext.exe';
const dir = process.argv[2] || '../provas';
const OUT = path.join(import.meta.dirname, '..', 'src', 'provas-fgv2024.json');

// arquivo → nome do caderno no gabarito definitivo, rótulo curto e modo de importação:
//   all     = prova do próprio cargo (Dev Software): todas as questões
//   filtro  = outros perfis de TI: gerais + específicas que batem com o edital do Perfil 3
//   gerais  = demais cargos de nível superior: só as 40 de conhecimentos gerais
const PROVAS = [
  ['FGV2024_DATAPREV_DevSoftware_Tipo1.pdf', 'Desenvolvimento de Software', 'Dev Software', 'all'],
  ['FGV2024_DATAPREV_ArquiteturaEngenharia_Tipo1.pdf', 'Arquitetura, Engenharia e Sustentação Tecnológica', 'Arquitetura', 'filtro'],
  ['FGV2024_DATAPREV_AnaliseNegocioTI_Tipo1.pdf', 'Análise de Negócio de TI', 'Análise de Negócio', 'filtro'],
  ['FGV2024_DATAPREV_SegurancaCibernetica_Tipo1.pdf', 'Segurança Cibernética e Proteção de Dados', 'Segurança Cibernética', 'filtro'],
  ['FGV2024_DATAPREV_GestaoServicosTIC_Tipo1.pdf', 'Gestão de Serviços de TIC', 'Gestão de Serviços TIC', 'filtro'],
  ['FGV2024_DATAPREV_InteligenciaInformacao_Tipo1.pdf', 'Inteligência da Informação', 'Inteligência da Informação', 'filtro'],
  ['FGV2024_DATAPREV_AnalistaProcessamento_Tipo1.pdf', 'Analista de Processamento', 'Analista de Processamento', 'filtro'],
  // Os demais cargos de nível superior (Advocacia, Contabilidade etc.) foram verificados: o bloco
  // de 40 gerais é idêntico ao do caderno de Dev Software, então não acrescentam questões.
];

// Seção das gerais → disciplina do app
const SPEC = new Set(['dev', 'arq', 'proc', 'seg', 'bd', 'gov']);
const GERAIS_DISC ={ port: 'ling', ing: 'ling', rlm: 'rlm', atu: 'ia', leg: 'leg' };

// Tópicos do edital do Perfil 3 (Anexo I) → disciplina do app. Pesos por palavra-chave.
const TOPICS = {
  dev: /\b(java|jakarta|java ?ee|jpa|hibernate|spring|junit|jsf|primefaces|javascript|typescript|android|ios|kotlin|swift|flutter|react native|xamarin|ionic|low-?code|no-?code|clean code|sonarqube|code smell|html|css|ajax|vue|angular|react|spa\b|pwa|single page|progressive web|padr(ão|ões) de projeto|design pattern|singleton|factory|observer|strategy|decorator|adapter|solid|liskov|orientação a objetos|polimorfismo|herança|encapsulamento|classe abstrata|interface)/gi,
  arq: /\b(arquitetura de software|design de software|microsservi|hexagonal|portas e adaptadores|orientad[ao] a servi|soa\b|web ?services?|soap|wsdl|uddi|restful|\brest\b|\bapi\b|apis|swagger|openapi|api gateway|mensageria|message broker|kafka|rabbitmq|fila de mensagens|xml|xslt|json|servidor de aplica|servidor web|intranet|extranet|portal corporativo|blockchain|contêiner|container|docker|kubernetes|https|tls|ssl|transaç(ão|ões) distribuída|two-phase|saga|interoperabilidade)/gi,
  proc: /\b(teste|testes|tdd|bdd|test-driven|scrum|sprint|kanban|extreme programming|\bxp\b|ágil|ágeis|devops|integração contínua|entrega contínua|implantação contínua|ci\/cd|pipeline|\bgit\b|commit|branch|merge|rebase|rpa|robotic process|ponto(s)? de função|story points?|requisito|elicitação|user stor|história(s)? de usuário|usabilidade|acessibilidade|user experience|\bux\b|gestão de conteúdo|\bcms\b|workflow|arquitetura da informação)/gi,
  seg: /\b(segurança da informação|27001|27002|owasp|oauth|openid|single sign|\bsso\b|controle de acesso|ameaça|vulnerabilidade|sast|dast|sdl|security development|criptogra|confidencialidade|integridade|disponibilidade|x\.800|autenticação|autorização|malware|injeção|injection|xss|cross-site)/gi,
  bd: /\b(banco(s)? de dados|\bsql\b|select|nosql|mongodb|normaliza|forma normal|modelagem (de dados|conceitual|lógica|física|dimensional)|entidade-relacionamento|\bddl\b|\bdml\b|sgbd|data ?warehouse|data ?lake|data ?mart|\bolap\b|\betl\b|\belt\b|dimensional|data mining|mineração de dados|business intelligence|\bbi\b|suporte à decisão|big data|chave (primária|estrangeira)|integridade referencial|\bacid\b|metadados|cubo|fato|dimensão|ingestão)/gi,
  gov: /\b(itil|cobit|bpmn|pmbok|gerenciamento de projetos|gestão de projetos|portfólio|governança de ti|gerenciamento de serviços|gestão de serviços|lean|processos de negócio|gestão de riscos)/gi,
};
// Temas fora do edital do Perfil 3: se dominarem, a questão é descartada
const OFF_TOPIC = /\b(tcp|udp|ipv4|ipv6|roteador|roteamento|switch|vlan|camada de rede|modelo osi|cabeamento|802\.\d+|dns|dhcp|sistema operacional|kernel|linux|windows server|raid|backup|estatística|probabilidade|variância|desvio padrão|regressão|derivada|integral|matriz de covariância|contábil|contabilidade|balanço|ativo circulante|direito|licitação|contrato administrativo|firewall|ids\b|ips\b|siem|pentest|forense|nist csf|itsm|cmdb|service desk)\b/gi;

// Curadoria manual (revisada questão a questão) para os casos em que as palavras-chave erram.
// Valor = disciplina do app; null = fora do edital do Perfil 3 (descartar).
const OVERRIDES = {
  // LGPD nas específicas de outros perfis: cai em Legislação no edital 2026
  'Arquitetura Q58': 'leg', 'Arquitetura Q61': 'leg', 'Segurança Cibernética Q50': 'leg', 'Analista de Processamento Q43': 'leg',
  // dentro do edital, mas não pegos pelas palavras-chave
  'Arquitetura Q55': 'proc', // IaC → DevOps
  'Arquitetura Q69': 'dev', // código
  'Análise de Negócio Q42': 'gov', 'Análise de Negócio Q47': 'gov', 'Análise de Negócio Q49': 'gov', // gestão de processos
  'Análise de Negócio Q51': 'proc', // métodos ágeis
  'Análise de Negócio Q55': 'arq', // arquitetura de software
  'Análise de Negócio Q57': 'proc', // prototipação (requisitos)
  'Gestão de Serviços TIC Q42': 'gov', // gerenciamento de projetos
  'Inteligência da Informação Q58': 'bd', 'Inteligência da Informação Q59': 'bd', // IA/análise de dados (item 20)
  // fora do edital do Perfil 3 (nuvem, infraestrutura, diretório, NIST, ESG, estatística avançada)
  'Arquitetura Q51': null, // misturada com o SQL em imagem da Q49
  'Arquitetura Q63': null, 'Arquitetura Q66': null, 'Arquitetura Q68': null,
  'Análise de Negócio Q46': null,
  'Segurança Cibernética Q49': null, 'Segurança Cibernética Q53': null, 'Segurança Cibernética Q58': null,
  'Segurança Cibernética Q65': null, 'Segurança Cibernética Q68': null, 'Segurança Cibernética Q70': null,
  'Gestão de Serviços TIC Q54': null, 'Gestão de Serviços TIC Q55': null,
  'Analista de Processamento Q48': null, 'Analista de Processamento Q53': null, 'Analista de Processamento Q54': null,
  'Analista de Processamento Q55': null, 'Analista de Processamento Q70': null,
};

// Chave de deduplicação tolerante a diferenças de espaçamento/hifenização entre cadernos
// (usa o fim do enunciado: em alguns cadernos o texto-base de Inglês vem colado no início)
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9à-ú]/g, '');
const dedupKeys = (stem, opts) => {
  const o = norm(opts.join('')).slice(0, 200);
  return ['h' + norm(stem).slice(0, 150) + o, 't' + norm(stem).slice(-150) + o];
};

function classify(text) {
  const score = {};
  for (const [disc, re] of Object.entries(TOPICS)) score[disc] = (text.match(re) || []).length;
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  const off = (text.match(OFF_TOPIC) || []).length;
  return { disc: best[1] > 0 ? best[0] : null, score: best[1], off };
}
const GABARITO = 'FGV2024_DATAPREV_Gabarito_Definitivo.pdf';

const SECTIONS = [
  [/^Língua Portuguesa/i, 'port'],
  [/^Língua Inglesa/i, 'ing'],
  [/^Raciocínio Lógico/i, 'rlm'],
  [/^Atualidades/i, 'atu'],
  [/^(Legislação|Segurança da Informação e|Noções de)/i, 'leg'],
  [/^Conhecimentos Específicos/i, 'esp'],
];

const pdfText = (file, layout = false) =>
  execFileSync(PDFTOTEXT, [...(layout ? ['-layout'] : []), '-enc', 'UTF-8', path.join(dir, file), '-'], { encoding: 'utf8' });

// Gabarito: { 'Desenvolvimento de Software': ['E','D',...,'*'] } (apenas TIPO 1)
function parseGabarito() {
  const lines = pdfText(GABARITO, true).split(/\r?\n/);
  const result = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(?:Analista de Tecnologia da Informação - )?(.+?) - TIPO 1\s*$/);
    if (!m) continue;
    const answers = [];
    for (let j = i + 1; j < lines.length && answers.length < 70; j++) {
      if (/^\s*\d+(\s+\d+)+\s*$/.test(lines[j])) {
        answers.push(...lines[j + 1].replace(/\s+/g, '').split(''));
        j++;
      }
    }
    result[m[1].trim()] = answers;
  }
  return result;
}

const HEADER_LINES = [
  /^EMPRESA DE TECNOLOGIA E INFORMAÇÕES/, /^FGV CONHECIMENTO$/, /^TIPO \w+ - PÁGINA \d+/,
  /^(ATI|Analista)[^\n]* - (TARDE|MANHÃ)$/, /^Realização$/,
];
const SECTION_LINE = /^(Conhecimentos Gerais\s*)?(Língua Portuguesa|Língua Inglesa|Raciocínio Lógico[^\n]*|Atualidades[^\n]*|Legislação[^\n]*|Segurança da Informação e[^\n]*|Conhecimentos Específicos)\s*$/;
// "…as próximas três questões" / "…the next six questions" → 3 / 6 (sem indicação: até a próxima seção)
const NUMS = { duas: 2, two: 2, três: 3, three: 3, quatro: 4, four: 4, cinco: 5, five: 5, seis: 6, six: 6, sete: 7, seven: 7 };
function contextCount(text) {
  const m = text.match(/(?:próximas|next)\s+([a-zà-ú]+)\s+(?:questões|questions)/i);
  return (m && NUMS[m[1].toLowerCase()]) || Infinity;
}
const clean = (s) => s.replace(/\s+/g, ' ').replace(/ ([,.;:?!)])/g, '$1').trim();

function parseProva(file, firstN = 1) {
  let text = pdfText(file)
    .split(/\r?\n/)
    .filter((l) => !HEADER_LINES.some((re) => re.test(l.trim())))
    .join('\n');
  // Rodapés/cabeçalhos que às vezes vêm colados no meio da linha (com hífen ou travessão)
  text = text
    .replace(/(?:ATI|Analista de Processamento)[^\n]{0,90}?[-–—]\s*(?:TARDE|MANHÃ)\b/gi, ' ')
    .replace(/TIPO\s+BRANCA\s*[-–—]\s*PÁGINA\s*\d+/gi, ' ')
    .replace(/EMPRESA DE TECNOLOGIA E INFORMAÇÕES DA PREVIDÊNCIA\s*[-–—]\s*DATAPREV/g, ' ')
    .replace(/FGV CONHECIMENTO/g, ' ');
  const begin = firstN > 1 ? text.search(/Conhecimentos Específicos/) : text.search(/Conhecimentos Gerais/);
  text = '\n' + text.slice(begin);

  const qs = [];
  let pos = text.search(new RegExp(`\\s${firstN}\\s+(?=[A-ZÀ-Ú“"'(])`));
  let section = firstN > 1 ? 'esp' : 'port';
  let context = '';
  let contextLeft = 0; // quantas questões ainda usam o texto-base atual
  for (let n = firstN; n <= 70; n++) {
    let end;
    if (n < 70) {
      // o número da próxima questão pode vir no meio da linha ("...jogos. 29 Numa certa...")
      const re = new RegExp(`\\s${n + 1}\\s+(?=[A-ZÀ-Ú“"'(])`, 'g');
      // procura depois da (E) desta questão; se não houver, a partir do início dela
      const ePos = text.indexOf('(E)', pos);
      re.lastIndex = ePos > 0 ? ePos : pos + 1;
      let m = re.exec(text);
      if (!m) {
        re.lastIndex = pos + 1;
        m = re.exec(text);
      }
      if (!m) throw new Error(`${file}: não achei a questão ${n + 1}`);
      end = m.index;
    } else end = text.length;
    let block = text.slice(pos, end).replace(new RegExp(`^\\s${n}\\s+`), '');

    // Alternativas na ordem (A)…(E)
    const idx = [];
    let from = 0;
    for (const L of 'ABCDE') {
      const k = block.indexOf(`(${L})`, from);
      idx.push(k);
      from = k + 3;
    }
    if (idx.some((k) => k < 0)) {
      // conteúdo em imagem no PDF (código, tabela): não dá para reconstruir a questão
      qs.push({ n, broken: true });
      contextLeft--; // ainda conta como uma das "próximas N questões" do texto-base
      pos = end;
      continue;
    }

    // O que vem depois da (E) pode ser cabeçalho de seção e/ou texto-base das próximas questões
    let tail = block.slice(idx[4] + 3);
    let nextContext = null;
    let nextSection = null;
    const tailLines = tail.split('\n');
    const cut = tailLines.findIndex((l, i) => i > 0 && (SECTION_LINE.test(l.trim()) || /^(Use the following|Read the|Leia o texto|Considere o texto|ATENÇÃO)/i.test(l.trim())));
    if (cut > 0) {
      const rest = tailLines.slice(cut);
      tail = tailLines.slice(0, cut).join('\n');
      const sec = SECTION_LINE.exec(rest[0].trim());
      if (sec) {
        const name = sec[2];
        nextSection = SECTIONS.find(([re]) => re.test(name))?.[1] || section;
        rest.shift();
      }
      nextContext = clean(rest.join('\n'));
    }

    const stem = clean(block.slice(0, idx[0]));
    const opts = [0, 1, 2, 3].map((i) => clean(block.slice(idx[i] + 3, idx[i + 1])));
    opts.push(clean(tail));
    qs.push({ n, section, context: contextLeft > 0 ? context : '', stem, opts });
    contextLeft--;

    if (nextSection && nextSection !== section) {
      section = nextSection;
      context = '';
      contextLeft = 0;
    }
    if (nextContext !== null) {
      context = nextContext;
      contextLeft = contextCount(nextContext);
    }
    pos = end;
  }
  return qs;
}

const gab = parseGabarito();
const all = [];
const seen = new Map(); // dedup de questões gerais repetidas entre cadernos
let skipped = 0;

const dropped = [];
for (const [file, gabName, label, mode] of PROVAS) {
  if (!fs.existsSync(path.join(dir, file))) {
    console.warn(`(pulando ${file}: não encontrado)`);
    continue;
  }
  const answers = gab[gabName];
  if (!answers || answers.length !== 70) throw new Error(`gabarito de "${gabName}" inválido (${answers?.length})`);
  let qs;
  try {
    qs = parseProva(file, mode === 'filtro' ? 41 : 1);
  } catch (e) {
    console.warn(`⚠️  ${label}: ${e.message} (caderno pulado)`);
    continue;
  }
  let added = 0;
  for (const q of qs) {
    const ans = answers[q.n - 1];
    if (!'ABCDE'.includes(ans)) { skipped++; continue; } // anulada
    if (q.broken) { dropped.push(`${label} Q${q.n}: (incompleta no PDF – conteúdo em imagem)`); continue; }
    // Enunciado que apresenta código/tabela/figura que veio como imagem no PDF
    if (/(seguinte|a seguir|abaixo)[^.?]{0,40}:\s*(Assinale|Com base|Considerando|Nesse|A execução|Sobre|Em relação|O resultado|Qual|Analise|Após|Ao)/.test(q.stem)) {
      q.stem = q.stem.replace(/:\s*(?=[A-ZÀ-Ú])/, ': [⚠️ código/figura da prova original não disponível em texto — veja o PDF] ');
    }
    const isEsp = q.section === 'esp';
    if (isEsp && mode === 'gerais') continue;
    let disc;
    if (!isEsp) disc = GERAIS_DISC[q.section] || 'ling';
    else {
      const c = classify(`${q.stem} ${q.opts.join(' ')}`);
      // Prova do próprio cargo: tudo entra (tema padrão: arquitetura). Outros perfis: só no edital.
      const ov = `${label} Q${q.n}`;
      if (mode === 'all') disc = c.disc || 'arq';
      else if (ov in OVERRIDES) disc = OVERRIDES[ov];
      else if (c.disc && c.score > c.off) disc = c.disc;
      if (!disc) { dropped.push(`${label} Q${q.n}: ${q.stem.slice(0, 90)}`); continue; }
    }
    const keys = dedupKeys(q.stem, q.opts);
    const dup = keys.map((k) => seen.get(k)).find(Boolean);
    if (dup) { dup.ref += `, ${label} Q${q.n}`; continue; }
    const item = {
      id: `fgv24-${label}-${q.n}`.replace(/\s+/g, '_'),
      disc,
      source: 'fgv2024',
      q: q.context ? `${q.context}\n\n${q.stem}` : q.stem,
      opts: q.opts,
      ans,
      ref: `FGV 2024 · ${label} Q${q.n}`,
    };
    for (const k of keys) seen.set(k, item);
    all.push(item);
    added++;
  }
  console.log(`${label}: ${added} questões novas`);
}

fs.writeFileSync(OUT, JSON.stringify(all, null, 1));
if (process.env.VERBOSE) {
  console.log('\nDescartadas (fora do edital do Perfil 3):\n' + dropped.join('\n'));
  console.log('\nMantidas (outros perfis):\n' + all.filter((q) => !q.ref.includes('Dev Software') && SPEC.has(q.disc)).map((q) => `[${q.disc}] ${q.ref}: ${q.q.slice(0, 90)}`).join('\n'));
}
const count = {};
for (const q of all) count[q.disc] = (count[q.disc] || 0) + 1;
console.log('Por disciplina:', count, `| descartadas: ${dropped.length}`);
console.log(`\nTotal: ${all.length} questões (${skipped} anuladas puladas) → ${path.relative(process.cwd(), OUT)}`);
