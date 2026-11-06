import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../server/index.mjs';

test('cookie HttpOnly mantém sessão e Mesa após reinício da API SQLite', async t => {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-cookie-persistencia-'));
  let servidor = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await servidor.listen();
  let base = `http://127.0.0.1:${servidor.address.port}`;
  t.after(async () => {
    await servidor.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  const requisitar = (rota, opcoes = {}) => fetch(base + rota, opcoes);
  const senha = 'senha-local-cookie-2026';
  const cadastro = await requisitar('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'cookie-persistente', password: senha }),
  });
  assert.equal(cadastro.status, 201);

  const login = await requisitar('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'cookie-persistente', password: senha }),
  });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get('set-cookie') ?? '';
  assert.match(setCookie, /ab_local_session=[A-Za-z0-9_-]{40,100}/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.match(setCookie, /Path=\//i);
  const cookie = setCookie.split(';')[0];

  const criacao = await requisitar('/api/mesas', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ name: 'Mesa persistente por cookie' }),
  });
  assert.equal(criacao.status, 201);
  const { mesa } = await criacao.json();

  const listaAntes = await requisitar('/api/mesas', { headers: { cookie } });
  assert.equal(listaAntes.status, 200);
  assert.deepEqual((await listaAntes.json()).mesas.map(item => item.id), [mesa.id]);

  await servidor.close();
  servidor = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await servidor.listen();
  base = `http://127.0.0.1:${servidor.address.port}`;

  const contaRestaurada = await requisitar('/api/auth/me', { headers: { cookie } });
  assert.equal(contaRestaurada.status, 200);
  assert.equal((await contaRestaurada.json()).account.username, 'cookie-persistente');

  const listaRestaurada = await requisitar('/api/mesas', { headers: { cookie } });
  assert.equal(listaRestaurada.status, 200);
  assert.deepEqual((await listaRestaurada.json()).mesas.map(item => item.id), [mesa.id]);

  const logout = await requisitar('/api/auth/logout', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: '{}',
  });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie') ?? '', /ab_local_session=;.*Max-Age=0/i);

  const sessaoRevogada = await requisitar('/api/auth/me', { headers: { cookie } });
  assert.equal(sessaoRevogada.status, 401);
  const mesasSemSessao = await requisitar('/api/mesas', { headers: { cookie } });
  assert.equal(mesasSemSessao.status, 401);
});
