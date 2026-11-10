import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chaveRemotaVinculo,
  validarVinculoLan,
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
