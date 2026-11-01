import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../server/index.mjs';

async function criarServidor(t) {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-personagens-'));
  const app = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await app.listen();
  t.after(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });
  return { app, url: 'http://127.0.0.1:' + app.address.port };
}

async function criarConta(url, email) {
  const credenciais = { email, password: 'senha-local-comprida-2026' };
  const cadastro = await fetch(url + '/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credenciais),
  });
  assert.equal(cadastro.status, 201);
  const login = await fetch(url + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credenciais),
  });
  assert.equal(login.status, 200);
  const sessao = await login.json();
  return { account: sessao.account, token: sessao.token, headers: { authorization: 'Bearer ' + sessao.token } };
}

test('rascunhos de personagem persistem e ficam isolados por conta e Mesa', async t => {
  const { app, url } = await criarServidor(t);
  const mestre = await criarConta(url, 'mestre-personagem@example.test');
  const jogador = await criarConta(url, 'jogador-personagem@example.test');
  const terceiro = await criarConta(url, 'terceiro-personagem@example.test');

  const respostaMesa = await fetch(url + '/api/mesas', {
    method: 'POST',
    headers: { ...mestre.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mesa privada' }),
  });
  assert.equal(respostaMesa.status, 201);
  const { mesa } = await respostaMesa.json();

  app.db.prepare('INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)')
    .run(mesa.id, jogador.account.id, 'jogador', new Date().toISOString());

  const dados = { classe: 'Agente', origem: 'Civil', atributos: { vigor: 2, agilidade: 1 } };
  const criar = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Claire', data: dados }),
  });
  assert.equal(criar.status, 201);
  const { personagem } = await criar.json();
  assert.equal(personagem.name, 'Claire');
  assert.equal(personagem.status, 'rascunho');
  assert.deepEqual(personagem.data, dados);

  const listar = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', { headers: jogador.headers });
  assert.equal(listar.status, 200);
  const lista = await listar.json();
  assert.equal(lista.personagens.length, 1);
  assert.equal(lista.personagens[0].id, personagem.id);

  const atualizar = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Claire Redfield', data: { ...dados, origem: 'Policial' } }),
  });
  assert.equal(atualizar.status, 200);
  assert.equal((await atualizar.json()).personagem.name, 'Claire Redfield');

  const consultarOutro = await fetch(url + '/api/personagens/' + personagem.id, { headers: terceiro.headers });
  assert.equal(consultarOutro.status, 404);
  const consultarMestre = await fetch(url + '/api/personagens/' + personagem.id, { headers: mestre.headers });
  assert.equal(consultarMestre.status, 404);
  const listaMestre = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', { headers: mestre.headers });
  assert.equal(listaMestre.status, 404);

  const nomeInvalido = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: ' ', data: {} }),
  });
  assert.equal(nomeInvalido.status, 422);
});

test('rascunhos são removidos quando a conta deixa de participar da Mesa', async t => {
  const { app, url } = await criarServidor(t);
  const mestre = await criarConta(url, 'mestre-remocao@example.test');
  const jogador = await criarConta(url, 'jogador-remocao@example.test');
  const respostaMesa = await fetch(url + '/api/mesas', {
    method: 'POST',
    headers: { ...mestre.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mesa de remoção' }),
  });
  const { mesa } = await respostaMesa.json();
  app.db.prepare('INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)')
    .run(mesa.id, jogador.account.id, 'jogador', new Date().toISOString());
  const criar = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Personagem', data: {} }),
  });
  assert.equal(criar.status, 201);
  app.db.prepare('DELETE FROM participantes_mesa WHERE mesa_id = ? AND conta_id = ?')
    .run(mesa.id, jogador.account.id);
  const restantes = app.db.prepare('SELECT COUNT(*) AS total FROM personagens_locais WHERE mesa_id = ?').get(mesa.id);
  assert.equal(restantes.total, 0);
});
