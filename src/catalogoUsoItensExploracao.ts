import { listarItensExploracao } from './catalogoItensExploracao.ts';

export type ProcedimentoUsoItem = {
  itemId: string;
  emCombate: string;
  foraDeCombate: string;
  referencia: string;
};

const foraSemRegra = 'O Arquivo do Jogador não fixa custo de ação nem duração fora de combate; resolver conforme a situação, sem presumir rolagem ou efeito adicional.';
const procedimentos: ProcedimentoUsoItem[] = [
  { itemId: 'lanterna-simples', emCombate: 'Sacar, ligar e desligar são Interações Gratuitas com Objeto separadas. Não pode ser usada junto de arma de 2 mãos.', foraDeCombate: 'Sacar, ligar e desligar continuam sendo atos separados; o livro não fixa custo ou duração fora de combate.', referencia: 'Arquivo do Jogador v1.0, p. 67' },
  { itemId: 'lanterna-grande', emCombate: 'Sacar, ligar e desligar são Interações Gratuitas com Objeto separadas. Não pode ser usada com arma de 2 mãos nem permite Mirar enquanto estiver em uso.', foraDeCombate: 'Sacar, ligar e desligar continuam sendo atos separados; o livro não fixa custo ou duração fora de combate.', referencia: 'Arquivo do Jogador v1.0, p. 67' },
  { itemId: 'lanterna-de-bolso', emCombate: 'Sempre Equipada; ligar ou desligar usa Interação Gratuita com Objeto.', foraDeCombate: 'Permanece Sempre Equipada; ligar ou desligar são atos separados. O livro não fixa duração fora de combate.', referencia: 'Arquivo do Jogador v1.0, p. 67' },
  { itemId: 'lanterna-de-cabeca', emCombate: 'Equipar e ligar são Interações Gratuitas com Objeto separadas; concede Vantagem ao Mirar.', foraDeCombate: 'Equipar e ligar são atos separados; o livro não fixa custo ou duração fora de combate.', referencia: 'Arquivo do Jogador v1.0, p. 67' },
  { itemId: 'lanterna-policial', emCombate: 'Sacar, ligar e desligar são Interações Gratuitas com Objeto separadas. Pode ser usada como Cassetete; não pode ser usada com arma de 2 mãos.', foraDeCombate: 'Sacar, ligar e desligar continuam sendo atos separados; o livro não fixa custo ou duração fora de combate.', referencia: 'Arquivo do Jogador v1.0, p. 67' },
  { itemId: 'agente-reestruturante', emCombate: 'Uso normal recupera 2d8 PV. Alternativamente, reimplantar membro Decepado disponível exige Ação e ambas as mãos livres; recolher o membro do chão/recipiente também exige Movimento.', foraDeCombate: 'Uso normal recupera 2d8 PV. Reimplante é automático, sem Teste; a condição do membro e o acréscimo de BI seguem a regra de Reimplante. O livro não fixa duração para o uso normal.', referencia: 'Arquivo do Jogador v1.0, pp. 67–68 e 93' },
  { itemId: 'bomba-de-fumaca', emCombate: 'Ação para arremessar em ponto até Alcance Médio; esfera de fumaça de 4,5 m de diâmetro por 1d4 + 1 rodadas. Ataques dependentes de visão através dela têm Desvantagem; bloqueio total pode tornar o Ataque impossível.', foraDeCombate: foraSemRegra, referencia: 'Arquivo do Jogador v1.0, p. 68' },
  { itemId: 'coletor', emCombate: 'Permite coletar Sangue Contaminado e outros fluidos compatíveis quando a situação permitir; o livro não fixa custo de ação.', foraDeCombate: 'Reutilizável e não se desgasta; coleta depende de haver fluido compatível e situação apropriada. Quando componente do Kit de Primeiros Socorros, não ocupa Espaço adicional.', referencia: 'Arquivo do Jogador v1.0, p. 68' },
  { itemId: 'composto-balistico', emCombate: 'Não possui efeito isolado; não produz efeito de combate por si só.', foraDeCombate: 'Ingrediente consumido em Receitas que o exijam; cada dose é matéria-prima. Não possui efeito isolado.', referencia: 'Arquivo do Jogador v1.0, pp. 68 e 71–72' },
  { itemId: 'composto-necrotico', emCombate: 'Carregar a dose em Injetor e aplicar com Ação, exigindo contato Corpo a Corpo. Causa 1d6 por ponto de Medicina do criador, máximo 10d6; Fortitude DT 15 reduz à metade. Contra alvo Vulnerável, há explosão orgânica sem Dano em área. Injetor é descartado.', foraDeCombate: 'A aplicação continua exigindo Injetor e contato Corpo a Corpo; não há procedimento ou duração fora de combate especificados.', referencia: 'Arquivo do Jogador v1.0, p. 68' },
  { itemId: 'erva-amarela', emCombate: 'Ação Bônus somente quando integrada a Mistura válida; com Erva Verde, reduz BI em 1d6.', foraDeCombate: 'Ingrediente de Mistura; não possui efeito isolado. O livro não fixa custo ou duração fora de combate.', referencia: 'Arquivo do Jogador v1.0, pp. 68 e 72–73' },
  { itemId: 'erva-azul', emCombate: 'Ação Bônus somente quando integrada a Mistura válida; com Erva Verde, remove Intoxicação.', foraDeCombate: 'Ingrediente de Mistura; não possui efeito isolado. O livro não fixa custo ou duração fora de combate.', referencia: 'Arquivo do Jogador v1.0, pp. 68 e 72–73' },
  { itemId: 'erva-verde', emCombate: 'Ação Bônus; ao usar sozinha recupera 1d8 PV. Também pode integrar Misturas/Receitas.', foraDeCombate: 'Pode ser usada para recuperar 1d8 PV ou combinada em Mistura/Receita; o livro não fixa duração fora de combate.', referencia: 'Arquivo do Jogador v1.0, pp. 68 e 72–73' },
  { itemId: 'erva-vermelha', emCombate: 'Ação Bônus somente quando integrada a Mistura válida; com Erva Verde potencializa a recuperação.', foraDeCombate: 'Ingrediente de Mistura; não possui efeito isolado. O livro não fixa custo ou duração fora de combate.', referencia: 'Arquivo do Jogador v1.0, pp. 68 e 73' },
  { itemId: 'estabilizador', emCombate: 'Ação Bônus. Recupera 1d8 PV e concede Vantagem no primeiro Ataque de cada turno por 3 turnos. Se fabricado, é preparado em Injetor e consumido no uso.', foraDeCombate: 'O efeito de recuperação é 1d8 PV; o bônus de Ataque é descrito por turnos. O livro não define conversão de turnos nem custo fora de combate.', referencia: 'Arquivo do Jogador v1.0, pp. 68–69 e 72' },
  { itemId: 'esteroide', emCombate: 'Ação Bônus. Recupera todos os PV perdidos e concede 2d8 PV Temporários; se fabricado, é preparado em Injetor e consumido no uso.', foraDeCombate: 'Recupera todos os PV perdidos e concede 2d8 PV Temporários até serem consumidos ou até o fim de Descanso Parcial/Completo. O livro não fixa custo fora de combate.', referencia: 'Arquivo do Jogador v1.0, p. 69 e 72' },
  { itemId: 'fluido-esteril', emCombate: 'Não possui efeito isolado nem uso de combate autônomo definido.', foraDeCombate: 'Ingrediente de compostos médicos/experimentais, incluindo Agente Reestruturante e Composto Necrótico; sem efeito isolado definido.', referencia: 'Arquivo do Jogador v1.0, pp. 69 e 71–72' },
  { itemId: 'gazua', emCombate: 'Teste de AGI para abrir fechadura/cadeado compatível; tentativa exige Ação. É descartada após uma tentativa, com sucesso ou falha.', foraDeCombate: 'Teste de AGI para fechadura/cadeado compatível; tempo depende da situação. É descartada após uma tentativa, com sucesso ou falha.', referencia: 'Arquivo do Jogador v1.0, p. 69' },
  { itemId: 'gazua-profissional', emCombate: 'Teste de AGI para abrir fechadura/cadeado compatível; tentativa exige Ação. Reutilizável.', foraDeCombate: 'Teste de AGI para fechadura/cadeado compatível; tempo depende da situação. Reutilizável.', referencia: 'Arquivo do Jogador v1.0, p. 69' },
  { itemId: 'granada', emCombate: 'Ação para arremessar em ponto até Alcance Médio; esfera de 3 m. Reflexos DT 12: sucesso sofre metade de 4d6, falha sofre 4d6. Não há Acerto Crítico.', foraDeCombate: foraSemRegra, referencia: 'Arquivo do Jogador v1.0, p. 69' },
  { itemId: 'injetor', emCombate: 'Carrega uma única dose compatível e aplica quando pressionado contra superfície sólida; é descartado após a aplicação. A ação da aplicação depende do composto/Receita.', foraDeCombate: 'Recipiente e aplicador de uma dose compatível; é descartado após a aplicação. A Receita/composto determina o procedimento.', referencia: 'Arquivo do Jogador v1.0, p. 69' },
  { itemId: 'kit-de-ferramentas', emCombate: 'Não concede ação de combate autônoma; permite Manutenção, criação e modificação quando regra permitir.', foraDeCombate: 'Item Característico do Operador; substitui ferramentas de Sala de Descanso quando permitido. Fora da Sala de Descanso, os tempos permanecem os mesmos até Habilidade reduzi-los.', referencia: 'Arquivo do Jogador v1.0, p. 69' },
  { itemId: 'kit-de-primeiros-socorros', emCombate: 'Não concede ação de combate autônoma; permite preparar/combinar itens medicinais exigidos por Receita ou Habilidade.', foraDeCombate: 'Item Característico do Autodidata; permite preparar/combinar itens medicinais quando exigido. Habilidades podem reduzir o tempo de preparo.', referencia: 'Arquivo do Jogador v1.0, p. 70' },
  { itemId: 'mina', emCombate: 'Ação Completa para instalar em espaço adjacente. Ao entrar no espaço ou em espaço adjacente indicado, detona; raio 1,5 m, Reflexos DT 12: sucesso metade de 4d6, falha 4d6. Não distingue aliados de inimigos.', foraDeCombate: 'Instalação exige Ação Completa segundo a regra; a detonação ocorre quando uma criatura entra na área de ativação. Não é fabricável por personagens.', referencia: 'Arquivo do Jogador v1.0, p. 70' },
  { itemId: 'moeda-antiga', emCombate: 'Não possui ação de combate autônoma; pode ser gasta em mecanismos, Armários e Gaiolas conforme tabela de preços.', foraDeCombate: 'Tesouro físico; até 3 ocupam 1 Espaço. Personagens carregam suas próprias moedas e podem reuni-las ou cedê-las ao grupo para gastos compartilhados.', referencia: 'Arquivo do Jogador v1.0, pp. 70 e 73' },
  { itemId: 'neurotoxina', emCombate: 'Ação para aplicar a arma Corpo a Corpo, virote ou alvo adjacente compatível. No primeiro contato efetivo, Fortitude DT 12; em falha, alvo não soma AGI à Defesa por 1d4 rodadas. Dose consumida.', foraDeCombate: 'Pode ser aplicada a arma Corpo a Corpo, virote ou alvo adjacente compatível; o livro não fixa custo ou duração fora de combate. Dose consumida no contato efetivo.', referencia: 'Arquivo do Jogador v1.0, p. 71' },
  { itemId: 'sangue-contaminado', emCombate: 'Não possui efeito isolado definido nem uso de combate autônomo.', foraDeCombate: 'Ingrediente do Composto Necrótico; deve ser obtido com Coletor ou por outro método explicitamente permitido pelo Narrador.', referencia: 'Arquivo do Jogador v1.0, pp. 71–72' },
  { itemId: 'spray-primeiros-socorros', emCombate: 'Ação Bônus; recupera 3d8 PV.', foraDeCombate: 'Recupera 3d8 PV; o livro não fixa custo de ação ou duração fora de combate.', referencia: 'Arquivo do Jogador v1.0, p. 71' },
];

const porId = new Map(procedimentos.map(item => [item.itemId, item]));

/** Reúne procedimentos sem executar ações, Testes, consumo ou alterações de ficha. */
export function consultarProcedimentoUsoItem(itemId: string): ProcedimentoUsoItem | null {
  const item = porId.get(itemId);
  return item ? { ...item } : null;
}

export function listarProcedimentosUsoItens(): ProcedimentoUsoItem[] {
  return procedimentos.map(item => ({ ...item }));
}

/** Auditoria estrutural: cada item do catálogo precisa ter procedimento explícito nos dois contextos. */
export function catalogoUsoItensCompleto(): boolean {
  const idsCatalogo = listarItensExploracao().map(item => item.id).sort();
  const idsUso = procedimentos.map(item => item.itemId).sort();
  return idsCatalogo.length === idsUso.length
    && idsCatalogo.every((id, indice) => id === idsUso[indice])
    && procedimentos.every(item => item.emCombate.trim() && item.foraDeCombate.trim() && item.referencia.trim());
}
