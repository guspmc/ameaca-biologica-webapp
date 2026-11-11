import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');

test('Na Minha Mira aparece somente quando a Habilidade está ativa', () => {
  assert.match(painel, /habilidadesAtivas\.includes\('na-minha-mira'\)/);
});

test('A interface exige confirmação de uso por rodada, percepção, Alcance Médio e nova Condição', () => {
  assert.match(painel, /ainda não usei Na Minha Mira nesta rodada/);
  assert.match(painel, /O inimigo está percebido/);
  assert.match(painel, /até Alcance Médio/);
  assert.match(painel, /nova Condição penalizante ou restritiva/);
});

test('A interface exige arma de fogo empunhada e carregada, além de elegibilidade confirmada', () => {
  assert.match(painel, /arma de fogo empunhada e carregada/);
  assert.match(painel, /arma permite este Ataque de Oportunidade à distância/);
  assert.match(painel, /registrarNaMinhaMira/);
});

test('O painel registra somente a Reação; o Ataque de Oportunidade continua manual', () => {
  assert.match(painel, /Execute o Ataque de Oportunidade à distância manualmente/);
  assert.match(painel, /Na Minha Mira registrado/);
});


test('Na Minha Mira usa a transição validada de Reação e preserva o estado integrado', () => {
  assert.match(painel, /aplicarReacaoCombate\(atual, economiaAtual => registrarNaMinhaMira/);
  assert.doesNotMatch(painel, /comEconomia\(atual, economiaAtual => registrarNaMinhaMira/);
});
