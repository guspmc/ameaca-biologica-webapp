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

  const listaTerceiro = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', { headers: terceiro.headers });
  assert.equal(listaTerceiro.status, 404);
  const listaSemSessao = await fetch(url + '/api/mesas/' + mesa.id + '/personagens');
  assert.equal(listaSemSessao.status, 401);

  const tentativaCriacaoTerceiro = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST',
    headers: { ...terceiro.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Acesso indevido', data: {} }),
  });
  assert.equal(tentativaCriacaoTerceiro.status, 404);

  const mesaDeOutraConta = await fetch(url + '/api/mesas', {
    method: 'POST',
    headers: { ...terceiro.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mesa isolada' }),
  });
  assert.equal(mesaDeOutraConta.status, 201);
  const { mesa: mesaIsolada } = await mesaDeOutraConta.json();
  const jogadorForaDaMesa = await fetch(url + '/api/mesas/' + mesaIsolada.id + '/personagens', { headers: jogador.headers });
  assert.equal(jogadorForaDaMesa.status, 404);


  const dados = { classe: 'Agente', origem: 'Civil', atributos: { vigor: 2, agilidade: 1 }, identidade: { idade: '29', ocupacao: 'Policial' } };
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
    body: JSON.stringify({ name: 'Claire Redfield', data: { ...dados, origem: 'Policial', identidade: { ...dados.identidade, historia: 'Sobreviveu ao incidente.' } }, expectedRevision: personagem.revision }),
  });
  assert.equal(atualizar.status, 200);
  const registroAtualizado = (await atualizar.json()).personagem;
  assert.equal(registroAtualizado.name, 'Claire Redfield');
  assert.equal(registroAtualizado.revision, personagem.revision + 1);

  const consultarOutro = await fetch(url + '/api/personagens/' + personagem.id, { headers: terceiro.headers });
  assert.equal(consultarOutro.status, 404);
  const editarOutro = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT',
    headers: { ...terceiro.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Alteração indevida', data: { adulterado: true }, expectedRevision: registroAtualizado.revision }),
  });
  assert.equal(editarOutro.status, 404);

  const consultarMestre = await fetch(url + '/api/personagens/' + personagem.id, { headers: mestre.headers });
  assert.equal(consultarMestre.status, 404);
  const editarMestre = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT',
    headers: { ...mestre.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Edição pelo Mestre', data: { adulterado: true }, expectedRevision: registroAtualizado.revision }),
  });
  assert.equal(editarMestre.status, 404);

  const salvarVersaoAntiga = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Versão antiga', data: { sobrescrito: true }, expectedRevision: personagem.revision }),
  });
  assert.equal(salvarVersaoAntiga.status, 409);

  const confirmarIntegridade = await fetch(url + '/api/personagens/' + personagem.id, { headers: jogador.headers });
  assert.equal(confirmarIntegridade.status, 200);
  const registroIntegro = await confirmarIntegridade.json();
  assert.equal(registroIntegro.personagem.name, 'Claire Redfield');
  assert.equal(registroIntegro.personagem.revision, registroAtualizado.revision);
  assert.deepEqual(registroIntegro.personagem.data, { ...dados, origem: 'Policial', identidade: { ...dados.identidade, historia: 'Sobreviveu ao incidente.' } });
  const listaMestre = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', { headers: mestre.headers });
  assert.equal(listaMestre.status, 404);

  const nomeInvalido = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: ' ', data: {} }),
  });
  assert.equal(nomeInvalido.status, 422);
});

test('duas gravações simultâneas da mesma revisão não se sobrescrevem', async t => {
  const { url, app } = await criarServidor(t);
  const mestre = await criarConta(url, 'mestre-concorrencia-atomica@example.test');
  const jogador = await criarConta(url, 'jogador-concorrencia-atomica@example.test');
  const mesaResposta = await fetch(url + '/api/mesas', {
    method: 'POST',
    headers: { ...mestre.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mesa de gravação concorrente' }),
  });
  assert.equal(mesaResposta.status, 201);
  const { mesa } = await mesaResposta.json();
  app.db.prepare('INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)')
    .run(mesa.id, jogador.account.id, 'jogador', new Date().toISOString());

  const criacao = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Claire', data: { pv: 10, origem: 'Civil' } }),
  });
  assert.equal(criacao.status, 201);
  const { personagem } = await criacao.json();

  const gravacoes = await Promise.all([
    fetch(url + '/api/personagens/' + personagem.id, {
      method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Claire A', data: { pv: 9, origem: 'Civil' }, expectedRevision: personagem.revision }),
    }),
    fetch(url + '/api/personagens/' + personagem.id, {
      method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Claire B', data: { pv: 8, origem: 'Civil' }, expectedRevision: personagem.revision }),
    }),
  ]);
  assert.deepEqual(gravacoes.map(resposta => resposta.status).sort(), [200, 409]);

  const consulta = await fetch(url + '/api/personagens/' + personagem.id, { headers: jogador.headers });
  assert.equal(consulta.status, 200);
  const { personagem: salvo } = await consulta.json();
  assert.equal(salvo.revision, personagem.revision + 1);
  assert.ok(['Claire A', 'Claire B'].includes(salvo.name));
  assert.equal(salvo.data.pv, salvo.name === 'Claire A' ? 9 : 8);
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


test('limita a três rascunhos por jogador na mesma Mesa', async t => {
  const { app, url } = await criarServidor(t);
  const mestre = await criarConta(url, 'mestre-limite-rascunhos@example.test');
  const jogador = await criarConta(url, 'jogador-limite-rascunhos@example.test');
  const respostaMesa = await fetch(url + '/api/mesas', {
    method: 'POST',
    headers: { ...mestre.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mesa dos três rascunhos' }),
  });
  assert.equal(respostaMesa.status, 201);
  const { mesa } = await respostaMesa.json();
  app.db.prepare('INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)')
    .run(mesa.id, jogador.account.id, 'jogador', new Date().toISOString());

  for (let i = 1; i <= 3; i += 1) {
    const resposta = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', {
      method: 'POST',
      headers: { ...jogador.headers, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Rascunho ' + i, data: { ordem: i } }),
    });
    assert.equal(resposta.status, 201);
  }

  const quarto = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Quarto rascunho', data: {} }),
  });
  assert.equal(quarto.status, 409);
  assert.equal((await quarto.json()).error, 'Você já possui o limite de três rascunhos nesta Mesa.');

  const lista = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', { headers: jogador.headers });
  assert.equal(lista.status, 200);
  assert.equal((await lista.json()).personagens.length, 3);
});

