import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');

test('Painel compacto registra o custo de Contra-Ataque sem administrar gatilhos ou turnos', () => {
  assert.match(painel, /nome: 'Contra-Ataque', custo: 1/);
  assert.match(painel, /Após Aparar ou Esquivar com sucesso/);
  assert.doesNotMatch(painel, /prepararContraAtaque|turnoEmAndamento|janela >= 3/);
});

test('Ficha não mantém painel contextual de Contra-Ataque nem controle de Reação', async () => {
  const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(ficha, /valorLuta=.*valorReflexos|estadoTurnoCombate/);
});
