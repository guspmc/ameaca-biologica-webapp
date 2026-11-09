import { listarPerfisArma } from './catalogoArmas.ts';
import { listarPerfisArmasFogo } from './catalogoArmasFogo.ts';

export type ProcedimentoArma = {
  armaId: string;
  nome: string;
  categoria: 'corpo-a-corpo' | 'arma-fogo';
  emCombate: string[];
  foraDeCombate: string;
  referencia: string;
};

const regraFora = 'O Arquivo do Jogador não fixa custo de ação nem duração para sacar, guardar, inspecionar ou manter esta arma fora de combate; não presumir tempo, teste ou efeito.';
const regraAtaqueCorpo = 'Use a ação normal de Ataque Corpo a Corpo, respeitando alcance Curto, mãos exigidas, proficiência e propriedades da arma. A rolagem e o dano permanecem sob controle do jogador; este catálogo não rola nem aplica efeitos.';
const regraAtaqueFogo = 'Use a ação normal de Ataque à Distância, respeitando alcance, mãos exigidas, proficiência, munição carregada e propriedades da arma. A rolagem e o dano permanecem sob controle do jogador; este catálogo não rola nem aplica efeitos.';

const procedimentos: ProcedimentoArma[] = [
  ...listarPerfisArma().map(arma => ({
    armaId: arma.id,
    nome: arma.nome,
    categoria: arma.categoria,
    emCombate: [
      regraAtaqueCorpo,
      ...(arma.propriedades.includes('Arremessável') ? ['A arma é Arremessável; o catálogo registra a propriedade, mas o livro não estabelece aqui um custo separado para arremessar.'] : []),
      ...(arma.id === 'motosserra' ? ['Ligar exige Movimento. Ataques com a Motosserra são feitos com Desvantagem. Cada resultado 6 no dano gera outro dado, podendo encadear.'] : []),
      ...(arma.id === 'hatchet' ? ['Indestrutível e Arremessável. Pode Aparar e Contra-Atacar. Em Contra-Ataque, se o alvo estiver Vulnerável ou o golpe causar Dano Massivo, aciona Decepamento; o Narrador resolve conforme a regra da arma.'] : []),
    ],
    foraDeCombate: regraFora,
    referencia: arma.referencia,
  })),
  ...listarPerfisArmasFogo().map(arma => {
    const especiais = [...arma.propriedades, ...arma.regrasEspeciais];
    const combate = [regraAtaqueFogo, `Capacidade: ${arma.capacidade}; recarga indicada na ficha: ${arma.recarga}.`];
    if (especiais.some(x => /Disparo Cadenciado/.test(x))) {
      combate.push('Disparo Cadenciado, quando concedido pela ficha da arma ou Peça Extra: usa um Ataque normal, consome 5 cartuchos em vez de 1 e adiciona +2 Dados de Dano do mesmo tipo. A Matilda com sua Coronha específica consome 3 cartuchos.');
    }
    if (especiais.some(x => /Rajada/.test(x))) {
      combate.push('Rajada, quando concedida pela ficha da arma: Manobra de Ação Completa, consome 10 cartuchos e cobre cone de 4,5 m (1 espaço na primeira fileira, 2 na segunda e 3 na terceira). Todos na área, inclusive aliados, fazem Reflexos DT 12; sucesso sofre metade do Dano da arma, falha sofre Dano integral. Para Rajada, a arma pode operar em alcance Curto mesmo quando seu alcance mínimo normal é Médio.');
    }
    if (arma.categoria === 'Escopeta' || arma.categoria === 'Rifle de Precisão') {
      combate.push('Coice: normalmente exige Ação Bônus após o disparo; uma categoria superior de ação pode ser usada. Peças e Habilidades podem reduzir o custo.');
    }
    if (arma.categoria === 'Magnum') {
      combate.push('Coice de Magnum: normalmente exige Movimento após o disparo. Se disparar depois de já usar o Movimento no turno, fica Caído. Peças e Habilidades podem reduzir o custo.');
      combate.push('Magnums possuem Decepamento e Carnificina. Decepamento só é acionado quando o ataque com essa propriedade causa Dano Massivo: o Narrador faz secretamente Fortitude DT 15; falha causa mutilação compatível. Não causa Morte Instantânea em alvo ainda não Vulnerável, salvo regra específica. Carnificina é narrativa e não aumenta Dano nem cria Condições.');
    }
    if (especiais.some(x => /bombeamento|ferrolho|Manejar Ferrolho/i.test(x))) {
      combate.push('Armas de bombeamento ou ferrolho precisam ser preparadas antes do próximo disparo; bombear ou manejar o ferrolho normalmente exige Ação Bônus.');
    }
    if (especiais.some(x => /Perfuração/.test(x))) {
      combate.push('Perfuração: após acertar, faça novo Teste de Ataque contra o próximo alvo na Linha. Cada alvo subsequente atingido remove 1 Dado de Dano e não recebe AGI no Dano; alvos maiores que Médio removem mais 1 Dado por categoria. O projétil para em cobertura/objeto ou quando os dados chegam a 0. A Punisher é exceção: não perde Dados de Dano e atravessa apenas 1 alvo adicional Médio ou menor.');
    }
    if (arma.id === 'spark-shot') combate.push('Spark Shot: disparo normal consome 1 Carga e causa 1d4; disparo carregado é Ação Completa, consome 3 Cargas e causa 4d4. Alvo atingido e criaturas a até 1,5 m fazem Fortitude DT 15; falha aplica Atordoado até o fim do próximo turno e Imobilizado por 1d4 rodadas.');
    if (arma.id === 'lanca-chamas-quimico') combate.push('Lança-Chamas: cada Ataque consome 10 unidades de Combustível e atinge cone de 4,5 m. O dano começa em 3d6 e aumenta +1d6 por turno consecutivo atacando sem usar Movimento, até 6d6; mover ou falhar no Teste de Ataque encerra a acumulação e o próximo Ataque volta a 3d6.');
    if (arma.id === 'besta') combate.push('Besta: virotes podem ser recuperados com Investigação DT 10 quando a regra permitir. Engate Triplo dispara até 3 virotes, consome 3 e exige um Teste de Ataque próprio para cada virote.');
    if (arma.id === 'gm-79') combate.push('GM 79: cada cartucho (Ácido, Explosivo ou Incendiário) possui procedimento próprio; consulte o catálogo de munições. Não substituir seus efeitos por um disparo genérico.');
    if (arma.id === 'rpg-7') combate.push('RPG-7: após o disparo, fica vazio. Perseguidores, Chefes e criaturas com regra própria podem avançar de fase ou sofrer o efeito indicado em sua ficha em vez de Morte Instantânea.');
    return {
      armaId: arma.id,
      nome: arma.nome,
      categoria: 'arma-fogo' as const,
      emCombate: combate,
      foraDeCombate: regraFora,
      referencia: arma.referencia,
    };
  }),
];

const porId = new Map(procedimentos.map(item => [item.armaId, item]));

/** Procedimentos consolidados de referência; não rola, consome munição ou altera equipamentos. */
export function consultarProcedimentoArma(id: string): ProcedimentoArma | null {
  const item = porId.get(id);
  return item ? { ...item, emCombate: [...item.emCombate] } : null;
}

export function listarProcedimentosArmas(): ProcedimentoArma[] {
  return procedimentos.map(item => ({ ...item, emCombate: [...item.emCombate] }));
}

export function catalogoProcedimentosArmasCompleto(): boolean {
  const idsCatalogo = [...listarPerfisArma(), ...listarPerfisArmasFogo()].map(item => item.id).sort();
  const idsProcedimentos = procedimentos.map(item => item.armaId).sort();
  return idsCatalogo.length === idsProcedimentos.length
    && idsCatalogo.every((id, i) => id === idsProcedimentos[i])
    && procedimentos.every(item => item.emCombate.length > 0 && item.foraDeCombate.trim() && item.referencia.trim());
}
