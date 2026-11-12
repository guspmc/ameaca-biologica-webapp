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
    if (contexto.pericia === 'Reflexos' && ativas.has('imobilizado')) resultado.add('imobilizado');
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

/** Defesa alternativa de Reflexos de Sobrevivente; não altera a Defesa-base. */
export function calcularDefesaComReflexosSobrevivente(defesaAtual: number, valorAcrobacia: number, habilidadeAtiva: boolean): number {
  if (!Number.isSafeInteger(defesaAtual) || defesaAtual < 0 || !Number.isSafeInteger(valorAcrobacia) || valorAcrobacia < 0 || typeof habilidadeAtiva !== 'boolean') {
    throw new Error('Valores da Defesa alternativa inválidos.');
  }
  return habilidadeAtiva ? Math.max(defesaAtual, 10 + valorAcrobacia) : defesaAtual;
}


export type RestricaoAtaqueCondicao = { condicao: CondicaoId; motivo: string };

/** Lembretes de Condições que proíbem Ações ou o uso de Atacar; não bloqueia a rolagem. */
export function restricoesDeAtaquePorCondicoes(
  condicoes: readonly CondicaoId[],
): RestricaoAtaqueCondicao[] {
  const ativas = new Set(condicoes);
  const restricoes: RestricaoAtaqueCondicao[] = [];
  if (ativas.has('desorientado')) restricoes.push({
    condicao: 'desorientado',
    motivo: 'Desorientado: não pode usar Atacar.',
  });
  if (ativas.has('atordoado')) restricoes.push({
    condicao: 'atordoado',
    motivo: 'Atordoado: não pode realizar Ações, Reações ou Movimento.',
  });
  if (ativas.has('incapacitado')) restricoes.push({
    condicao: 'incapacitado',
    motivo: 'Incapacitado: não pode realizar Ações nem Reações.',
  });
  if (ativas.has('surpreendido')) restricoes.push({
    condicao: 'surpreendido',
    motivo: 'Surpreendido: no primeiro turno, não pode se mover nem realizar Ações; enquanto durar, não pode usar Reações nem gastar SA.',
  });
  return restricoes;
}