test('somente o jogador proprietário pode excluir seu rascunho', async t => {
  const { url, app } = await criarServidor(t);
  const mestre = await criarConta(url, 'mestre-exclusao-rascunho@example.test');
  const jogador = await criarConta(url, 'jogador-exclusao-rascunho@example.test');
  const terceiro = await criarConta(url, 'terceiro-exclusao-rascunho@example.test');
  const respostaMesa = await fetch(url + '/api/mesas', { method: 'POST', headers: { ...mestre.headers, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Mesa exclusão de rascunho' }) });
  assert.equal(respostaMesa.status, 201);
  const { mesa } = await respostaMesa.json();
  app.db.prepare('INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)').run(mesa.id, jogador.account.id, 'jogador', new Date().toISOString());
  const criacao = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', { method: 'POST', headers: { ...jogador.headers, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Rascunho descartável', data: { origem: 'Civil' } }) });
  assert.equal(criacao.status, 201);
  const { personagem } = await criacao.json();
  for (const headers of [terceiro.headers, mestre.headers]) {
    const negada = await fetch(url + '/api/personagens/' + personagem.id, { method: 'DELETE', headers });
    assert.equal(negada.status, 404);
  }
  const aindaExiste = await fetch(url + '/api/personagens/' + personagem.id, { headers: jogador.headers });
  assert.equal(aindaExiste.status, 200);
  const excluir = await fetch(url + '/api/personagens/' + personagem.id, { method: 'DELETE', headers: jogador.headers });
  assert.equal(excluir.status, 200);
  assert.deepEqual(await excluir.json(), { deleted: true, id: personagem.id });
  const consultar = await fetch(url + '/api/personagens/' + personagem.id, { headers: jogador.headers });
  assert.equal(consultar.status, 404);
  const lista = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', { headers: jogador.headers });
  assert.equal(lista.status, 200);
  assert.equal((await lista.json()).personagens.length, 0);
});


test('migration 11 prepara ciclo de ativação sem alterar rascunhos legados', async t => {
  const { app, url } = await criarServidor(t);
  const mestre = await criarConta(url, 'mestre-migration-ativacao@example.test');
  const jogador = await criarConta(url, 'jogador-migration-ativacao@example.test');
  const mesaResposta = await fetch(url + '/api/mesas', { method: 'POST', headers: { ...mestre.headers, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Mesa migration ativação' }) });
  assert.equal(mesaResposta.status, 201);
  const { mesa } = await mesaResposta.json();
  app.db.prepare('INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)').run(mesa.id, jogador.account.id, 'jogador', new Date().toISOString());
  const criacao = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', { method: 'POST', headers: { ...jogador.headers, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Rascunho preservado', data: { classe: 'Agente' } }) });
  assert.equal(criacao.status, 201);
  const { personagem } = await criacao.json();
  assert.equal(app.db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get().version, 11);
  const colunas = app.db.prepare('PRAGMA table_info(personagens_locais)').all().map(c => c.name);
  assert.ok(colunas.includes('estado_ficha'));
  assert.ok(colunas.includes('inventario_json'));
  const legado = app.db.prepare('SELECT estado_ficha, inventario_json FROM personagens_locais WHERE id = ?').get(personagem.id);
  assert.equal(legado.estado_ficha, 'rascunho');
  assert.equal(legado.inventario_json, null);
  assert.throws(() => app.db.prepare("UPDATE personagens_locais SET estado_ficha = 'completa' WHERE id = ?").run(personagem.id), /Ativação exige inventário e recibo/);
  const operacao = '8d8b1a25-8b8f-4e1c-9d1a-5b21d9f2a301';
  const agora = new Date().toISOString();
  app.db.prepare('UPDATE personagens_locais SET inventario_json = ? WHERE id = ?').run(JSON.stringify({ personagemId: personagem.id, revisao: 1, capacidade: 5, itens: [] }), personagem.id);
  app.db.prepare('INSERT INTO ativacoes_personagem_locais (personagem_id, operacao_id, revisao_ficha, revisao_criacao, quantidade_instancias, criada_em) VALUES (?, ?, ?, ?, ?, ?)').run(personagem.id, operacao, 1, 2, 0, agora);
  app.db.prepare("UPDATE personagens_locais SET estado_ficha = 'completa' WHERE id = ?").run(personagem.id);
  assert.equal(app.db.prepare('SELECT estado_ficha FROM personagens_locais WHERE id = ?').get(personagem.id).estado_ficha, 'completa');
  assert.throws(() => app.db.prepare("UPDATE personagens_locais SET estado_ficha = 'rascunho' WHERE id = ?").run(personagem.id), /não pode voltar a rascunho/);
  assert.throws(() => app.db.prepare('UPDATE personagens_locais SET inventario_json = NULL WHERE id = ?').run(personagem.id), /não pode perder o inventário/);
});
