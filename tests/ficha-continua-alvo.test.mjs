import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fichaContinuaSendoAlvo, sessaoContinuaSendoAtual } from '../src/fichaContinuaSendoAlvo.ts';

const alvo = { mesaId: 'mesa-a', personagemId: 'personagem-a' };
const ficha = {
  mesa: { id: 'mesa-a', role: 'jogador' },
  personagem: { id: 'personagem-a' },
};

test('resposta tardia só pode atualizar a ficha ainda aberta no mesmo contexto', () => {
  assert.equal(fichaContinuaSendoAlvo(ficha, alvo), true);
});

test('resposta tardia é descartada depois do encerramento da sessão', () => {
  assert.equal(fichaContinuaSendoAlvo(null, alvo), false);
});

test('resposta tardia não migra para outra personagem ou Mesa', () => {
  assert.equal(fichaContinuaSendoAlvo({
    mesa: { id: 'mesa-b', role: 'jogador' },
    personagem: { id: 'personagem-a' },
  }, alvo), false);
  assert.equal(fichaContinuaSendoAlvo({
    mesa: { id: 'mesa-a', role: 'jogador' },
    personagem: { id: 'personagem-b' },
  }, alvo), false);
});

test('resposta tardia é descartada se o papel na Mesa deixar de ser jogador', () => {
  assert.equal(fichaContinuaSendoAlvo({
    mesa: { id: 'mesa-a', role: 'mestre' },
    personagem: { id: 'personagem-a' },
  }, alvo), false);
});

test('resposta só pertence à mesma geração de sessão', () => {
  assert.equal(sessaoContinuaSendoAtual(3, 3), true);
  assert.equal(sessaoContinuaSendoAtual(4, 3), false);
  assert.equal(sessaoContinuaSendoAtual(3, 4), false);
  assert.equal(sessaoContinuaSendoAtual(Number.NaN, 3), false);
});
