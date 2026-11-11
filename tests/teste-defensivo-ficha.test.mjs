import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolverTesteDefensivo } from '../src/reacoesCombate.ts';

const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');

test('Esquiva compara Reflexos com o resultado total do Ataque recebido', () => {
  const resultado = resolverTesteDefensivo({
    tipo: 'esquivar', valorReflexos: 5, resultadoAtaque: 14, dado1: 9,
  });
  assert.equal(resultado.total, 14);
  assert.equal(resultado.dt, 14);
  assert.equal(resultado.estado, 'sucesso');
});

test('Desvantagem usa o pior de dois d20 no Teste defensivo', () => {
  const resultado = resolverTesteDefensivo({
    tipo: 'esquivar', valorReflexos: 5, resultadoAtaque: 14,
    dado1: 17, dado2: 4, vantagem: 'desvantagem',
  });
  assert.equal(resultado.dadoEscolhido, 4);
  assert.equal(resultado.total, 9);
  assert.equal(resultado.estado, 'falha');
});

test('Aparar e Esquivar usam as Perícias próprias, sem duplicar Atributo', () => {
  assert.equal(resolverTesteDefensivo({
    tipo: 'aparar', valorLuta: 6, resultadoAtaque: 15, dado1: 9,
  }).total, 15);
  assert.equal(resolverTesteDefensivo({
    tipo: 'esquivar', valorReflexos: 4, resultadoAtaque: 15, dado1: 9,
  }).total, 13);
});

test('A interface permite solicitar o cálculo em qualquer modo e respeita o método de dados', () => {
  assert.match(painel, /esta rolagem só acontece após sua solicitação/);
  assert.doesNotMatch(painel, /modo === 'automatico' &&/);
  assert.match(painel, /sortearDados\(desvantagem \? 2 : 1, 20\)/);
  assert.match(painel, /validarResultadosFisicos/);
  assert.match(painel, /modoDados === 'mistos'/);
  assert.match(painel, /modoDados === 'virtuais'/);
  assert.match(ficha, /valorBasePericia\('Reflexos'/);
  assert.match(ficha, /desvantagemBI=\{faseBi\.desvantagemAtaquesETestes === true\}/);
});

test('O cálculo defensivo não altera recursos, Defesa, Dano ou Condições', () => {
  assert.match(painel, /resolverTesteDefensivo/);
  assert.match(painel, /não altera Defesa, Dano, BI ou Condições/);
  assert.doesNotMatch(painel, /aoSalvar\(\{[^}]*resultadoDefensivo/s);
});


test('Resultado automático de Esquiva atualiza a confirmação usada por Retaliação e Contra-Ataque', () => {
  assert.match(painel, /setConfirmouDefesaBemSucedida\(resolvido\.estado === 'sucesso' \|\| resolvido\.estado === 'critico-sucesso'\)/);
  assert.match(painel, /defesaBemSucedida: confirmouDefesaBemSucedida/);
});
