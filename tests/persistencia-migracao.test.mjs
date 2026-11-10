import { test } from 'node:test';
import assert from 'node:assert/strict';

function instalarIndexedDBComBancoV1(registrosIniciais, versaoInicial = 1) {
  const registros = new Map(registrosIniciais.map(item => [item.id, structuredClone(item)]));
  let versaoBanco = versaoInicial;
  const stores = new Set(['personagens']);
  let indiceRemotoUnico = false;

  const store = {
    openCursor() {
      let callbackSucesso = null;
      const requisicao = { result: null, onerror: null };
      Object.defineProperty(requisicao, 'onsuccess', {
        get() { return callbackSucesso; },
        set(callback) { callbackSucesso = callback; },
      });
      const ids = [...registros.keys()];
      let indice = 0;
      function avancar() {
        setImmediate(() => {
          if (indice >= ids.length) {
            cursorConcluido = true;
            requisicao.result = null;
            requisicao.onsuccess?.();
            return;
          }
          const id = ids[indice];
          requisicao.result = {
            value: structuredClone(registros.get(id)),
            update(valor) { registros.set(id, structuredClone(valor)); },
            continue() { indice += 1; avancar(); },
          };
          requisicao.onsuccess?.();
        });
      }
      avancar();
      return requisicao;
    },
    getAll() {
      const requisicao = { result: null, onsuccess: null, onerror: null };
      setImmediate(() => {
        requisicao.result = [...registros.values()].map(item => structuredClone(item));
        requisicao.onsuccess?.();
      });
      return requisicao;
    },
  };

  const banco = {
    onversionchange: null,
    objectStoreNames: { contains: nome => stores.has(nome) },
    createObjectStore(nome, opcoes) {
      stores.add(nome);
      return {
        keyPath: opcoes.keyPath,
        createIndex(nomeIndice, campo, configuracao) {
          if (nome === 'vinculosLan' && nomeIndice === 'remoteKey'
            && campo === 'remoteKey' && configuracao.unique === true) indiceRemotoUnico = true;
        },
      };
    },
    close() {},
    transaction() {
      const transacao = {
        error: null, onabort: null, onerror: null,
        objectStore: () => store,
      };
      Object.defineProperty(transacao, 'oncomplete', {
        set(callback) { setImmediate(() => callback?.()); },
      });
      return transacao;
    },
  };

  globalThis.indexedDB = {
    open(_nome, versaoSolicitada) {
      const requisicao = {
        result: banco, transaction: { objectStore: () => store },
        error: null, onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null,
      };
      if (versaoSolicitada > versaoBanco) {
        const versaoAntiga = versaoBanco;
        versaoBanco = versaoSolicitada;
        setImmediate(() => {
          requisicao.onupgradeneeded?.({ oldVersion: versaoAntiga });
          // O sucesso só é disparado depois que o cursor da migração termina.
          const aguardarCursor = () => {
            if (cursorConcluido) requisicao.onsuccess?.();
            else setImmediate(aguardarCursor);
          };
          aguardarCursor();
        });
      } else {
        setImmediate(() => requisicao.onsuccess?.());
      }
      return requisicao;
    },
  };

  let cursorConcluido = false;
  const abrirCursorOriginal = store.openCursor;
  store.openCursor = () => {
    const pedido = abrirCursorOriginal();
    const sucessoOriginal = () => {};
    pedido.onsuccess = evento => {
      if (pedido.result === null) cursorConcluido = true;
      sucessoOriginal(evento);
    };
    return pedido;
  };

  return { registros, stores, indiceRemotoUnico: () => indiceRemotoUnico };
}

test('migração v1 para v3 preserva fichas, cria store LAN e atribui geração às fichas antigas', async () => {
  const fake = instalarIndexedDBComBancoV1([
    {
      id: 'sem-geracao', nome: 'Claire',
      criadoEm: '2026-11-01T10:00:00.000Z',
      atualizadoEm: '2026-11-02T10:00:00.000Z',
      dados: { estadoFicha: 'rascunho' },
    },
    {
      id: 'geracao-vazia', geracao: '   ', nome: 'Jill',
      criadoEm: '2026-11-01T10:00:00.000Z',
      atualizadoEm: '2026-11-02T10:00:00.000Z',
      dados: { estadoFicha: 'rascunho' },
    },
    {
      id: 'geracao-existente', geracao: 'geracao-preservada', nome: 'Rebecca',
      criadoEm: '2026-11-01T10:00:00.000Z',
      atualizadoEm: '2026-11-02T10:00:00.000Z',
      dados: { estadoFicha: 'rascunho' },
    },
  ]);
  const persistencia = await import('../src/persistenciaFicha.ts?teste-migracao-v1-v2');

  const fichas = await persistencia.listarPersonagens();
  const porId = new Map(fichas.map(ficha => [ficha.id, ficha]));

  assert.equal(persistencia.VERSAO_BANCO_FICHA, 3);
  assert.ok(fake.stores.has('personagens'));
  assert.ok(fake.stores.has('vinculosLan'));
  assert.equal(fake.indiceRemotoUnico(), true);
  assert.equal(typeof porId.get('sem-geracao').geracao, 'string');
  assert.ok(porId.get('sem-geracao').geracao.trim().length > 0);
  assert.equal(typeof porId.get('geracao-vazia').geracao, 'string');
  assert.ok(porId.get('geracao-vazia').geracao.trim().length > 0);
  assert.notEqual(porId.get('sem-geracao').geracao, porId.get('geracao-vazia').geracao);
  assert.equal(porId.get('geracao-existente').geracao, 'geracao-preservada');
  assert.ok([...fake.registros.values()].every(ficha => typeof ficha.geracao === 'string' && ficha.geracao.trim().length > 0));
});


test('migração v2 para v3 cria somente o store de vínculos e preserva a ficha existente', async () => {
  const fichaOriginal = {
    id: 'ficha-v2', geracao: 'geracao-v2', nome: 'Claire',
    criadoEm: '2026-11-01T10:00:00.000Z',
    atualizadoEm: '2026-11-02T10:00:00.000Z',
    dados: { classe: 'Operador', recursos: { pv: 12 } },
  };
  const fake = instalarIndexedDBComBancoV1([fichaOriginal], 2);
  const persistencia = await import('../src/persistenciaFicha.ts?teste-migracao-v2-v3');

  const fichas = await persistencia.listarPersonagens();
  assert.equal(persistencia.VERSAO_BANCO_FICHA, 3);
  assert.deepEqual(fichas, [fichaOriginal]);
  assert.deepEqual([...fake.registros.values()], [fichaOriginal]);
  assert.ok(fake.stores.has('personagens'));
  assert.ok(fake.stores.has('vinculosLan'));
  assert.equal(fake.indiceRemotoUnico(), true);
});
