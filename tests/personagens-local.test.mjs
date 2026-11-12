import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../server/index.mjs';
import { estadoTurnoCombateInicial } from '../src/estadoTurnoCombate.ts';

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

function dadosCriacaoValida() {
  return {
    classe: 'Agente',
    origem: 'Acadêmico',
    atributos: { forca: 2, agilidade: 2, vigor: 2, astucia: 1 },
    periciaOrigemTreinada: 'Investigação',
    distribuicaoPericias: { Acrobacia: 1, Furtividade: 1, Luta: 1, Percepção: 1 },
    habilidadeBasica: 'anatomia-de-combate',
    equipamentoInicial: 'A',
  };
}

async function criarMesaComJogador(url, app, mestre, jogador, name = 'Mesa de ativação') {
  const resposta = await fetch(url + '/api/mesas', {
    method: 'POST',
    headers: { ...mestre.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  assert.equal(resposta.status, 201);
  const { mesa } = await resposta.json();
  app.db.prepare('INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)')
    .run(mesa.id, jogador.account.id, 'jogador', new Date().toISOString());
  return mesa;
}

async function criarRascunhoValido(url, jogador, mesaId, name) {
  const resposta = await fetch(url + '/api/mesas/' + mesaId + '/personagens', {
    method: 'POST',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name, data: dadosCriacaoValida() }),
  });
  assert.equal(resposta.status, 201);
  return (await resposta.json()).personagem;
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
    body: JSON.stringify({ name: 'Claire Redfield', data: { ...dados, origem: 'Policial', identidade: { ...dados.identidade, historia: 'Sobreviveu ao incidente.' }, registrosMesa: [{ id: 'evento-1', tipo: 'morte', descricao: 'O Mestre decidiu registrar a morte após avaliar a situação.', responsavel: 'Mestre', ocorridoEm: '2026-11-12T15:00:00.000Z', registradoEm: '2026-11-12T15:05:00.000Z' }] }, expectedRevision: personagem.revision }),
  });
  assert.equal(atualizar.status, 200);
  const registroAtualizado = (await atualizar.json()).personagem;
  assert.equal(registroAtualizado.name, 'Claire Redfield');
  assert.equal(registroAtualizado.revision, personagem.revision + 1);
  assert.equal(registroAtualizado.data.registrosMesa.length, 1);
  assert.equal(registroAtualizado.data.registrosMesa[0].responsavel, 'Mestre');

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
  const decisaoInvalida = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: registroAtualizado.name, data: { ...registroAtualizado.data, registrosMesa: [{ id: 'evento-ruim', tipo: 'morte', descricao: '', responsavel: 'Mestre', ocorridoEm: 'ontem', registradoEm: '2026-11-12T15:05:00.000Z' }] }, expectedRevision: registroAtualizado.revision }),
  });
  assert.equal(decisaoInvalida.status, 422);
  assert.equal(registroIntegro.personagem.revision, registroAtualizado.revision);
  assert.deepEqual(registroIntegro.personagem.data, { ...dados, origem: 'Policial', identidade: { ...dados.identidade, historia: 'Sobreviveu ao incidente.' }, registrosMesa: registroAtualizado.data.registrosMesa });
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


