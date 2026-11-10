import { test } from 'node:test';
import assert from 'node:assert/strict';

function instalarIndexedDBTransacional() {
  const stores = new Map();
  let banco;

  function criarStore(nome) {
    if (!stores.has(nome)) stores.set(nome, new Map());
    return stores.get(nome);
  }

  function objetoStore(nome, pendencias) {
    const registros = criarStore(nome);
    const opcoes = {
      add(valor) {
        pendencias.push({ tipo: 'add', store: nome, valor: structuredClone(valor) });
        return {};
      },
      put(valor) {
        pendencias.push({ tipo: 'put', store: nome, valor: structuredClone(valor) });
        return {};
      },
      get(chave) {
        const req = { result: undefined, onsuccess: null, onerror: null, error: null };
        setImmediate(() => {
          req.result = registros.has(chave) ? structuredClone(registros.get(chave)) : undefined;
          req.onsuccess?.();
        });
        return req;
      },
      getAll() {
        const req = { result: [], onsuccess: null, onerror: null, error: null };
        setImmediate(() => {
          req.result = [...registros.values()].map(valor => structuredClone(valor));
          req.onsuccess?.();
        });
        return req;
      },
      delete(chave) {
        pendencias.push({ tipo: 'delete', store: nome, chave });
        return {};
      },
    };
    return opcoes;
  }

  banco = {
    onversionchange: null,
    objectStoreNames: { contains: nome => stores.has(nome) },
    createObjectStore(nome) {
      criarStore(nome);
      return { createIndex() {} };
    },
    close() {},
    transaction(nomes, modo) {
      const lista = Array.isArray(nomes) ? nomes : [nomes];
      const pendencias = [];
      let abortada = false;
      const tx = {
        error: null,
        oncomplete: null,
        onabort: null,
        onerror: null,
        objectStore(nome) {
          assert.ok(lista.includes(nome), 'store fora da transação');
          return objetoStore(nome, pendencias);
        },
        abort() {
          abortada = true;
          tx.error = new Error('Transação abortada');
        },
      };
      setImmediate(() => {
        if (abortada) {
          tx.onabort?.();
          return;
        }
        if (modo === 'readwrite') {
          const copias = new Map(lista.map(nome => [nome, new Map(
            [...criarStore(nome)].map(([chave, valor]) => [chave, structuredClone(valor)]),
          )]));
          try {
            for (const p of pendencias) {
              const destino = copias.get(p.store);
              if (p.tipo === 'delete') destino.delete(p.chave);
              else {
                const chave = p.valor.localId ?? p.valor.id;
                if (p.tipo === 'add' && destino.has(chave)) throw new Error('ConstraintError: chave duplicada');
                if (p.tipo === 'add' && p.store === 'vinculosLan'
                  && [...destino.values()].some(v => v.remoteKey === p.valor.remoteKey)) {
                  throw new Error('ConstraintError: remoteKey duplicada');
                }
                destino.set(chave, structuredClone(p.valor));
              }
            }
            for (const [nome, copia] of copias) stores.set(nome, copia);
          } catch (erro) {
            tx.error = erro;
            tx.onerror?.();
            tx.onabort?.();
            return;
          }
        }
        tx.oncomplete?.();
      });
      return tx;
    },
  };

  globalThis.indexedDB = {
    open() {
      const req = { result: banco, error: null, onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null };
      setImmediate(() => {
        if (!stores.has('personagens') || !stores.has('vinculosLan')) {
          req.onupgradeneeded?.({ oldVersion: 2 });
        }
        req.onsuccess?.();
      });
      return req;
    },
  };
  return stores;
}

test('vínculos LAN são gravados, consultados e atualizados sem permitir duplicidade ou troca de identidade', async () => {
  instalarIndexedDBTransacional();
  const db = await import('../src/persistenciaFicha.ts?teste-crud-vinculos-lan');
  const chave = db.chaveRemotaVinculo('conta-1', 'mesa-1', 'a'.repeat(32));
  const vinculo = {
    localId: 'local-1',
    accountId: 'conta-1',
    mesaId: 'mesa-1',
    personagemId: 'a'.repeat(32),
    remoteKey: chave,
    baseRevision: 4,
    syncState: 'pendente',
  };

  await db.criarVinculoLan(vinculo);
  assert.deepEqual(await db.obterVinculoLan('local-1'), vinculo);
  assert.deepEqual(await db.listarVinculosLan(), [vinculo]);

  await assert.rejects(
    db.criarVinculoLan({ ...vinculo, localId: 'local-2' }),
    /remoteKey duplicada/,
  );
  assert.deepEqual(await db.listarVinculosLan(), [vinculo]);

  const atualizado = await db.salvarMetadadosVinculoLan('local-1', chave, {
    baseRevision: 5,
    syncState: 'sincronizado',
  });
  assert.equal(atualizado.localId, 'local-1');
  assert.equal(atualizado.accountId, 'conta-1');
  assert.equal(atualizado.mesaId, 'mesa-1');
  assert.equal(atualizado.personagemId, 'a'.repeat(32));
  assert.equal(atualizado.remoteKey, chave);
  assert.equal(atualizado.baseRevision, 5);
  assert.equal(atualizado.syncState, 'sincronizado');

  await assert.rejects(
    db.salvarMetadadosVinculoLan('local-1', 'identidade-divergente', {
      baseRevision: 6,
      syncState: 'pendente',
    }),
    /identidade do vínculo mudou/,
  );
  assert.deepEqual(await db.obterVinculoLan('local-1'), atualizado);
});
