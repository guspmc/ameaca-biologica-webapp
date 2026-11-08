import test from 'node:test';
import assert from 'node:assert/strict';
import {
  consultarItemExploracao,
  listarCategoriasItensExploracao,
  listarItensExploracao,
} from '../src/catalogoItensExploracao.ts';

test('catálogo reúne os itens de exploração e consumíveis descritos nas páginas 67–71', () => {
  const itens = listarItensExploracao();
  assert.equal(itens.length, 27);
  assert.equal(new Set(itens.map(item => item.id)).size, 27);
  assert.deepEqual(listarCategoriasItensExploracao(), [
    'iluminacao',
    'consumivel',
    'ingrediente',
    'ferramenta',
    'explosivo',
    'equipamento-caracteristico',
    'moeda',
  ]);
  for (const item of itens) {
    assert.ok(item.nome.trim());
    assert.ok(item.uso.trim());
    assert.ok(item.efeito.trim());
    assert.ok(item.aquisicao.trim());
    assert.match(item.referencia, /Arquivo do Jogador v1\.0, p\. (67|68|69|70|71)/);
  }
});

test('lanternas preservam alcance, Espaço e limitações de uso', () => {
  assert.match(consultarItemExploracao('lanterna-simples').efeito, /Cone de 12 m/);
  assert.match(consultarItemExploracao('lanterna-grande').observacoes.join(' '), /não permite Mirar/);
  assert.match(consultarItemExploracao('lanterna-de-bolso').observacoes.join(' '), /Sempre Equipada/);
  assert.match(consultarItemExploracao('lanterna-de-cabeca').efeito, /Vantagem ao Mirar/);
});

test('consumíveis e explosivos preservam seus efeitos e procedimentos', () => {
  assert.match(consultarItemExploracao('spray-primeiros-socorros').efeito, /3d8 PV/);
  assert.match(consultarItemExploracao('esteroide').efeito, /2d8 PV Temporários/);
  const agente = consultarItemExploracao('agente-reestruturante');
  assert.match(agente.efeito, /Reimplanta automaticamente/);
  assert.doesNotMatch(agente.efeito, /recupera 2d8 PV/);
  assert.match(agente.observacoes.join(' '), /Vontade DT 15/);
  assert.match(consultarItemExploracao('neurotoxina').efeito, /Fortitude DT 12/);
  assert.match(consultarItemExploracao('granada').efeito, /4d6/);
  assert.match(consultarItemExploracao('mina').observacoes.join(' '), /Não distingue aliados/);
  assert.match(consultarItemExploracao('bomba-de-fumaca').efeito, /1d4 \+ 1 rodadas/);
});

test('ingredientes e equipamentos característicos mantêm suas distinções', () => {
  assert.equal(consultarItemExploracao('erva-verde').categoria, 'ingrediente');
  assert.match(consultarItemExploracao('composto-balistico').efeito, /Não possui efeito isolado/);
  assert.match(consultarItemExploracao('sangue-contaminado').aquisicao, /Coletor/);
  assert.match(consultarItemExploracao('kit-de-ferramentas').efeito, /não pode ser descartado/);
  assert.match(consultarItemExploracao('kit-de-primeiros-socorros').uso, /Receita ou Habilidade/);
  assert.match(consultarItemExploracao('gazua').efeito, /descartada/);
  assert.match(consultarItemExploracao('gazua-profissional').efeito, /reutilizável/);
});

test('consulta e listagem clonam observações e não permitem mutar o catálogo interno', () => {
  const item = consultarItemExploracao('erva-verde');
  item.observacoes.push('mutação externa');
  assert.equal(consultarItemExploracao('erva-verde').observacoes.includes('mutação externa'), false);
  const lista = listarItensExploracao();
  lista[0].observacoes.push('outra mutação');
  assert.equal(consultarItemExploracao(lista[0].id).observacoes.includes('outra mutação'), false);
  assert.equal(consultarItemExploracao('inexistente'), null);
});
