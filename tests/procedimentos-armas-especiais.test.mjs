import test from 'node:test';
import assert from 'node:assert/strict';
import { consultarProcedimentoArmaEspecial } from '../src/procedimentosArmasEspeciais.ts';

test('RPG-7 apresenta Morte Instantânea e suas exceções sem decidir o destino do alvo', () => {
  const procedimento = consultarProcedimentoArmaEspecial('rpg-7');
  assert.equal(procedimento.titulo, 'RPG-7 — Morte Instantânea');
  assert.match(procedimento.descricao, /Perseguidores, Chefes e criaturas com regra própria/);
  assert.match(procedimento.descricao, /avançar de fase ou sofrer o efeito indicado em sua ficha/);
  assert.match(procedimento.descricao, /após o disparo, fica vazio/);
});

test('Spark Shot apresenta o teste e as duas Condições da falha', () => {
  const procedimento = consultarProcedimentoArmaEspecial('spark-shot');
  assert.equal(procedimento.titulo, 'Spark Shot — efeito elétrico');
  assert.match(procedimento.descricao, /Fortitude DT 15/);
  assert.match(procedimento.descricao, /Atordoado até o fim do próximo turno/);
  assert.match(procedimento.descricao, /Imobilizado por 1d4 rodadas/);
});

test('armas sem procedimento especial dedicado retornam null', () => {
  assert.equal(consultarProcedimentoArmaEspecial('redemption'), null);
  assert.equal(consultarProcedimentoArmaEspecial('besta'), null);
  assert.equal(consultarProcedimentoArmaEspecial('inexistente'), null);
});
