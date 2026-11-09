import { HABILIDADES_BASICAS } from './habilidades';

const EFEITOS_PROGRESSAO: Record<string, string> = {
  'finalizacao-a-distancia': 'Permite usar a Manobra Finalizar com arma de fogo contra alvo no alcance da arma e, no máximo, até Alcance Médio. Mantém custo de SA, Dano, Teste de Fortitude e Atordoamento quando não houver Morte Instantânea. Não amplia alcance nem remove penalidades.',
  'na-minha-mira': 'Uma vez por rodada, quando inimigo perceptível a até Alcance Médio adquirir uma Condição que imponha penalidade ou restrição, permite usar Reação para Ataque de Oportunidade à distância com arma de fogo. Reaplicar Condição já existente não ativa o efeito.',
  'contra-ataque-instintivo': 'Após Aparar ou Esquivar com sucesso, permite realizar Contra-Ataque como parte da mesma Reação; o custo normal de 1 SA permanece.',
  'armeira-autodidata': 'Armas de Fogo modificadas causam +1d4 de Dano por Peça Extra instalada. Não se aplica a armas Corpo a Corpo. Permite usar uma Pistola em cada mão para Aparar Ataques Corpo a Corpo.',
  'tentativa-e-erro': 'Permite Testes com Perícias não Treinadas, inclusive aplicações normalmente restritas a Treinamento, salvo requisito adicional expresso. Recebe +1 nesses Testes e escolhe uma Perícia adicional para Treinar.',
  'farmacia-de-campo': 'Permite criar Misturas de Ervas como Ação fora de Sala de Descanso e durante deslocamento, desde que possua Receita e ingredientes.',
  'casca-grossa': 'Dano Desarmado ou de Coronhada sobe uma categoria de Dado. Uma vez por turno, pode executar Cabeçada ou Pisão com Desvantagem após Ataque bem-sucedido.',
  'armamento-especial': 'Concede Proficiência com Magnums e Armas Especiais. Reduz em uma categoria de Ação os custos de Recarga, Bombear/Manejar e Coice, nunca abaixo de Interação Gratuita com Objeto.',
  'quanto-mais-melhor': 'Quando estiver na Área de Ameaça de 3 ou mais inimigos, recebe Vantagem em Ataques.',
  'luta-livre': 'Contra alvo Atordoado, permite Finalização e deslocamento em linha reta até 12 m sem provocar Ataques de Oportunidade. Se o alvo não estiver Vulnerável, adiciona +1d8 de Dano por Nível de Agente, até 10d8. Se derrotado pela Manobra, não há custo de SA.',
  'brecha-tatica': 'Amplia gatilhos de Ataque de Oportunidade para ações vulneráveis durante Movimento/Ação. Se causar Dano, interrompe a ação provocadora. Concede Vantagem em Ataques de Oportunidade.',
  'retaliacao': 'Após Aparar ou Esquivar com sucesso, o inimigo fica Atordoado até o início do próximo turno dele. Contra-Ataque recebe Vantagem e, se acertar, causa +1 Dado de Dano da arma.',
  'arsenal-improvavel': 'Concede Proficiência com Magnums e estende Ambidestria a elas, permitindo a empunhadura apropriada definida pela Habilidade.',
  'reflexos-de-sobrevivente': 'Uma vez por rodada, pode Esquivar sem gastar Reação; a próxima Ação Bônus fica comprometida. Pode atravessar espaços ocupados por jogadores ou inimigos Médios e menores sem provocar Ataque de Oportunidade. Ataques contra si podem usar Defesa ou 10 + Acrobacia, o que for maior.',
  'primeiros-socorros': 'Itens de cura usados pela personagem concedem PV Temporários por 1 hora iguais à Medicina. Aliados até 3 m que recebam cura também recebem o efeito; ao curar aliado, a personagem recebe metade da Cura, sem PV Temporários. Também permite fabricar Neurotoxinas, Bombas de Fumaça, Esteroides e Estabilizadores com Receita, ingredientes e ferramentas.',
  'briga-de-gente-grande': 'Manobras de GOLPE SUJO funcionam contra criaturas maiores quando a anatomia física for compatível/humanoide; recebe Vantagem em Derrubar ou Cabeçada contra criatura maior.',
  'controle-de-fogo': 'Ao usar Rajada, pode substituir Cone por até 6 espaços conectados entre si e dentro do alcance permitido. Cada espaço precisa de linha de efeito. Mantém consumo de munição, Dano, DT e restrições.',
  'parede-humana': 'Ao fim do turno, se não gastou o recurso Movimento, adiciona VIG à Defesa e recebe Redução de Dano igual a 1 + metade do Nível de Operador, arredondada para baixo, máximo 6. Dura até o início do próximo turno.',
  'voce-aparou-um-missil': 'Pode Aparar qualquer Ataque quando a narrativa permitir a interceptação. Com Faca de Combate ou Hatchet, uma vez durante o próprio turno, pode Aparar como Ação Livre em vez de Reação quando houver gatilho válido. Aparar Corpo a Corpo bem-sucedido com uma dessas armas causa 2d4 de Dano. Pode usar Finalizar sem custo de SA durante Reação de Contra-Ataque; Contra-Ataques causam +2d4.',
  'code-veronica': 'Conhece automaticamente senhas, códigos e combinações, sem substituir chaves, cartões ou itens físicos. Testes de Perícia têm Vantagem; resultados naturais de 2 a 9 contam como 10, mas 1 natural continua Falha Crítica. Ao Combinar Ervas, tem 50% de chance de produzir em dobro. Pode usar Submetralhadoras sem coronha com Ambidestria.',
  'socador-de-pedras': 'Dano base dos Ataques Desarmados passa a 3d10 antes de aumentos de categoria. Punhos são tratados como Indestrutíveis para Aparar Ataques Corpo a Corpo aparáveis. Pode Contra-Atacar desarmado sem largar arma de duas mãos. Criaturas adjacentes ao alvo principal sofrem 1d10 da onda de choque. Ao acertar, o resultado do Ataque pode ser usado como DT de Fortitude para Derrubar.',
};

export function descricaoEfeitoHabilidade(id: string): string {
  return HABILIDADES_BASICAS.find(item => item.id === id)?.efeito ?? EFEITOS_PROGRESSAO[id] ?? '';
}

export function efeitoHabilidadeConhecido(id: string): boolean {
  return descricaoEfeitoHabilidade(id).length > 0;
}
