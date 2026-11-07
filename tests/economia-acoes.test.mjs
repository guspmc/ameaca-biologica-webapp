import { test } from 'node:test';
import assert from 'node:assert/strict';
import { economiaAcoesInicial, consumirRecursoNormal, consumirAcaoCompleta, consumirInteracaoGratuita, comprarRecursoPorEsforco, encerrarTurnoAcoes, saNaJanelaEsforco } from '../src/economiaAcoes.ts';

test('recursos normais são únicos por turno e renovam ao encerrar o turno', () => {
  let estado = economiaAcoesInicial(5);
  estado = consumirRecursoNormal(estado, 'acao');
  estado = consumirRecursoNormal(estado, 'movimento');
  estado = consumirRecursoNormal(estado, 'acaoBonus');
  estado = consumirRecursoNormal(estado, 'reacao');
  assert.throws(() => consumirRecursoNormal(estado, 'acao'), /já foi utilizado/);
  estado = encerrarTurnoAcoes(estado);
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

test('Esforço custa 1 SA para Movimento, Ação Bônus e Reação; 2 SA para Ação', () => {
  let estado = economiaAcoesInicial(5);
  estado = comprarRecursoPorEsforco(estado, 'movimento');
  estado = comprarRecursoPorEsforco(estado, 'acaoBonus');
  assert.equal(estado.saAtual, 3);
  estado = comprarRecursoPorEsforco(estado, 'acao');
  assert.equal(estado.saAtual, 1);
  assert.equal(saNaJanelaEsforco(estado), 4);
});
