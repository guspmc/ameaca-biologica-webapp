export type PerfilMunicao = {
  id: string;
  nome: string;
  unidadesPorEspaco: number;
  aquisicao: string;
  grupoPilha: string;
  uso: string;
  observacoes: string[];
  referencia: string;
};

const referencia = 'Arquivo do Jogador v1.0, p. 65–66';

const municoes: PerfilMunicao[] = [
  { id: '9mm', nome: '9 mm', unidadesPorEspaco: 30, aquisicao: '15 por 1 Moeda Antiga', grupoPilha: '9mm', uso: 'Usada por Pistolas 9 mm.', observacoes: ['Variante Alto Impacto: Rara; adiciona +1d6 de Dano em um acerto. Ver Fabricação e Receitas.'], referencia },
  { id: 'calibre-12', nome: 'Calibre 12', unidadesPorEspaco: 15, aquisicao: '8 por 2 Moedas Antigas', grupoPilha: 'calibre-12', uso: 'Usada por Escopetas.', observacoes: ['Variante Incendiária aplica Queimadura por 1 turno além do Dano normal em acerto. Ver Fabricação e Receitas.'], referencia },
  { id: 'cargas', nome: 'Cargas', unidadesPorEspaco: 10, aquisicao: 'Exploração', grupoPilha: 'cargas-spark-shot', uso: 'Unidades elétricas da Spark Shot.', observacoes: ['Bateria funciona como pente; Carga funciona como cartucho.', 'Bateria padrão: 7 Cargas; Bateria de Alta Capacidade: 10.', 'Disparo normal consome 1 Carga; Disparo Carregado consome 3.'], referencia },
  { id: 'cartucho-gm79-acido', nome: 'Cartucho GM 79 — Ácido', unidadesPorEspaco: 10, aquisicao: 'Exploração', grupoPilha: 'cartuchos-gm79', uso: 'Munição especial do GM 79.', observacoes: ['Compartilha a pilha de Cartuchos GM 79.', 'Ataque direto: em acerto, alvo sofre o Dano do GM 79; criaturas, exceto o alvo direto, em raio de 1,5 m fazem Reflexos DT 10; falha sofre 1d6 de respingo, sucesso evita.', 'Alternativamente, disparo em ponto até Alcance Médio, sem Teste de Ataque: criaturas em raio de 1,5 m fazem Reflexos DT 10; sucesso sofre metade do Dano do GM 79, falha sofre Dano integral. Não causa Acerto Crítico.'], referencia },
  { id: 'cartucho-gm79-explosivo', nome: 'Cartucho GM 79 — Explosivo', unidadesPorEspaco: 10, aquisicao: 'Exploração', grupoPilha: 'cartuchos-gm79', uso: 'Munição especial do GM 79.', observacoes: ['Compartilha a pilha de Cartuchos GM 79.', 'Dispare contra um ponto até Alcance Médio, sem Teste de Ataque. Criaturas em raio de 3 m fazem Reflexos DT 10; sucesso sofre metade do Dano do GM 79, falha sofre Dano integral. Não causa Acerto Crítico.'], referencia },
  { id: 'cartucho-gm79-incendiario', nome: 'Cartucho GM 79 — Incendiário', unidadesPorEspaco: 10, aquisicao: 'Exploração', grupoPilha: 'cartuchos-gm79', uso: 'Munição especial do GM 79.', observacoes: ['Compartilha a pilha de Cartuchos GM 79.', 'Ataque direto: em acerto, além do Dano do GM 79, alvo faz Fortitude DT 10; falha sofre Queimadura de 1d6 por 1 turno.', 'Alternativamente, disparo em ponto até Alcance Médio, sem Teste de Ataque: criaturas em raio de 1,5 m fazem Reflexos DT 10; sucesso sofre metade do Dano do GM 79, falha sofre Dano integral. Não causa Acerto Crítico.'], referencia },
  { id: 'cartuchos-gm79', nome: 'Cartuchos GM 79', unidadesPorEspaco: 10, aquisicao: 'Exploração', grupoPilha: 'cartuchos-gm79', uso: 'Munição do GM 79.', observacoes: ['Os cartuchos Ácido, Explosivo e Incendiário compartilham esta pilha de 10 por Espaço.'], referencia },
  { id: 'combustivel', nome: 'Combustível', unidadesPorEspaco: 100, aquisicao: 'Exploração', grupoPilha: 'combustivel-lancachamas', uso: 'Combustível sólido próprio para o sistema químico do Lança-Chamas Químico.', observacoes: ['Cada Ataque do Lança-Chamas consome 10 unidades.'], referencia },
  { id: 'foguete', nome: 'Foguete', unidadesPorEspaco: 1, aquisicao: 'Exploração', grupoPilha: 'foguete-rpg7', uso: 'Projétil explosivo do RPG-7.', observacoes: ['Cada foguete ocupa um Espaço de Inventário inteiro.'], referencia },
  { id: 'magnum', nome: 'Magnum', unidadesPorEspaco: 10, aquisicao: '5 por 4 Moedas Antigas', grupoPilha: 'magnum', uso: 'Cartuchos de alto calibre raros e poderosos.', observacoes: ['Economizar munição de Magnum costuma ser uma decisão de sobrevivência.'], referencia },
  { id: 'rifle', nome: 'Rifle', unidadesPorEspaco: 50, aquisicao: '25 por 3 Moedas Antigas', grupoPilha: 'rifle', uso: 'Usada por Rifles, Rifles de Precisão e Redemption.', observacoes: [], referencia },
  { id: 'submetralhadora', nome: 'Submetralhadora', unidadesPorEspaco: 70, aquisicao: '35 por 1 Moeda Antiga', grupoPilha: 'submetralhadora', uso: 'Munição destinada a submetralhadoras, armazenada em maior quantidade por Espaço devido ao alto consumo de fogo automático.', observacoes: [], referencia },
  { id: 'virotes', nome: 'Virotes', unidadesPorEspaco: 10, aquisicao: 'Exploração', grupoPilha: 'virotes-besta', uso: 'Projéteis reutilizáveis de besta.', observacoes: ['Podem ser recuperados quando a regra da arma permitir.'], referencia },
];

/** Reserva abstrata de referência. Não controla carregadores, recargas ou consumo. */
export function listarMunicoes(): PerfilMunicao[] {
  return municoes.map(item => ({ ...item, observacoes: [...item.observacoes] }));
}

export function consultarMunicao(id: string): PerfilMunicao | null {
  const item = municoes.find(municao => municao.id === id);
  return item ? { ...item, observacoes: [...item.observacoes] } : null;
}
