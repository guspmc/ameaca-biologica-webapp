import { consultarProcedimentoArma } from './catalogoProcedimentosArmas.ts';

export type ProcedimentoArmaEspecial = {
  titulo: string;
  descricao: string;
};

/** Projeta lembretes da fonte única de procedimentos, sem determinar alvos ou aplicar efeitos. */
export function consultarProcedimentoArmaEspecial(id: string): ProcedimentoArmaEspecial | null {
  if (id !== 'rpg-7' && id !== 'spark-shot') return null;
  const procedimento = consultarProcedimentoArma(id);
  if (!procedimento) return null;
  const descricao = procedimento.emCombate.find(texto =>
    id === 'rpg-7' ? texto.startsWith('RPG-7:') : texto.startsWith('Spark Shot:'),
  );
  if (!descricao) return null;
  return {
    titulo: id === 'rpg-7' ? 'RPG-7 — Morte Instantânea' : 'Spark Shot — efeito elétrico',
    descricao,
  };
}
