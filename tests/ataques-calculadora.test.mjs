import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ui = await readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
const pericias = await readFile(new URL('../src/pericias.ts', import.meta.url), 'utf8');

test('calculadora oferece Ataque Corpo a Corpo com Luta e Ataque à distância com Pontaria', () => {
  assert.match(ui, /ataque-corpo/);
  assert.match(ui, /ataque-distancia/);
  assert.match(ui, /const periciaEfetiva = tipo === 'ataque-corpo' \? 'Luta' : tipo === 'ataque-distancia' \? 'Pontaria'/);
  assert.match(ui, /Ataque Corpo a Corpo: 1d20 \+ Luta contra a Defesa do alvo/);
  assert.match(ui, /Ataque à distância: 1d20 \+ Pontaria contra a Defesa do alvo/);
});

test('modo de Ataque usa Defesa do alvo e mantém os resultados críticos oficiais', () => {
  assert.match(ui, /Defesa do alvo/);
  assert.match(ui, /20 natural: acerto automático e Crítico/);
  assert.match(ui, /1 natural: Falha Crítica e aplica Exposto/);
});

test('calculadora não rola dados nem aplica Dano automaticamente', () => {
  assert.match(ui, /sortearDados/);
  assert.match(ui, /Cada rolagem exige comando explícito/);
  assert.match(ui, /não altera dados da personagem/);
  assert.doesNotMatch(ui, /salvarPatchPersonagem|localStorage|aoSalvar/);
  assert.match(ui, /O cálculo de Dano depende da arma equipada e permanece manual/);
  assert.doesNotMatch(ui, /Math\.random|crypto\.getRandomValues/);
});

test('Ataques usam os Atributos oficiais associados a Luta e Pontaria', () => {
  assert.match(pericias, /Luta:\s*'forca'/);
  assert.match(pericias, /Pontaria:\s*'agilidade'/);
});
