import test from 'node:test';
import assert from 'node:assert/strict';
import { fichaContinuaSendoAlvo, sessaoContinuaSendoAtual } from '../src/fichaContinuaSendoAlvo.ts';

const alvo = { mesaId: 'mesa-a', personagemId: 'personagem-a' };
const ficha = {
  mesa: { id: 'mesa-a', role: 'jogador' },
  personagem: { id: 'personagem-a' },
};

test('aceita somente a ficha de jogador que continua aberta no mesmo alvo', () => {
  assert.equal(fichaContinuaSendoAlvo(ficha, alvo), true);
  assert.equal(fichaContinuaSendoAlvo(null, alvo), false);
  assert.equal(fichaContinuaSendoAlvo({ ...ficha, mesa: { ...ficha.mesa, role: 'mestre' } }, alvo), false);
  assert.equal(fichaContinuaSendoAlvo({ ...ficha, mesa: { ...ficha.mesa, id: 'mesa-b' } }, alvo), false);
  assert.equal(fichaContinuaSendoAlvo({ ...ficha, personagem: { id: 'personagem-b' } }, alvo), false);
});

test('descarta resposta tardia se a sessão ou a geração não for válida', () => {
  assert.equal(sessaoContinuaSendoAtual(4, 4), true);
  assert.equal(sessaoContinuaSendoAtual(5, 4), false);
  assert.equal(sessaoContinuaSendoAtual(4, 5), false);
  assert.equal(sessaoContinuaSendoAtual(Number.NaN, 4), false);
  assert.equal(sessaoContinuaSendoAtual(4, Number.POSITIVE_INFINITY), false);
  assert.equal(sessaoContinuaSendoAtual('4', 4), false);
});
