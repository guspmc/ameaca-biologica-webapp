export type AtributoProgressao = 'forca' | 'agilidade' | 'vigor' | 'astucia';

export type BeneficioNivelRegistrado =
  | { nivel: number; tipo: 'habilidade'; habilidadeId: string }
  | { nivel: number; tipo: 'atributo'; atributo: AtributoProgressao; valorAntes: number; valorDepois: number }
  | { nivel: number; tipo: 'pericia'; pericia: string; grauAntes: 0 | 1; grauDepois: 1 | 2 };

export type PlanoReversaoMorte = {
  aplicavel: boolean;
  nivelAnterior: number;
  nivelResultante: number;
  penalidadeMorteNivel1: boolean;
  reversoes: BeneficioNivelRegistrado[];
  pendencias: string[];
};

const BENEFICIOS_ESPERADOS: Record<number, string[]> = {
  2: ['habilidade'],
  3: ['atributo'],
  4: ['habilidade', 'pericia'],
  5: ['atributo'],
  6: ['habilidade'],
  7: ['atributo'],
  8: ['habilidade', 'pericia'],
  9: ['atributo'],
  10: ['habilidade'],
};

function beneficioValido(valor: unknown, nivel: number): valor is BeneficioNivelRegistrado {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)
    || Object.getPrototypeOf(valor) !== Object.prototype) return false;
  const item = valor as Record<string, unknown>;
  if (item.nivel !== nivel) return false;
  if (item.tipo === 'habilidade') {
    return Object.keys(item).sort().join('|') === ['habilidadeId', 'nivel', 'tipo'].sort().join('|')
      && typeof item.habilidadeId === 'string' && item.habilidadeId.trim().length > 0;
  }
  if (item.tipo === 'atributo') {
    return Object.keys(item).sort().join('|') === ['atributo', 'nivel', 'tipo', 'valorAntes', 'valorDepois'].sort().join('|')
      && ['forca', 'agilidade', 'vigor', 'astucia'].includes(item.atributo as string)
      && Number.isSafeInteger(item.valorAntes) && Number.isSafeInteger(item.valorDepois)
      && (item.valorAntes as number) >= 0 && (item.valorAntes as number) < 5
      && item.valorDepois === (item.valorAntes as number) + 1;
  }
  if (item.tipo === 'pericia') {
    return Object.keys(item).sort().join('|') === ['grauAntes', 'grauDepois', 'nivel', 'pericia', 'tipo'].sort().join('|')
      && typeof item.pericia === 'string' && item.pericia.trim().length > 0
      && (item.grauAntes === 0 || item.grauAntes === 1)
      && item.grauDepois === (item.grauAntes as number) + 1;
  }
  return false;
}

/**
 * Prepara a reversão do último nível perdido por Morte.
 * Não altera a ficha: a aplicação deve usar o histórico exato e confirmar cada reversão.
 */
export function planejarPerdaNivelPorMorte(
  nivelAtual: number,
  beneficiosDoNivel: unknown,
): PlanoReversaoMorte {
  const planoBase = {
    aplicavel: false,
    nivelAnterior: nivelAtual,
    nivelResultante: nivelAtual,
    penalidadeMorteNivel1: false,
    reversoes: [] as BeneficioNivelRegistrado[],
    pendencias: [] as string[],
  };
  if (!Number.isSafeInteger(nivelAtual) || nivelAtual < 1 || nivelAtual > 10) {
    return { ...planoBase, pendencias: ['Nível atual inválido; esperado inteiro entre 1 e 10.'] };
  }
  if (nivelAtual === 1) {
    if (!Array.isArray(beneficiosDoNivel) || beneficiosDoNivel.length !== 0) {
      return { ...planoBase, pendencias: ['No nível 1 não há benefício de nível anterior a reverter; o registro deve ser vazio.'] };
    }
    return {
      ...planoBase, aplicavel: true, penalidadeMorteNivel1: true,
      pendencias: [],
    };
  }
  const nivelPerdido = nivelAtual;
  const esperados = BENEFICIOS_ESPERADOS[nivelPerdido];
  if (!Array.isArray(beneficiosDoNivel)) {
    return { ...planoBase, pendencias: ['Histórico dos benefícios do nível perdido não foi informado.'] };
  }
  const beneficios = beneficiosDoNivel as unknown[];
  const tipos = beneficios.map(item => item && typeof item === 'object' ? (item as Record<string, unknown>).tipo : undefined);
  const pendencias: string[] = [];
  if (beneficios.length !== esperados.length) {
    pendencias.push(`O nível ${nivelPerdido} exige registro de ${esperados.length} benefício(s); foram informados ${beneficios.length}.`);
  }
  for (const tipo of esperados) {
    if (tipos.filter(item => item === tipo).length !== 1) {
      pendencias.push(`O benefício do tipo "${tipo}" do nível ${nivelPerdido} não está registrado exatamente uma vez.`);
    }
  }
  for (const item of beneficios) {
    if (!beneficioValido(item, nivelPerdido)) {
      pendencias.push('Existe benefício inválido, incompleto ou atribuído a outro nível.');
      break;
    }
  }
  if (pendencias.length > 0) return { ...planoBase, pendencias };
  return {
    aplicavel: true,
    nivelAnterior: nivelAtual,
    nivelResultante: nivelAtual - 1,
    penalidadeMorteNivel1: false,
    reversoes: beneficios.map(item => ({ ...(item as BeneficioNivelRegistrado) })),
    pendencias: [],
  };
}

/** Penalidade temporária específica de Morte no nível 1; não é uma Condição. */
export function penalidadePorMorteNivel1(ativa: boolean): {
  modificadorTestesAtributoPericiaAtaque: number;
  ativa: boolean;
} {
  if (typeof ativa !== 'boolean') throw new Error('Estado da penalidade de Morte inválido.');
  return { modificadorTestesAtributoPericiaAtaque: ativa ? -2 : 0, ativa };
}

/** Recuperar o nível 2 encerra a penalidade especial aplicada quando a personagem morreu no nível 1. */
export function atualizarPenalidadeMorteNivel1(
  penalidadeAtiva: boolean,
  nivelResultante: number,
): boolean {
  if (typeof penalidadeAtiva !== 'boolean' || !Number.isSafeInteger(nivelResultante)
    || nivelResultante < 1 || nivelResultante > 10) {
    throw new Error('Estado de recuperação da penalidade de Morte inválido.');
  }
  return penalidadeAtiva && nivelResultante < 2;
}
