import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../server/index.mjs';

async function setup(t) {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-auth-local-'));
  const app = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await app.listen();
  t.after(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });
  return `http://127.0.0.1:${app.address.port}`;
}
async function post(base, path, body, token) {
  return fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

test('cria conta local e retorna apenas identificador e e-mail', async t => {
  const base = await setup(t);
  const resposta = await post(base, '/api/auth/register', { email: 'Teste@Exemplo.com', password: 'uma-senha-local-segura-2026' });
  assert.equal(resposta.status, 201);
  const { account } = await resposta.json();
  assert.equal(account.email, 'teste@exemplo.com');
  assert.deepEqual(Object.keys(account).sort(), ['email', 'id']);
});

test('login cria sessão, /me valida token e logout revoga sessão', async t => {
  const base = await setup(t);
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
  const base = await setup(t);
  assert.equal((await post(base, '/api/auth/register', { email: 'curta@example.test', password: 'curta' })).status, 422);
  const resposta = await post(base, '/api/auth/login', { email: 'nao-existe@example.test', password: 'senha-local-comprida-2026' });
  assert.equal(resposta.status, 401);
  assert.equal((await resposta.json()).error, 'E-mail ou senha inválidos.');
});

test('impede duplicação de e-mail sem diferenciar maiúsculas', async t => {
  const base = await setup(t);
  const password = 'senha-local-comprida-2026';
  assert.equal((await post(base, '/api/auth/register', { email: 'Conta@example.test', password })).status, 201);
  assert.equal((await post(base, '/api/auth/register', { email: 'conta@example.test', password })).status, 409);
});

test('limita tentativas repetidas de cadastro por IP e informa quando tentar novamente', async t => {
  const base = await setup(t);
  for (let i = 0; i < 5; i += 1) {
    const resposta = await post(base, '/api/auth/register', { email: 'email-invalido', password: 'senha-local-comprida-2026' });
    assert.equal(resposta.status, 422);
  }
  const bloqueada = await post(base, '/api/auth/register', { email: 'outro-email-invalido', password: 'senha-local-comprida-2026' });
  assert.equal(bloqueada.status, 429);
  assert.ok(Number(bloqueada.headers.get('retry-after')) > 0);
  assert.equal((await bloqueada.json()).error, 'Muitas tentativas. Aguarde antes de tentar novamente.');
});
