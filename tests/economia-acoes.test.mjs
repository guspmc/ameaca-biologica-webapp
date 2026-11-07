import { test } from 'node:test';
import assert from 'node:assert/strict';
import { economiaAcoesInicial, consumirRecursoNormal, consumirAcaoCompleta, consumirInteracaoGratuita, comprarRecursoPorEsforco, gastarSAEmManobra, iniciarTurnoAcoes, encerrarTurnoAcoes, saNaJanelaEsforco } from '../src/economiaAcoes.ts';

test('recursos normais são únicos por turno e renovam no início do próximo turno', () => {
  let estado = economiaAcoesInicial(5);
  for (const recurso of ['acao', 'movimento', 'acaoBonus', 'reacao']) estado = consumirRecursoNormal(estado, recurso);
  assert.throws(() => consumirRecursoNormal(estado, 'acao'), /já foi utilizado/);
  estado = iniciarTurnoAcoes(estado);
  assert.deepEqual(estado.usados, { acao: 0, movimento: 0, acaoBonus: 0, reacao: 0 });
});

test('Ação Completa consome Ação e Movimento em conjunto', () => {
  const estado = consumirAcaoCompleta(economiaAcoesInicial(3));
  assert.equal(estado.usados.acao, 1);
  assert.equal(estado.usados.movimento, 1);
  assert.throws(() => consumirAcaoCompleta(estado), /Ação e Movimento disponíveis/);
});

test('Interação Gratuita é paralela e não pode ser comprada por Esforço', () => {
  let estado = consumirInteracaoGratuita(economiaAcoesInicial(3));
  estado = consumirRecursoNormal(estado, 'acao');
  assert.throws(() => consumirInteracaoGratuita(estado), /já foi utilizada/);
  assert.throws(() => comprarRecursoPorEsforco(estado, 'interacaoGratuita'), /Recurso não pode/);
});

test('custos de Esforço são 1 SA para Movimento, Ação Bônus e Reação e 2 SA para Ação', () => {
  let estado = economiaAcoesInicial(5);
  estado = comprarRecursoPorEsforco(estado, 'movimento');
  estado = comprarRecursoPorEsforco(estado, 'acaoBonus');
  estado = comprarRecursoPorEsforco(estado, 'reacao');
  assert.equal(estado.saAtual, 2);
  assert.equal(saNaJanelaEsforco(estado), 3);
  assert.throws(() => comprarRecursoPorEsforco(estado, 'acao'), /limite de 3 SA/);
  assert.equal(comprarRecursoPorEsforco(economiaAcoesInicial(2), 'acao').saAtual, 0);
});

test('Manobras também entram no limite de 3 SA da janela', () => {
  let estado = gastarSAEmManobra(economiaAcoesInicial(4));
  estado = comprarRecursoPorEsforco(estado, 'movimento');
  estado = gastarSAEmManobra(estado);
  assert.equal(saNaJanelaEsforco(estado), 3);
  assert.throws(() => gastarSAEmManobra(estado), /limite de 3 SA/);
});

test('início do turno não renova a janela; somente o fim do próximo turno a encerra', () => {
  let estado = comprarRecursoPorEsforco(economiaAcoesInicial(6), 'acao');
  estado = encerrarTurnoAcoes(estado);
  assert.equal(saNaJanelaEsforco(estado), 0);
  estado = gastarSAEmManobra(estado);
  estado = iniciarTurnoAcoes(estado);
  assert.equal(saNaJanelaEsforco(estado), 1);
  estado = comprarRecursoPorEsforco(estado, 'movimento');
  assert.equal(saNaJanelaEsforco(estado), 2);
  estado = encerrarTurnoAcoes(estado);
  assert.equal(saNaJanelaEsforco(estado), 0);
});
