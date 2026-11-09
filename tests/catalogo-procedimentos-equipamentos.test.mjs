import test from 'node:test';
import assert from 'node:assert/strict';
import { listarPecasExtras } from '../src/catalogoPecas.ts';
import { listarMunicoes } from '../src/catalogoMunicoes.ts';
import { listarColetes } from '../src/catalogoColetes.ts';
import { catalogoProcedimentosEquipamentosCompleto, consultarProcedimentoEquipamento, listarProcedimentosEquipamentos } from '../src/catalogoProcedimentosEquipamentos.ts';

test('todas as peças, munições e proteções têm procedimentos nos dois contextos', () => {
  const total = listarPecasExtras().length + listarMunicoes().length + listarColetes().length;
  assert.equal(listarProcedimentosEquipamentos().length, total);
  assert.equal(catalogoProcedimentosEquipamentosCompleto(), true);
});

test('instalação de peças preserva tempo, bancada, ausência de Teste e exclusividade', () => {
  const p = consultarProcedimentoEquipamento('peca', 'cano-longo-wolfsbane');
  assert.match(p.foraDeCombate, /30 minutos/);
  assert.match(p.foraDeCombate, /não há Teste/);
  assert.match(p.foraDeCombate, /não pode beneficiar duas armas/);
  assert.match(p.emCombate, /+2 Dados de Dano/);
});

test('munição usa reserva abstrata e respeita regras específicas', () => {
  const m = consultarProcedimentoEquipamento('municao', '9mm');
  assert.match(m.foraDeCombate, /carregadores parcialmente cheios/);
  assert.match(m.foraDeCombate, /retornam à reserva/);
  assert.match(consultarProcedimentoEquipamento('municao', 'cartucho-gm79-acido').emCombate, /Reflexos DT 10/);
  assert.match(consultarProcedimentoEquipamento('municao', 'virotes').emCombate, /recuperados/);
});

test('proteções consolidam Defesa, RD, AGI e interação com BI', () => {
  const leve = consultarProcedimentoEquipamento('protecao', 'colete-balistico-leve');
  assert.match(leve.emCombate, /RD 1/);
  assert.match(leve.emCombate, /BI se restar Dano após a RD/);
  assert.match(consultarProcedimentoEquipamento('protecao', 'colete-balistico-pesado').emCombate, /não é somada à Defesa/);
  assert.match(consultarProcedimentoEquipamento('protecao', 'colete-kendo-0').foraDeCombate, /Item Característico/);
});

test('consulta retorna cópia e rejeita combinação inexistente', () => {
  const p = consultarProcedimentoEquipamento('peca', 'alca');
  p.emCombate = 'alterado';
  assert.notEqual(consultarProcedimentoEquipamento('peca', 'alca').emCombate, 'alterado');
  assert.equal(consultarProcedimentoEquipamento('municao', 'alca'), null);
});
