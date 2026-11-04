import { test } from 'node:test';
import assert from 'node:assert/strict';

function instalarIndexedDB({ falharNoPut = false } = {}) {
  const registros = new Map();
  let erroInjetado = falharNoPut;
  let ultimaTransacao;

  globalThis.indexedDB = {
    open() {
      const pedido = { result: null, error: null, onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null };
      const banco = {
        onversionchange: null,
        objectStoreNames: { contains: () => true },
        close() {},
        transaction() {
          const pendencias = [];
          let falha = null;
          const tx = {
            error: null,
            oncomplete: null,
            onabort: null,
            onerror: null,
            objectStore() {
              return {
                getAll() {
                  const req = { result: null, error: null, onsuccess: null, onerror: null };
                  setImmediate(() => {
                    req.result = [...registros.values()].map(item => structuredClone(item));
                    req.onsuccess?.();
                  });
                  return req;
                },
                get(id) {
                  const req = { result: null, error: null, onsuccess: null, onerror: null };
                  setImmediate(() => {
                    req.result = registros.has(id) ? structuredClone(registros.get(id)) : undefined;
                    req.onsuccess?.();
                  });
                  return req;
                },
                put(item) {
                  if (erroInjetado) {
                    erroInjetado = false;
                    falha = new Error('Falha simulada ao inserir registro');
                  } else {
                    pendencias.push({ tipo: 'put', id: item.id, item: structuredClone(item) });
                  }
                  return {};
                },
                add(item) {
                  if (registros.has(item.id) || pendencias.some(p => p.id === item.id)) {
                    falha = new Error('Chave duplicada');
                  } else {
                    pendencias.push({ tipo: 'put', id: item.id, item: structuredClone(item) });
                  }
                  return {};
                },
                clear() { pendencias.push({ tipo: 'clear' }); return {}; },
                delete(id) { pendencias.push({ tipo: 'delete', id }); return {}; },
              };
            },
          };
          ultimaTransacao = tx;
          setImmediate(() => {
            if (falha) {
              tx.error = falha;
              tx.onerror?.();
              tx.onabort?.();
              return;
            }
            for (const p of pendencias) {
              if (p.tipo === 'clear') registros.clear();
              else if (p.tipo === 'delete') registros.delete(p.id);
              else registros.set(p.id, structuredClone(p.item));
            }
            tx.oncomplete?.();
          });
          return tx;
        },
      };
      pedido.result = banco;
      setImmediate(() => pedido.onsuccess?.());
      return pedido;
    },
  };
  return { registros, ultimaTransacao: () => ultimaTransacao };
}

async function importarPersistencia() {
  return import('../src/persistenciaFicha.ts?operacoes=' + Math.random());
}

const ficha = (id, nome = id) => ({
  id, nome,
  criadoEm: '2026-11-01T10:00:00.000Z',
  atualizadoEm: '2026-11-02T10:00:00.000Z',
  dados: { classe: 'Agente', identidade: { apelido: nome } },
});

test('listar, obter e excluir percorrem o ciclo de persistência local', async () => {
  const fake = instalarIndexedDB();
  const db = await importarPersistencia();
  await db.salvarPersonagem(ficha('a'));
  await db.salvarPersonagem(ficha('b'));

  assert.deepEqual((await db.listarPersonagens()).map(p => p.id), ['a', 'b']);
  assert.equal((await db.obterPersonagem('a')).nome, 'a');
  assert.equal(await db.obterPersonagem('inexistente'), null);

  await db.excluirPersonagem('a');
  assert.deepEqual((await db.listarPersonagens()).map(p => p.id), ['b']);
  assert.equal(fake.registros.size, 1);
});

test('importação em lote adiciona todas as fichas e rejeita colisão sem parcialidade', async () => {
  const fake = instalarIndexedDB();
  const db = await importarPersistencia();
  await db.salvarPersonagem(ficha('existente'));

  await db.adicionarPersonagens([ficha('nova-1'), ficha('nova-2')]);
  assert.deepEqual((await db.listarPersonagens()).map(p => p.id), ['existente', 'nova-1', 'nova-2']);

  await assert.rejects(
    db.adicionarPersonagens([ficha('nova-3'), ficha('existente')]),
  );
  assert.deepEqual((await db.listarPersonagens()).map(p => p.id), ['existente', 'nova-1', 'nova-2']);
  assert.equal(fake.registros.size, 3);
});

test('substituição troca o conjunto inteiro e mantém o conjunto anterior em caso de abortamento', async () => {
  const fake = instalarIndexedDB();
  const db = await importarPersistencia();
  await db.salvarPersonagem(ficha('antiga-1'));
  await db.salvarPersonagem(ficha('antiga-2'));

  await db.substituirPersonagens([ficha('nova-1'), ficha('nova-2')]);
  assert.deepEqual((await db.listarPersonagens()).map(p => p.id), ['nova-1', 'nova-2']);

  fake.registros.clear();
  fake.registros.set('preservar', ficha('preservar'));
  // A falha ocorre depois do clear ter sido enfileirado, mas antes do commit.
  fake.ultimaTransacao();
  const segunda = instalarIndexedDB({ falharNoPut: true });
  const dbComFalha = await importarPersistencia();
  await assert.rejects(dbComFalha.substituirPersonagens([ficha('nao-gravar')]), /Falha simulada/);
  assert.equal(segunda.registros.has('nao-gravar'), false);
  assert.equal(segunda.registros.size, 0);
});
