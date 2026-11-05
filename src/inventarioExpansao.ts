import { capacidadeInventario } from './equipamento';

export type ExpansaoInventario = 'pochete' | 'bolsa' | null;
export type ItemExpansaoRetornado = { id: 'pochete'; nome: 'Pochete'; espacos: 1 };
export type ResultadoUpgradeExpansao =
  | { permitido: true; alterou: boolean; expansaoEquipada: ExpansaoInventario; itemComumRetornado: ItemExpansaoRetornado | null }
  | { permitido: false; alterou: false; expansaoEquipada: ExpansaoInventario; itemComumRetornado: null; motivo: string };

/** Calcula capacidade ativa; Bolsa e Pochete ocupam um único espaço dedicado e não se acumulam. */
export function capacidadeInventarioAtiva(forca: number, origem: string | null, expansao: ExpansaoInventario): number {
  if (!Number.isSafeInteger(forca) || forca < 0) throw new Error('FOR precisa ser um inteiro não negativo.');
  if (expansao !== null && expansao !== 'pochete' && expansao !== 'bolsa') throw new Error('Expansão de Inventário inválida.');
  return capacidadeInventario(forca, origem) + (expansao === 'pochete' ? 2 : expansao === 'bolsa' ? 3 : 0);
}

/** A expansão fica vinculada; Pochete pode evoluir para Bolsa, mas não há remoção nem downgrade. */
export function avaliarUpgradeExpansao(atual: ExpansaoInventario, solicitada: ExpansaoInventario): ResultadoUpgradeExpansao {
  if (atual !== null && atual !== 'pochete' && atual !== 'bolsa') throw new Error('Expansão atual inválida.');
  if (solicitada !== null && solicitada !== 'pochete' && solicitada !== 'bolsa') throw new Error('Expansão solicitada inválida.');
  if (atual === solicitada) return { permitido: true, alterou: false, expansaoEquipada: atual, itemComumRetornado: null };
  if (atual === 'bolsa' && solicitada === 'pochete') {
    return { permitido: false, alterou: false, expansaoEquipada: atual, itemComumRetornado: null, motivo: 'Bolsa não pode ser substituída por uma expansão menor.' };
  }
  if (atual !== null && solicitada === null) {
    return { permitido: false, alterou: false, expansaoEquipada: atual, itemComumRetornado: null, motivo: 'A expansão equipada é vinculada e não pode ser removida.' };
  }
  if (atual === 'pochete' && solicitada === 'bolsa') {
    return { permitido: true, alterou: true, expansaoEquipada: 'bolsa', itemComumRetornado: { id: 'pochete', nome: 'Pochete', espacos: 1 } };
  }
  return { permitido: true, alterou: true, expansaoEquipada: solicitada, itemComumRetornado: null };
}

/** Cada bloco de moedas ocupa um Espaço e aceita no máximo três moedas; não transborda. */
export function blocoMoedasValido(quantidade: number): boolean {
  return Number.isSafeInteger(quantidade) && quantidade >= 1 && quantidade <= 3;
}
