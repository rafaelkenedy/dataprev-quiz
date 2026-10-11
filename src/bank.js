// Banco unificado: questões oficiais (FGV 2024) + autorais (estilo FGV, com explicação).
import { QUESTIONS as AUTORAIS } from './questions.js';
import OFICIAIS from './provas-fgv2024.json';

export { DISCIPLINES, SPECIFIC } from './questions.js';

export const SOURCES = {
  fgv2024: 'Oficiais FGV 2024',
  autoral: 'Autorais',
  ambas: 'Ambas',
};

export const ALL_QUESTIONS = [
  ...OFICIAIS.map((q) => ({ ...q, source: 'fgv2024' })),
  ...AUTORAIS.map((q) => ({ ...q, source: 'autoral' })),
];

export const bySource = (source) =>
  source === 'ambas' ? ALL_QUESTIONS : ALL_QUESTIONS.filter((q) => q.source === source);

export const FGV_SOURCE_URL = 'https://conhecimento.fgv.br/concursos/dataprev24';
