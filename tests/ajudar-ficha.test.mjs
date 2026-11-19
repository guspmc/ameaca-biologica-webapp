import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
test('Painel de Manobras não contém controles genéricos de SA', () => {
  assert.ok(!painel.includes('salvarSA(-1'));
  assert.ok(!painel.includes('salvarSA(1'));
  assert.ok(!painel.includes('Registrar Ajudar'));
});
test('Ajustes manuais de SA ficam na barra de recursos do topo', () => {
  assert.ok(ficha.includes('ficha-local-recursos-sticky'));
  assert.ok(ficha.includes('Diminuir 1 SA'));
  assert.ok(ficha.includes('Aumentar 1 SA'));
  assert.ok(ficha.includes('PainelAcoesLocal dados={dados} saAtual={recursosAtuais.saAtual}'));
});
