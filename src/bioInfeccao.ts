export type FaseBioInfeccao = {
  estado: 'indefinido' | 'fase' | 'colapso';
  fase: 1 | 2 | 3 | 4 | 5 | null;
  efeito: string;
};

const EFEITOS_FASE: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Sem efeito.',
  2: 'Movimento +3 m.',
  3: 'Movimento +3 m; Ataques +2.',
  4: 'Movimento +3 m; Ataques +3 no total; Dano Corpo a Corpo +1d4.',
  5: 'Perde os benefícios anteriores; Movimento -6 m; Desvantagem em Ataques e Testes de Perícia e Atributo.',
};

/** Calcula somente a fase descrita no cânone; não altera BI nem inicia Reanimação. */
export function calcularFaseBioInfeccao(atual: number, maximo: number): FaseBioInfeccao {
  if (!Number.isSafeInteger(atual) || atual < 0 || !Number.isSafeInteger(maximo) || maximo <= 0) {
    return { estado: 'indefinido', fase: null, efeito: 'Valores de BI indisponíveis.' };
  }
  if (atual >= maximo) {
    return { estado: 'colapso', fase: null, efeito: 'Colapso Viral: personagem Desacordada; Reanimação específica.' };
  }
  const fase = Math.floor(atual * 5 / maximo) + 1 as 1 | 2 | 3 | 4 | 5;
  return { estado: 'fase', fase, efeito: EFEITOS_FASE[fase] };
}