test('ativação LAN valida no servidor, materializa inventário uma vez e é idempotente', async t => {
  const { app, url } = await criarServidor(t);
  const mestre = await criarConta(url, 'mestre-ativacao-lan@example.test');
  const jogador = await criarConta(url, 'jogador-ativacao-lan@example.test');
  const mesa = await criarMesaComJogador(url, app, mestre, jogador);
  const rascunho = await criarRascunhoValido(url, jogador, mesa.id, 'Claire Redfield');

  const conferencia = await fetch(url + '/api/personagens/' + rascunho.id + '/conferencia', { headers: jogador.headers });
  assert.equal(conferencia.status, 200);
  const revisao = await conferencia.json();
  assert.equal(revisao.valido, true);
  assert.deepEqual(revisao.pendencias, []);
  assert.equal(revisao.revision, rascunho.revision);
  assert.equal(revisao.ativas, 0);
  assert.equal(revisao.inventario.capacidade, 6);

  const pedido = {
    expectedRevision: revisao.revision,
    operationId: '8d8b1a25-8b8f-4e1c-9d1a-5b21d9f2a301',
  };
  const ativacao = () => fetch(url + '/api/personagens/' + rascunho.id + '/ativar', {
    method: 'POST',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify(pedido),
  });
  const resposta = await ativacao();
  assert.equal(resposta.status, 200);
  const resultado = await resposta.json();
  assert.equal(resultado.personagem.status, 'completa');
  assert.equal(resultado.personagem.revision, rascunho.revision + 1);
  assert.deepEqual(resultado.personagem.data, dadosCriacaoValida());
  assert.equal(resultado.recibo.personagemId, rascunho.id);
  assert.equal(resultado.recibo.operacaoId, pedido.operationId);
  assert.equal(resultado.recibo.estado, 'completa');
  assert.equal(resultado.recibo.revisaoCriacao, rascunho.revision + 1);

  const registro = app.db.prepare('SELECT estado_ficha, inventario_json FROM personagens_locais WHERE id = ?').get(rascunho.id);
  const inventario = JSON.parse(registro.inventario_json);
  assert.equal(registro.estado_ficha, 'completa');
  assert.equal(inventario.capacidade, 6);
  assert.equal(inventario.itens.length, resultado.recibo.quantidadeInstancias);
  assert.equal(app.db.prepare('SELECT COUNT(*) AS total FROM ativacoes_personagem_locais WHERE personagem_id = ?').get(rascunho.id).total, 1);

  const repetida = await ativacao();
  assert.equal(repetida.status, 200);
  assert.deepEqual((await repetida.json()).recibo, resultado.recibo);
  assert.equal(app.db.prepare('SELECT COUNT(*) AS total FROM ativacoes_personagem_locais WHERE personagem_id = ?').get(rascunho.id).total, 1);

  const lista = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', { headers: jogador.headers });
  assert.equal((await lista.json()).personagens[0].status, 'completa');

  const alteracaoCriacao = await fetch(url + '/api/personagens/' + rascunho.id, {
    method: 'PUT',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: rascunho.name, data: { ...dadosCriacaoValida(), origem: 'Civil' }, expectedRevision: rascunho.revision + 1 }),
  });
  assert.equal(alteracaoCriacao.status, 409);

  const alteracaoRecurso = await fetch(url + '/api/personagens/' + rascunho.id, {
    method: 'PUT',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: rascunho.name, data: { ...dadosCriacaoValida(), pvAtual: 5 }, expectedRevision: rascunho.revision + 1 }),
  });
  assert.equal(alteracaoRecurso.status, 200);
  assert.equal((await alteracaoRecurso.json()).personagem.status, 'completa');

  const excluir = await fetch(url + '/api/personagens/' + rascunho.id, { method: 'DELETE', headers: jogador.headers });
  assert.equal(excluir.status, 409);
});

test('ativação recusa ficha incompleta e preserva integralmente o rascunho', async t => {
  const { app, url } = await criarServidor(t);
  const mestre = await criarConta(url, 'mestre-ativacao-invalida@example.test');
  const jogador = await criarConta(url, 'jogador-ativacao-invalida@example.test');
  const mesa = await criarMesaComJogador(url, app, mestre, jogador);
  const criacao = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Rascunho incompleto', data: { classe: 'Agente' } }),
  });
  assert.equal(criacao.status, 201);
  const { personagem } = await criacao.json();

  const resposta = await fetch(url + '/api/personagens/' + personagem.id + '/ativar', {
    method: 'POST',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ expectedRevision: 1, operationId: '8d8b1a25-8b8f-4e1c-9d1a-5b21d9f2a302' }),
  });
  assert.equal(resposta.status, 422);
  const registro = app.db.prepare('SELECT estado_ficha, inventario_json, revisao FROM personagens_locais WHERE id = ?').get(personagem.id);
  assert.equal(registro.estado_ficha, 'rascunho');
  assert.equal(registro.inventario_json, null);
  assert.equal(registro.revisao, 1);
  assert.equal(app.db.prepare('SELECT COUNT(*) AS total FROM ativacoes_personagem_locais WHERE personagem_id = ?').get(personagem.id).total, 0);
});

