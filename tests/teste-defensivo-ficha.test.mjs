import test from 'node:test';
import assert from 'node:assert/strict';
import { resolverTesteDefensivo } from '../src/reacoesCombate.ts';
import { readFile } from 'node:fs/promises';

const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');

test('O cálculo de Esquiva continua comparando Reflexos com o resultado total do Ataque', () => {
  const resultado = resolverTesteDefensivo({ tipo: 'esquivar', valorReflexos: 5, resultadoAtaque: 14, dado1: 9 });
  assert.equal(resultado.total, 14);
  assert.equal(resultado.dt, 14);
  assert.equal(resultado.estado, 'sucesso');
});

test('Desvantagem usa o pior de dois d20 no Teste defensivo', () => {
  const resultado = resolverTesteDefensivo({ tipo: 'esquivar', valorReflexos: 5, resultadoAtaque: 14, dado1: 17, dado2: 4, vantagem: 'desvantagem' });
  assert.equal(resultado.dadoEscolhido, 4);
  assert.equal(resultado.total, 9);
  assert.equal(resultado.estado, 'falha');
});

test('Aparar e Esquivar usam as Perícias próprias, sem duplicar Atributo', () => {
  assert.equal(resolverTesteDefensivo({ tipo: 'aparar', valorLuta: 6, resultadoAtaque: 15, dado1: 9 }).total, 15);
  assert.equal(resolverTesteDefensivo({ tipo: 'esquivar', valorReflexos: 4, resultadoAtaque: 15, dado1: 9 }).total, 13);
});

test('A Ficha não mantém painel de cálculo defensivo acoplado a turnos', () => {
  assert.doesNotMatch(painel, /resolverTesteDefensivo|janelaDefensiva|turnoEmAndamento/);
  assert.doesNotMatch(ficha, /estadoTurnoCombate|carregarEstadoTurnoCombate/);
});
