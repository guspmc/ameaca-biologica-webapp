import test from 'node:test';
import assert from 'node:assert/strict';
import {
  consultarReceita,
  listarCategoriasReceitas,
  listarReceitas,
} from '../src/catalogoReceitas.ts';

test('catálogo reúne as 15 receitas e misturas das páginas 71–73', () => {
  const receitas = listarReceitas();
  assert.equal(receitas.length, 15);
  assert.equal(new Set(receitas.map(item => item.id)).size, 15);
  assert.deepEqual(listarCategoriasReceitas(), ['composto', 'municao', 'item', 'item-especial', 'mistura']);
  for (const receita of receitas) {
    assert.ok(receita.nome.trim());
    assert.ok(receita.ingredientes.length > 0);
    assert.ok(receita.teste.trim());
    assert.ok(receita.tempo.trim());
    assert.ok(receita.resultado.trim());
    assert.ok(receita.requisito.trim());
    assert.match(receita.referencia, /Arquivo do Jogador v1\.0, p\. (71|72|73)/);
  }
});

test('receitas de compostos preservam ingredientes, Testes, tempo e requisitos', () => {
  const agente = consultarReceita('agente-reestruturante');
  assert.deepEqual(agente.ingredientes, ['Erva Verde', 'Fluido Estéril']);
  assert.match(agente.teste, /Medicina DT 12/);
  assert.match(agente.teste, /sem Teste com Medicina Treinada/);
  assert.equal(agente.tempo, '30 minutos');

  const necrotico = consultarReceita('composto-necrotico');
  assert.deepEqual(necrotico.ingredientes, ['Sangue Contaminado', 'Fluido Estéril']);
  assert.match(necrotico.teste, /Medicina DT 15/);
  assert.equal(necrotico.tempo, '1 hora');
  assert.match(necrotico.requisito, /Coletor/);
  assert.match(necrotico.requisito, /Injetor/);
});

test('receitas de armamento preservam DTs e requisitos próprios', () => {
  assert.match(consultarReceita('calibre-12-incendiario').teste, /AST DT 15/);
  assert.match(consultarReceita('municao-9mm-alto-impacto').teste, /AST DT 18/);
  assert.match(consultarReceita('bomba-de-fumaca').resultado, /1 Bomba de Fumaça/);
  for (const id of ['calibre-12-incendiario','municao-9mm-alto-impacto','bomba-de-fumaca']) {
    assert.equal(consultarReceita(id).tempo, '30 minutos');
    assert.match(consultarReceita(id).requisito, /Kit de Ferramentas/);
  }
});

test('misturas preservam efeitos de PV, Bio-Infecção e Intoxicação', () => {
  assert.match(consultarReceita('mistura-verde-amarela').resultado, /1d8 PV e reduz BI em 1d6/);
  assert.match(consultarReceita('mistura-verde-azul').resultado, /1d8 PV e remove Intoxicação/);
  assert.match(consultarReceita('mistura-verde-verde').resultado, /2d8 PV/);
  assert.match(consultarReceita('mistura-verde-verde-verde').resultado, /3d8 PV/);
  assert.match(consultarReceita('mistura-verde-vermelha').resultado, /3d8 PV/);
  assert.match(consultarReceita('mistura-verde-vermelha-amarela').resultado, /reduz BI em 1d6/);
  assert.match(consultarReceita('mistura-verde-vermelha-azul').resultado, /remove Intoxicação/);
  for (const receita of listarReceitas().filter(item => item.categoria === 'mistura')) {
    assert.match(receita.teste, /Medicina DT 12/);
    assert.equal(receita.tempo, '30 minutos');
    assert.match(receita.requisito, /Kit de Primeiros Socorros/);
  }
});

test('consulta e listagem clonam ingredientes e não permitem mutar o catálogo interno', () => {
  const receita = consultarReceita('agente-reestruturante');
  receita.ingredientes.push('ingrediente falso');
  assert.equal(consultarReceita('agente-reestruturante').ingredientes.includes('ingrediente falso'), false);
  const lista = listarReceitas();
  lista[0].ingredientes.push('mutação externa');
  assert.equal(consultarReceita(lista[0].id).ingredientes.includes('mutação externa'), false);
  assert.equal(consultarReceita('inexistente'), null);
});
