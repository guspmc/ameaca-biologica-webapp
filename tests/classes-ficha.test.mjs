import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fonte = await readFile(new URL('../src/classesFicha.ts', import.meta.url), 'utf8');

test('mantém fórmulas oficiais de PV, BI, SA e Pontos de Perícia', () => {
  for (const trecho of [
    "pvPorNivel: '10 + VIG'", 'biBase: 8', "saMaxima: 'AGI + AST'", 'pontosPericia: 4',
    "pvPorNivel: '8 + VIG'", 'biBase: 10', 'pontosPericia: 5',
    "pvPorNivel: '12 + VIG'", 'biBase: 6', 'pontosPericia: 3',
  ]) assert.ok(fonte.includes(trecho), 'Trecho ausente: ' + trecho);
});

test('mantém três Ramos, proficiências e dois Itens Característicos por Classe', () => {
  assert.equal((fonte.match(/ramos: \[/g) ?? []).length, 3);
  assert.equal((fonte.match(/proficiencias: \[/g) ?? []).length, 3);
  assert.equal((fonte.match(/itensCaracteristicos: \[/g) ?? []).length, 3);
  for (const nome of ['Agente', 'Autodidata', 'Operador']) assert.ok(fonte.includes(nome));
});

test('a consulta de dados de Classe trata valores ausentes sem inventar uma Classe', () => {
  assert.match(fonte, /if \(classe === 'Agente' \|\| classe === 'Autodidata' \|\| classe === 'Operador'\)/);
  assert.match(fonte, /return null;/);
});
