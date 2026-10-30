import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAVE_LABORATORIO,
  criarEstadoLaboratorio,
  lerLaboratorio,
  salvarLaboratorio,
  gravarRegistroLaboratorio,
  removerRegistroLaboratorio,
  limparLaboratorio,
} from '../src/laboratorioLocal.ts';

function armazenamentoFalso() {
  const dados = new Map();
  return {
    getItem: chave => dados.has(chave) ? dados.get(chave) : null,
    setItem: (chave, valor) => dados.set(chave, valor),
    removeItem: chave => dados.delete(chave),
    dados,
  };
}

const mesa = (id = 'lab-mesa-1') => ({
  id, tipo: 'mesa', nome: 'Mesa Fictícia', atualizadoEm: '2026-10-30T12:00:00.000Z',
  dados: { ficticia: true },
});

test('inicia vazio e marca explicitamente o ambiente como laboratório local', () => {
  const storage = armazenamentoFalso();
  const estado = lerLaboratorio(storage);
  assert.equal(estado.ambiente, 'laboratorio-local');
  assert.equal(estado.versao, 1);
  assert.deepEqual(estado.registros, []);
  assert.equal(storage.getItem(CHAVE_LABORATORIO), null);
});

test('grava e recupera registros após uma nova leitura do armazenamento', () => {
  const storage = armazenamentoFalso();
  gravarRegistroLaboratorio(storage, mesa(), '2026-10-30T12:01:00.000Z');
  const recuperado = lerLaboratorio(storage);
  assert.equal(recuperado.registros.length, 1);
  assert.equal(recuperado.registros[0].nome, 'Mesa Fictícia');
  assert.equal(recuperado.registros[0].dados.ficticia, true);
  assert.equal(recuperado.atualizadoEm, '2026-10-30T12:01:00.000Z');
});

test('atualizar um id substitui o registro em vez de duplicá-lo', () => {
  const storage = armazenamentoFalso();
  gravarRegistroLaboratorio(storage, mesa(), '2026-10-30T12:00:00.000Z');
  gravarRegistroLaboratorio(storage, { ...mesa(), nome: 'Mesa Renomeada' }, '2026-10-30T12:02:00.000Z');
  const estado = lerLaboratorio(storage);
  assert.equal(estado.registros.length, 1);
  assert.equal(estado.registros[0].nome, 'Mesa Renomeada');
});

test('recusa JSON corrompido sem sobrescrever o conteúdo original', () => {
  const storage = armazenamentoFalso();
  storage.setItem(CHAVE_LABORATORIO, '{quebrado');
  assert.throws(() => lerLaboratorio(storage), /corrompidos/);
  assert.equal(storage.getItem(CHAVE_LABORATORIO), '{quebrado');
});

test('recusa versão desconhecida e ids duplicados', () => {
  const storage = armazenamentoFalso();
  storage.setItem(CHAVE_LABORATORIO, JSON.stringify({
    ...criarEstadoLaboratorio(), versao: 99,
  }));
  assert.throws(() => lerLaboratorio(storage), /versão inválidos/);
  const estado = criarEstadoLaboratorio();
  estado.registros = [mesa(), mesa()];
  assert.throws(() => salvarLaboratorio(storage, estado), /inválido/);
});

test('remove um registro específico e permite limpar apenas a chave do laboratório', () => {
  const storage = armazenamentoFalso();
  gravarRegistroLaboratorio(storage, mesa('mesa-1'));
  gravarRegistroLaboratorio(storage, mesa('mesa-2'));
  removerRegistroLaboratorio(storage, 'mesa-1');
  assert.deepEqual(lerLaboratorio(storage).registros.map(r => r.id), ['mesa-2']);
  limparLaboratorio(storage);
  assert.equal(storage.getItem(CHAVE_LABORATORIO), null);
});

test('se o navegador negar gravação, a operação falha em vez de indicar sucesso', () => {
  const storage = {
    getItem: () => null,
    setItem: () => { throw new Error('QuotaExceededError'); },
    removeItem: () => {},
  };
  assert.throws(() => salvarLaboratorio(storage, criarEstadoLaboratorio()), /QuotaExceededError/);
});
