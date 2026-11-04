import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarFilaSerializada } from '../src/filaSerializada.ts';

test('executa operações na ordem em que entram na fila', async () => {
  const fila = criarFilaSerializada();
  const ordem = [];

  const primeira = fila.enfileirar(async () => {
    await new Promise(resolve => setImmediate(resolve));
    ordem.push('primeira');
    return 1;
  });
  const segunda = fila.enfileirar(() => {
    ordem.push('segunda');
    return 2;
  });

  assert.deepEqual(await Promise.all([primeira, segunda]), [1, 2]);
  assert.deepEqual(ordem, ['primeira', 'segunda']);
});

test('uma operação rejeitada não impede as operações seguintes', async () => {
  const fila = criarFilaSerializada();
  const ordem = [];

  const falha = fila.enfileirar(() => {
    ordem.push('falha');
    throw new Error('erro esperado');
  });
  const seguinte = fila.enfileirar(() => {
    ordem.push('seguinte');
    return 'ok';
  });

  await assert.rejects(falha, /erro esperado/);
  assert.equal(await seguinte, 'ok');
  assert.deepEqual(ordem, ['falha', 'seguinte']);
});

test('aguardar funciona como barreira para todas as operações anteriores', async () => {
  const fila = criarFilaSerializada();
  let liberar;
  let concluida = false;

  fila.enfileirar(() => new Promise(resolve => {
    liberar = () => {
      concluida = true;
      resolve();
    };
  }));

  const barreira = fila.aguardar();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(concluida, false);

  liberar();
  await barreira;
  assert.equal(concluida, true);
});
