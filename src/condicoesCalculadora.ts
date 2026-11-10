import type { CondicaoId } from './condicoesFicha.ts';

export type ContextoRolagemCondicao = {
  escopo: 'testes' | 'ataques';
  tipoTeste?: 'pericia' | 'atributo';
  pericia?: string;
  atributo?: string;
  tipoAtaque?: 'corpo-a-corpo' | 'distancia';
};

/**
 * Retorna as fontes de Desvantagem da própria personagem aplicáveis à rolagem.
 * Não resolve condições do alvo, impossibilidade narrativa ou duração por turno.
 */
export function condicoesQueImpoemDesvantagem(
  condicoes: readonly CondicaoId[],
  contexto: ContextoRolagemCondicao,
): CondicaoId[] {
  const ativas = new Set(condicoes);
  const resultado = new Set<CondicaoId>();

  if (contexto.escopo === 'ataques') {
    for (const id of ['caido', 'cego', 'imobilizado', 'intoxicado'] as const) {
      if (ativas.has(id)) resultado.add(id);
    }
    if (contexto.tipoAtaque === 'corpo-a-corpo' && ativas.has('enfraquecido')) {
      resultado.add('enfraquecido');
    }
    if (contexto.tipoAtaque === 'distancia' && ativas.has('infectado-especial')) {
      resultado.add('infectado-especial');
    }
    return [...resultado];
  }

  if (contexto.tipoTeste === 'pericia') {
    if (ativas.has('desorientado')) resultado.add('desorientado');
    if (ativas.has('intoxicado')) resultado.add('intoxicado');
  }
  if (contexto.atributo === 'forca' || contexto.pericia === 'Fortitude') {
    if (ativas.has('enfraquecido')) resultado.add('enfraquecido');
  }
  return [...resultado];
}

/** Calcula Defesa atual aplicando somente os modificadores próprios e explícitos. */
export function calcularDefesaComCondicoes(
  defesaBase: number,
  agilidade: number,
  condicoes: readonly CondicaoId[],
): number {
  if (!Number.isSafeInteger(defesaBase) || defesaBase < 0
    || !Number.isSafeInteger(agilidade) || agilidade < 0 || agilidade > 5) {
    throw new Error('Defesa base ou Agilidade inválida.');
  }
  const ativas = new Set(condicoes);
  return defesaBase
    - (ativas.has('desorientado') ? agilidade : 0)
    - (ativas.has('exposto') ? 2 : 0);
}
