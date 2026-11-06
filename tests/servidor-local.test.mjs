import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { Script } from 'node:vm';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
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
  assert.ok(Array.isArray(dados.lanAddresses));
  assert.ok(dados.lanAddresses.every(ip => typeof ip === 'string' && /^\\d{1,3}(\\.\\d{1,3}){3}$/.test(ip)));
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


test('autenticação local confirma conta, protege Mesas e revoga a sessão no logout', async t => {
  const instancia = await criarInstancia(t);
  const origem = 'https://guspmc.github.io';
  const credenciais = { email: 'conta-api@example.test', password: 'senha-local-comprida-2026' };

  const cadastro = await fetch(`${instancia.url}/api/auth/register`, {
    method: 'POST', headers: { origin: origem, 'content-type': 'application/json' },
    body: JSON.stringify(credenciais),
  });
  assert.equal(cadastro.status, 201);
  assert.equal(cadastro.headers.get('access-control-allow-origin'), origem);
  const contaCriada = await cadastro.json();
  assert.equal(typeof contaCriada.account.id, 'string');
  assert.equal(contaCriada.account.email, credenciais.email);

  const login = await fetch(`${instancia.url}/api/auth/login`, {
    method: 'POST', headers: { origin: origem, 'content-type': 'application/json' },
    body: JSON.stringify(credenciais),
  });
  assert.equal(login.status, 200);
  const sessao = await login.json();
  assert.equal(sessao.account.id, contaCriada.account.id);
  assert.match(sessao.token, /^[A-Za-z0-9_-]{40,100}$/);
  assert.ok(Date.parse(sessao.expiresAt) > Date.now());

  const autorizacao = { origin: origem, authorization: `Bearer ${sessao.token}` };
  const eu = await fetch(`${instancia.url}/api/auth/me`, { headers: autorizacao });
  assert.equal(eu.status, 200);
  assert.deepEqual((await eu.json()).account, contaCriada.account);

  const mesas = await fetch(`${instancia.url}/api/mesas`, { headers: autorizacao });
  assert.equal(mesas.status, 200);
  assert.deepEqual((await mesas.json()).mesas, []);

  const criada = await fetch(`${instancia.url}/api/mesas`, {
    method: 'POST', headers: { ...autorizacao, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mesa de teste' }),
  });
  assert.equal(criada.status, 201);
  const dadosMesa = await criada.json();
  assert.equal(dadosMesa.mesa.name, 'Mesa de teste');
  assert.equal(dadosMesa.mesa.role, 'mestre');

  const logout = await fetch(`${instancia.url}/api/auth/logout`, {
    method: 'POST', headers: { ...autorizacao, 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(logout.status, 200);
  assert.deepEqual(await logout.json(), { ok: true });

  const depois = await fetch(`${instancia.url}/api/auth/me`, { headers: autorizacao });
  assert.equal(depois.status, 401);
  const mesasDepois = await fetch(`${instancia.url}/api/mesas`, { headers: autorizacao });
  assert.equal(mesasDepois.status, 401);
});


test('Mestre consulta participantes sem expor e-mail e remove jogador com revogação de acesso e rascunhos', async t => {
  const instancia = await criarInstancia(t);
  const origem = 'https://guspmc.github.io';
  async function conta(email) {
    const credenciais = { email, password: 'senha-local-comprida-2026' };
    const cadastro = await fetch(instancia.url + '/api/auth/register', {
      method: 'POST', headers: { origin: origem, 'content-type': 'application/json' },
      body: JSON.stringify(credenciais),
    });
    assert.equal(cadastro.status, 201);
    const login = await fetch(instancia.url + '/api/auth/login', {
      method: 'POST', headers: { origin: origem, 'content-type': 'application/json' },
      body: JSON.stringify(credenciais),
    });
    assert.equal(login.status, 200);
    const sessao = await login.json();
    return { account: sessao.account, headers: { origin: origem, authorization: 'Bearer ' + sessao.token } };
  }

  const mestre = await conta('mestre-gestao-participantes@example.test');
  const jogador = await conta('jogador-gestao-participantes@example.test');
  const terceiro = await conta('terceiro-gestao-participantes@example.test');
  const criarMesa = await fetch(instancia.url + '/api/mesas', {
    method: 'POST', headers: { ...mestre.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mesa de participantes' }),
  });
  assert.equal(criarMesa.status, 201);
  const { mesa } = await criarMesa.json();
  instancia.app.db.prepare('INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)')
    .run(mesa.id, jogador.account.id, 'jogador', new Date().toISOString());

  const criarRascunho = await fetch(instancia.url + '/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Rascunho do jogador', data: { estadoFicha: 'rascunho' } }),
  });
  assert.equal(criarRascunho.status, 201);
  const { personagem } = await criarRascunho.json();

  const listar = await fetch(instancia.url + '/api/mesas/' + mesa.id + '/participantes', { headers: mestre.headers });
  assert.equal(listar.status, 200);
  const lista = await listar.json();
  assert.deepEqual(lista.participants.map(p => p.role), ['mestre', 'jogador']);
  assert.equal(lista.participants[1].accountId, jogador.account.id);
  assert.equal(JSON.stringify(lista).includes(jogador.account.email), false);

  const convite = await fetch(instancia.url + '/api/mesas/' + mesa.id + '/convites', {
    method: 'POST', headers: { ...mestre.headers, 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(convite.status, 201);
  const codigoConvite = (await convite.json()).invitation.code;
  const solicitacao = await fetch(instancia.url + '/api/convites/solicitar', {
    method: 'POST', headers: { ...terceiro.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ code: codigoConvite }),
  });
  assert.equal(solicitacao.status, 202);
  const pedidos = await fetch(instancia.url + '/api/mesas/' + mesa.id + '/solicitacoes', { headers: mestre.headers });
  assert.equal(pedidos.status, 200);
  const listaPedidos = await pedidos.json();
  assert.equal(listaPedidos.requests.length, 1);
  assert.equal(listaPedidos.requests[0].accountId, terceiro.account.id);
  assert.equal(JSON.stringify(listaPedidos).includes(terceiro.account.email), false);

  const listarJogador = await fetch(instancia.url + '/api/mesas/' + mesa.id + '/participantes', { headers: jogador.headers });
  assert.equal(listarJogador.status, 200);
  assert.equal((await listarJogador.json()).participants.length, 2);
  const listarTerceiro = await fetch(instancia.url + '/api/mesas/' + mesa.id + '/participantes', { headers: terceiro.headers });
  assert.equal(listarTerceiro.status, 404);

  const remocaoPeloProprioJogador = await fetch(instancia.url + '/api/mesas/' + mesa.id + '/participantes/' + jogador.account.id, {
    method: 'DELETE', headers: jogador.headers,
  });
  assert.equal(remocaoPeloProprioJogador.status, 404);
  const remocaoJogador = await fetch(instancia.url + '/api/mesas/' + mesa.id + '/participantes/' + jogador.account.id, {
    method: 'DELETE', headers: mestre.headers,
  });
  assert.equal(remocaoJogador.status, 200);
  assert.deepEqual(await remocaoJogador.json(), { removed: true, accountId: jogador.account.id });

  const mesasJogador = await fetch(instancia.url + '/api/mesas', { headers: jogador.headers });
  assert.equal(mesasJogador.status, 200);
  assert.deepEqual((await mesasJogador.json()).mesas, []);
  const fichaRevogada = await fetch(instancia.url + '/api/personagens/' + personagem.id, { headers: jogador.headers });
  assert.equal(fichaRevogada.status, 404);
  const rascunhosRestantes = instancia.app.db.prepare('SELECT COUNT(*) AS total FROM personagens_locais WHERE mesa_id = ?').get(mesa.id);
  assert.equal(rascunhosRestantes.total, 0);

  const listaFinal = await fetch(instancia.url + '/api/mesas/' + mesa.id + '/participantes', { headers: mestre.headers });
  assert.equal(listaFinal.status, 200);
  assert.deepEqual((await listaFinal.json()).participants.map(p => p.role), ['mestre']);

  const tentativaTerceiro = await fetch(instancia.url + '/api/mesas/' + mesa.id + '/participantes/' + jogador.account.id, {
    method: 'DELETE', headers: terceiro.headers,
  });
  assert.equal(tentativaTerceiro.status, 404);
});


test('aprovações simultâneas respeitam o teto de 10 jogadores da Mesa LAN', async t => {
  const instancia = await criarInstancia(t);
  const origem = 'https://guspmc.github.io';
  function conta(email) {
    const id = randomBytes(16).toString('hex');
    const token = randomBytes(32).toString('base64url');
    const agora = new Date();
    const salt = randomBytes(16).toString('hex');
    instancia.app.db.prepare(
      'INSERT INTO contas_locais (id, email, senha_salt, senha_hash, criada_em) VALUES (?, ?, ?, ?, ?)'
    ).run(id, email, salt, Buffer.alloc(64).toString('hex'), agora.toISOString());
    instancia.app.db.prepare(
      'INSERT INTO sessoes_locais (token_hash, conta_id, criada_em, expira_em) VALUES (?, ?, ?, ?)'
    ).run(createHash('sha256').update(token).digest('hex'), id, agora.toISOString(), new Date(agora.getTime() + 60 * 60 * 1000).toISOString());
    return { account: { id, email }, headers: { origin: origem, authorization: 'Bearer ' + token } };
  }

  const mestre = conta('mestre-limite-lan@example.test');
  const jogadores = Array.from({ length: 9 }, (_, i) => conta('jogador-limite-' + i + '@example.test'));
  const candidatos = Array.from({ length: 2 }, (_, i) => conta('candidato-limite-' + i + '@example.test'));

  const criarMesa = await fetch(instancia.url + '/api/mesas', {
    method: 'POST', headers: { ...mestre.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mesa no limite' }),
  });
  assert.equal(criarMesa.status, 201);
  const { mesa } = await criarMesa.json();
  const agora = new Date().toISOString();
  const inserirJogador = instancia.app.db.prepare(
    "INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, 'jogador', ?)"
  );
  for (const jogador of jogadores) inserirJogador.run(mesa.id, jogador.account.id, agora);
  assert.equal(instancia.app.db.prepare("SELECT COUNT(*) AS total FROM participantes_mesa WHERE mesa_id = ? AND papel = 'jogador'").get(mesa.id).total, 9);

  const convite = await fetch(instancia.url + '/api/mesas/' + mesa.id + '/convites', {
    method: 'POST', headers: { ...mestre.headers, 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(convite.status, 201);
  const codigo = (await convite.json()).invitation.code;
  const pedidos = await Promise.all(candidatos.map(async candidato => {
    const resposta = await fetch(instancia.url + '/api/convites/solicitar', {
      method: 'POST', headers: { ...candidato.headers, 'content-type': 'application/json' },
      body: JSON.stringify({ code: codigo }),
    });
    assert.equal(resposta.status, 202);
    return (await resposta.json()).request.id;
  }));

  const decisoes = await Promise.all(pedidos.map(id => fetch(
    instancia.url + '/api/mesas/' + mesa.id + '/solicitacoes/' + id + '/aprovar',
    { method: 'POST', headers: mestre.headers },
  )));
  assert.deepEqual(decisoes.map(r => r.status).sort(), [200, 409]);

  const total = instancia.app.db.prepare(
    "SELECT COUNT(*) AS total FROM participantes_mesa WHERE mesa_id = ? AND papel = 'jogador'"
  ).get(mesa.id).total;
  assert.equal(total, 10);
  const estados = instancia.app.db.prepare(
    "SELECT status, COUNT(*) AS total FROM solicitacoes_mesa_locais WHERE mesa_id = ? GROUP BY status ORDER BY status"
  ).all(mesa.id);
  assert.deepEqual(estados.map(x => [x.status, x.total]), [['aprovada', 1], ['pendente', 1]]);
});

test('CORS aceita apenas origens explicitamente permitidas e responde preflight', async t => {
  const instancia = await criarInstancia(t);
  const origemPermitida = 'https://guspmc.github.io';
  const preflight = await fetch(`${instancia.url}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      origin: origemPermitida,
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'authorization,content-type',
    },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), origemPermitida);
  assert.match(preflight.headers.get('access-control-allow-methods') ?? '', /POST/);

  const origemBloqueada = await fetch(`${instancia.url}/api/health`, {
    headers: { origin: 'https://origem-nao-autorizada.example' },
  });
  assert.equal(origemBloqueada.status, 403);
  assert.equal(origemBloqueada.headers.get('access-control-allow-origin'), null);
});


test('contas diferentes não enxergam nem consultam Mesas umas das outras', async t => {
  const instancia = await criarInstancia(t);
  const origem = 'https://guspmc.github.io';
  async function cadastrarEEntrar(email) {
    const credenciais = { email, password: 'senha-local-comprida-2026' };
    const cadastro = await fetch(`${instancia.url}/api/auth/register`, {
      method: 'POST', headers: { origin: origem, 'content-type': 'application/json' },
      body: JSON.stringify(credenciais),
    });
    assert.equal(cadastro.status, 201);
    const login = await fetch(`${instancia.url}/api/auth/login`, {
      method: 'POST', headers: { origin: origem, 'content-type': 'application/json' },
      body: JSON.stringify(credenciais),
    });
    assert.equal(login.status, 200);
    return (await login.json()).token;
  }

  const tokenMestre = await cadastrarEEntrar('mestre-isolamento@example.test');
  const tokenOutraConta = await cadastrarEEntrar('outra-conta@example.test');
  const criar = await fetch(`${instancia.url}/api/mesas`, {
    method: 'POST',
    headers: { origin: origem, authorization: `Bearer ${tokenMestre}`, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mesa privada' }),
  });
  assert.equal(criar.status, 201);
  const { mesa } = await criar.json();

  const listaAlheia = await fetch(`${instancia.url}/api/mesas`, {
    headers: { origin: origem, authorization: `Bearer ${tokenOutraConta}` },
  });
  assert.equal(listaAlheia.status, 200);
  assert.deepEqual((await listaAlheia.json()).mesas, []);

  const detalheAlheio = await fetch(`${instancia.url}/api/mesas/${mesa.id}`, {
    headers: { origin: origem, authorization: `Bearer ${tokenOutraConta}` },
  });
  assert.equal(detalheAlheio.status, 404);
});


test('preserva a Mesa e o vínculo do Mestre após reiniciar o servidor SQLite', async t => {
  const instancia = await criarInstancia(t);
  const credenciais = { email: 'mestre-persistencia@example.test', password: 'senha-local-comprida-2026' };
  const post = (path, body, token) => fetch(instancia.url + path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: 'Bearer ' + token } : {}),
    },
    body: JSON.stringify(body),
  });

  assert.equal((await post('/api/auth/register', credenciais)).status, 201);
  const loginInicial = await post('/api/auth/login', credenciais);
  assert.equal(loginInicial.status, 200);
  const sessaoInicial = await loginInicial.json();

  const criacao = await post('/api/mesas', { name: 'Mesa persistente' }, sessaoInicial.token);
  assert.equal(criacao.status, 201);
  const { mesa } = await criacao.json();

  await instancia.reiniciar();

  const loginPosterior = await post('/api/auth/login', credenciais);
  assert.equal(loginPosterior.status, 200);
  const sessaoPosterior = await loginPosterior.json();
  const respostaMesas = await fetch(instancia.url + '/api/mesas', {
    headers: { authorization: 'Bearer ' + sessaoPosterior.token },
  });
  assert.equal(respostaMesas.status, 200);
  const dados = await respostaMesas.json();
  assert.equal(dados.mesas.length, 1);
  assert.equal(dados.mesas[0].id, mesa.id);
  assert.equal(dados.mesas[0].name, 'Mesa persistente');
  assert.equal(dados.mesas[0].role, 'mestre');
});
