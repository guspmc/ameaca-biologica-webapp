import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
const usos = await readFile(new URL('../src/UsosDescansoCompletoLocal.tsx', import.meta.url), 'utf8');
test('Painel compacto não registra Reações ou usos limitados por rodada', () => {
  assert.ok(!painel.includes('avaliarRespostaMercenario'));
  assert.ok(!painel.includes('registrarRespostaMercenario'));
  assert.ok(!painel.includes('turnoEmAndamento'));
});
test('limites de uso do Mercenário permanecem no módulo de Descanso Completo', () => {
  assert.ok(usos.includes("origem:mercenario"));
});
