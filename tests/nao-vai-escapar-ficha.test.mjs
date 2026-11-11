import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');

test('Não Vai Escapar só aparece quando a Habilidade está ativa', () => {
  assert.match(painel, /habilidadesAtivas\.includes\('nao-vai-escapar'\) && <div/);
  assert.match(ficha, /habilidadesAtivas=\{habilidadesAtivasIds\}/);
});

test('Não Vai Escapar exige confirmação de provocação para você/aliado e combate Corpo a Corpo', () => {
  assert.match(painel, /provocou Ataque de Oportunidade para mim ou para um aliado/);
  assert.match(painel, /gatilho ocorreu em combate Corpo a Corpo/);
  assert.match(painel, /avaliarNaoVaiEscapar/);
  assert.match(painel, /registrarNaoVaiEscapar/);
});

test('A interface informa deslocamento de até 3 m e término adjacente sem simular movimento', () => {
  assert.match(painel, /Desloque-se até 3 m e termine adjacente antes do Ataque/);
  assert.match(painel, /deslocamento não provoca Ataques de Oportunidade/);
});
