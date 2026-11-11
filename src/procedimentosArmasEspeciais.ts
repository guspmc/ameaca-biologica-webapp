export type ProcedimentoArmaEspecial = {
  titulo: string;
  descricao: string;
};

/** Consulta lembretes canônicos; não determina alvos nem aplica efeitos. */
export function consultarProcedimentoArmaEspecial(id: string): ProcedimentoArmaEspecial | null {
  if (id === 'rpg-7') {
    return {
      titulo: 'RPG-7 — Morte Instantânea',
      descricao: 'A propriedade prevê Morte Instantânea. Perseguidores, Chefes e criaturas com regra própria podem avançar de fase ou sofrer o efeito indicado em sua ficha em vez de morrer imediatamente.',
    };
  }
  if (id === 'spark-shot') {
    return {
      titulo: 'Spark Shot — efeito elétrico',
      descricao: 'O alvo atingido e criaturas a até 1,5 m dele fazem Fortitude DT 15. Em falha, ficam Atordoados até o fim do próximo turno e Imobilizados por 1d4 rodadas.',
    };
  }
  return null;
}
