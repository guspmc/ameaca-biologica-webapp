import test from 'node:test';
import assert from 'node:assert/strict';
import {
  catalogoAtaquesUniversaisCompleto,
  consultarProcedimentoAtaqueUniversal,
  listarProcedimentosAtaquesUniversais,
} from '../src/catalogoProcedimentosAtaquesUniversais.ts';

test('catálogo universal contém Arma Improvisada e Ataque Desarmado', () => {
  assert.equal(catalogoAtaquesUniversaisCompleto(), true);
  assert.deepEqual(
    listarProcedimentosAtaquesUniversais().map(item => item.id).sort(),
    ['arma-improvisada', 'ataque-desarmado'],
  );
});

test('Arma Improvisada preserva dano, uso único, proibição de Aparar e alcance da página 52', () => {
  const item = consultarProcedimentoAtaqueUniversal('arma-improvisada');
  assert.equal(item.danoCorpo, '1d6 + FOR');
  assert.equal(item.danoArremesso, '1d6 + AGI');
  assert.equal(item.multiplicadorCritico, 2);
  assert.equal(item.maos, '1/2');
  assert.equal(item.durabilidade, '0');
  assert.equal(item.alcance, 'Versátil');
  const texto = item.emCombate.join(' ');
  assert.match(texto, /único golpe desesperado/);
  assert.match(texto, /não pode Aparar/);
  assert.match(texto, /Após o Ataque, quebra, perde-se ou deixa de ser adequada/);
});

test('Ataque Desarmado preserva dano, Desvantagem padrão, uso com mãos ocupadas e alcance', () => {
  const item = consultarProcedimentoAtaqueUniversal('ataque-desarmado');
  assert.equal(item.danoCorpo, '1d4 + FOR');
  assert.equal(item.danoArremesso, undefined);
  assert.equal(item.multiplicadorCritico, 3);
  assert.equal(item.alcance, 'Curto');
  const texto = item.emCombate.join(' ');
  assert.match(texto, /Desvantagem, salvo Habilidade ou efeito/);
  assert.match(texto, /mesmo com as mãos ocupadas/);
});

test('consulta devolve cópia das instruções e não permite alterar o catálogo', () => {
  const item = consultarProcedimentoAtaqueUniversal('ataque-desarmado');
  item.emCombate.push('texto adulterado');
  assert.equal(
    consultarProcedimentoAtaqueUniversal('ataque-desarmado').emCombate.includes('texto adulterado'),
    false,
  );
});
