/**
 * Progressão de categoria de Dano do Arquivo do Jogador v1.0.
 * A sequência é aplicada ao dado-base antes do multiplicador de Acerto Crítico.
 * Este módulo não rola dados nem altera PV.
 */
const CATEGORIAS_DANO = [
  '1d4', '1d6', '1d8', '1d10', '1d12',
  '2d6', '2d8', '2d10', '2d12',
  '3d6', '3d8', '3d10', '3d12',
  '4d6',
] as const;

export function aumentarCategoriaDano(formula: string, categorias: number): string {
  if (typeof formula !== 'string' || !Number.isSafeInteger(categorias) || categorias < 0) {
    throw new Error('Fórmula ou quantidade de categorias de Dano inválida.');
  }
  const normalizada = formula.trim().toLowerCase();
  const indice = CATEGORIAS_DANO.indexOf(normalizada as typeof CATEGORIAS_DANO[number]);
  if (indice < 0 || indice + categorias >= CATEGORIAS_DANO.length) {
    throw new Error('A fórmula de Dano não possui progressão de categoria disponível.');
  }
  return CATEGORIAS_DANO[indice + categorias];
}

export function categoriasAtaqueUniversal(origem: string, habilidadeCascaGrossa: boolean, perfilId: string): number {
  if (typeof origem !== 'string' || typeof habilidadeCascaGrossa !== 'boolean' || typeof perfilId !== 'string') {
    throw new Error('Contexto de progressão de Dano inválido.');
  }
  const desarmado = perfilId === 'universal-ataque-desarmado';
  const improvisada = perfilId === 'universal-arma-improvisada';
  const bonusLutador = origem === 'Lutador' && (desarmado || improvisada) ? 1 : 0;
  const bonusCascaGrossa = habilidadeCascaGrossa && desarmado ? 1 : 0;
  return bonusLutador + bonusCascaGrossa;
}
