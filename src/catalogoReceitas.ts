export type CategoriaReceita = 'composto' | 'municao' | 'item' | 'item-especial' | 'mistura';

export type PerfilReceita = {
  id: string;
  nome: string;
  categoria: CategoriaReceita;
  ingredientes: string[];
  teste: string;
  tempo: string;
  resultado: string;
  requisito: string;
  referencia: string;
};

const ref71 = 'Arquivo do Jogador v1.0, p. 71';
const ref72 = 'Arquivo do Jogador v1.0, p. 72';
const ref73 = 'Arquivo do Jogador v1.0, p. 73';
const requisitoMedicina = 'Sala de Descanso ou Kit de Primeiros Socorros, salvo regra específica.';
const requisitoArmamento = 'Sala de Descanso ou Kit de Ferramentas.';

const receitas: PerfilReceita[] = [
  { id: 'agente-reestruturante', nome: 'Agente Reestruturante', categoria: 'composto', ingredientes: ['Erva Verde', 'Fluido Estéril'], teste: 'Medicina DT 12; sem Teste com Medicina Treinada.', tempo: '30 minutos', resultado: 'Produz 1 Agente Reestruturante.', requisito: requisitoMedicina, referencia: ref71 },
  { id: 'composto-necrotico', nome: 'Composto Necrótico', categoria: 'composto', ingredientes: ['Sangue Contaminado', 'Fluido Estéril'], teste: 'Medicina DT 15.', tempo: '1 hora', resultado: 'Produz Composto Necrótico com Dano igual a 1d6 por ponto de Medicina do criador, máximo 10d6.', requisito: 'Requer Coletor para obter Sangue Contaminado; Sala de Descanso ou Kit de Primeiros Socorros. A aplicação exige Injetor.', referencia: ref71 },
  { id: 'calibre-12-incendiario', nome: 'Calibre 12 Incendiário', categoria: 'municao', ingredientes: ['1 dose de Composto Balístico', '1 cartucho Calibre 12'], teste: 'AST DT 15.', tempo: '30 minutos', resultado: 'Produz 1 cartucho Calibre 12 Incendiário; em acerto, aplica Queimadura por 1 turno além do Dano normal.', requisito: requisitoArmamento, referencia: ref72 },
  { id: 'municao-9mm-alto-impacto', nome: 'Munição 9 mm Alto Impacto', categoria: 'municao', ingredientes: ['1 dose de Composto Balístico', '1 cartucho 9 mm'], teste: 'AST DT 18.', tempo: '30 minutos', resultado: 'Produz 1 cartucho 9 mm de Alto Impacto; em acerto, causa +1d6 de Dano.', requisito: requisitoArmamento, referencia: ref72 },
  { id: 'bomba-de-fumaca', nome: 'Bomba de Fumaça', categoria: 'item', ingredientes: ['Composto Balístico', 'Fluido Estéril'], teste: 'AST DT 18.', tempo: '30 minutos', resultado: 'Produz 1 Bomba de Fumaça.', requisito: requisitoArmamento, referencia: ref72 },
  { id: 'estabilizador', nome: 'Estabilizador', categoria: 'item-especial', ingredientes: ['Injetor', 'Erva Azul', 'Fluido Estéril'], teste: 'Medicina DT 12; sem Teste com Medicina Treinada.', tempo: '30 minutos', resultado: 'Produz 1 Estabilizador preparado no Injetor.', requisito: requisitoMedicina, referencia: ref72 },
  { id: 'esteroide', nome: 'Esteroide', categoria: 'item-especial', ingredientes: ['Injetor', 'Erva Amarela', 'Fluido Estéril'], teste: 'Medicina DT 12; sem Teste com Medicina Treinada.', tempo: '30 minutos', resultado: 'Produz 1 Esteroide preparado no Injetor.', requisito: requisitoMedicina, referencia: ref72 },
  { id: 'neurotoxina', nome: 'Neurotoxina', categoria: 'item', ingredientes: ['Erva Azul', 'Fluido Estéril'], teste: 'Medicina DT 12; sem Teste com Medicina Treinada.', tempo: '30 minutos', resultado: 'Produz 1 dose de Neurotoxina.', requisito: requisitoMedicina, referencia: ref72 },
  { id: 'mistura-verde-amarela', nome: 'Verde + Amarela', categoria: 'mistura', ingredientes: ['Erva Verde', 'Erva Amarela'], teste: 'Medicina DT 12; sem Teste com Medicina Treinada.', tempo: '30 minutos', resultado: 'Recupera 1d8 PV e reduz BI em 1d6.', requisito: requisitoMedicina, referencia: ref72 },
  { id: 'mistura-verde-azul', nome: 'Verde + Azul', categoria: 'mistura', ingredientes: ['Erva Verde', 'Erva Azul'], teste: 'Medicina DT 12; sem Teste com Medicina Treinada.', tempo: '30 minutos', resultado: 'Recupera 1d8 PV e remove Intoxicação.', requisito: requisitoMedicina, referencia: ref72 },
  { id: 'mistura-verde-verde', nome: 'Verde + Verde', categoria: 'mistura', ingredientes: ['2× Erva Verde'], teste: 'Medicina DT 12; sem Teste com Medicina Treinada.', tempo: '30 minutos', resultado: 'Recupera 2d8 PV.', requisito: requisitoMedicina, referencia: ref72 },
  { id: 'mistura-verde-verde-verde', nome: 'Verde + Verde + Verde', categoria: 'mistura', ingredientes: ['3× Erva Verde'], teste: 'Medicina DT 12; sem Teste com Medicina Treinada.', tempo: '30 minutos', resultado: 'Recupera 3d8 PV.', requisito: requisitoMedicina, referencia: ref72 },
  { id: 'mistura-verde-vermelha', nome: 'Verde + Vermelha', categoria: 'mistura', ingredientes: ['Erva Verde', 'Erva Vermelha'], teste: 'Medicina DT 12; sem Teste com Medicina Treinada.', tempo: '30 minutos', resultado: 'Recupera 3d8 PV.', requisito: requisitoMedicina, referencia: ref73 },
  { id: 'mistura-verde-vermelha-amarela', nome: 'Verde + Vermelha + Amarela', categoria: 'mistura', ingredientes: ['Erva Verde', 'Erva Vermelha', 'Erva Amarela'], teste: 'Medicina DT 12; sem Teste com Medicina Treinada.', tempo: '30 minutos', resultado: 'Recupera 3d8 PV e reduz BI em 1d6.', requisito: requisitoMedicina, referencia: ref73 },
  { id: 'mistura-verde-vermelha-azul', nome: 'Verde + Vermelha + Azul', categoria: 'mistura', ingredientes: ['Erva Verde', 'Erva Vermelha', 'Erva Azul'], teste: 'Medicina DT 12; sem Teste com Medicina Treinada.', tempo: '30 minutos', resultado: 'Recupera 3d8 PV e remove Intoxicação.', requisito: requisitoMedicina, referencia: ref73 },
];

const porId = new Map(receitas.map(receita => [receita.id, receita]));

function clonar(receita: PerfilReceita): PerfilReceita {
  return { ...receita, ingredientes: [...receita.ingredientes] };
}

/** Catálogo de referência. Não executa Testes, consome ingredientes nem fabrica itens. */
export function listarReceitas(): PerfilReceita[] {
  return receitas.map(clonar);
}

export function consultarReceita(id: string): PerfilReceita | null {
  const receita = porId.get(id);
  return receita ? clonar(receita) : null;
}

export function listarCategoriasReceitas(): CategoriaReceita[] {
  return ['composto', 'municao', 'item', 'item-especial', 'mistura'];
}
