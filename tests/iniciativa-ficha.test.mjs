import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ficha = readFileSync(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
const roladores = readFileSync(new URL('../src/RoladoresBasicosLocal.tsx', import.meta.url), 'utf8');
test('Ficha exibe Iniciativa como cartão derivado de AGI', () => {
  assert.ok(ficha.includes('<small>INICIATIVA</small>'));
  assert.ok(ficha.includes('+{numero(atributos.agilidade)}'));
  assert.ok(!ficha.includes('MODIFICADOR DE INICIATIVA'));
});
test('rolagem pontual de Iniciativa fica na Ficha somente no modo Automático', () => {
  assert.ok(ficha.includes('RoladoresBasicosLocal modo={configuracaoFuncionamento.modo}'));
  assert.ok(roladores.includes('Iniciativa'));
  assert.ok(roladores.includes('1d20 + AGI'));
});
test('Ficha não administra ordem de turnos ou Encontros', () => {
  assert.ok(!ficha.includes('estadoTurnoCombate'));
  assert.ok(!ficha.includes('carregarEstadoTurnoCombate'));
  assert.ok(!ficha.includes('Iniciar meu turno'));
  assert.ok(!ficha.includes('Encerrar meu turno'));
});
