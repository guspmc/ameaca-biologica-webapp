import { listarPecasExtras } from './catalogoPecas.ts';
import { listarMunicoes } from './catalogoMunicoes.ts';
import { listarColetes } from './catalogoColetes.ts';

export type ProcedimentoEquipamento = {
  itemId: string;
  nome: string;
  tipo: 'peca' | 'municao' | 'protecao';
  emCombate: string;
  foraDeCombate: string;
  referencia: string;
};

const pecas = listarPecasExtras().map(peca => ({
  itemId: peca.id,
  nome: peca.nome,
  tipo: 'peca' as const,
  emCombate: `O efeito só se aplica quando a peça está instalada em arma compatível: ${peca.efeito} O Arquivo do Jogador não define custo de ação para instalar, remover ou trocar peças durante o combate.`,
  foraDeCombate: `Instalar, remover ou trocar normalmente leva 30 minutos e exige bancada apropriada; não há Teste. O Kit de Ferramentas pode substituir a bancada quando uma regra permitir. Cada peça ocupa 1 Espaço de Peça salvo indicação diferente; a mesma peça não pode beneficiar duas armas ao mesmo tempo. Um personagem pode trabalhar na arma de outro. Compatibilidade: ${peca.compatibilidade.join('; ')}. Efeito: ${peca.efeito}`,
  referencia: peca.referencia,
}));

const municoes = listarMunicoes().map(municao => ({
  itemId: municao.id,
  nome: municao.nome,
  tipo: 'municao' as const,
  emCombate: `${municao.uso} ${municao.observacoes.join(' ')}`,
  foraDeCombate: `Reserva abstrata: ${municao.unidadesPorEspaco} unidade(s) por Espaço. Não controlar carregadores parcialmente cheios individualmente: ao recarregar antes de esvaziar a arma, as munições restantes retornam à reserva e a arma é preenchida a partir dela, salvo regra específica. Aquisição: ${municao.aquisicao}. ${municao.observacoes.join(' ')}`,
  referencia: municao.referencia,
}));

const protecoes = listarColetes().map(colete => ({
  itemId: colete.id,
  nome: colete.nome,
  tipo: 'protecao' as const,
  emCombate: `Enquanto equipado: ${colete.defesa >= 0 ? '+' + colete.defesa : colete.defesa} Defesa; RD ${colete.reducaoDano}. A RD é subtraída do Dano recebido de qualquer origem até o mínimo 0, salvo exceção. Fonte infectante só aumenta BI se restar Dano após a RD. Contribuição de AGI: ${colete.contribuicaoAgilidade === 'total' ? 'total' : colete.contribuicaoAgilidade === 'maximo-2' ? 'limitada a +2' : 'não é somada à Defesa'}.`,
  foraDeCombate: `${colete.caracteristico ? 'Item Característico; ' : ''}Aquisição: ${colete.aquisicao}. Coletes não usam Durabilidade. ${colete.observacoes.join(' ')}`,
  referencia: colete.referencia,
}));

const procedimentos: ProcedimentoEquipamento[] = [...pecas, ...municoes, ...protecoes];
const porId = new Map(procedimentos.map(item => [`${item.tipo}:${item.itemId}`, item]));

/** Reúne regras de referência. Não equipa peças/coletes, consome munição ou altera ficha. */
export function consultarProcedimentoEquipamento(tipo: ProcedimentoEquipamento['tipo'], itemId: string): ProcedimentoEquipamento | null {
  const item = porId.get(`${tipo}:${itemId}`);
  return item ? { ...item } : null;
}

export function listarProcedimentosEquipamentos(): ProcedimentoEquipamento[] {
  return procedimentos.map(item => ({ ...item }));
}

export function catalogoProcedimentosEquipamentosCompleto(): boolean {
  const esperado = [
    ...listarPecasExtras().map(item => `peca:${item.id}`),
    ...listarMunicoes().map(item => `municao:${item.id}`),
    ...listarColetes().map(item => `protecao:${item.id}`),
  ].sort();
  const atual = procedimentos.map(item => `${item.tipo}:${item.itemId}`).sort();
  return esperado.length === atual.length
    && esperado.every((id, i) => id === atual[i])
    && procedimentos.every(item => item.emCombate.trim() && item.foraDeCombate.trim() && item.referencia.trim());
}
