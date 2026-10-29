import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../server/index.mjs';
import { consumirTicketWebSocketLocal } from '../server/auth-local.mjs';

async function setup(t) {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-auth-local-'));
  const app = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await app.listen();
  let fechado = false;
  const fechar = async () => {
    if (fechado) return;
    await app.close();
    fechado = true;
  };
  t.after(async () => {
    await fechar();
    await rm(dataDir, { recursive: true, force: true });
  });
  return { base: `http://127.0.0.1:${app.address.port}`, app, dataDir, fechar };
}
async function post(base, path, body, token) {
  return fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

test('cria conta local e retorna apenas identificador e e-mail', async t => {
  const { base } = await setup(t);
  const resposta = await post(base, '/api/auth/register', { email: 'Teste@Exemplo.com', password: 'uma-senha-local-segura-2026' });
  assert.equal(resposta.status, 201);
  const { account } = await resposta.json();
  assert.equal(account.email, 'teste@exemplo.com');
  assert.deepEqual(Object.keys(account).sort(), ['email', 'id']);
});

test('login cria sessão, /me valida token e logout revoga sessão', async t => {
  const { base } = await setup(t);
  const credentials = { email: 'jogador@example.test', password: 'senha-local-comprida-2026' };
  assert.equal((await post(base, '/api/auth/register', credentials)).status, 201);
  const login = await post(base, '/api/auth/login', credentials);
  assert.equal(login.status, 200);
  const dados = await login.json();
  assert.match(dados.token, /^[A-Za-z0-9_-]{40,100}$/);
  assert.ok(dados.expiresAt);
  const me = await fetch(base + '/api/auth/me', { headers: { authorization: `Bearer ${dados.token}` } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).account.email, credentials.email);
  assert.equal((await post(base, '/api/auth/logout', {}, dados.token)).status, 200);
  const depois = await fetch(base + '/api/auth/me', { headers: { authorization: `Bearer ${dados.token}` } });
  assert.equal(depois.status, 401);
});

test('rejeita senha curta e usa erro genérico no login inválido', async t => {
  const { base } = await setup(t);
  assert.equal((await post(base, '/api/auth/register', { email: 'curta@example.test', password: 'curta' })).status, 422);
  const resposta = await post(base, '/api/auth/login', { email: 'nao-existe@example.test', password: 'senha-local-comprida-2026' });
  assert.equal(resposta.status, 401);
  assert.equal((await resposta.json()).error, 'E-mail ou senha inválidos.');
});

test('impede duplicação de e-mail sem diferenciar maiúsculas', async t => {
  const { base } = await setup(t);
  const password = 'senha-local-comprida-2026';
  assert.equal((await post(base, '/api/auth/register', { email: 'Conta@example.test', password })).status, 201);
  assert.equal((await post(base, '/api/auth/register', { email: 'conta@example.test', password })).status, 409);
});

test('limita tentativas repetidas de cadastro por IP e informa quando tentar novamente', async t => {
  const { base } = await setup(t);
  for (let i = 0; i < 5; i += 1) {
    const resposta = await post(base, '/api/auth/register', { email: 'email-invalido', password: 'senha-local-comprida-2026' });
    assert.equal(resposta.status, 422);
  }
  const bloqueada = await post(base, '/api/auth/register', { email: 'outro-email-invalido', password: 'senha-local-comprida-2026' });
  assert.equal(bloqueada.status, 429);
  assert.ok(Number(bloqueada.headers.get('retry-after')) > 0);
  assert.equal((await bloqueada.json()).error, 'Muitas tentativas. Aguarde antes de tentar novamente.');
});

test('registra a migração de autenticação uma única vez', async t => {
  const { app, dataDir, fechar } = await setup(t);
  assert.deepEqual(
    app.db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(row => row.version),
    [1, 2, 3],
  );
  await fechar();

  const reiniciado = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await reiniciado.listen();
  t.after(async () => {
    await reiniciado.close();
  });
  assert.deepEqual(
    reiniciado.db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(row => row.version),
    [1, 2],
  );
});

test('preserva conta e sessão existentes ao reiniciar o servidor e reaplicar migrações', async t => {
  const { base, app, dataDir, fechar } = await setup(t);
  const credentials = { email: 'preservar@example.test', password: 'senha-local-comprida-2026' };
  assert.equal((await post(base, '/api/auth/register', credentials)).status, 201);
  const login = await post(base, '/api/auth/login', credentials);
  assert.equal(login.status, 200);
  const { token } = await login.json();
  const contaAntes = app.db.prepare('SELECT COUNT(*) AS total FROM contas_locais').get().total;
  const sessoesAntes = app.db.prepare('SELECT COUNT(*) AS total FROM sessoes_locais').get().total;
  assert.equal(contaAntes, 1);
  assert.equal(sessoesAntes, 1);
  await fechar();

  const reiniciado = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await reiniciado.listen();
  t.after(async () => {
    await reiniciado.close();
  });
  const resposta = await fetch(`http://127.0.0.1:${reiniciado.address.port}/api/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(resposta.status, 200);
  assert.equal((await resposta.json()).account.email, credentials.email);
  assert.equal(reiniciado.db.prepare('SELECT COUNT(*) AS total FROM contas_locais').get().total, 1);
  assert.equal(reiniciado.db.prepare('SELECT COUNT(*) AS total FROM sessoes_locais').get().total, 1);
});


test('migra Mesas e permite papéis diferentes para a mesma conta em Mesas distintas', async t => {
  const { app } = await setup(t);
  const agora = new Date().toISOString();
  app.db.prepare('INSERT INTO contas_locais (id, email, senha_salt, senha_hash, criada_em) VALUES (?, ?, ?, ?, ?)')
    .run('conta-teste', 'mesa@example.test', 'salt', 'hash', agora);
  app.db.prepare('INSERT INTO mesas (id, nome, criada_por, criada_em) VALUES (?, ?, ?, ?)')
    .run('mesa-a', 'Mesa A', 'conta-teste', agora);
  app.db.prepare('INSERT INTO mesas (id, nome, criada_por, criada_em) VALUES (?, ?, ?, ?)')
    .run('mesa-b', 'Mesa B', 'conta-teste', agora);
  const inserirParticipante = app.db.prepare(
    'INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)'
  );
  inserirParticipante.run('mesa-a', 'conta-teste', 'jogador', agora);
  inserirParticipante.run('mesa-b', 'conta-teste', 'mestre', agora);

  const participacoes = app.db.prepare(
    'SELECT mesa_id, papel FROM participantes_mesa WHERE conta_id = ? ORDER BY mesa_id'
  ).all('conta-teste');
  assert.deepEqual(participacoes, [
    { mesa_id: 'mesa-a', papel: 'jogador' },
    { mesa_id: 'mesa-b', papel: 'mestre' },
  ]);
  assert.throws(
    () => inserirParticipante.run('mesa-a', 'conta-teste', 'administrador', agora),
    /CHECK constraint failed/,
  );
});


test('hub lista somente Mesas da conta autenticada e mantém papel por Mesa', async t => {
  const { base } = await setup(t);
  const senha = 'senha-local-comprida-2026';
  const registrar = async email => {
    assert.equal((await post(base, '/api/auth/register', { email, password: senha })).status, 201);
    const resposta = await post(base, '/api/auth/login', { email, password: senha });
    assert.equal(resposta.status, 200);
    return (await resposta.json()).token;
  };
  const tokenClaire = await registrar('claire@example.test');
  const tokenChris = await registrar('chris@example.test');

  const criar = await post(base, '/api/mesas', { name: 'Mesa da Claire', accountId: 'conta-do-chris' }, tokenClaire);
  assert.equal(criar.status, 201);
  const { mesa } = await criar.json();
  assert.equal(mesa.role, 'mestre');

  const listagemClaire = await fetch(base + '/api/mesas', {
    headers: { authorization: `Bearer ${tokenClaire}` },
  });
  assert.equal(listagemClaire.status, 200);
  assert.deepEqual((await listagemClaire.json()).mesas.map(item => item.id), [mesa.id]);

  const listagemChris = await fetch(base + '/api/mesas', {
    headers: { authorization: `Bearer ${tokenChris}` },
  });
  assert.equal(listagemChris.status, 200);
  assert.deepEqual((await listagemChris.json()).mesas, []);

  const detalheNegado = await fetch(base + `/api/mesas/${mesa.id}`, {
    headers: { authorization: `Bearer ${tokenChris}` },
  });
  assert.equal(detalheNegado.status, 404);

  const detalheClaire = await fetch(base + `/api/mesas/${mesa.id}`, {
    headers: { authorization: `Bearer ${tokenClaire}` },
  });
  assert.equal(detalheClaire.status, 200);
  assert.equal((await detalheClaire.json()).mesa.role, 'mestre');
});

test('API de Mesas exige sessão válida e valida o nome', async t => {
  const { base } = await setup(t);
  assert.equal((await fetch(base + '/api/mesas')).status, 401);
  assert.equal((await post(base, '/api/mesas', { name: 'Mesa sem login' })).status, 401);

  const senha = 'senha-local-comprida-2026';
  await post(base, '/api/auth/register', { email: 'validar@example.test', password: senha });
  const login = await post(base, '/api/auth/login', { email: 'validar@example.test', password: senha });
  const { token } = await login.json();
  assert.equal((await post(base, '/api/mesas', { name: '   ' }, token)).status, 422);
  assert.equal((await post(base, '/api/mesas', { name: 'x'.repeat(81) }, token)).status, 422);
});


test('emite ticket WebSocket autenticado, temporário e de uso único', async t => {
  const { base, app } = await setup(t);
  const credentials = { email: 'ws@example.test', password: 'senha-local-comprida-2026' };
  assert.equal((await post(base, '/api/auth/register', credentials)).status, 201);
  const login = await post(base, '/api/auth/login', credentials);
  const { token } = await login.json();

  assert.equal((await post(base, '/api/auth/ws-ticket', {})).status, 401);
  const resposta = await post(base, '/api/auth/ws-ticket', {}, token);
  assert.equal(resposta.status, 201);
  const dados = await resposta.json();
  assert.match(dados.ticket, /^[A-Za-z0-9_-]{40,100}$/);
  assert.equal(dados.singleUse, true);
  assert.ok(Date.parse(dados.expiresAt) > Date.now());

  const primeira = consumirTicketWebSocketLocal(app.db, dados.ticket);
  assert.ok(primeira);
  assert.equal(primeira.email, credentials.email);
  assert.equal(consumirTicketWebSocketLocal(app.db, dados.ticket), null);
});

test('ticket WebSocket inválido ou desconhecido não autentica conexão', async t => {
  const { app } = await setup(t);
  assert.equal(consumirTicketWebSocketLocal(app.db, 'ticket-invalido'), null);
  assert.equal(consumirTicketWebSocketLocal(app.db, 'A'.repeat(43)), null);
});

test('rotas antigas de eventos demonstrativos ficam desativadas', async t => {
  const { base } = await setup(t);
  assert.equal((await fetch(base + '/api/events')).status, 410);
  assert.equal((await post(base, '/api/events', { message: 'teste' })).status, 410);
});
