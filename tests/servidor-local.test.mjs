import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { Script } from 'node:vm';
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
  assert.equal(dados.authentication, 'local-prototype-api');
  assert.match(dados.warning, /sem proteção de transporte/i);
});

async function abrirWebSocketAutenticado(instancia, opcoes = {}) {
  const credenciais = {
    email: 'heartbeat@example.test',
    password: 'senha-local-comprida-2026',
  };
  const cadastro = await fetch(`${instancia.url}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credenciais),
  });
  assert.equal(cadastro.status, 201);
  const login = await fetch(`${instancia.url}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credenciais),
  });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  const emissao = await fetch(`${instancia.url}/api/auth/ws-ticket`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: '{}',
  });
  assert.equal(emissao.status, 201);
  const { ticket } = await emissao.json();
  return new WebSocket(`${instancia.wsUrl}?ticket=${encodeURIComponent(ticket)}`, opcoes);
}

test('heartbeat mantém WebSocket responsivo conectado durante inatividade', async t => {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-biologica-heartbeat-'));
  const app = createLocalServer({
    host: '127.0.0.1',
    port: 0,
    dataDir,
    heartbeatIntervalMs: 20,
  });
  await app.listen();
  const instancia = { url: 'http://127.0.0.1:' + app.address.port, wsUrl: 'ws://127.0.0.1:' + app.address.port + '/ws' };
  const cliente = await abrirWebSocketAutenticado(instancia);

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


test('script da página LAN tem sintaxe válida e inclui recuperação automática', async () => {
  const html = await readFile(new URL('../server/index.html', import.meta.url), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1, 'a página de diagnóstico deve ter um script inline');
  assert.doesNotThrow(() => new Script(scripts[0][1]));
  assert.match(scripts[0][1], /function scheduleReconnect/);
  assert.match(scripts[0][1], /eventIds\.has\(id\)/);
  assert.match(scripts[0][1], /loadEvents\(\)\.then/);
  assert.match(scripts[0][1], /document\.addEventListener\('visibilitychange'/);
});


test('heartbeat encerra cliente que deixa de responder aos pings', async t => {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-biologica-heartbeat-dead-'));
  const app = createLocalServer({
    host: '127.0.0.1',
    port: 0,
    dataDir,
    heartbeatIntervalMs: 20,
  });
  await app.listen();
  const instancia = { url: 'http://127.0.0.1:' + app.address.port, wsUrl: 'ws://127.0.0.1:' + app.address.port + '/ws' };
  const cliente = await abrirWebSocketAutenticado(instancia, { autoPong: false });

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

  await new Promise((resolve, reject) => {
    const limite = setTimeout(() => reject(new Error('O servidor não encerrou o cliente que ignorou o heartbeat.')), 1000);
    cliente.once('close', () => {
      clearTimeout(limite);
      resolve();
    });
  });

  assert.equal(cliente.readyState, WebSocket.CLOSED);
});


test('cliente reconecta após fechamento e sincroniza histórico ao voltar à aba', async () => {
  const html = await readFile(new URL('../server/index.html', import.meta.url), 'utf8');
  const scriptText = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
  const sockets = [];
  let fetchCount = 0;
  const visibilityListeners = [];
  const elementos = new Map();

  const lista = {
    itens: [],
    vazio: { className: 'empty', textContent: 'Aguardando conexão e eventos…' },
    querySelector(seletor) {
      if (seletor === '.empty') return this.vazio;
      if (seletor === 'li[data-event-id]') return this.itens[0] ?? null;
      return null;
    },
    querySelectorAll() { return this.itens; },
    append(item) {
      if (item.className === 'empty') this.vazio = item;
      else this.itens.push(item);
    },
    insertBefore(item, following) {
      const index = this.itens.indexOf(following);
      this.itens.splice(index < 0 ? this.itens.length : index, 0, item);
    },
  };
  const formulario = { addEventListener() {} };
  const campo = { value: '', focus() {} };
  const botao = { disabled: false };
  elementos.set('#status', { dataset: {} });
  elementos.set('#status-text', { textContent: '' });
  elementos.set('#feedback', { textContent: '' });
  elementos.set('#event-form', formulario);
  elementos.set('#message', campo);
  elementos.set('#send', botao);
  elementos.set('#events', lista);

  const documentFalso = {
    visibilityState: 'visible',
    querySelector(seletor) { return elementos.get(seletor); },
    createElement() { return { dataset: {}, append() {}, className: '', textContent: '' }; },
    addEventListener(tipo, listener) {
      if (tipo === 'visibilitychange') visibilityListeners.push(listener);
    },
  };

  class WebSocketFalso {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor(url) {
      this.url = url;
      this.readyState = WebSocketFalso.CONNECTING;
      this.listeners = new Map();
      sockets.push(this);
    }
    addEventListener(tipo, listener) {
      const listeners = this.listeners.get(tipo) ?? [];
      listeners.push(listener);
      this.listeners.set(tipo, listeners);
    }
    emitir(tipo, evento = {}) {
      for (const listener of this.listeners.get(tipo) ?? []) listener(evento);
    }
    abrir() {
      this.readyState = WebSocketFalso.OPEN;
      this.emitir('open');
    }
    fechar() {
      this.readyState = WebSocketFalso.CLOSED;
      this.emitir('close');
    }
  }

  const contexto = {
    document: documentFalso,
    location: { protocol: 'http:', host: '127.0.0.1:4175' },
    WebSocket: WebSocketFalso,
    fetch: async () => {
      fetchCount += 1;
      return { ok: true, json: async () => ({ events: [] }) };
    },
    setTimeout,
    clearTimeout,
    Math,
    Date,
    JSON,
    Number,
    String,
    Error,
  };
  new Script(scriptText).runInNewContext(contexto);

  assert.equal(sockets.length, 1, 'a página deve iniciar a primeira conexão');
  sockets[0].abrir();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fetchCount, 1, 'a conexão inicial deve carregar o histórico');

  for (const listener of visibilityListeners) listener();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fetchCount, 2, 'ao voltar à aba visível, o histórico deve ser sincronizado novamente');

  sockets[0].fechar();
  const limite = Date.now() + 2200;
  while (sockets.length < 2 && Date.now() < limite) {
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  assert.equal(sockets.length, 2, 'a página deve criar outra conexão sem F5 após o fechamento do WebSocket');
});
