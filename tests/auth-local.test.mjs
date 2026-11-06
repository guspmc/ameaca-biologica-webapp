import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../server/index.mjs';
import { WebSocket } from 'ws';
import { consumirTicketWebSocketLocal } from '../server/auth-local.mjs';

async function setup(t) {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-auth-local-'));
  const app = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await app.listen();
  const servidores = new Set([app]);
  const servidoresFechados = new WeakSet();
  const fecharServidor = async servidor => {
    if (servidoresFechados.has(servidor)) return;
    await servidor.close();
    servidoresFechados.add(servidor);
  };
  const fechar = () => fecharServidor(app);
  const registrarServidor = servidor => {
    servidores.add(servidor);
    return () => fecharServidor(servidor);
  };
  t.after(async () => {
    for (const servidor of servidores) await fecharServidor(servidor);
    await rm(dataDir, { recursive: true, force: true });
  });
  return { base: `http://127.0.0.1:${app.address.port}`, app, dataDir, fechar, registrarServidor };
}
async function abrirWebSocket(url, origin) {
  const origem = origin ?? new URL(url.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:')).origin;
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { headers: { Origin: origem } });
    let concluido = false;
    const primeiraMensagem = new Promise((resolveMensagem, rejectMensagem) => {
      ws.once('message', dados => resolveMensagem(JSON.parse(dados.toString('utf8'))));
      ws.once('error', rejectMensagem);
    });
    ws.once('open', () => {
      concluido = true;
      resolve({ ws, status: 101, primeiraMensagem });
    });
    ws.once('unexpected-response', (_req, resposta) => {
      concluido = true;
      resposta.resume();
      resolve({ ws: null, status: resposta.statusCode });
    });
    ws.once('error', erro => {
      if (!concluido) reject(erro);
    });
  });
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
  assert.equal((await post(base, '/api/auth/register', { email: 'curta@example.test', password: 'cur' })).status, 422);
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

test('cadastro e login locais não bloqueiam novas tentativas por IP', async t => {
  const { base } = await setup(t);
  for (let i = 0; i < 7; i += 1) {
    const resposta = await post(base, '/api/auth/register', { email: 'email-invalido', password: 'senha-local-comprida-2026' });
    assert.equal(resposta.status, 422);
  }
  const login = await post(base, '/api/auth/login', { email: 'nao-existe@example.test', password: 'senha-local-comprida-2026' });
  assert.equal(login.status, 401);
  assert.notEqual(login.status, 429);
});

