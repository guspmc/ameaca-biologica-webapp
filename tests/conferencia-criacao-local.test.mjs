import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../server/index.mjs';

async function criarInstancia(t) {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-conferencia-local-'));
  const app = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await app.listen();
  t.after(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });
  return { app, url: 'http://127.0.0.1:' + app.address.port };
}

async function criarConta(url, username) {
  const credenciais = { username, password: 'senha-local-comprida-2026' };
  const cadastro = await fetch(url + '/api/auth/register', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credenciais),
  });
  assert.equal(cadastro.status, 201);
  const login = await fetch(url + '/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credenciais),
  });
  assert.equal(login.status, 200);
  const sessao = await login.json();
  return { account: sessao.account, headers: { authorization: 'Bearer ' + sessao.token } };
}

function dadosCriacaoValida() {
  return {
    classe: 'Agente',
    origem: 'Acadêmico',
    atributos: { forca: 2, agilidade: 2, vigor: 2, astucia: 1 },
    periciaOrigemTreinada: 'Investigação',
    distribuicaoPericias: {
      Acrobacia: 1, Furtividade: 1, Luta: 1, Percepção: 1,
    },
    habilidadeBasica: 'anatomia-de-combate',
    equipamentoInicial: 'A',
  };
}

test('conferência LAN valida no servidor sem gravar e respeita autoria e vínculo atual', async t => {
  const instancia = await criarInstancia(t);
  const mestre = await criarConta(instancia.url, 'mestre-conferencia');
  const jogador = await criarConta(instancia.url, 'jogador-conferencia');
  const terceiro = await criarConta(instancia.url, 'terceiro-conferencia');

  const criarMesa = await fetch(instancia.url + '/api/mesas', {
    method: 'POST',
    headers: { ...mestre.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mesa de conferência' }),
  });
  assert.equal(criarMesa.status, 201);
  const { mesa } = await criarMesa.json();
  instancia.app.db.prepare(
    'INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)',
  ).run(mesa.id, jogador.account.id, 'jogador', new Date().toISOString());

  const criarFicha = await fetch(instancia.url + '/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Claire Redfield', data: dadosCriacaoValida() }),
  });
  assert.equal(criarFicha.status, 201);
  const { personagem } = await criarFicha.json();

  const conferir = await fetch(instancia.url + '/api/personagens/' + personagem.id + '/conferencia', {
    headers: jogador.headers,
  });
  assert.equal(conferir.status, 200);
  const resultado = await conferir.json();
  assert.equal(resultado.valido, true);
  assert.equal(resultado.revision, personagem.revision);
  assert.ok(resultado.inventario.itens.some(item => item.catalogoId === 'sentinel-nine'));

  const persistido = instancia.app.db.prepare(
    'SELECT revisao, dados_json FROM personagens_locais WHERE id = ?',
  ).get(personagem.id);
  assert.equal(persistido.revisao, personagem.revision);
  assert.deepEqual(JSON.parse(persistido.dados_json), dadosCriacaoValida());

  const acessoMestre = await fetch(instancia.url + '/api/personagens/' + personagem.id + '/conferencia', {
    headers: mestre.headers,
  });
  assert.equal(acessoMestre.status, 404);
  const acessoTerceiro = await fetch(instancia.url + '/api/personagens/' + personagem.id + '/conferencia', {
    headers: terceiro.headers,
  });
  assert.equal(acessoTerceiro.status, 404);

  instancia.app.db.prepare('DELETE FROM participantes_mesa WHERE mesa_id = ? AND conta_id = ?')
    .run(mesa.id, jogador.account.id);
  const acessoRemovido = await fetch(instancia.url + '/api/personagens/' + personagem.id + '/conferencia', {
    headers: jogador.headers,
  });
  assert.equal(acessoRemovido.status, 404);
});

test('conferência LAN retorna pendências sem alterar o rascunho', async t => {
  const instancia = await criarInstancia(t);
  const mestre = await criarConta(instancia.url, 'mestre-pendencias');
  const jogador = await criarConta(instancia.url, 'jogador-pendencias');
  const criarMesa = await fetch(instancia.url + '/api/mesas', {
    method: 'POST',
    headers: { ...mestre.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mesa de pendências' }),
  });
  const { mesa } = await criarMesa.json();
  instancia.app.db.prepare(
    'INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)',
  ).run(mesa.id, jogador.account.id, 'jogador', new Date().toISOString());
  const criarFicha = await fetch(instancia.url + '/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Rascunho incompleto', data: { classe: 'Agente' } }),
  });
  const { personagem } = await criarFicha.json();

  const resposta = await fetch(instancia.url + '/api/personagens/' + personagem.id + '/conferencia', {
    headers: jogador.headers,
  });
  assert.equal(resposta.status, 200);
  const resultado = await resposta.json();
  assert.equal(resultado.valido, false);
  assert.ok(resultado.pendencias.length > 0);
  assert.equal(instancia.app.db.prepare('SELECT revisao FROM personagens_locais WHERE id = ?').get(personagem.id).revisao, 1);
});
