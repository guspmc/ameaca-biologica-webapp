import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
test('Painel de Manobras não rastreia gatilhos de Ataque de Oportunidade por turno', () => {
  assert.ok(!painel.includes("nao-vai-escapar"));
  assert.ok(!painel.includes('avaliarNaoVaiEscapar'));
  assert.ok(!painel.includes('registrarNaoVaiEscapar'));
  assert.ok(!painel.includes('turnoEmAndamento'));
  assert.ok(ficha.includes('PainelAcoesLocal'));
});
