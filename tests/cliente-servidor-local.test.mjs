import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../server/index.mjs';
import { criarClienteServidorLocal, ErroServidorLocal } from '../src/servidorLocal.ts';

test('cliente HTTP local cria, consulta e atualiza rascunho usando o mesmo endereço e sessão', async t => {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-cliente-local-'));
  const app = createLocalServer({ host: '0.0.0.0', port: 0, dataDir });
  await app.listen();
  t.after(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  // O bind 0.0.0.0 exercita o mesmo modo de escuta usado no teste LAN.
  // O cliente conecta por loopback para manter o teste isolado na própria máquina.
  const baseUrl = `http://127.0.0.1:${app.address.port}`;
  const origem = 'http://localhost:5173';
  const fetchComOrigem = (url, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set('origin', origem);
    return fetch(url, { ...init, headers });
  };
  const anonimo = criarClienteServidorLocal({ baseUrl, fetcher: fetchComOrigem });
  const email = 'cliente-integracao@example.test';
  const senha = 'senha-local-comprida-2026';

  await anonimo.cadastrar(email, senha);
  const sessao = await anonimo.entrar(email, senha);
  const cliente = criarClienteServidorLocal({ baseUrl, token: sessao.token, fetcher: fetchComOrigem });

  assert.equal((await cliente.minhaConta()).account.id, sessao.account.id);
  const { mesa } = await cliente.criarMesa('Mesa integração cliente');
  app.db.prepare('UPDATE participantes_mesa SET papel = ? WHERE mesa_id = ? AND conta_id = ?')
    .run('jogador', mesa.id, sessao.account.id);

  const dadosOriginais = { versaoModelo: 1, estadoFicha: 'rascunho' };
  const criado = await cliente.criarPersonagem(mesa.id, 'Claire', dadosOriginais);
  const id = criado.personagem.id;
  assert.equal(criado.personagem.name, 'Claire');
  assert.equal(criado.personagem.revision, 1);

  const consultado = await cliente.consultarPersonagem(id);
  assert.deepEqual(consultado.personagem.data, dadosOriginais);

  const preflight = await fetch(baseUrl + `/api/personagens/${id}`, {
    method: 'OPTIONS',
    headers: {
      origin: origem,
      'access-control-request-method': 'PUT',
      'access-control-request-headers': 'authorization,content-type',
    },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), origem);
  assert.match(preflight.headers.get('access-control-allow-methods') ?? '', /PUT/);
  assert.match(preflight.headers.get('access-control-allow-headers') ?? '', /Authorization/i);

  const dadosAtualizados = { ...dadosOriginais, identidade: { nome: 'Claire Redfield' } };
  const atualizado = await cliente.atualizarPersonagem(id, 'Claire Redfield', dadosAtualizados, criado.personagem.revision);
  assert.equal(atualizado.personagem.name, 'Claire Redfield');
  assert.equal(atualizado.personagem.revision, criado.personagem.revision + 1);
  assert.deepEqual(atualizado.personagem.data, dadosAtualizados);

  const lista = await cliente.listarPersonagens(mesa.id);
  assert.equal(lista.personagens.length, 1);
  assert.equal(lista.personagens[0].id, id);

  const leituraPersistida = await cliente.consultarPersonagem(id);
  assert.equal(leituraPersistida.personagem.name, 'Claire Redfield');
  assert.deepEqual(leituraPersistida.personagem.data, dadosAtualizados);

  await assert.rejects(
    cliente.atualizarPersonagem(id, 'Versão antiga', { sobrescrito: true }, criado.personagem.revision),
    erro => erro?.status === 409,
  );
  const aposConflito = await cliente.consultarPersonagem(id);
  assert.equal(aposConflito.personagem.name, 'Claire Redfield');
  assert.equal(aposConflito.personagem.revision, atualizado.personagem.revision);
  assert.deepEqual(aposConflito.personagem.data, dadosAtualizados);

  const excluido = await cliente.excluirPersonagem(id);
  assert.deepEqual(excluido, { deleted: true, id });
  await assert.rejects(cliente.consultarPersonagem(id), erro => erro?.status === 404);
});


test('cliente preserva diagnóstico técnico quando fetch falha antes de receber resposta', async () => {
  const falhaNativa = new TypeError('Failed to fetch');
  const cliente = criarClienteServidorLocal({
    baseUrl: 'http://127.0.0.1:4175',
    fetcher: async () => { throw falhaNativa; },
  });

  await assert.rejects(
    cliente.verificarSaude(),
    erro => {
      assert.ok(erro instanceof ErroServidorLocal);
      assert.equal(erro.status, 0);
      assert.equal(erro.message, 'Não foi possível alcançar o servidor local. Confira o endereço e a conexão de rede.');
      assert.deepEqual(erro.diagnostico, { nome: 'TypeError', mensagem: 'Failed to fetch' });
      return true;
    },
  );
});


test('cliente distingue resposta HTTP de falha de transporte e limita diagnóstico', async () => {
  const respostaHttp = criarClienteServidorLocal({
    baseUrl: 'http://127.0.0.1:4175',
    fetcher: async () => new Response(JSON.stringify({ error: 'Revisão desatualizada.' }), {
      status: 409,
      headers: { 'content-type': 'application/json' },
    }),
  });
  await assert.rejects(
    respostaHttp.verificarSaude(),
    erro => {
      assert.ok(erro instanceof ErroServidorLocal);
      assert.equal(erro.status, 409);
      assert.equal(erro.message, 'Revisão desatualizada.');
      assert.equal(erro.diagnostico, undefined);
      return true;
    },
  );

  const excecaoLonga = new TypeError('x'.repeat(400));
  const transporte = criarClienteServidorLocal({
    baseUrl: 'http://127.0.0.1:4175',
    fetcher: async () => { throw excecaoLonga; },
  });
  await assert.rejects(
    transporte.verificarSaude(),
    erro => {
      assert.ok(erro instanceof ErroServidorLocal);
      assert.equal(erro.status, 0);
      assert.equal(erro.diagnostico.nome, 'TypeError');
      assert.equal(erro.diagnostico.mensagem.length, 240);
      return true;
    },
  );
});
