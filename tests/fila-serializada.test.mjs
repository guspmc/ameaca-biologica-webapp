import test from 'node:test';
import assert from 'node:assert/strict';
import { criarFilaSerializada } from '../src/filaSerializada.ts';

test('executa operações em ordem e não sobrepõe tarefas', async () => {
  const fila = criarFilaSerializada();
  const ordem = [];
  let emExecucao = 0;
  const tarefa = (id) => fila.enfileirar(async () => {
    emExecucao += 1;
    assert.equal(emExecucao, 1);
    ordem.push(`início-${id}`);
    await Promise.resolve();
    ordem.push(`fim-${id}`);
    emExecucao -= 1;
    return id;
  });
  const resultados = await Promise.all([tarefa(1), tarefa(2), tarefa(3)]);
  assert.deepEqual(resultados, [1, 2, 3]);
  assert.deepEqual(ordem, ['início-1','fim-1','início-2','fim-2','início-3','fim-3']);
});

test('uma operação rejeitada não impede a execução das seguintes', async () => {
  const fila = criarFilaSerializada();
  const executadas = [];
  const falha = fila.enfileirar(async () => {
    executadas.push('falha');
    throw new Error('falha simulada');
  });
  const seguinte = fila.enfileirar(async () => {
    executadas.push('seguinte');
    return 'ok';
  });
  await assert.rejects(falha, /falha simulada/);
  assert.equal(await seguinte, 'ok');
  await fila.aguardar();
  assert.deepEqual(executadas, ['falha','seguinte']);
});

test('aguardar só conclui depois de todas as operações pendentes', async () => {
  const fila = criarFilaSerializada();
  const estado = [];
  const primeira = fila.enfileirar(() => { estado.push('primeira'); });
  const segunda = fila.enfileirar(() => { estado.push('segunda'); });
  await fila.aguardar();
  await Promise.all([primeira, segunda]);
  assert.deepEqual(estado, ['primeira','segunda']);
});


test('mantém a segunda gravação aguardando a confirmação da primeira', async () => {
  const fila = criarFilaSerializada();
  let liberarPrimeira;
  const barreira = new Promise(resolve => { liberarPrimeira = resolve; });
  const eventos = [];

  const primeira = fila.enfileirar(async () => {
    eventos.push('primeira-iniciou');
    await barreira;
    eventos.push('primeira-confirmada');
  });
  const segunda = fila.enfileirar(async () => {
    eventos.push('segunda-iniciou');
  });

  await Promise.resolve();
  assert.deepEqual(eventos, ['primeira-iniciou']);

  let esperaConcluida = false;
  const espera = fila.aguardar().then(() => { esperaConcluida = true; });
  await Promise.resolve();
  assert.equal(esperaConcluida, false);
  assert.deepEqual(eventos, ['primeira-iniciou']);

  liberarPrimeira();
  await Promise.all([primeira, segunda, espera]);
  assert.deepEqual(eventos, ['primeira-iniciou', 'primeira-confirmada', 'segunda-iniciou']);
  assert.equal(esperaConcluida, true);
});
