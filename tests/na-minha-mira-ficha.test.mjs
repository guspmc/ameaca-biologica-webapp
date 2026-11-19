import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
test('Painel de Manobras não controla Ataques de Oportunidade por rodada', () => {
  assert.ok(!painel.includes("na-minha-mira"));
  assert.ok(!painel.includes('ainda não usei Na Minha Mira nesta rodada'));
  assert.ok(!painel.includes('registrarNaMinhaMira'));
  assert.ok(!painel.includes('turnoEmAndamento'));
});