test('ativação exige proprietário jogador e revisão atual da ficha', async t => {
  const { app, url } = await criarServidor(t);
  const mestre = await criarConta(url, 'mestre-ativacao-acesso@example.test');
  const jogador = await criarConta(url, 'jogador-ativacao-acesso@example.test');
  const terceiro = await criarConta(url, 'terceiro-ativacao-acesso@example.test');
  const mesa = await criarMesaComJogador(url, app, mestre, jogador);
  const rascunho = await criarRascunhoValido(url, jogador, mesa.id, 'Personagem de teste');
  const corpo = { expectedRevision: 1, operationId: '8d8b1a25-8b8f-4e1c-9d1a-5b21d9f2a303' };
  for (const headers of [mestre.headers, terceiro.headers]) {
    const negada = await fetch(url + '/api/personagens/' + rascunho.id + '/ativar', {
      method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify(corpo),
    });
    assert.equal(negada.status, 404);
  }
  const atualizacao = await fetch(url + '/api/personagens/' + rascunho.id, {
    method: 'PUT',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: rascunho.name, data: dadosCriacaoValida(), expectedRevision: 1 }),
  });
  assert.equal(atualizacao.status, 200);
  const obsoleta = await fetch(url + '/api/personagens/' + rascunho.id + '/ativar', {
    method: 'POST',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  assert.equal(obsoleta.status, 409);
  assert.equal(app.db.prepare('SELECT estado_ficha FROM personagens_locais WHERE id = ?').get(rascunho.id).estado_ficha, 'rascunho');
  assert.equal(app.db.prepare('SELECT COUNT(*) AS total FROM ativacoes_personagem_locais WHERE personagem_id = ?').get(rascunho.id).total, 0);
});

test('limite de dez personagens ativas é transacional e não consome vagas de rascunho', async t => {
  const { app, url } = await criarServidor(t);
  const mestre = await criarConta(url, 'mestre-limite-ativas@example.test');
  const jogador = await criarConta(url, 'jogador-limite-ativas@example.test');
  const mesa = await criarMesaComJogador(url, app, mestre, jogador);

  for (let i = 1; i <= 10; i += 1) {
    const rascunho = await criarRascunhoValido(url, jogador, mesa.id, 'Ativa ' + i);
    const operationId = '00000000-0000-4000-8000-' + String(i).padStart(12, '0');
    const resposta = await fetch(url + '/api/personagens/' + rascunho.id + '/ativar', {
      method: 'POST',
      headers: { ...jogador.headers, 'content-type': 'application/json' },
      body: JSON.stringify({ expectedRevision: rascunho.revision, operationId }),
    });
    assert.equal(resposta.status, 200);
  }

  const ultima = await criarRascunhoValido(url, jogador, mesa.id, 'Décima primeira');
  const conferencia = await fetch(url + '/api/personagens/' + ultima.id + '/conferencia', { headers: jogador.headers });
  assert.equal((await conferencia.json()).ativas, 10);
  const bloqueada = await fetch(url + '/api/personagens/' + ultima.id + '/ativar', {
    method: 'POST',
    headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ expectedRevision: ultima.revision, operationId: '00000000-0000-4000-8000-000000000011' }),
  });
  assert.equal(bloqueada.status, 409);
  assert.equal(app.db.prepare('SELECT estado_ficha FROM personagens_locais WHERE id = ?').get(ultima.id).estado_ficha, 'rascunho');
  assert.equal(app.db.prepare("SELECT COUNT(*) AS total FROM personagens_locais WHERE mesa_id = ? AND estado_ficha = 'completa'").get(mesa.id).total, 10);
});


