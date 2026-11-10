import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planejarPerdaNivelPorMorte, penalidadePorMorteNivel1, atualizarPenalidadeMorteNivel1 } from '../src/progressaoMorte.ts';

test('Morte no nível 1 mantém o nível e aplica penalidade separada de Condição', () => {
  const plano = planejarPerdaNivelPorMorte(1, []);
  assert.equal(plano.aplicavel, true);
  assert.equal(plano.nivelResultante, 1);
  assert.equal(plano.penalidadeMorteNivel1, true);
  assert.deepEqual(plano.reversoes, []);
  assert.equal(penalidadePorMorteNivel1(true).modificadorTestesAtributoPericiaAtaque, -2);
  assert.equal(penalidadePorMorteNivel1(false).modificadorTestesAtributoPericiaAtaque, 0);
});

test('Morte acima do nível 1 reverte somente os benefícios registrados no nível perdido', () => {
  const beneficios = [
    { nivel: 4, tipo: 'habilidade', habilidadeId: 'finalizacao-a-distancia' },
    { nivel: 4, tipo: 'pericia', pericia: 'Luta', grauAntes: 0, grauDepois: 1 },
  ];
  const plano = planejarPerdaNivelPorMorte(4, beneficios);
  assert.equal(plano.aplicavel, true);
  assert.equal(plano.nivelResultante, 3);
  assert.deepEqual(plano.reversoes, beneficios);
  assert.equal(plano.penalidadeMorteNivel1, false);
});

test('níveis com um único benefício exigem o tipo correto', () => {
  assert.equal(planejarPerdaNivelPorMorte(3, [
    { nivel: 3, tipo: 'atributo', atributo: 'forca', valorAntes: 2, valorDepois: 3 },
  ]).aplicavel, true);
  assert.equal(planejarPerdaNivelPorMorte(6, [
    { nivel: 6, tipo: 'habilidade', habilidadeId: 'retaliacao' },
  ]).aplicavel, true);
  assert.equal(planejarPerdaNivelPorMorte(6, [
    { nivel: 6, tipo: 'atributo', atributo: 'forca', valorAntes: 2, valorDepois: 3 },
  ]).aplicavel, false);
});

test('níveis 4 e 8 exigem reversão tanto da Habilidade quanto do Ponto de Perícia', () => {
  const incompleto = planejarPerdaNivelPorMorte(8, [
    { nivel: 8, tipo: 'habilidade', habilidadeId: 'luta-livre' },
  ]);
  assert.equal(incompleto.aplicavel, false);
  assert.ok(incompleto.pendencias.some(p => p.includes('pericia')));
});

test('histórico ausente, incompleto, duplicado ou malformado bloqueia reversão sem adivinhar', () => {
  assert.equal(planejarPerdaNivelPorMorte(5, null).aplicavel, false);
  assert.equal(planejarPerdaNivelPorMorte(5, []).aplicavel, false);
  assert.equal(planejarPerdaNivelPorMorte(5, [
    { nivel: 5, tipo: 'atributo', atributo: 'forca', valorAntes: 4, valorDepois: 5 },
    { nivel: 5, tipo: 'atributo', atributo: 'agilidade', valorAntes: 1, valorDepois: 2 },
  ]).aplicavel, false);
  assert.equal(planejarPerdaNivelPorMorte(5, [
    { nivel: 4, tipo: 'atributo', atributo: 'forca', valorAntes: 1, valorDepois: 2 },
  ]).aplicavel, false);
});

test('planejamento não altera o histórico de origem', () => {
  const beneficios = [
    { nivel: 2, tipo: 'habilidade', habilidadeId: 'nao-vai-escapar' },
  ];
  planejarPerdaNivelPorMorte(2, beneficios);
  assert.deepEqual(beneficios, [{ nivel: 2, tipo: 'habilidade', habilidadeId: 'nao-vai-escapar' }]);
});

test('penalidade de Morte no nível 1 termina ao recuperar o nível 2', () => {
  assert.equal(atualizarPenalidadeMorteNivel1(true, 1), true);
  assert.equal(atualizarPenalidadeMorteNivel1(true, 2), false);
  assert.equal(atualizarPenalidadeMorteNivel1(false, 1), false);
  assert.throws(() => atualizarPenalidadeMorteNivel1(true, 0), /inválido/);
});

test('nível inválido é recusado', () => {
  assert.equal(planejarPerdaNivelPorMorte(0, []).aplicavel, false);
  assert.equal(planejarPerdaNivelPorMorte(11, []).aplicavel, false);
});

test('a penalidade de Morte no Nível 1 é aplicada ao valor-base de todos os Testes da calculadora', async () => {
  const fs = await import('node:fs/promises');
  const calculadora = await fs.readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
  assert.match(calculadora, /penalidadeMorteNivel1 \? -2 : 0/);
  assert.match(calculadora, /Penalidade por Morte no Nível 1/);
  const ficha = await fs.readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ficha, /penalidadeMorteNivel1=\{penalidadeMorteNivel1\}/);
  assert.match(ficha, /estadoProgressaoPersistenteValido\(ficha\.progressao, classe\)/);
});

test('a calculadora aplica os modificadores da fase de Bio-Infecção e combina Vantagem/Desvantagem', async () => {
  const fs = await import('node:fs/promises');
  const calculadora = await fs.readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
  assert.match(calculadora, /bonusAtaqueBI/);
  assert.match(calculadora, /desvantagemBI/);
  assert.match(calculadora, /vantagem === 'vantagem' \? 'normal' : 'desvantagem'/);
  assert.match(calculadora, /vantagem: vantagemEfetiva/);
  const ficha = await fs.readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ficha, /bonusAtaqueBI=\{faseBi\.bonusTesteAtaque \?\? 0\}/);
  assert.match(ficha, /desvantagemBI=\{faseBi\.desvantagemAtaquesETestes === true\}/);
});
