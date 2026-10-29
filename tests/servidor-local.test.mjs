import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';
import { createLocalServer } from '../server/index.mjs';

async function criarInstancia(t) {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-biologica-lan-'));
  let app = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await app.listen();
  const porta = app.address.port;
  t.after(async () => {
    if (app) await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });
  return {
    dataDir,
    url: `http://127.0.0.1:${porta}`,
    wsUrl: `ws://127.0.0.1:${porta}/ws`,
    get app() { return app; },
    async reiniciar() {
      await app.close();
      app = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
      await app.listen();
      this.url = `http://127.0.0.1:${app.address.port}`;
      this.wsUrl = `ws://127.0.0.1:${app.address.port}/ws`;
    },
  };
}

test('health informa que o protótipo usa SQLite e não exige internet', async t => {
  const instancia = await criarInstancia(t);
  const resposta = await fetch(`${instancia.url}/api/health`);
  assert.equal(resposta.status, 200);
  const dados = await resposta.json();
  assert.equal(dados.ok, true);
  assert.equal(dados.storage, 'SQLite');
  assert.equal(dados.realtime, 'WebSocket');
  assert.equal(dados.internetRequired, false);
  assert.equal(dados.authentication, 'not-implemented');
  assert.match(dados.warning, /sem autenticação/i);
});

test('evento válido é persistido no SQLite e pode ser consultado', async t => {
  const instancia = await criarInstancia(t);
  const resposta = await fetch(`${instancia.url}/api/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'evento de teste da rede local' }),
  });
  assert.equal(resposta.status, 201);
  const criado = await resposta.json();
  assert.equal(criado.event.message, 'evento de teste da rede local');
  assert.ok(criado.event.id > 0);
  assert.ok(criado.event.createdAt);

  const consulta = await fetch(`${instancia.url}/api/events`);
  const dados = await consulta.json();
  assert.equal(dados.events.length, 1);
  assert.equal(dados.events[0].id, criado.event.id);
});

test('eventos continuam no SQLite após reiniciar o processo do servidor', async t => {
  const instancia = await criarInstancia(t);
  await fetch(`${instancia.url}/api/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'persistência entre reinicializações' }),
  });

  await instancia.reiniciar();
  const consulta = await fetch(`${instancia.url}/api/events`);
  assert.equal(consulta.status, 200);
  const dados = await consulta.json();
  assert.equal(dados.events.length, 1);
  assert.equal(dados.events[0].message, 'persistência entre reinicializações');
});

test('evento é transmitido em tempo real para clientes WebSocket', async t => {
  const instancia = await criarInstancia(t);
  const cliente = new WebSocket(instancia.wsUrl);
  t.after(() => {
    if (cliente.readyState === WebSocket.OPEN || cliente.readyState === WebSocket.CONNECTING) cliente.terminate();
  });

  const primeiraMensagem = new Promise((resolve, reject) => {
    cliente.once('message', dados => resolve(JSON.parse(dados.toString('utf8'))));
    cliente.once('error', reject);
  });
  await new Promise((resolve, reject) => {
    cliente.once('open', resolve);
    cliente.once('error', reject);
  });
  const boasVindas = await primeiraMensagem;
  assert.equal(boasVindas.type, 'ready');

  const eventoRecebido = new Promise((resolve, reject) => {
    const limite = setTimeout(() => reject(new Error('Tempo esgotado aguardando evento WebSocket.')), 2000);
    cliente.on('message', dados => {
      const mensagem = JSON.parse(dados.toString('utf8'));
      if (mensagem.type === 'event.created') {
        clearTimeout(limite);
        resolve(mensagem.event);
      }
    });
  });

  await fetch(`${instancia.url}/api/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'atualização ao vivo' }),
  });
  const evento = await eventoRecebido;
  assert.equal(evento.message, 'atualização ao vivo');
});

test('servidor rejeita mensagens vazias ou acima do limite', async t => {
  const instancia = await criarInstancia(t);
  for (const message of ['', 'x'.repeat(281)]) {
    const resposta = await fetch(`${instancia.url}/api/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    assert.equal(resposta.status, 422);
  }
  const consulta = await fetch(`${instancia.url}/api/events`);
  assert.deepEqual((await consulta.json()).events, []);
});


test('heartbeat mantém WebSocket responsivo conectado durante inatividade', async t => {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-biologica-heartbeat-'));
  const app = createLocalServer({
    host: '127.0.0.1',
    port: 0,
    dataDir,
    heartbeatIntervalMs: 20,
  });
  await app.listen();
  const cliente = new WebSocket('ws://127.0.0.1:' + app.address.port + '/ws');

  t.after(async () => {
    if (cliente.readyState === WebSocket.OPEN || cliente.readyState === WebSocket.CONNECTING) {
      cliente.terminate();
    }
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  await new Promise((resolve, reject) => {
    cliente.once('open', resolve);
    cliente.once('error', reject);
  });
  await new Promise(resolve => setTimeout(resolve, 140));

  assert.equal(cliente.readyState, WebSocket.OPEN, 'o cliente que responde ao heartbeat deve continuar conectado');
  assert.equal(app.httpServer.listening, true, 'o servidor não deve encerrar por inatividade');
});
