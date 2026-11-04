import { test } from 'node:test';
import assert from 'node:assert/strict';

function instalarIndexedDB({ bloqueada = false } = {}) {
  const conexoes = [];
  let aberturas = 0;

  globalThis.indexedDB = {
    open() {
      aberturas += 1;
      const requisicao = {
        result: null,
        error: null,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        onblocked: null,
      };
      const banco = {
        fechado: false,
        onversionchange: null,
        objectStoreNames: { contains: () => true },
        transaction() {
          const transacao = {
            oncomplete: null,
            onabort: null,
            onerror: null,
            objectStore() {
              return {
                getAll() {
                  const leitura = { result: [], error: null, onsuccess: null, onerror: null };
                  setImmediate(() => {
                    leitura.onsuccess?.();
                    setImmediate(() => transacao.oncomplete?.());
                  });
                  return leitura;
                },
              };
            },
          };
          return transacao;
        },
        close() { this.fechado = true; },
      };
      requisicao.result = banco;
      conexoes.push(banco);
      setImmediate(() => {
        if (bloqueada) requisicao.onblocked?.();
        setImmediate(() => requisicao.onsuccess?.());
      });
      return requisicao;
    },
  };

  return { conexoes, quantidadeAberturas: () => aberturas };
}

async function importarModulo() {
  return import('../src/persistenciaFicha.ts?teste=' + Math.random());
}

test('versionchange fecha a conexão e permite abrir novamente o banco', async () => {
  const fake = instalarIndexedDB();
  const persistencia = await importarModulo();

  await persistencia.listarPersonagens();
  assert.equal(fake.quantidadeAberturas(), 1);

  fake.conexoes[0].onversionchange();
  assert.equal(fake.conexoes[0].fechado, true);

  await persistencia.listarPersonagens();
  assert.equal(fake.quantidadeAberturas(), 2);
});

test('evento versionchange antigo não invalida uma abertura mais recente', async () => {
  const fake = instalarIndexedDB();
  const persistencia = await importarModulo();

  await persistencia.listarPersonagens();
  persistencia.fecharBancoFicha();
  await persistencia.listarPersonagens();
  assert.equal(fake.quantidadeAberturas(), 2);

  fake.conexoes[0].onversionchange();
  await persistencia.listarPersonagens();
  assert.equal(fake.quantidadeAberturas(), 2);
});

test('uma abertura bloqueada que recebe sucesso tardio fecha a conexão', async () => {
  const fake = instalarIndexedDB({ bloqueada: true });
  const persistencia = await importarModulo();

  await assert.rejects(
    persistencia.listarPersonagens(),
    /O banco local está sendo usado por outra aba/,
  );
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fake.conexoes[0].fechado, true);
});
