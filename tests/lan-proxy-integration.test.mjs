import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { WebSocket } from 'ws';
import { createLocalServer } from '../server/index.mjs';

test('proxy LAN mantém API e WebSocket same-origin até o servidor SQLite', async t => {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-vite-lan-'));
  const servidor = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await servidor.listen();
  const baseServidor = `http://127.0.0.1:${servidor.address.port}`;
  const vite = await createViteServer({
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    mode: 'lan',
    server: {
      host: '127.0.0.1',
      port: 0,
      strictPort: false,
      proxy: {
        '/api': { target: baseServidor, changeOrigin: false },
        '/ws': { target: baseServidor.replace(/^http/, 'ws'), changeOrigin: false, ws: true },
      },
    },
  });
  await vite.listen();
  const endereco = vite.httpServer.address();
  assert.ok(endereco && typeof endereco === 'object');
  const origem = `http://127.0.0.1:${endereco.port}`;

  let socket;
  t.after(async () => {
    socket?.terminate();
    await vite.close();
    await servidor.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  const requisitar = (rota, opcoes = {}) => fetch(origem + rota, {
    ...opcoes,
    headers: { origin: origem, ...(opcoes.headers ?? {}) },
  });
  const saude = await requisitar('/api/health');
  assert.equal(saude.status, 200);
  assert.equal((await saude.json()).ok, true);

  const senha = 'senha-local-comprida-2026';
  const cadastro = await requisitar('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'proxy-lan@example.test', password: senha }),
  });
  assert.equal(cadastro.status, 201);
  const login = await requisitar('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'proxy-lan@example.test', password: senha }),
  });
  assert.equal(login.status, 200);
  const cookieCompleto = login.headers.get('set-cookie');
  assert.match(cookieCompleto ?? '', /ab_local_session=.*HttpOnly/i);
  const cookie = cookieCompleto.split(';')[0];
  const sessaoPorCookie = await requisitar('/api/auth/me', { headers: { cookie } });
  assert.equal(sessaoPorCookie.status, 200);
  const contaPorCookie = (await sessaoPorCookie.json()).account;
  assert.equal(contaPorCookie.email, 'proxy-lan@example.test');

  const criarMesa = await requisitar('/api/mesas', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ name: 'Mesa via proxy' }),
  });
  assert.equal(criarMesa.status, 201);
  const { mesa } = await criarMesa.json();
  const mesasAposRecarga = await requisitar('/api/mesas', { headers: { cookie } });
  assert.equal(mesasAposRecarga.status, 200);
  assert.deepEqual((await mesasAposRecarga.json()).mesas.map(item => item.id), [mesa.id]);

  // Exercita o mesmo caminho HTTP same-origin usado pelo cliente da ficha no modo LAN.
  servidor.db.prepare("UPDATE participantes_mesa SET papel = 'jogador' WHERE mesa_id = ? AND conta_id = ?")
    .run(mesa.id, contaPorCookie.id);
  const dadosIniciais = { secaoA: { valor: 'confirmado' }, secaoB: { marcador: 1 } };
  const criarRascunho = await requisitar('/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ name: 'Ficha via proxy', data: dadosIniciais }),
  });
  assert.equal(criarRascunho.status, 201);
  const { personagem } = await criarRascunho.json();
  const dadosAlterados = { ...dadosIniciais, secaoB: { marcador: 2 } };
  const salvarRascunho = await requisitar('/api/personagens/' + personagem.id, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Ficha via proxy', data: dadosAlterados, expectedRevision: personagem.revision }),
  });
  assert.equal(salvarRascunho.status, 200);
  const fichaConfirmada = (await salvarRascunho.json()).personagem;
  assert.equal(fichaConfirmada.revision, personagem.revision + 1);
  assert.deepEqual(fichaConfirmada.data, dadosAlterados);
  const reaberta = await requisitar('/api/personagens/' + personagem.id, {
    headers: { cookie },
  });
  assert.equal(reaberta.status, 200);
  assert.deepEqual((await reaberta.json()).personagem.data, dadosAlterados);

  const ticketResposta = await requisitar('/api/auth/ws-ticket', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: '{}',
  });
  assert.equal(ticketResposta.status, 201);
  const { ticket } = await ticketResposta.json();

  const wsUrl = origem.replace(/^http/, 'ws') + '/ws?ticket=' + ticket;
  const conectado = await new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl, { headers: { Origin: origem } });
    const primeiraMensagem = new Promise((resolveMensagem, rejectMensagem) => {
      ws.once('message', dados => resolveMensagem(JSON.parse(dados.toString('utf8'))));
      ws.once('error', rejectMensagem);
    });
    const timer = setTimeout(() => { ws.terminate(); reject(new Error('WebSocket LAN proxy não conectou.')); }, 2000);
    ws.once('open', () => { clearTimeout(timer); resolve({ ws, primeiraMensagem }); });
    ws.once('error', erro => { clearTimeout(timer); reject(erro); });
  });
  socket = conectado.ws;
  const pronto = await conectado.primeiraMensagem;
  assert.equal(pronto.type, 'ready');

  const inscricao = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Inscrição de Mesa não foi confirmada pelo proxy.')), 1000);
    socket.on('message', function receber(dados) {
      const mensagem = JSON.parse(dados.toString('utf8'));
      if (mensagem.type !== 'subscribed') return;
      clearTimeout(timer);
      socket.off('message', receber);
      resolve(mensagem);
    });
  });
  socket.send(JSON.stringify({ type: 'subscribe', mesaId: mesa.id }));
  assert.deepEqual(await inscricao, { type: 'subscribed', mesaId: mesa.id });
});
