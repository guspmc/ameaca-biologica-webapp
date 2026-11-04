import { test } from 'node:test';
import assert from 'node:assert/strict';

function instalarBancoCompartilhado() {
  const registros = new Map();
  globalThis.indexedDB = {
    open() {
      const pedido = { result: null, onsuccess: null, onerror: null, onblocked: null, onupgradeneeded: null };
      const banco = {
        onversionchange: null,
        objectStoreNames: { contains: () => true },
        close() {},
        transaction() {
          const operacoes = [];
          let abortada = false;
          const tx = {
            error: null, oncomplete: null, onabort: null, onerror: null,
            abort() {
              abortada = true;
              tx.error = new Error('AbortError');
              setImmediate(() => tx.onabort?.());
            },
            objectStore() {
              return {
                get(id) {
                  const req = { result: undefined, onsuccess: null, onerror: null };
                  setImmediate(() => {
                    req.result = registros.has(id) ? structuredClone(registros.get(id)) : undefined;
                    req.onsuccess?.();
                  });
                  return req;
                },
                put(valor) { operacoes.push(() => registros.set(valor.id, structuredClone(valor))); return {}; },
              };
            },
          };
          setImmediate(() => setImmediate(() => {
            if (abortada) return;
            for (const aplicar of operacoes) aplicar();
            tx.oncomplete?.();
          }));
          return tx;
        },
      };
      pedido.result = banco;
      setImmediate(() => pedido.onsuccess?.());
      return pedido;
    },
  };
  return registros;
}

const ficha = {
  id: 'claire', geracao: 'geracao-original', nome: 'Claire',
  criadoEm: '2026-11-01T10:00:00.000Z',
  atualizadoEm: '2026-11-02T10:00:00.000Z',
  dados: { identidade: { apelido: 'Claire' }, atributos: { vigor: 2 } },
};

test('patches de abas distintas preservam alterações em chaves diferentes', async () => {
  const registros = instalarBancoCompartilhado();
  registros.set(ficha.id, structuredClone(ficha));
  const abaA = await import('../src/persistenciaFicha.ts?aba=A');
  const abaB = await import('../src/persistenciaFicha.ts?aba=B');

  await abaA.salvarPatchPersonagem('claire', { identidade: { apelido: 'Redfield' } }, ficha.dados, undefined, undefined, ficha.geracao);
  await abaB.salvarPatchPersonagem('claire', { atributos: { vigor: 3 } }, ficha.dados, undefined, undefined, ficha.geracao);

  const final = registros.get('claire');
  assert.deepEqual(final.dados.identidade, { apelido: 'Redfield' });
  assert.deepEqual(final.dados.atributos, { vigor: 3 });
});

test('patch concorrente na mesma chave é recusado para evitar sobrescrita silenciosa', async () => {
  const registros = instalarBancoCompartilhado();
  registros.set(ficha.id, structuredClone(ficha));
  const abaA = await import('../src/persistenciaFicha.ts?mesma-A');
  const abaB = await import('../src/persistenciaFicha.ts?mesma-B');

  await abaA.salvarPatchPersonagem('claire', { identidade: { apelido: 'Claire Redfield' } }, ficha.dados, undefined, undefined, ficha.geracao);
  await assert.rejects(
    abaB.salvarPatchPersonagem('claire', { identidade: { apelido: 'Claire Valentine' } }, ficha.dados, undefined, undefined, ficha.geracao),
    /alterada em outra aba/,
  );
  assert.deepEqual(registros.get('claire').dados.identidade, { apelido: 'Claire Redfield' });
});


test('patch de uma ficha anterior é recusado após restauração com mesmo ID e mesmos dados', async () => {
  const registros = instalarBancoCompartilhado();
  registros.set(ficha.id, {
    ...structuredClone(ficha),
    geracao: 'geracao-da-restauracao',
  });
  const abaAntiga = await import('../src/persistenciaFicha.ts?geracao-antiga');

  await assert.rejects(
    abaAntiga.salvarPatchPersonagem(
      'claire',
      { identidade: { apelido: 'Alteração da aba antiga' } },
      ficha.dados,
      undefined,
      undefined,
      ficha.geracao,
    ),
    /substituída por uma restauração ou alteração em outra aba/,
  );
  assert.deepEqual(registros.get('claire').dados, ficha.dados);
  assert.equal(registros.get('claire').geracao, 'geracao-da-restauracao');
});
