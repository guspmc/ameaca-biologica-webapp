import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const componente = readFileSync(new URL('../src/IniciativaFichaLocal.tsx', import.meta.url), 'utf8');
const ficha = readFileSync(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');

test('calculadora de Iniciativa soma AGI ao resultado natural informado', () => {
  assert.match(componente, /const total = valido \? natural \+ agilidade : null/);
  assert.match(componente, /min="1"/);
  assert.match(componente, /max="20"/);
  assert.match(componente, /Informe um resultado natural inteiro entre 1 e 20/);
});

test('calculadora de Iniciativa não gera rolagem nem altera a ordem do Encontro', () => {
  assert.match(componente, /não realiza a rolagem nem altera a ordem do Encontro/);
  assert.doesNotMatch(componente, /Math\.random|crypto\.getRandomValues/);
});

test('Ficha integra a calculadora com o valor atual de AGI', () => {
  assert.match(ficha, /import IniciativaFichaLocal from '\.\/IniciativaFichaLocal'/);
  assert.match(ficha, /<IniciativaFichaLocal agilidade=\{numero\(atributos\.agilidade\)\} \/>/);
});
