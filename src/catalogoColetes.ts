export type ContribuicaoAgilidadeColete = 'total' | 'maximo-2' | 'nenhuma';

export type PerfilColete = {
  id: string;
  nome: string;
  defesa: number;
  reducaoDano: number;
  contribuicaoAgilidade: ContribuicaoAgilidadeColete;
  aquisicao: string;
  caracteristico: boolean;
  observacoes: string[];
  referencia: string;
};

const referencia = 'Arquivo do Jogador v1.0, p. 66–67';

const coletes: PerfilColete[] = [
  { id: 'colete-acolchoado', nome: 'Colete Acolchoado', defesa: 1, reducaoDano: 0, contribuicaoAgilidade: 'total', aquisicao: '1 Moeda Antiga', caracteristico: false, observacoes: ['Colete de proteção leve contra pequenos ferimentos perfurantes ou cortantes; não chega a ser à prova de balas.', 'Coletes não usam Durabilidade.'], referencia },
  { id: 'colete-balistico-leve', nome: 'Colete Balístico Leve', defesa: 1, reducaoDano: 1, contribuicaoAgilidade: 'total', aquisicao: '2 Moedas Antigas', caracteristico: false, observacoes: ['Proteção balística básica contra projéteis de baixo calibre.', 'Coletes não usam Durabilidade.'], referencia },
  { id: 'colete-balistico-medio', nome: 'Colete Balístico Médio', defesa: 2, reducaoDano: 2, contribuicaoAgilidade: 'maximo-2', aquisicao: '3 Moedas Antigas', caracteristico: false, observacoes: ['Proteção balística equilibrada; não é muito eficaz contra altos calibres.', 'Coletes não usam Durabilidade.'], referencia },
  { id: 'colete-balistico-pesado', nome: 'Colete Balístico Pesado', defesa: 3, reducaoDano: 3, contribuicaoAgilidade: 'nenhuma', aquisicao: '4 Moedas Antigas', caracteristico: false, observacoes: ['Proteção balística para projéteis de alto calibre; peso e tamanho atrapalham a mobilidade.', 'Coletes não usam Durabilidade.'], referencia },
  { id: 'colete-kendo-0', nome: 'Colete de Placas Kendo — 0 placas', defesa: 1, reducaoDano: 0, contribuicaoAgilidade: 'total', aquisicao: 'Item Característico do Operador', caracteristico: true, observacoes: ['Começa com 0 placas.', 'Pode ajustar a quantidade de placas em Sala de Descanso ou com ferramentas adequadas.', 'Cada placa adicional custa 1 Moeda Antiga, até o máximo de 3.', 'Não pode ser comprado como colete normal.', 'Coletes não usam Durabilidade.'], referencia },
  { id: 'colete-kendo-1', nome: 'Colete de Placas Kendo — 1 placa', defesa: 1, reducaoDano: 1, contribuicaoAgilidade: 'total', aquisicao: 'Item Característico; 1 Moeda Antiga por placa adicional', caracteristico: true, observacoes: ['Coletes não usam Durabilidade.'], referencia },
  { id: 'colete-kendo-2', nome: 'Colete de Placas Kendo — 2 placas', defesa: 2, reducaoDano: 2, contribuicaoAgilidade: 'maximo-2', aquisicao: 'Item Característico; 1 Moeda Antiga por placa adicional', caracteristico: true, observacoes: ['Coletes não usam Durabilidade.'], referencia },
  { id: 'colete-kendo-3', nome: 'Colete de Placas Kendo — 3 placas', defesa: 3, reducaoDano: 3, contribuicaoAgilidade: 'nenhuma', aquisicao: 'Item Característico; 1 Moeda Antiga por placa adicional', caracteristico: true, observacoes: ['Coletes não usam Durabilidade.'], referencia },
];

/** Catálogo de referência. Não equipa coletes nem altera Defesa, RD ou Inventário. */
export function listarColetes(): PerfilColete[] {
  return coletes.map(item => ({ ...item, observacoes: [...item.observacoes] }));
}

export function consultarColete(id: string): PerfilColete | null {
  const item = coletes.find(colete => colete.id === id);
  return item ? { ...item, observacoes: [...item.observacoes] } : null;
}
