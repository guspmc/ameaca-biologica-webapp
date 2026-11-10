import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sortearDados, validarResultadosFisicos } from '../src/rolagemDados.ts';
import { calcularTesteManual } from '../src/testes.ts';

test('rolagem virtual usa a fonte aleatória fornecida e respeita os lados do dado', () => {
  const valores = [0, 1, 5, 19];
  const resultado = sortearDados(4, 20, () => valores.shift() ?? 0);
  assert.deepEqual(resultado, [1, 2, 6, 20]);
});

test('rolagem rejeita valores fora do universo para evitar viés de módulo', () => {
  const valores = [4294967295, 0];
  assert.deepEqual(sortearDados(1, 20, () => valores.shift() ?? 0), [1]);
});

test('rolagem valida quantidade, tipo de dado e fonte aleatória', () => {
  assert.throws(() => sortearDados(0, 6, () => 0), /quantidade/);
  assert.throws(() => sortearDados(1, 7, () => 0), /Tipo de dado/);
  assert.throws(() => sortearDados(1, 6, () => -1), /fonte aleatória/);
});

test('entrada física exige quantidade e faces válidas', () => {
  assert.deepEqual(validarResultadosFisicos('4, 2 6', 3, 6), [4, 2, 6]);
  assert.throws(() => validarResultadosFisicos('4 2', 3, 6), /exatamente 3/);
  assert.throws(() => validarResultadosFisicos('7', 1, 6), /entre 1 e 6/);
});

test('roladores integrados só são renderizados no modo Automático e não alteram ficha', async () => {
  const ui = await readFile(new URL('../src/RoladoresBasicosLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /if \(modo !== 'automatico'\) return null/);
  assert.match(ui, /nenhum resultado altera os dados da personagem/);
  assert.doesNotMatch(ui, /localStorage|salvarPatchPersonagem|aoSalvar/);
});


test('Testes de Perícia e Atributo respeitam resultado natural, Vantagem e Desvantagem', () => {
  const critico = calcularTesteManual({ valorBase: 2, dt: 25, dado1: 20 });
  assert.equal(critico.estado, 'critico-sucesso');
  const falhaCritica = calcularTesteManual({ valorBase: 10, dt: 10, dado1: 1 });
  assert.equal(falhaCritica.estado, 'falha-critica');
  assert.match(falhaCritica.detalhe, /Exposto/);
  const vantagem = calcularTesteManual({ valorBase: 4, dt: 20, dado1: 8, dado2: 17, vantagem: 'vantagem' });
  assert.equal(vantagem.dadoEscolhido, 17);
  assert.equal(vantagem.total, 21);
  assert.equal(vantagem.estado, 'sucesso');
  const desvantagem = calcularTesteManual({ valorBase: 4, dt: 13, dado1: 8, dado2: 17, vantagem: 'desvantagem' });
  assert.equal(desvantagem.dadoEscolhido, 8);
  assert.equal(desvantagem.total, 12);
  assert.equal(desvantagem.estado, 'falha');
});

test('calculadora integrada exige ação explícita e respeita preferência física/virtual/mista', async () => {
  const ui = await readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /sortearDados\(quantidadeDados, 20\)/);
  assert.match(ui, /validarResultadosFisicos/);
  assert.match(ui, /onClick=\{registrarRolagem\}/);
  assert.match(ui, /modoDados === 'mistos'/);
  assert.match(ui, /não altera dados da personagem/);
  assert.doesNotMatch(ui, /salvarPatchPersonagem|localStorage|aoSalvar/);
});


test('Exposto automático só é solicitado por Falha Crítica em Ataque no fluxo Automático', async () => {
  const calculadora = await readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
  const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(calculadora, /const ehAtaque = tipo === 'ataque-corpo' \|\| tipo === 'ataque-distancia'/);
  assert.match(calculadora, /if \(ehAtaque && resultado\.estado === 'falha-critica' && aoFalharCriticoAtaque\)/);
  assert.match(ficha, /configuracaoFuncionamento\.modo !== 'automatico'/);
  assert.match(ficha, /fonte: 'Falha Crítica em Ataque'/);
  assert.match(ficha, /condicao: 'exposto'/);
  assert.match(ficha, /aoFalharCriticoAtaque=\{registrarExpostoPorFalhaCritica\}/);
});

test('a Falha Crítica não aciona Exposto automático em Teste comum de Perícia ou Atributo', async () => {
  const ui = await readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /const ehAtaque = tipo === 'ataque-corpo' \|\| tipo === 'ataque-distancia'/);
  assert.match(ui, /if \(ehAtaque && resultado\.estado === 'falha-critica'/);
});
