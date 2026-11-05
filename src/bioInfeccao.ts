export type FaseBioInfeccao = {
  estado: 'indefinido' | 'fase' | 'colapso';
  fase: 1 | 2 | 3 | 4 | 5 | null;
  efeito: string;
  modificadorMovimento: number | null;
  bonusTesteAtaque: number | null;
  danoCorpoACorpoAdicional: string | null;
  desvantagemAtaquesETestes: boolean | null;
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
    return { estado: 'indefinido', fase: null, efeito: 'Valores de BI indisponíveis.', modificadorMovimento: null, bonusTesteAtaque: null, danoCorpoACorpoAdicional: null, desvantagemAtaquesETestes: null };
  }
  if (atual >= maximo) {
    return { estado: 'colapso', fase: null, efeito: 'Colapso Viral: personagem Desacordada; Reanimação específica.', modificadorMovimento: null, bonusTesteAtaque: null, danoCorpoACorpoAdicional: null, desvantagemAtaquesETestes: null };
  }
  const fase = Math.floor(atual * 5 / maximo) + 1 as 1 | 2 | 3 | 4 | 5;
  const modificadorMovimento = fase === 1 ? 0 : fase <= 4 ? 3 : -6;
  const bonusTesteAtaque = fase === 3 ? 2 : fase === 4 ? 3 : 0;
  const danoCorpoACorpoAdicional = fase === 4 ? '1d4' : null;
  const desvantagemAtaquesETestes = fase === 5;
  return { estado: 'fase', fase, efeito: EFEITOS_FASE[fase], modificadorMovimento, bonusTesteAtaque, danoCorpoACorpoAdicional, desvantagemAtaquesETestes };
}
