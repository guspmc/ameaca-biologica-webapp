import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../server/index.mjs';
import { criarClienteServidorLocal } from '../src/servidorLocal.ts';

test('cliente HTTP local cria, consulta e atualiza rascunho usando o mesmo endereço e sessão', async t => {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-cliente-local-'));
  const app = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await app.listen();
  t.after(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${app.address.port}`;
  const anonimo = criarClienteServidorLocal({ baseUrl });
  const email = 'cliente-integracao@example.test';
  const senha = 'senha-local-comprida-2026';

  await anonimo.cadastrar(email, senha);
  const sessao = await anonimo.entrar(email, senha);
  const cliente = criarClienteServidorLocal({ baseUrl, token: sessao.token });

  assert.equal((await cliente.minhaConta()).account.id, sessao.account.id);
  const { mesa } = await cliente.criarMesa('Mesa integração cliente');
  app.db.prepare('INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)')
    .run(mesa.id, sessao.account.id, 'jogador', new Date().toISOString());

  const dadosOriginais = { versaoModelo: 1, estadoFicha: 'rascunho' };
  const criado = await cliente.criarPersonagem(mesa.id, 'Claire', dadosOriginais);
  const id = criado.personagem.id;
  assert.equal(criado.personagem.name, 'Claire');

  const consultado = await cliente.consultarPersonagem(id);
  assert.deepEqual(consultado.personagem.data, dadosOriginais);

  const dadosAtualizados = { ...dadosOriginais, identidade: { nome: 'Claire Redfield' } };
  const atualizado = await cliente.atualizarPersonagem(id, 'Claire Redfield', dadosAtualizados);
  assert.equal(atualizado.personagem.name, 'Claire Redfield');
  assert.deepEqual(atualizado.personagem.data, dadosAtualizados);

  const lista = await cliente.listarPersonagens(mesa.id);
  assert.equal(lista.personagens.length, 1);
  assert.equal(lista.personagens[0].id, id);

  const leituraPersistida = await cliente.consultarPersonagem(id);
  assert.equal(leituraPersistida.personagem.name, 'Claire Redfield');
  assert.deepEqual(leituraPersistida.personagem.data, dadosAtualizados);
});