test('servidor LAN valida o estado integrado de Combate e recusa estado inválido', async t => {
  const { app, url } = await criarServidor(t);
  const mestre = await criarConta(url, 'mestre-turno-combate@example.test');
  const jogador = await criarConta(url, 'jogador-turno-combate@example.test');
  const mesa = await criarMesaComJogador(url, app, mestre, jogador, 'Mesa de estado de combate');
  const personagem = await criarRascunhoValido(url, jogador, mesa.id, 'Claire');
  const estado = estadoTurnoCombateInicial(3);
  const valido = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: personagem.name, data: { ...personagem.data, saAtual: 3, estadoTurnoCombate: estado }, expectedRevision: personagem.revision }),
  });
  assert.equal(valido.status, 200);
  let salvo = (await valido.json()).personagem;
  assert.deepEqual(salvo.data.estadoTurnoCombate, estado);

  const compostoLegado = {
    versao: 1,
    economia: estado.economia,
    manobras: { disparadaUsada: true, fugaUsada: true, mirarPreparado: false, combateDuasArmasUsado: false },
  };
  const legadoAceito = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: salvo.name, data: { ...salvo.data, estadoTurnoCombate: compostoLegado }, expectedRevision: salvo.revision }),
  });
  assert.equal(legadoAceito.status, 200);
  salvo = (await legadoAceito.json()).personagem;
  assert.deepEqual(salvo.data.estadoTurnoCombate, compostoLegado);

  const invalido = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: salvo.name, data: { ...salvo.data, estadoTurnoCombate: { ...estado, versao: 99 } }, expectedRevision: salvo.revision }),
  });
  assert.equal(invalido.status, 422);
  const preservado = await fetch(url + '/api/personagens/' + personagem.id, { headers: jogador.headers });
  const final = (await preservado.json()).personagem;
  assert.equal(final.revision, salvo.revision);
  assert.deepEqual(final.data.estadoTurnoCombate, compostoLegado);
});


test('servidor LAN permite editar apenas contador de Missões e protege método, Marcos e histórico', async t => {
  const { app, url } = await criarServidor(t);
  const mestre = await criarConta(url, 'mestre-progressao@example.test');
  const jogador = await criarConta(url, 'jogador-progressao@example.test');
  const mesa = await criarMesaComJogador(url, app, mestre, jogador, 'Mesa de Progressão');
  const personagem = await criarRascunhoValido(url, jogador, mesa.id, 'Claire');
  const progressao = {
    versao: 1, nivelAtual: 1, metodo: 'missoes', missoesCompletadas: 0,
    marcoNarrativoConcedido: false, missoesCompletadasNaUltimaMorte: null,
    nivelNaUltimaMorte: null, marcoNarrativoAposUltimaMorte: false,
    penalidadeMorteNivel1: false, beneficiosPorNivel: [],
  };

  const criacaoDireta = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: personagem.name, data: { ...personagem.data, nivel: 1, progressao }, expectedRevision: personagem.revision }),
  });
  assert.equal(criacaoDireta.status, 403);

  app.db.prepare('UPDATE personagens_locais SET dados_json = ? WHERE id = ?')
    .run(JSON.stringify({ ...personagem.data, nivel: 1, progressao }), personagem.id);

  const valido = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: personagem.name, data: { ...personagem.data, nivel: 1, progressao: { ...progressao, missoesCompletadas: 1 } }, expectedRevision: personagem.revision }),
  });
  assert.equal(valido.status, 200);
  const salvo = (await valido.json()).personagem;
  assert.equal(salvo.data.progressao.missoesCompletadas, 1);

  const marcoAlterado = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: salvo.name, data: { ...salvo.data, progressao: { ...salvo.data.progressao, marcoNarrativoConcedido: true } }, expectedRevision: salvo.revision }),
  });
  assert.equal(marcoAlterado.status, 403);

  const metodoAlterado = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: salvo.name, data: { ...salvo.data, progressao: { ...salvo.data.progressao, metodo: 'marco_narrativo' } }, expectedRevision: salvo.revision }),
  });
  assert.equal(metodoAlterado.status, 403);

  const nivelAlterado = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: salvo.name, data: { ...salvo.data, nivel: 2, progressao: { ...salvo.data.progressao, nivelAtual: 2 } }, expectedRevision: salvo.revision }),
  });
  assert.equal(nivelAlterado.status, 403);

  const classeAlterada = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: salvo.name, data: { ...salvo.data, classe: 'Operador' }, expectedRevision: salvo.revision }),
  });
  assert.equal(classeAlterada.status, 403);

  app.db.prepare('UPDATE personagens_locais SET dados_json = ? WHERE id = ?')
    .run(JSON.stringify({ ...salvo.data, progressao: { ...salvo.data.progressao, campoExtra: true } }), personagem.id);
  const estadoAtualCorrompido = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: salvo.name, data: salvo.data, expectedRevision: salvo.revision }),
  });
  assert.equal(estadoAtualCorrompido.status, 409);
  const preservado = await fetch(url + '/api/personagens/' + personagem.id, { headers: jogador.headers });
  const final = (await preservado.json()).personagem;
  assert.equal(final.revision, salvo.revision);
});
