// Banco unificado: questões oficiais (FGV 2026 e 2024) + autorais (estilo FGV, com explicação).
import { QUESTIONS as AUTORAIS } from './questions.js';
import OFICIAIS from './provas.json'; // gerado por tools/import-provas.mjs (texto com marcação leve, ver RichText.jsx)
import { escapeMarkup } from './RichText.jsx';

export { DISCIPLINES, SPECIFIC } from './questions.js';

export const SOURCES = {
  fgv2026: 'Prova 2026',
  fgv2024: 'Prova 2024',
  autoral: 'Autorais',
  todas: 'Todas',
};

export const SOURCE_INFO = {
  fgv2026: {
    url: 'https://conhecimento.fgv.br/concursos/dataprev26',
    text: 'Questões reais da prova de 11/10/2026: os 7 cadernos de TI completos (gerais e específicas repetidas entre cadernos aparecem uma vez só). Gabarito oficial preliminar de 13/10/2026.',
  },
  fgv2024: {
    url: 'https://conhecimento.fgv.br/concursos/dataprev24',
    text: 'Questões reais da FGV (DATAPREV 2024) ligadas ao edital do Perfil 3, com gabarito definitivo.',
  },
  autoral: { text: 'Questões inéditas no estilo FGV, com explicação do gabarito.' },
  todas: { text: 'Provas 2026 e 2024 + autorais.' },
};

export const isOfficial = (q) => q.source !== 'autoral';

export const ALL_QUESTIONS = [
  ...OFICIAIS,
  ...AUTORAIS.map((q) => ({ ...q, source: 'autoral', q: escapeMarkup(q.q), opts: q.opts.map(escapeMarkup) })),
];

export const bySource = (source) =>
  source === 'todas' ? ALL_QUESTIONS : ALL_QUESTIONS.filter((q) => q.source === source);

// Cadernos (perfis) de uma lista de questões oficiais, na ordem de aparição
export const provasOf = (list) => [...new Set(list.filter(isOfficial).flatMap((q) => cadernos(q)))];

// Uma questão pode estar em vários cadernos (ref: "FGV 2026 · Dev Software Q51, Arquitetura Q44")
export const cadernos = (q) => (q.ref || '').replace(/^FGV \d+ · /, '').split(', ').map((r) => r.replace(/ Q\d+$/, ''));
