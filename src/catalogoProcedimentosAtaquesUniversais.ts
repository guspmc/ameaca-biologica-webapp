export type ProcedimentoAtaqueUniversal = {
  id: 'arma-improvisada' | 'ataque-desarmado';
  nome: string;
  danoCorpo?: string;
  danoArremesso?: string;
  multiplicadorCritico: number;
  maos: string;
  durabilidade: string;
  alcance: string;
  emCombate: string[];
  referencia: string;
};

const procedimentos: ProcedimentoAtaqueUniversal[] = [
  {
    id: 'arma-improvisada',
    nome: 'Arma Improvisada',
    danoCorpo: '1d6 + FOR',
    danoArremesso: '1d6 + AGI',
    multiplicadorCritico: 2,
    maos: '1/2',
    durabilidade: '0',
    alcance: 'Versátil',
    emCombate: [
      'Qualquer objeto adequado para um único golpe desesperado, como cano, cadeira, garrafa pesada ou ferramenta solta.',
      'Ataque Corpo a Corpo: dano de 1d6 + FOR.',
      'Arremesso: dano de 1d6 + AGI.',
      'Uso único: não pode Aparar. Após o Ataque, quebra, perde-se ou deixa de ser adequada.',
      'O livro não detalha aqui um procedimento separado de aquisição; a tabela indica que não se aplica.',
    ],
    referencia: 'Arquivo do Jogador, v1.0, p. 52',
  },
  {
    id: 'ataque-desarmado',
    nome: 'Ataque Desarmado',
    danoCorpo: '1d4 + FOR',
    multiplicadorCritico: 3,
    maos: '—',
    durabilidade: '—',
    alcance: 'Curto',
    emCombate: [
      'Soco, chute, joelhada, cotovelada ou qualquer ataque feito com o próprio corpo.',
      'Ataque com qualquer parte do corpo: dano de 1d4 + FOR.',
      'Por padrão, é feito com Desvantagem, salvo Habilidade ou efeito que o modifique.',
      'Pode ser usado mesmo com as mãos ocupadas.',
    ],
    referencia: 'Arquivo do Jogador, v1.0, p. 52',
  },
];

const porId = new Map(procedimentos.map(item => [item.id, item]));

/** Referência universal de ataques; não rola dados nem altera estado da ficha. */
export function consultarProcedimentoAtaqueUniversal(
  id: ProcedimentoAtaqueUniversal['id'],
): ProcedimentoAtaqueUniversal {
  const item = porId.get(id)!;
  return { ...item, emCombate: [...item.emCombate] };
}

export function listarProcedimentosAtaquesUniversais(): ProcedimentoAtaqueUniversal[] {
  return procedimentos.map(item => ({ ...item, emCombate: [...item.emCombate] }));
}

export function catalogoAtaquesUniversaisCompleto(): boolean {
  return procedimentos.length === 2
    && procedimentos.every(item => item.emCombate.length > 0 && item.referencia === 'Arquivo do Jogador, v1.0, p. 52')
    && procedimentos.some(item => item.id === 'arma-improvisada')
    && procedimentos.some(item => item.id === 'ataque-desarmado');
}
