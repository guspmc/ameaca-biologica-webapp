import { test } from 'node:test';
import assert from 'node:assert/strict';

function instalarBanco({ encerrar = 'complete' } = {}) {
  let transacaoCriada;
  let registroGravado;

  globalThis.indexedDB = {
    open() {
      const requisicao = {
        result: null,
        error: null,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        onblocked: null,
      };
      const banco = {
        onversionchange: null,
        objectStoreNames: { contains: () => true },
        close() {},
        transaction() {
          const transacao = {
            error: null,
            oncomplete: null,
            onabort: null,
            onerror: null,
            objectStore() {
              return {
                put(valor) {
                  registroGravado = valor;
                  return {};
                },
              };
            },
          };
          transacaoCriada = transacao;
          return transacao;
        },
      };
      requisicao.result = banco;
      setImmediate(() => requisicao.onsuccess?.());
      return requisicao;
    },
  };

  return {
    concluir() {
      if (encerrar === 'abort') {
        transacaoCriada.error = new Error('Falha simulada na transação');
        transacaoCriada.onabort?.();
      } else {
        transacaoCriada.oncomplete?.();
      }
    },
    registro: () => registroGravado,
  };
}

async function importarPersistencia() {
  return import('../src/persistenciaFicha.ts?gravacao=' + Math.random());
}

const personagem = () => ({
  id: 'personagem-1',
  geracao: 'geracao-personagem-1',
  nome: 'Claire',
  criadoEm: '2026-11-01T10:00:00.000Z',
  atualizadoEm: '2026-11-02T10:00:00.000Z',
  dados: { classe: 'Operador', recursos: { pv: 12 } },
});

test('salvamento só confirma depois que a transação IndexedDB termina', async () => {
  const fake = instalarBanco();
  const persistencia = await importarPersistencia();
  const ficha = personagem();
  let concluiu = false;

  const salvamento = persistencia.salvarPersonagem(ficha).then(() => { concluiu = true; });
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(concluiu, false, 'não pode anunciar salvamento antes do oncomplete');
  assert.deepEqual(fake.registro(), ficha);

  ficha.dados.recursos.pv = 1;
  assert.equal(fake.registro().dados.recursos.pv, 12, 'o registro enviado deve ser uma cópia independente');

  fake.concluir();
  await salvamento;
  assert.equal(concluiu, true);
});

test('falha de transação IndexedDB rejeita o salvamento em vez de confirmar', async () => {
  const fake = instalarBanco({ encerrar: 'abort' });
  const persistencia = await importarPersistencia();
  const salvamento = persistencia.salvarPersonagem(personagem());

  await new Promise(resolve => setImmediate(resolve));
  fake.concluir();

  await assert.rejects(salvamento, /Falha simulada na transação/);
});
