import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');

test('Contra-Ataque exige confirmação de defesa bem-sucedida e do gatilho Corpo a Corpo', () => {
  assert.match(painel, /Confirmo que Aparar ou Esquivar foi bem-sucedido/);
  assert.match(painel, /O Ataque que originou a defesa foi Corpo a Corpo/);
  assert.match(painel, /prepararContraAtaque/);
  assert.match(painel, /economia\\.saAtual < \\(economia\\.normaisUsados\\.reacao/);
});

test('Contra-Ataque Instintivo e Retaliação dependem das Habilidades realmente ativas', () => {
  assert.match(ficha, /habilidadesAtivas=\\{habilidadesAtivasIds\\}/);
  assert.match(painel, /habilidadesAtivas\\.includes\\('contra-ataque-instintivo'\\)/);
  assert.match(painel, /habilidadesAtivas\\.includes\\('retaliacao'\\)/);
  assert.match(painel, /agressor fica Atordoado/);
  assert.match(painel, /acrescenta 1 dado de Dano se acertar/);
});

test('Contra-Ataque não executa o Ataque nem resolve efeitos do alvo', () => {
  assert.match(painel, /não executa o Ataque/);
  assert.match(painel, /Execute o Ataque manualmente/);
});
