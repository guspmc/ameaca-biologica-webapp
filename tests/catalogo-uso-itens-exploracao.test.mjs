import test from 'node:test';
import assert from 'node:assert/strict';
import { listarItensExploracao } from '../src/catalogoItensExploracao.ts';
import { catalogoUsoItensCompleto, consultarProcedimentoUsoItem, listarProcedimentosUsoItens } from '../src/catalogoUsoItensExploracao.ts';

test('cada item de exploração tem procedimento de uso dentro e fora de combate', () => {
  assert.equal(listarItensExploracao().length, 28);
  assert.equal(listarProcedimentosUsoItens().length, 28);
  assert.equal(catalogoUsoItensCompleto(), true);
  for (const item of listarItensExploracao()) {
    const regra = consultarProcedimentoUsoItem(item.id);
    assert.ok(regra, item.id);
    assert.ok(regra.emCombate.trim(), item.id + ' / combate');
    assert.ok(regra.foraDeCombate.trim(), item.id + ' / fora de combate');
    assert.match(regra.referencia, /Arquivo do Jogador v1\.0/);
  }
});

test('itens com ação definida preservam a economia de combate e os efeitos canônicos', () => {
  assert.match(consultarProcedimentoUsoItem('bomba-de-fumaca').emCombate, /Ação para arremessar/);
  assert.match(consultarProcedimentoUsoItem('granada').emCombate, /Reflexos DT 12/);
  assert.match(consultarProcedimentoUsoItem('mina').emCombate, /Ação Completa/);
  assert.match(consultarProcedimentoUsoItem('neurotoxina').emCombate, /1d4 rodadas/);
  assert.match(consultarProcedimentoUsoItem('estabilizador').emCombate, /Ação Bônus/);
  assert.match(consultarProcedimentoUsoItem('agente-reestruturante').emCombate, /ambas as mãos livres/);
});

test('itens com uso fora de combate dependente da situação não recebem duração inventada', () => {
  assert.match(consultarProcedimentoUsoItem('gazua').foraDeCombate, /tempo depende da situação/);
  assert.match(consultarProcedimentoUsoItem('gazua-profissional').foraDeCombate, /tempo depende da situação/);
  assert.match(consultarProcedimentoUsoItem('coletor').foraDeCombate, /situação apropriada/);
  assert.match(consultarProcedimentoUsoItem('composto-balistico').foraDeCombate, /Não possui efeito isolado/);
  assert.match(consultarProcedimentoUsoItem('spray-primeiros-socorros').foraDeCombate, /não fixa custo de ação/);
});

test('consulta retorna cópia e não altera o catálogo de procedimentos', () => {
  const regra = consultarProcedimentoUsoItem('lanterna-simples');
  regra.emCombate = 'alterado';
  assert.notEqual(consultarProcedimentoUsoItem('lanterna-simples').emCombate, 'alterado');
  assert.equal(consultarProcedimentoUsoItem('item-inexistente'), null);
});
