import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chaveRemotaVinculo,
  validarVinculoLan,
  atualizarMetadadosVinculoLan,
} from '../src/persistenciaFicha.ts';

const vinculoValido = () => ({
  localId: 'local-uuid-1',
  accountId: 'conta-1',
  mesaId: 'mesa-1',
  personagemId: 'a'.repeat(32),
  remoteKey: chaveRemotaVinculo('conta-1', 'mesa-1', 'a'.repeat(32)),
  baseRevision: 4,
  syncState: 'pendente',
  pendingOperation: {
    operationId: 'op-1',
    payloadHash: 'sha256:abc123',
    baseRevision: 4,
    localVersion: 7,
  },
});

test('valida vínculo explícito e operação pendente permitida', () => {
  assert.equal(validarVinculoLan(vinculoValido()), true);
});

test('remoteKey é determinística e não aceita associação divergente', () => {
  const a = chaveRemotaVinculo('conta:1', 'mesa', 'a'.repeat(32));
  const b = chaveRemotaVinculo('conta', '1:mesa', 'a'.repeat(32));
  assert.notEqual(a, b);

  const vinculo = vinculoValido();
  vinculo.remoteKey = 'personagem:Claire';
  assert.equal(validarVinculoLan(vinculo), false);
});

test('recusa ID remoto fora do formato hexadecimal de 32 caracteres', () => {
  const vinculo = vinculoValido();
  vinculo.personagemId = 'Claire';
  assert.equal(validarVinculoLan(vinculo), false);
});

test('recusa estados, revisões e propriedades não previstas', () => {
  const estadoInvalido = vinculoValido();
  estadoInvalido.syncState = 'sincronizando';
  assert.equal(validarVinculoLan(estadoInvalido), false);

  const revisaoInvalida = vinculoValido();
  revisaoInvalida.baseRevision = -1;
  assert.equal(validarVinculoLan(revisaoInvalida), false);

  const propriedadeExtra = vinculoValido();
  propriedadeExtra.accessToken = 'nao-pode-ser-persistido';
  assert.equal(validarVinculoLan(propriedadeExtra), false);
});

test('recusa operação pendente incompleta e snapshot de conflito malformado', () => {
  const operacaoInvalida = vinculoValido();
  operacaoInvalida.pendingOperation.operationId = '';
  assert.equal(validarVinculoLan(operacaoInvalida), false);

  const snapshotInvalido = vinculoValido();
  snapshotInvalido.snapshotLanConflito = {
    name: 'Claire',
    data: {},
    revision: -2,
  };
  assert.equal(validarVinculoLan(snapshotInvalido), false);
});

test('vínculo sem credenciais e sem operação pendente também é válido', () => {
  const vinculo = vinculoValido();
  delete vinculo.pendingOperation;
  vinculo.syncState = 'sincronizado';
  assert.equal(validarVinculoLan(vinculo), true);
});


test('atualização de metadados preserva toda a identidade do vínculo', () => {
  const atual = vinculoValido();
  const remoteKey = atual.remoteKey;
  const atualizado = atualizarMetadadosVinculoLan(atual, remoteKey, {
    baseRevision: 5,
    syncState: 'sincronizado',
  });
  assert.equal(atualizado.localId, atual.localId);
  assert.equal(atualizado.accountId, atual.accountId);
  assert.equal(atualizado.mesaId, atual.mesaId);
  assert.equal(atualizado.personagemId, atual.personagemId);
  assert.equal(atualizado.remoteKey, remoteKey);
  assert.equal(atualizado.baseRevision, 5);
  assert.equal(atualizado.syncState, 'sincronizado');
  assert.equal(atualizado.pendingOperation, undefined);
});

test('recusa atualização quando a identidade remota esperada diverge', () => {
  const atual = vinculoValido();
  assert.throws(
    () => atualizarMetadadosVinculoLan(atual, 'outra-chave', {
      baseRevision: 5,
      syncState: 'sincronizado',
    }),
    /identidade do vínculo mudou/,
  );
});

test('metadados não permitem acrescentar credenciais ou reatribuir identidade', () => {
  const atual = vinculoValido();
  const atualizado = atualizarMetadadosVinculoLan(atual, atual.remoteKey, {
    baseRevision: 4,
    syncState: 'pendente',
    accountId: 'outra-conta',
    personagemId: 'b'.repeat(32),
    accessToken: 'nao-persistir',
  });
  assert.equal(atualizado.accountId, 'conta-1');
  assert.equal(atualizado.personagemId, 'a'.repeat(32));
  assert.equal('accessToken' in atualizado, false);
});
