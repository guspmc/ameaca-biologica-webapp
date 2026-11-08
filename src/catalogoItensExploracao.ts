export type CategoriaItemExploracao =
  | 'iluminacao'
  | 'consumivel'
  | 'ingrediente'
  | 'ferramenta'
  | 'explosivo'
  | 'equipamento-caracteristico'
  | 'moeda';

export type PerfilItemExploracao = {
  id: string;
  nome: string;
  categoria: CategoriaItemExploracao;
  uso: string;
  efeito: string;
  aquisicao: string;
  observacoes: string[];
  referencia: string;
};

const ref67 = 'Arquivo do Jogador v1.0, p. 67';
const ref68 = 'Arquivo do Jogador v1.0, p. 68';
const ref69 = 'Arquivo do Jogador v1.0, p. 69';
const ref70 = 'Arquivo do Jogador v1.0, p. 70';
const ref71 = 'Arquivo do Jogador v1.0, p. 71';

const itens: PerfilItemExploracao[] = [
  { id: 'lanterna-simples', nome: 'Lanterna Simples', categoria: 'iluminacao', uso: 'Iluminação portátil.', efeito: 'Cone de 12 m; ocupa 1 Espaço; Durabilidade 0.', aquisicao: '1 Moeda Antiga; toda personagem começa com uma.', observacoes: ['Sacar, ligar ou desligar usa Interação Gratuita com Objeto, cada ato separadamente.', 'Não pode ser usada junto de arma de 2 mãos.'], referencia: ref67 },
  { id: 'lanterna-grande', nome: 'Lanterna Grande', categoria: 'iluminacao', uso: 'Iluminação portátil de maior alcance.', efeito: 'Cone de 18 m; ocupa 1 Espaço; Durabilidade 0.', aquisicao: '1 Moeda Antiga.', observacoes: ['Sacar, ligar ou desligar usa Interação Gratuita com Objeto, cada ato separadamente.', 'Não pode ser usada com arma de 2 mãos e não permite Mirar enquanto estiver em uso.'], referencia: ref67 },
  { id: 'lanterna-de-bolso', nome: 'Lanterna de Bolso', categoria: 'iluminacao', uso: 'Iluminação portátil compacta.', efeito: 'Cone de 9 m; não ocupa Espaço.', aquisicao: '3 Moedas Antigas.', observacoes: ['Sempre Equipada.', 'Ligar ou desligar usa Interação Gratuita com Objeto.'], referencia: ref67 },
  { id: 'lanterna-de-cabeca', nome: 'Lanterna de Cabeça', categoria: 'iluminacao', uso: 'Iluminação vestível.', efeito: 'Cone de 9 m; não ocupa Espaço; concede Vantagem ao Mirar.', aquisicao: '4 Moedas Antigas.', observacoes: ['Equipar e ligar são interações separadas.'], referencia: ref67 },
  { id: 'lanterna-policial', nome: 'Lanterna Policial', categoria: 'iluminacao', uso: 'Iluminação portátil; pode ser usada como Cassetete.', efeito: 'Cone de 12 m; ocupa 1 Espaço; Durabilidade 1.', aquisicao: '2 Moedas Antigas.', observacoes: ['Sacar, ligar ou desligar usa Interação Gratuita com Objeto, cada ato separadamente.', 'Pode ser usada como Cassetete e não pode ser usada com arma de 2 mãos.'], referencia: ref67 },
  { id: 'agente-reestruturante', nome: 'Agente Reestruturante', categoria: 'consumivel', uso: 'Uso normal: recupera 2d8 PV. Uso alternativo de reimplante: Ação, exige ambas as mãos livres; se precisar recolher o membro do chão ou de um recipiente, também consome Movimento.', efeito: 'Uso normal: recupera 2d8 PV. Alternativamente, reimplanta automaticamente um membro Decepado disponível, sem Teste.', aquisicao: 'Fabricação; ver receita própria.', observacoes: ['Membro Fresco (até 1 h): +0 BI; Contaminado I (>1 a <2 h): +2 BI; Contaminado II (2 a <3 h): +3 BI; Contaminado III (3 a 4 h): +4 BI.', 'Membro Infectado (mais de 4 h): +6 BI e Vontade DT 15; em falha, sofre Colapso Viral e transforma-se imediatamente em Zumbi Especial, sem Testes de Reanimação.'], referencia: 'Arquivo do Jogador v1.0, p. 67 e 93' },
  { id: 'bomba-de-fumaca', nome: 'Bomba de Fumaça', categoria: 'explosivo', uso: 'Ação: arremessar em um ponto até Alcance Médio.', efeito: 'Cria uma esfera de fumaça de 4,5 m de diâmetro por 1d4 + 1 rodadas.', aquisicao: 'Fabricação ou exploração, conforme disponibilidade.', observacoes: ['Ataques que dependam de visão através da fumaça têm Desvantagem.', 'Se bloquear totalmente a visão entre atacante e alvo, o Narrador pode considerar o Ataque impossível.', 'Receita: Composto Balístico + Fluido Estéril; AST DT 18; 30 minutos.'], referencia: ref68 },
  { id: 'coletor', nome: 'Coletor', categoria: 'ferramenta', uso: 'Coleta Sangue Contaminado e outros fluidos compatíveis quando a situação permitir.', efeito: 'Reutilizável e não se desgasta com o uso.', aquisicao: 'Exploração.', observacoes: ['Quando faz parte do Kit de Primeiros Socorros, é componente do Kit e não ocupa Espaço adicional.', 'Necessário para obter Sangue Contaminado pela via descrita no livro.'], referencia: ref68 },
  { id: 'composto-balistico', nome: 'Composto Balístico', categoria: 'ingrediente', uso: 'Ingrediente de receitas de munições e dispositivos especiais.', efeito: 'Não possui efeito isolado.', aquisicao: 'Exploração.', observacoes: ['Cada dose pode ser consumida como ingrediente em uma Receita que a exija.'], referencia: ref68 },
  { id: 'composto-necrotico', nome: 'Composto Necrótico', categoria: 'consumivel', uso: 'Carregar a dose em um Injetor e aplicar com Ação, exigindo contato Corpo a Corpo com o alvo.', efeito: 'Causa 1d6 de Dano por ponto de Medicina de quem o criou, máximo 10d6; Fortitude DT 15 reduz o Dano à metade.', aquisicao: 'Fabricação; requer Sangue Contaminado e Fluido Estéril.', observacoes: ['Se o alvo estiver Vulnerável, ocorre explosão de sangue/matéria orgânica sem Dano em área.', 'O Injetor é descartado após a aplicação.'], referencia: ref68 },
  { id: 'erva-amarela', nome: 'Erva Amarela', categoria: 'ingrediente', uso: 'Ingrediente de Misturas voltadas à redução de Bio-Infecção.', efeito: 'Não possui efeito isolado; com Erva Verde, reduz BI em 1d6.', aquisicao: 'Exploração.', observacoes: ['Ação Bônus quando integrada a uma Mistura válida.'], referencia: ref68 },
  { id: 'erva-azul', nome: 'Erva Azul', categoria: 'ingrediente', uso: 'Ingrediente de Misturas capazes de neutralizar toxinas e estados de Intoxicação.', efeito: 'Não possui efeito isolado; com Erva Verde, remove Intoxicação.', aquisicao: 'Exploração.', observacoes: ['Ação Bônus quando integrada a uma Mistura válida.'], referencia: ref68 },
  { id: 'erva-verde', nome: 'Erva Verde', categoria: 'ingrediente', uso: 'Planta medicinal combinável em Misturas e Receitas.', efeito: 'Ao usar, recupera 1d8 PV.', aquisicao: 'Exploração.', observacoes: ['Pode ser combinada em Misturas/Receitas; Ação Bônus.'], referencia: ref68 },
  { id: 'erva-vermelha', nome: 'Erva Vermelha', categoria: 'ingrediente', uso: 'Ingrediente que potencializa a recuperação quando combinada com Erva Verde.', efeito: 'Não possui efeito isolado; em Misturas com Erva Verde, potencializa a recuperação.', aquisicao: 'Exploração.', observacoes: ['Ação Bônus apenas quando integrada a uma Mistura válida.'], referencia: ref68 },
  { id: 'estabilizador', nome: 'Estabilizador', categoria: 'consumivel', uso: 'Ação Bônus; preparado em um Injetor quando fabricado.', efeito: 'Recupera 1d8 PV e concede Vantagem no primeiro Ataque de cada turno por 3 turnos.', aquisicao: '3 Moedas Antigas ou fabricação.', observacoes: ['O Injetor é descartado após a aplicação.'], referencia: ref68 },
  { id: 'esteroide', nome: 'Esteroide', categoria: 'consumivel', uso: 'Ação Bônus; preparado em um Injetor quando fabricado.', efeito: 'Recupera todos os PV perdidos e concede 2d8 PV Temporários.', aquisicao: '3 Moedas Antigas ou fabricação.', observacoes: ['Os PV Temporários duram até serem consumidos ou até o fim de um Descanso Parcial ou Descanso Completo.', 'O Injetor é descartado após a aplicação.'], referencia: ref69 },
  { id: 'fluido-esteril', nome: 'Fluido Estéril', categoria: 'ingrediente', uso: 'Base de compostos médicos e experimentais.', efeito: 'Não possui efeito isolado.', aquisicao: 'Exploração.', observacoes: ['Ingrediente de Agente Reestruturante e Composto Necrótico, entre outras receitas.'], referencia: ref69 },
  { id: 'gazua', nome: 'Gazua', categoria: 'ferramenta', uso: 'Teste de AGI para abrir fechadura ou cadeado compatível; em combate exige uma Ação.', efeito: 'É descartada após uma tentativa, bem-sucedida ou não.', aquisicao: 'Exploração.', observacoes: ['Fora de combate, o tempo necessário depende da situação.'], referencia: ref69 },
  { id: 'gazua-profissional', nome: 'Gazua Profissional', categoria: 'equipamento-caracteristico', uso: 'Permite Teste de AGI para abrir fechadura ou cadeado compatível; em combate exige uma Ação.', efeito: 'Ferramenta reutilizável do Agente; não ocupa Inventário normal e não pode ser descartada.', aquisicao: 'Item Característico do Agente.', observacoes: ['Fora de combate, o tempo necessário depende da situação.'], referencia: ref69 },
  { id: 'granada', nome: 'Granada', categoria: 'explosivo', uso: 'Ação para arremessar em um ponto até Alcance Médio.', efeito: 'Criaturas em esfera de 3 m fazem Reflexos DT 12; sucesso sofre metade de 4d6, falha sofre 4d6. Não há Acerto Crítico.', aquisicao: 'Exploração ou recompensa; não é fabricável por personagens.', observacoes: [], referencia: ref69 },
  { id: 'injetor', nome: 'Injetor', categoria: 'ferramenta', uso: 'Recipiente e aplicador de uma única dose compatível; dispara o conteúdo quando pressionado contra superfície sólida.', efeito: 'Consumível; descartado após a aplicação.', aquisicao: 'Exploração ou conforme receita.', observacoes: ['Receitas que exigem Injetor especificam seu uso como recipiente e aplicador.'], referencia: ref69 },
  { id: 'kit-de-ferramentas', nome: 'Kit de Ferramentas', categoria: 'equipamento-caracteristico', uso: 'Permite Manutenção, criação e modificação quando uma regra permitir, substituindo ferramentas de uma Sala de Descanso.', efeito: 'Não ocupa Inventário normal e não pode ser descartado.', aquisicao: 'Item Característico do Operador.', observacoes: ['Fora da Sala de Descanso, os tempos permanecem os mesmos até que uma Habilidade os reduza.'], referencia: ref69 },
  { id: 'kit-de-primeiros-socorros', nome: 'Kit de Primeiros Socorros', categoria: 'equipamento-caracteristico', uso: 'Permite preparar/combinar itens medicinais exigidos por Receita ou Habilidade quando necessário.', efeito: 'Não ocupa Inventário normal e não pode ser descartado.', aquisicao: 'Item Característico do Autodidata.', observacoes: ['Habilidades podem reduzir o tempo de preparo.', 'O Coletor, quando parte do Kit, não ocupa Espaço adicional.'], referencia: ref70 },
  { id: 'mina', nome: 'Mina', categoria: 'explosivo', uso: 'Ação Completa para instalar em um espaço adjacente.', efeito: 'Quando uma criatura entra no espaço ou em um espaço adjacente indicado pelo instalador, explode; criaturas em raio de 1,5 m fazem Reflexos DT 12, sucesso sofre metade de 4d6, falha sofre 4d6.', aquisicao: 'Exploração ou recompensa; não é fabricável por personagens.', observacoes: ['Não distingue aliados de inimigos.'], referencia: ref70 },
  { id: 'moeda-antiga', nome: 'Moeda Antiga', categoria: 'moeda', uso: 'Tesouro físico usado em mecanismos, Armários e Gaiolas especiais; pode ser usada individualmente ou cedida ao grupo.', efeito: 'Até 3 Moedas Antigas ocupam 1 Espaço de Inventário.', aquisicao: 'Exploração e recompensas.', observacoes: ['Cada personagem carrega suas próprias moedas; o grupo pode reuni-las e decidir como gastá-las.'], referencia: ref70 },
  { id: 'neurotoxina', nome: 'Neurotoxina', categoria: 'consumivel', uso: 'Ação para aplicar a arma Corpo a Corpo, virote ou alvo adjacente compatível.', efeito: 'Na primeira vez que a dose causar contato efetivo, o alvo faz Fortitude DT 12; em falha, não soma AGI à Defesa por 1d4 rodadas.', aquisicao: 'Fabricação; Erva Azul + Fluido Estéril.', observacoes: ['A dose é consumida.'], referencia: ref71 },
  { id: 'sangue-contaminado', nome: 'Sangue Contaminado', categoria: 'ingrediente', uso: 'Ingrediente usado na criação de Composto Necrótico.', efeito: 'Não possui efeito isolado definido.', aquisicao: 'Coletor ou outro método explicitamente permitido pelo Narrador.', observacoes: ['A obtenção por Coletor depende de situação compatível.'], referencia: ref71 },
  { id: 'spray-primeiros-socorros', nome: 'Spray de Primeiros Socorros', categoria: 'consumivel', uso: 'Ação Bônus.', efeito: 'Recupera 3d8 PV.', aquisicao: '2 Moedas Antigas.', observacoes: [], referencia: ref71 },
];

const porId = new Map(itens.map(item => [item.id, item]));

function clonar(item: PerfilItemExploracao): PerfilItemExploracao {
  return { ...item, observacoes: [...item.observacoes] };
}

/** Catálogo de referência. Não controla posse, uso, consumo ou Inventário. */
export function listarItensExploracao(): PerfilItemExploracao[] {
  return itens.map(clonar);
}

export function consultarItemExploracao(id: string): PerfilItemExploracao | null {
  const item = porId.get(id);
  return item ? clonar(item) : null;
}

export function listarCategoriasItensExploracao(): CategoriaItemExploracao[] {
  return ['iluminacao', 'consumivel', 'ingrediente', 'ferramenta', 'explosivo', 'equipamento-caracteristico', 'moeda'];
}
