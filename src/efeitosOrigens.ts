export type ContextoTesteOrigem = {
  tipo: 'pericia' | 'atributo';
  pericia?: string;
  atributo: 'forca' | 'agilidade' | 'vigor' | 'astucia';
  finalidade?: 'procurar_pista' | 'outra';
  saDisponivel: number;
  gastoSAConfirmado: boolean;
};

/**
 * Bônus condicionais de Origem para um Teste específico.
 * Não altera o valor permanente da Perícia nem gasta SA: o chamador
 * precisa confirmar o gasto e persistir o novo saldo separadamente.
 */
export function bonusCondicionalOrigemTeste(origem: string, contexto: ContextoTesteOrigem): number {
  if (!Number.isSafeInteger(contexto.saDisponivel) || contexto.saDisponivel < 0
    || contexto.gastoSAConfirmado !== true || contexto.tipo !== 'pericia'
    || typeof contexto.pericia !== 'string') return 0;

  if (origem === 'Atleta') {
    const atributoElegivel = contexto.atributo === 'forca' || contexto.atributo === 'agilidade';
    const periciaExcluida = contexto.pericia === 'Luta' || contexto.pericia === 'Pontaria';
    return atributoElegivel && !periciaExcluida ? 5 : 0;
  }

  if (origem === 'Investigador') {
    return contexto.pericia === 'Investigação' && contexto.finalidade === 'procurar_pista' ? 5 : 0;
  }

  return 0;
}