test('registra a migração de autenticação uma única vez', async t => {
  const { app, dataDir, fechar, registrarServidor } = await setup(t);
  assert.deepEqual(
    app.db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(row => row.version),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
  await fechar();

  const reiniciado = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await reiniciado.listen();
  registrarServidor(reiniciado);
  assert.deepEqual(
    reiniciado.db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(row => row.version),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
});

test('migração 7 recupera o registro se a tabela de personagens já existir', async t => {
  const { app, dataDir, fechar, registrarServidor } = await setup(t);
  const agora = new Date().toISOString();
  app.db.prepare('INSERT INTO contas_locais (id, email, senha_salt, senha_hash, criada_em) VALUES (?, ?, ?, ?, ?)')
    .run('conta-migracao-7', 'migracao-7@example.test', 'salt', 'hash', agora);
  app.db.prepare('INSERT INTO mesas (id, nome, criada_por, criada_em) VALUES (?, ?, ?, ?)')
    .run('mesa-migracao-7', 'Mesa migração 7', 'conta-migracao-7', agora);
  app.db.prepare('INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)')
    .run('mesa-migracao-7', 'conta-migracao-7', 'jogador', agora);
  app.db.prepare(`
    INSERT INTO personagens_locais
      (id, mesa_id, conta_id, nome, dados_json, criada_em, atualizada_em)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('personagem-migracao-7', 'mesa-migracao-7', 'conta-migracao-7', 'Claire', '{"atributos":{}}', agora, agora);

  app.db.exec(`
    BEGIN IMMEDIATE;
    ALTER TABLE personagens_locais RENAME TO personagens_locais_com_revisao;
    CREATE TABLE personagens_locais (
      id TEXT PRIMARY KEY,
      mesa_id TEXT NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
      conta_id TEXT NOT NULL REFERENCES contas_locais(id) ON DELETE CASCADE,
      nome TEXT NOT NULL CHECK (length(trim(nome)) BETWEEN 1 AND 80),
      dados_json TEXT NOT NULL CHECK (json_valid(dados_json) AND json_type(dados_json) = 'object'),
      criada_em TEXT NOT NULL,
      atualizada_em TEXT NOT NULL,
      FOREIGN KEY (mesa_id, conta_id)
        REFERENCES participantes_mesa(mesa_id, conta_id) ON DELETE CASCADE
    );
    INSERT INTO personagens_locais
      (id, mesa_id, conta_id, nome, dados_json, criada_em, atualizada_em)
    SELECT id, mesa_id, conta_id, nome, dados_json, criada_em, atualizada_em
    FROM personagens_locais_com_revisao;
    DROP TABLE personagens_locais_com_revisao;
    CREATE INDEX idx_personagens_mesa_conta_atualizacao
      ON personagens_locais(mesa_id, conta_id, atualizada_em DESC);
    DELETE FROM schema_migrations WHERE version >= 7;
    COMMIT;
  `);
  await fechar();

  const reiniciado = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await reiniciado.listen();
  registrarServidor(reiniciado);

  assert.deepEqual(
    reiniciado.db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(row => row.version),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
  const personagemMigrado = reiniciado.db.prepare('SELECT nome, revisao FROM personagens_locais WHERE id = ?').get('personagem-migracao-7');
  assert.equal(personagemMigrado.nome, 'Claire');
  assert.equal(personagemMigrado.revisao, 1);
});

test('preserva conta e sessão existentes ao reiniciar o servidor e reaplicar migrações', async t => {
  const { base, app, dataDir, fechar, registrarServidor } = await setup(t);
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
  registrarServidor(reiniciado);
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
  ).all('conta-teste').map(registro => ({ ...registro }));
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

test('logout revoga tickets WebSocket ainda não consumidos da sessão', async t => {
  const { base, app } = await setup(t);
  const credentials = { email: 'revogar-ws@example.test', password: 'senha-local-comprida-2026' };
  assert.equal((await post(base, '/api/auth/register', credentials)).status, 201);
  const login = await post(base, '/api/auth/login', credentials);
  const { token } = await login.json();
  const emissao = await post(base, '/api/auth/ws-ticket', {}, token);
  assert.equal(emissao.status, 201);
  const { ticket } = await emissao.json();

  assert.equal((await post(base, '/api/auth/logout', {}, token)).status, 200);
  assert.equal(consumirTicketWebSocketLocal(app.db, ticket), null);
  assert.equal(app.db.prepare('SELECT COUNT(*) AS total FROM tickets_websocket_locais').get().total, 0);
});

test('handshake WebSocket exige ticket, valida origem, uso único e sessão ativa', async t => {
  const { base, app } = await setup(t);
  const wsBase = base.replace(/^http/, 'ws');
  const credentials = { email: 'handshake@example.test', password: 'senha-local-comprida-2026' };
  assert.equal((await post(base, '/api/auth/register', credentials)).status, 201);
  const login = await post(base, '/api/auth/login', credentials);
  const { token } = await login.json();

  const semTicket = await abrirWebSocket(wsBase + '/ws');
  assert.equal(semTicket.status, 401);

  const emitir = async () => {
    const resposta = await post(base, '/api/auth/ws-ticket', {}, token);
    assert.equal(resposta.status, 201);
    return (await resposta.json()).ticket;
  };

  const ticket = await emitir();
  const origemErrada = await abrirWebSocket(wsBase + '/ws?ticket=' + ticket, 'http://outro-host.example');
  assert.equal(origemErrada.status, 403);

  const conexao = await abrirWebSocket(wsBase + '/ws?ticket=' + ticket);
  assert.equal(conexao.status, 101);
  const primeiraMensagem = await conexao.primeiraMensagem;
  assert.equal(primeiraMensagem.type, 'ready');
  conexao.ws.close();

  const repetido = await abrirWebSocket(wsBase + '/ws?ticket=' + ticket);
  assert.equal(repetido.status, 401);

  const ticketExpirado = await emitir();
  app.db.prepare("UPDATE tickets_websocket_locais SET expira_em = ?").run(new Date(Date.now() - 1000).toISOString());
  const expirado = await abrirWebSocket(wsBase + '/ws?ticket=' + ticketExpirado);
  assert.equal(expirado.status, 401);

  const ticketRevogado = await emitir();
  assert.equal((await post(base, '/api/auth/logout', {}, token)).status, 200);
  const aposLogout = await abrirWebSocket(wsBase + '/ws?ticket=' + ticketRevogado);
  assert.equal(aposLogout.status, 401);
});

test('WebSocket limita assinaturas às Mesas autorizadas e envia somente invalidações', async t => {
  const { base } = await setup(t);
  const senha = 'senha-local-comprida-2026';
  const entrar = async email => {
    assert.equal((await post(base, '/api/auth/register', { email, password: senha })).status, 201);
    const login = await post(base, '/api/auth/login', { email, password: senha });
    return (await login.json()).token;
  };
  const tokenMestre = await entrar('mestre-eventos@example.test');
  const tokenJogador = await entrar('jogador-eventos@example.test');
  const tokenIntruso = await entrar('intruso-eventos@example.test');
  const { mesa } = await (await post(base, '/api/mesas', { name: 'Mesa eventos' }, tokenMestre)).json();
  const { invitation } = await (await post(base, `/api/mesas/${mesa.id}/convites`, {}, tokenMestre)).json();

  const conectar = async token => {
    const ticketResposta = await post(base, '/api/auth/ws-ticket', {}, token);
    assert.equal(ticketResposta.status, 201);
    const { ticket } = await ticketResposta.json();
    const conexao = await abrirWebSocket(base.replace(/^http/, 'ws') + '/ws?ticket=' + ticket);
    assert.equal(conexao.status, 101);
    assert.equal((await conexao.primeiraMensagem).type, 'ready');
    return conexao.ws;
  };
  const mestre = await conectar(tokenMestre);
  const jogador = await conectar(tokenJogador);
  const intruso = await conectar(tokenIntruso);
  t.after(() => { mestre.close(); jogador.close(); intruso.close(); });

  const receber = (ws, tipo) => new Promise((resolve, reject) => {
    const temporizador = setTimeout(() => {
      ws.off('message', aoReceber);
      reject(new Error('Tempo esgotado aguardando evento ' + tipo));
    }, 1500);
    const aoReceber = dados => {
      const mensagem = JSON.parse(dados.toString('utf8'));
      if (mensagem.type !== tipo) return;
      clearTimeout(temporizador);
      ws.off('message', aoReceber);
      resolve(mensagem);
    };
    ws.on('message', aoReceber);
  });

  const inscricaoMestre = receber(mestre, 'subscribed');
  mestre.send(JSON.stringify({ type: 'subscribe', mesaId: mesa.id }));
  assert.deepEqual(await inscricaoMestre, { type: 'subscribed', mesaId: mesa.id });

  const inscricaoJogadorAntes = receber(jogador, 'subscription.denied');
  jogador.send(JSON.stringify({ type: 'subscribe', mesaId: mesa.id }));
  assert.deepEqual(await inscricaoJogadorAntes, { type: 'subscription.denied' });

  const inscricaoIntruso = receber(intruso, 'subscription.denied');
  intruso.send(JSON.stringify({ type: 'subscribe', mesaId: mesa.id }));
  assert.deepEqual(await inscricaoIntruso, { type: 'subscription.denied' });

  const eventoPedido = receber(mestre, 'mesa.changed');
  const pedidoResposta = await post(base, '/api/convites/solicitar', { code: invitation.code }, tokenJogador);
  assert.equal(pedidoResposta.status, 202);
  const { request } = await pedidoResposta.json();
  const invalidacaoPedido = await eventoPedido;
  assert.equal(invalidacaoPedido.mesaId, mesa.id);
  assert.equal(invalidacaoPedido.change, 'requests.changed');
  assert.deepEqual(Object.keys(invalidacaoPedido).sort(), ['change', 'mesaId', 'type']);

  const eventoJogador = receber(jogador, 'account.changed');
  const aprovar = await post(base, `/api/mesas/${mesa.id}/solicitacoes/${request.id}/aprovar`, {}, tokenMestre);
  assert.equal(aprovar.status, 200);
  assert.deepEqual(await eventoJogador, { type: 'account.changed' });

  const inscricaoJogadorDepois = receber(jogador, 'subscribed');
  jogador.send(JSON.stringify({ type: 'subscribe', mesaId: mesa.id }));
  assert.deepEqual(await inscricaoJogadorDepois, { type: 'subscribed', mesaId: mesa.id });

  const eventoRascunho = receber(jogador, 'account.changed');
  const criar = await post(base, `/api/mesas/${mesa.id}/personagens`, { name: 'Claire', data: {} }, tokenJogador);
  assert.equal(criar.status, 201);
  assert.deepEqual(await eventoRascunho, { type: 'account.changed' });

  const fechamento = new Promise(resolve => intruso.once('close', codigo => resolve(codigo)));
  assert.equal((await post(base, '/api/auth/logout', {}, tokenIntruso)).status, 200);
  assert.equal(await fechamento, 4001);
});

test('ticket WebSocket inválido ou desconhecido não autentica conexão', async t => {
  const { app } = await setup(t);
  assert.equal(consumirTicketWebSocketLocal(app.db, 'ticket-invalido'), null);
  assert.equal(consumirTicketWebSocketLocal(app.db, 'A'.repeat(43)), null);
});

test('convite privado exige Mestre e aprovação antes de conceder acesso à Mesa', async t => {
  const { base } = await setup(t);
  const senha = 'senha-local-comprida-2026';
  const entrar = async email => {
    assert.equal((await post(base, '/api/auth/register', { email, password: senha })).status, 201);
    const login = await post(base, '/api/auth/login', { email, password: senha });
    return (await login.json()).token;
  };
  const tokenMestre = await entrar('mestre-convite@example.test');
  const tokenJogador = await entrar('jogador-convite@example.test');
  const criarMesa = await post(base, '/api/mesas', { name: 'Mesa privada' }, tokenMestre);
  const { mesa } = await criarMesa.json();
  assert.equal((await post(base, `/api/mesas/${mesa.id}/convites`, {}, tokenJogador)).status, 404);
  const conviteResposta = await post(base, `/api/mesas/${mesa.id}/convites`, {}, tokenMestre);
  assert.equal(conviteResposta.status, 201);
  const { invitation } = await conviteResposta.json();
  assert.match(invitation.code, /^[A-Za-z0-9_-]{40,100}$/);
  assert.equal((await post(base, '/api/convites/solicitar', { code: 'codigo-invalido' }, tokenJogador)).status, 404);
  const pedido = await post(base, '/api/convites/solicitar', { code: invitation.code }, tokenJogador);
  assert.equal(pedido.status, 202);
  const { request } = await pedido.json();
  assert.equal(request.status, 'pendente');
  assert.equal((await post(base, '/api/convites/solicitar', { code: invitation.code }, tokenJogador)).status, 409);
  assert.deepEqual((await (await fetch(base + '/api/mesas', { headers: { authorization: `Bearer ${tokenJogador}` } })).json()).mesas, []);
  assert.equal((await fetch(base + `/api/mesas/${mesa.id}`, { headers: { authorization: `Bearer ${tokenJogador}` } })).status, 404);
  const lista = await fetch(base + `/api/mesas/${mesa.id}/solicitacoes`, { headers: { authorization: `Bearer ${tokenMestre}` } });
  assert.equal(lista.status, 200);
  assert.equal((await lista.json()).requests[0].id, request.id);
  assert.equal((await post(base, `/api/mesas/${mesa.id}/solicitacoes/${request.id}/aprovar`, {}, tokenJogador)).status, 404);
  const aprovar = await post(base, `/api/mesas/${mesa.id}/solicitacoes/${request.id}/aprovar`, {}, tokenMestre);
  assert.equal(aprovar.status, 200);
  assert.equal((await aprovar.json()).request.status, 'aprovada');
  const detalhe = await fetch(base + `/api/mesas/${mesa.id}`, { headers: { authorization: `Bearer ${tokenJogador}` } });
  assert.equal(detalhe.status, 200);
  assert.equal((await detalhe.json()).mesa.role, 'jogador');
});

test('permite nova solicitação após recusa com convite válido e preserva o histórico', async t => {
  const { base, app } = await setup(t);
  const senha = 'senha-local-comprida-2026';
  const entrar = async email => {
    assert.equal((await post(base, '/api/auth/register', { email, password: senha })).status, 201);
    const login = await post(base, '/api/auth/login', { email, password: senha });
    return (await login.json()).token;
  };
  const tokenMestre = await entrar('mestre-reconvite@example.test');
  const tokenJogador = await entrar('jogador-reconvite@example.test');
  const { mesa } = await (await post(base, '/api/mesas', { name: 'Mesa nova tentativa' }, tokenMestre)).json();

  const { invitation: primeiroConvite } = await (await post(base, `/api/mesas/${mesa.id}/convites`, {}, tokenMestre)).json();
  const primeiraResposta = await post(base, '/api/convites/solicitar', { code: primeiroConvite.code }, tokenJogador);
  assert.equal(primeiraResposta.status, 202);
  const { request: primeira } = await primeiraResposta.json();

  const recusa = await post(base, `/api/mesas/${mesa.id}/solicitacoes/${primeira.id}/recusar`, {}, tokenMestre);
  assert.equal(recusa.status, 200);
  assert.equal((await recusa.json()).request.status, 'recusada');

  const { invitation: segundoConvite } = await (await post(base, `/api/mesas/${mesa.id}/convites`, {}, tokenMestre)).json();
  const segundaResposta = await post(base, '/api/convites/solicitar', { code: segundoConvite.code }, tokenJogador);
  assert.equal(segundaResposta.status, 202);
  const { request: segunda } = await segundaResposta.json();
  assert.notEqual(segunda.id, primeira.id);

  const duplicada = await post(base, '/api/convites/solicitar', { code: segundoConvite.code }, tokenJogador);
  assert.equal(duplicada.status, 409);
  assert.equal((await duplicada.json()).error, 'Sua solicitação já está pendente.');

  const historico = app.db.prepare(
    'SELECT id, status FROM solicitacoes_mesa_locais WHERE mesa_id = ? AND conta_id = ? ORDER BY criada_em, id'
  ).all(mesa.id, (await (await fetch(base + '/api/auth/me', { headers: { authorization: `Bearer ${tokenJogador}` } })).json()).account.id);
  assert.deepEqual(historico.map(item => item.status), ['recusada', 'pendente']);
  assert.notEqual(historico[0].id, historico[1].id);

  const pendentes = await fetch(base + `/api/mesas/${mesa.id}/solicitacoes`, {
    headers: { authorization: `Bearer ${tokenMestre}` },
  });
  assert.equal(pendentes.status, 200);
  const { requests } = await pendentes.json();
  assert.deepEqual(requests.map(item => item.id), [segunda.id]);
});

test('renovar convite invalida o anterior e revogar impede novos pedidos sem afetar membros', async t => {
  const { base } = await setup(t);
  const senha = 'senha-local-comprida-2026';
  const entrar = async email => {
    assert.equal((await post(base, '/api/auth/register', { email, password: senha })).status, 201);
    const login = await post(base, '/api/auth/login', { email, password: senha });
    return (await login.json()).token;
  };
  const tokenMestre = await entrar('mestre-renovacao@example.test');
  const tokenJogador = await entrar('jogador-renovacao@example.test');
  const tokenIntruso = await entrar('intruso-renovacao@example.test');
  const { mesa } = await (await post(base, '/api/mesas', { name: 'Mesa convites' }, tokenMestre)).json();

  const primeiro = await (await post(base, `/api/mesas/${mesa.id}/convites`, {}, tokenMestre)).json();
  const pedidoPrimeiro = await post(base, '/api/convites/solicitar', { code: primeiro.invitation.code }, tokenJogador);
  assert.equal(pedidoPrimeiro.status, 202);
  const { request } = await pedidoPrimeiro.json();
  assert.equal((await post(base, `/api/mesas/${mesa.id}/solicitacoes/${request.id}/aprovar`, {}, tokenMestre)).status, 200);

  const segundoResposta = await post(base, `/api/mesas/${mesa.id}/convites`, {}, tokenMestre);
  assert.equal(segundoResposta.status, 201);
  const { invitation: segundo } = await segundoResposta.json();
  assert.notEqual(segundo.code, primeiro.invitation.code);
  assert.equal((await post(base, '/api/convites/solicitar', { code: primeiro.invitation.code }, tokenIntruso)).status, 404);
  assert.equal((await post(base, '/api/convites/solicitar', { code: segundo.code }, tokenIntruso)).status, 202);

  const revogar = await fetch(base + `/api/mesas/${mesa.id}/convites/ativo`, {
    method: 'DELETE', headers: { authorization: `Bearer ${tokenMestre}` },
  });
  assert.equal(revogar.status, 200);
  assert.deepEqual(await revogar.json(), { revoked: true });
  assert.equal((await post(base, '/api/convites/solicitar', { code: segundo.code }, await entrar('outro-intruso@example.test'))).status, 404);

  const semAtivo = await fetch(base + `/api/mesas/${mesa.id}/convites/ativo`, {
    method: 'DELETE', headers: { authorization: `Bearer ${tokenMestre}` },
  });
  assert.deepEqual(await semAtivo.json(), { revoked: false });
  const detalheMembro = await fetch(base + `/api/mesas/${mesa.id}`, { headers: { authorization: `Bearer ${tokenJogador}` } });
  assert.equal(detalheMembro.status, 200);
  assert.equal((await detalheMembro.json()).mesa.role, 'jogador');

  const naoMestre = await fetch(base + `/api/mesas/${mesa.id}/convites/ativo`, {
    method: 'DELETE', headers: { authorization: `Bearer ${tokenJogador}` },
  });
  assert.equal(naoMestre.status, 404);
});

test('aprovação de ingresso respeita limite de dez jogadores no servidor', async t => {
  const { base, app } = await setup(t);
  const senha = 'senha-local-comprida-2026';
  const entrar = async email => {
    assert.equal((await post(base, '/api/auth/register', { email, password: senha })).status, 201);
    const login = await post(base, '/api/auth/login', { email, password: senha });
    return (await login.json()).token;
  };
  const tokenMestre = await entrar('mestre-limite@example.test');
  const tokenSolicitante = await entrar('solicitante-limite@example.test');
  const { mesa } = await (await post(base, '/api/mesas', { name: 'Mesa cheia' }, tokenMestre)).json();
  const { invitation } = await (await post(base, `/api/mesas/${mesa.id}/convites`, {}, tokenMestre)).json();
  const pedido = await post(base, '/api/convites/solicitar', { code: invitation.code }, tokenSolicitante);
  const { request } = await pedido.json();
  const agora = new Date().toISOString();
  for (let i = 0; i < 10; i += 1) {
    const id = `jogador-limite-${i}`;
    app.db.prepare('INSERT INTO contas_locais (id, email, senha_salt, senha_hash, criada_em) VALUES (?, ?, ?, ?, ?)').run(id, `${id}@example.test`, 'salt', 'hash', agora);
    app.db.prepare("INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, 'jogador', ?)").run(mesa.id, id, agora);
  }
  const resposta = await post(base, `/api/mesas/${mesa.id}/solicitacoes/${request.id}/aprovar`, {}, tokenMestre);
  assert.equal(resposta.status, 409);
  assert.equal((await resposta.json()).error, 'Esta Mesa já atingiu o limite de 10 jogadores.');
  assert.equal(app.db.prepare("SELECT status FROM solicitacoes_mesa_locais WHERE id = ?").get(request.id).status, 'pendente');
});

test('rotas antigas de eventos demonstrativos ficam desativadas', async t => {
  const { base } = await setup(t);
  assert.equal((await fetch(base + '/api/events')).status, 410);
  assert.equal((await post(base, '/api/events', { message: 'teste' })).status, 410);
});

test('LAN: aprovacoes concorrentes disputando a ultima vaga nao excedem dez jogadores', async t => {
  const { base, app } = await setup(t);
  const senha = 'senha-local-comprida-2026';
  const registrar = async email => {
    const cadastro = await post(base, '/api/auth/register', { email, password: senha });
    assert.equal(cadastro.status, 201);
    const login = await post(base, '/api/auth/login', { email, password: senha });
    assert.equal(login.status, 200);
    return (await login.json()).token;
  };

  const tokenMestre = await registrar('mestre-concorrencia-lan@example.test');
  const tokenA = await registrar('jogador-a-concorrencia-lan@example.test');
  const tokenB = await registrar('jogador-b-concorrencia-lan@example.test');
  const criarMesa = await post(base, '/api/mesas', { name: 'Mesa concorrente' }, tokenMestre);
  assert.equal(criarMesa.status, 201);
  const { mesa } = await criarMesa.json();

  const convite = await post(base, `/api/mesas/${mesa.id}/convites`, {}, tokenMestre);
  assert.equal(convite.status, 201);
  const codigo = (await convite.json()).invitation.code;
  const solicitacaoA = await post(base, '/api/convites/solicitar', { code: codigo }, tokenA);
  const solicitacaoB = await post(base, '/api/convites/solicitar', { code: codigo }, tokenB);
  assert.equal(solicitacaoA.status, 202);
  assert.equal(solicitacaoB.status, 202);
  const pedidoA = (await solicitacaoA.json()).request;
  const pedidoB = (await solicitacaoB.json()).request;

  // Nove jogadores existentes; somente uma vaga permanece disponível.
  const agora = new Date().toISOString();
  const inserirConta = app.db.prepare(
    'INSERT INTO contas_locais (id, email, senha_salt, senha_hash, criada_em) VALUES (?, ?, ?, ?, ?)'
  );
  const inserirParticipante = app.db.prepare(
    "INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, 'jogador', ?)"
  );
  for (let i = 0; i < 9; i += 1) {
    const id = 'concorrencia-lan-' + i;
    inserirConta.run(id, id + '@example.test', 'salt', 'hash', agora);
    inserirParticipante.run(mesa.id, id, agora);
  }

  const resultados = await Promise.all([
    post(base, `/api/mesas/${mesa.id}/solicitacoes/${pedidoA.id}/aprovar`, {}, tokenMestre),
    post(base, `/api/mesas/${mesa.id}/solicitacoes/${pedidoB.id}/aprovar`, {}, tokenMestre),
  ]);
  assert.deepEqual(resultados.map(resposta => resposta.status).sort(), [200, 409]);

  const total = app.db.prepare(
    "SELECT COUNT(*) AS total FROM participantes_mesa WHERE mesa_id = ? AND papel = 'jogador'"
  ).get(mesa.id).total;
  assert.equal(total, 10); // nove existentes + somente um dos dois candidatos
  const statusA = app.db.prepare('SELECT status FROM solicitacoes_mesa_locais WHERE id = ?').get(pedidoA.id).status;
  const statusB = app.db.prepare('SELECT status FROM solicitacoes_mesa_locais WHERE id = ?').get(pedidoB.id).status;
  assert.deepEqual([statusA, statusB].sort(), ['aprovada', 'pendente']);
});



test('cookie HttpOnly restaura a sessão após reiniciar o servidor', async t => {
  const { base, dataDir, fechar, registrarServidor } = await setup(t);
  const credentials = { email: 'cookie@example.test', password: 'senha-local-comprida-2026' };
  assert.equal((await post(base, '/api/auth/register', credentials)).status, 201);

  const login = await post(base, '/api/auth/login', credentials);
  assert.equal(login.status, 200);
  const cookieCompleto = login.headers.get('set-cookie');
  assert.match(cookieCompleto ?? '', /ab_local_session=.*HttpOnly/i);
  assert.match(cookieCompleto ?? '', /SameSite=Strict/i);
  const cookie = cookieCompleto.split(';')[0];

  const meAntes = await fetch(base + '/api/auth/me', { headers: { cookie } });
  assert.equal(meAntes.status, 200);
  const dadosAntes = await meAntes.json();
  assert.equal(dadosAntes.account.email, credentials.email);
  assert.ok(dadosAntes.expiresAt);

  await fechar();
  const reiniciado = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await reiniciado.listen();
  registrarServidor(reiniciado);

  const meDepois = await fetch('http://127.0.0.1:' + reiniciado.address.port + '/api/auth/me', {
    headers: { cookie },
  });
  assert.equal(meDepois.status, 200);
  assert.equal((await meDepois.json()).account.email, credentials.email);

  const logout = await fetch('http://127.0.0.1:' + reiniciado.address.port + '/api/auth/logout', {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie') ?? '', /Max-Age=0/);
  assert.equal((await fetch('http://127.0.0.1:' + reiniciado.address.port + '/api/auth/me', { headers: { cookie } })).status, 401);
});


test('aceita senha com exatamente quatro caracteres', async t => {
  const { base } = await setup(t);
  const credentials = { email: 'senha-quatro@example.test', password: '1234' };
  assert.equal((await post(base, '/api/auth/register', credentials)).status, 201);
  assert.equal((await post(base, '/api/auth/login', credentials)).status, 200);
});
