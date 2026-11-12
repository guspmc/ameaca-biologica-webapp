import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ui = await readFile(new URL('../src/ReanimacaoFichaLocal.tsx', import.meta.url), 'utf8');

test('registro de Reanimação inválido é distinguido de registro ausente', () => {
  assert.match(ui, /const registroReanimacaoPresente = dados\.reanimacao !== null && dados\.reanimacao !== undefined/);
  assert.match(ui, /const registroReanimacaoValido = !registroReanimacaoPresente \|\| reanimacaoValida\(dados\.reanimacao\)/);
  assert.match(ui, /const registroReanimacaoInvalido = !registroReanimacaoValido/);
});

test('registro inválido bloqueia início automático por 0 PV ou Colapso Viral', () => {
  assert.match(ui, /!registroReanimacaoInvalido && recursos\.pvAtual === 0/);
  assert.match(ui, /!registroReanimacaoInvalido && biMaximo > 0 && recursos\.biAtual >= biMaximo/);
  assert.match(ui, /if \(ocupado \|\| bloqueado \|\| registroReanimacaoInvalido\) return/);
  assert.match(ui, /O registro de Reanimação está inválido\. Os dados originais foram preservados/);
  assert.match(ui, /!podeIniciarPV && !podeIniciarColapso && !registroReanimacaoInvalido\) return null/);
});
