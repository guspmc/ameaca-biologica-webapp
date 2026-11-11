import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');

test('Agente de Saúde recebe lembrete de +1d4 ao curar aliado, sem aplicar à própria personagem', () => {
  assert.match(ficha, /origem === 'Agente de Saúde'/);
  assert.match(ficha, /ao curar um aliado com item ou efeito, acrescente \+1d4 aos Dados de Cura/);
  assert.match(ficha, /O benefício não se aplica à própria personagem/);
  assert.match(ficha, /ficha correspondente/);
});
