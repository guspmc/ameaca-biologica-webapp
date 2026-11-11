import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
const usos = await readFile(new URL('../src/UsosDescansoCompletoLocal.tsx', import.meta.url), 'utf8');

test('Mercenário registra Reação e uso por Descanso Completo na mesma gravação', () => {
  assert.match(painel, /avaliarRespostaMercenario/);
  assert.match(painel, /registrarRespostaMercenario/);
  assert.match(painel, /registrarUsoDescansoCompleto\(usosDescanso, 'origem:mercenario'/);
  assert.match(painel, /usosDescansoCompleto: usoAtualizado/);
  assert.match(painel, /arma de fogo carregada/);
  assert.match(painel, /você não fica Surpreendido/);
  assert.match(painel, /Ataque manualmente/);
});

test('uso do Mercenário não pode ser consumido sem registrar a Reação no Painel de Combate', () => {
  assert.match(usos, /fonte\.chave === 'origem:mercenario'/);
  assert.match(usos, /registrado junto com a Reação no Painel de Combate/);
});
