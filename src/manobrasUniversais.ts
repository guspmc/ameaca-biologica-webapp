export type CategoriaCustoManobra =
  | 'sem-custo'
  | 'acao'
  | 'movimento'
  | 'acao-bonus'
  | 'acao-convertida-em-movimento'
  | 'substitui-ataque'
  | 'sa'
  | 'reacao-sa';

export type PerfilManobraUniversal = {
  id: string;
  nome: string;
  categoriaCusto: CategoriaCustoManobra;
  custo: string;
  limite: string;
  requisitos: string[];
  procedimento: string[];
  efeitos: string[];
  restricoes: string[];
  referencia: string;
};

const manobras: PerfilManobraUniversal[] = [
  {
    id: 'adiar-acao', nome: 'Adiar Ação', categoriaCusto: 'sem-custo', custo: 'Sem SA.',
    limite: 'Uma decisão de ordem de atuação para o turno.',
    requisitos: ['Abrir mão de agir na posição atual da Iniciativa.'],
    procedimento: ['Deslocar o próprio turno para depois do turno de um aliado ou para depois que todos tiverem agido na rodada.'],
    efeitos: ['A personagem passa a agir na posição escolhida, conforme a ordem descrita no livro.'],
    restricoes: ['Preparar Ação não existe neste sistema.'],
    referencia: 'Arquivo do Jogador v1.0, p. 77',
  },
  {
    id: 'agarrar', nome: 'Agarrar', categoriaCusto: 'substitui-ataque', custo: 'Substitui um Ataque.',
    limite: 'Sem limite adicional indicado nesta regra.',
    requisitos: ['Exige uma mão livre.', 'Alvo de no máximo uma categoria maior.'],
    procedimento: ['Faça Atletismo contra Atletismo ou Reflexos do alvo, à escolha dele.'],
    efeitos: ['Em sucesso, aplica Agarrado.'],
    restricoes: ['Escapar exige uma Ação e Atletismo ou Reflexos contra a DT do resultado original do Agarrão.'],
    referencia: 'Arquivo do Jogador v1.0, p. 77',
  },
  {
    id: 'ajudar', nome: 'Ajudar', categoriaCusto: 'acao', custo: 'Ação em combate.',
    limite: 'Sem limite adicional indicado nesta regra.',
    requisitos: ['A tarefa precisa poder receber auxílio.', 'Quem ajuda deve cumprir os requisitos de treinamento da tarefa.'],
    procedimento: ['Declare a ajuda à personagem que realizará o Teste.'],
    efeitos: ['O aliado recebe Vantagem no Teste.'],
    restricoes: ['Alguns Testes não podem ser Ajudados.'],
    referencia: 'Arquivo do Jogador v1.0, p. 78',
  },
  {
    id: 'atacar', nome: 'Atacar', categoriaCusto: 'acao', custo: 'Ação.',
    limite: 'Uma Ação normal por turno, salvo Esforço ou regra específica.',
    requisitos: ['Alvo válido para o Ataque escolhido.'],
    procedimento: ['Faça um Ataque Corpo a Corpo ou à distância contra um alvo válido.'],
    efeitos: ['Resolve um Ataque normal conforme as regras da arma e do combate.'],
    restricoes: ['Não existe Ataque Extra básico. Uma segunda Ação para atacar exige Esforço ou outra regra.'],
    referencia: 'Arquivo do Jogador v1.0, p. 78',
  },
  {
    id: 'combate-duas-armas', nome: 'Combate com Duas Armas', categoriaCusto: 'acao-bonus', custo: 'Ação Bônus.',
    limite: 'Uma vez por turno.',
    requisitos: ['Usar a Ação Atacar.', 'O Ataque inicial deve usar Arma Corpo a Corpo de Grau Comum e Mãos 1, empunhada em uma mão.', 'Outra Arma Corpo a Corpo de Grau Comum e Mãos 1 deve estar empunhada na outra mão.'],
    procedimento: ['Depois do Ataque que cumpre os requisitos, realize um Ataque adicional com a outra arma.'],
    efeitos: ['O Ataque adicional é resolvido normalmente.'],
    restricoes: ['O Ataque adicional não adiciona FOR ao Dano, salvo regra específica que amplie as armas permitidas ou permita adicionar o Atributo.'],
    referencia: 'Arquivo do Jogador v1.0, p. 78',
  },
  {
    id: 'desengajar', nome: 'Desengajar', categoriaCusto: 'movimento', custo: 'Movimento.',
    limite: 'O deslocamento desta manobra é de 1,5 m.',
    requisitos: [],
    procedimento: ['Consuma seu Movimento para se deslocar 1,5 m.'],
    efeitos: ['Esse deslocamento não provoca Ataque de Oportunidade.'],
    restricoes: ['A proteção contra Ataque de Oportunidade se aplica a esse deslocamento.'],
    referencia: 'Arquivo do Jogador v1.0, p. 78',
  },
  {
    id: 'disparada', nome: 'Disparada', categoriaCusto: 'acao-convertida-em-movimento', custo: 'Converte a Ação em um Movimento adicional.',
    limite: 'Um Movimento adicional pela conversão da Ação.',
    requisitos: [],
    procedimento: ['Abra mão da Ação para realizar um Movimento adicional.'],
    efeitos: ['Ação Bônus, Reação e Ações Livres permanecem disponíveis.', 'A Interação Gratuita com Objeto permanece paralela, limitada a uma por turno.'],
    restricoes: [],
    referencia: 'Arquivo do Jogador v1.0, p. 78',
  },
  {
    id: 'empurrar-derrubar', nome: 'Empurrar/Derrubar', categoriaCusto: 'substitui-ataque', custo: 'Substitui um Ataque.',
    limite: 'Sem limite adicional indicado nesta regra.',
    requisitos: ['Alvo válido para a disputa de Agarrar.'],
    procedimento: ['Use a mesma disputa de Agarrar: Atletismo contra Atletismo ou Reflexos do alvo, à escolha dele.'],
    efeitos: ['Em sucesso, escolha empurrar o alvo 1,5 m para longe ou deixá-lo Caído.'],
    restricoes: ['Não causa Dano.'],
    referencia: 'Arquivo do Jogador v1.0, p. 78',
  },
  {
    id: 'esconder-se', nome: 'Esconder-se', categoriaCusto: 'acao', custo: 'Ação.',
    limite: 'Sem limite adicional indicado nesta regra.',
    requisitos: ['Estar fora dos sentidos do inimigo.', 'Ter onde se ocultar.'],
    procedimento: ['Faça Furtividade contra Percepção Passiva ou ativa, conforme a situação.'],
    efeitos: ['Resolve a tentativa de ocultação conforme o resultado do Teste.'],
    restricoes: [],
    referencia: 'Arquivo do Jogador v1.0, p. 78',
  },
  {
    id: 'finalizacao-dupla', nome: 'Finalização Dupla', categoriaCusto: 'reacao-sa', custo: 'Reação + 3 SA.',
    limite: 'Uma oportunidade vinculada à Finalização de um aliado na rodada.',
    requisitos: ['Um aliado acabou de usar Finalizar.', 'O alvo sobreviveu.', 'A personagem ainda não agiu na rodada.'],
    procedimento: ['Execute outra Finalização no mesmo alvo.'],
    efeitos: ['A personagem realiza a Manobra Finalizar contra o mesmo alvo.'],
    restricoes: ['Compromete a Ação e o Movimento do próximo turno da personagem.', 'Preserva Ação Bônus e Ação Livre.', 'Os 3 SA são o custo da Finalização; a Reação é custo adicional.'],
    referencia: 'Arquivo do Jogador v1.0, p. 78',
  },
  {
    id: 'finalizar', nome: 'Finalizar', categoriaCusto: 'sa', custo: '3 SA.',
    limite: 'Os 3 SA constituem o custo completo da Manobra.',
    requisitos: ['Alvo válido para Ataque.', 'Para Morte Instantânea, o alvo deve estar Vulnerável e poder sofrer Morte Instantânea.'],
    procedimento: ['Faça um Ataque contra a Defesa do alvo.', 'Como parte da Manobra, pode se deslocar até uma distância igual ao próprio Movimento, exclusivamente para alcançar o alvo.', 'Em acerto, o alvo faz Fortitude com DT igual ao resultado do Ataque.'],
    efeitos: ['Se o alvo falhar no Teste de Fortitude, sofre o Dano normal +3d6.', 'Se estiver Vulnerável e puder sofrer Morte Instantânea, é morto.'],
    restricoes: ['Não consome a Ação nem o Movimento normais.', 'Morte Instantânea depende da condição Vulnerável e das regras que permitem a morte instantânea.'],
    referencia: 'Arquivo do Jogador v1.0, p. 79',
  },
  {
    id: 'fuga', nome: 'Fuga', categoriaCusto: 'sa', custo: 'Disparada + 1 SA.',
    limite: 'Concede um terceiro Movimento no turno.',
    requisitos: ['Ter convertido a Ação em Movimento por Disparada.'],
    procedimento: ['Depois da Disparada, gaste 1 SA.'],
    efeitos: ['Recebe um terceiro Movimento.'],
    restricoes: ['O custo de 1 SA entra na janela de 3 SA de Esforço e Manobras.'],
    referencia: 'Arquivo do Jogador v1.0, p. 79',
  },
  {
    id: 'mirar', nome: 'Mirar', categoriaCusto: 'sa', custo: '1 SA.',
    limite: 'O bônus se aplica ao Ataque declarado após Mirar.',
    requisitos: ['Declarar Mirar antes do Ataque.', 'Escolher uma região específica do alvo.'],
    procedimento: ['Declare a intenção de Mirar e escolha a região antes de realizar o Ataque.'],
    efeitos: ['Recebe +2 no Teste de Ataque.'],
    restricoes: ['Não aumenta Dano.', 'Não remove Desvantagem.', 'Não torna possível um Ataque impossível.', 'O custo de 1 SA entra na janela de 3 SA de Esforço e Manobras.'],
    referencia: 'Arquivo do Jogador v1.0, p. 79',
  },
  {
    id: 'usar-objeto', nome: 'Usar um Objeto', categoriaCusto: 'acao', custo: 'Ação.',
    limite: 'Permite uma interação adicional com objeto.',
    requisitos: ['A Interação Gratuita com Objeto do turno já foi usada.'],
    procedimento: ['Gaste uma Ação para realizar uma interação adicional com objeto.'],
    efeitos: ['Permite a interação adicional.'],
    restricoes: ['Uma regra específica de item ou Habilidade pode determinar custo diferente.'],
    referencia: 'Arquivo do Jogador v1.0, p. 79',
  },
];

function clonar(manobra: PerfilManobraUniversal): PerfilManobraUniversal {
  return {
    ...manobra,
    requisitos: [...manobra.requisitos],
    procedimento: [...manobra.procedimento],
    efeitos: [...manobra.efeitos],
    restricoes: [...manobra.restricoes],
  };
}

/** Catálogo de consulta. Não executa ações, Testes, deslocamentos ou efeitos no estado da ficha. */
export function listarManobrasUniversais(): PerfilManobraUniversal[] {
  return manobras.map(clonar);
}

export function consultarManobraUniversal(id: string): PerfilManobraUniversal | null {
  const manobra = manobras.find(item => item.id === id);
  return manobra ? clonar(manobra) : null;
}
