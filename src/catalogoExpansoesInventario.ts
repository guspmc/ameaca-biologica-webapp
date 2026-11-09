export type PerfilExpansaoInventario = {
  id: 'pochete' | 'bolsa';
  nome: 'Pochete' | 'Bolsa';
  espacosAdicionais: 2 | 3;
  precoMoedasAntigas: 3 | 4;
  permanente: true;
  acumulaComOutraExpansao: false;
  referencia: string;
};

const referencia = 'Arquivo do Jogador v1.0, pp. 48 e 73';

const expansoes: PerfilExpansaoInventario[] = [
  {
    id: 'pochete',
    nome: 'Pochete',
    espacosAdicionais: 2,
    precoMoedasAntigas: 3,
    permanente: true,
    acumulaComOutraExpansao: false,
    referencia,
  },
  {
    id: 'bolsa',
    nome: 'Bolsa',
    espacosAdicionais: 3,
    precoMoedasAntigas: 4,
    permanente: true,
    acumulaComOutraExpansao: false,
    referencia,
  },
];

/** Catálogo de referência. Não registra posse nem altera a capacidade da ficha. */
export function listarExpansoesInventario(): PerfilExpansaoInventario[] {
  return expansoes.map(item => ({ ...item }));
}

export function consultarExpansaoInventario(id: string): PerfilExpansaoInventario | null {
  const item = expansoes.find(expansao => expansao.id === id);
  return item ? { ...item } : null;
}

/**
 * Aplica a regra de não acumulação: entre Bolsa e Pochete, considera somente
 * o maior benefício adquirido. Não cria nem altera posse dos itens.
 */
export function calcularBonusExpansaoInventario(ids: readonly string[]): number {
  if (!Array.isArray(ids)) throw new Error('Lista de expansões inválida.');
  let maiorBonus = 0;
  for (const id of ids) {
    if (typeof id !== 'string') throw new Error('Identificador de expansão inválido.');
    const expansao = expansoes.find(item => item.id === id);
    if (!expansao) throw new Error('Expansão de Inventário desconhecida: ' + id);
    maiorBonus = Math.max(maiorBonus, expansao.espacosAdicionais);
  }
  return maiorBonus;
}
