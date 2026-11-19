import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
test('Manobras SA ficam em Combate e não há controle de turno ou ajuste SA duplicado', () => {
  assert.ok(ficha.includes('<h3 className="ficha-local-subtitulo">Manobras</h3>'));
  assert.ok(painel.includes("nome: 'Contra-Ataque', custo: 1"));
  assert.ok(painel.includes('Gastar · {manobra.custo} SA'));
  assert.ok(painel.includes('saAtual < manobra.custo || saMaximo < manobra.custo'));
  assert.ok(!painel.includes('salvarSA(-1') && !painel.includes('salvarSA(1'));
  assert.ok(!painel.includes('turnoEmAndamento'));
});
