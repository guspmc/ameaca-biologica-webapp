import test from 'node:test';
import assert from 'node:assert/strict';
import { validarPersonagemLocal } from '../src/validacaoPersonagemLocal.ts';

const base = (dados = { versaoModelo: 1, estadoFicha: 'rascunho' }) => ({
  id: 'claire', geracao: 'geracao-claire', nome: 'Claire Redfield',
  criadoEm: '2026-11-03T10:00:00.000Z',
  atualizadoEm: '2026-11-03T11:00:00.000Z',
  dados,
});

const atributos = { forca: 1, agilidade: 2, vigor: 2, astucia: 2 };

test('aceita rascunho mínimo e seções parciais legítimas', () => {
  assert.equal(validarPersonagemLocal(base()), true);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente' })), true);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', identidade: { apelido: 'Claire' } })), true);
});

test('valida atributos e Perícias com as regras existentes de criação', () => {
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', origem: 'Acadêmico',
    atributos, periciaOrigemTreinada: 'Investigação', periciaOrigemExtra: null,
    distribuicaoPericias: { Percepção: 1 },
  };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, atributos: { ...atributos, vigor: 9 } })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, distribuicaoPericias: { Vontade: 2 } })), false);
});

test('valida Características e compatibilidade entre Classe, Origem e Habilidade', () => {
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', origem: 'Acadêmico',
    armaOperario: '', habilidadeBasica: 'anatomia-de-combate', equipamentoInicial: 'A',
  };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, habilidadeBasica: 'parrudo' })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, equipamentoInicial: 'kit-inexistente' })), false);
});

test('valida compras iniciais usando o simulador de inventário existente', () => {
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', origem: 'Acadêmico',
    atributos, periciaOrigemTreinada: 'Investigação', periciaOrigemExtra: null,
    distribuicaoPericias: {}, armaOperario: '', habilidadeBasica: 'anatomia-de-combate',
    equipamentoInicial: 'C', comprasIniciais: { 'municao-9mm': 1 }, revisaoCompras: 1,
  };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, comprasIniciais: { 'item-desconhecido': 1 } })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, revisaoCompras: -1 })), false);
});

test('valida limites da Identidade e preserva campos desconhecidos JSON válidos', () => {
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho',
    identidade: { apelido: 'Claire', historia: 'x'.repeat(4000), campoFuturo: { valor: 7 } },
    campoFuturoDaFicha: ['preservar', 1, true],
  };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, identidade: { historia: 'x'.repeat(4001) } })), false);
});

test('recusa versões, estados e valores que não podem ser preservados no backup JSON', () => {
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 2, estadoFicha: 'rascunho' })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'ativa' })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', campo: undefined })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', campo: new Date() })), false);
});

test('aceita geração ausente somente no caminho explícito de legado', () => {
  const legado = base();
  delete legado.geracao;
  assert.equal(validarPersonagemLocal(legado), false);
  assert.equal(validarPersonagemLocal(legado, { permitirGeracaoAusente: true }), true);
});
