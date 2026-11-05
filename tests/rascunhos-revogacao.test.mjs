import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../server/index.mjs';

test('após revogação da participação, rascunho não pode ser consultado nem atualizado', async t => {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-revogacao-'));
  const app = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await app.listen();
  t.after(async () => { await app.close(); await rm(dataDir, { recursive: true, force: true }); });
  const url = 'http://127.0.0.1:' + app.address.port;

  async function conta(email) {
    const dados = { email, password: 'senha-local-comprida-2026' };
    const cadastro = await fetch(url + '/api/auth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dados),
    });
    assert.equal(cadastro.status, 201);
    const login = await fetch(url + '/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dados),
    });
    assert.equal(login.status, 200);
    const sessao = await login.json();
    return { account: sessao.account, headers: { authorization: 'Bearer ' + sessao.token } };
  }

  const mestre = await conta('mestre-revogacao@example.test');
  const jogador = await conta('jogador-revogacao@example.test');
  const mesaResposta = await fetch(url + '/api/mesas', {
    method: 'POST', headers: { ...mestre.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mesa de revogação' }),
  });
  assert.equal(mesaResposta.status, 201);
  const { mesa } = await mesaResposta.json();
  app.db.prepare('INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)')
    .run(mesa.id, jogador.account.id, 'jogador', new Date().toISOString());

  const criacao = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Claire', data: { pv: 10 } }),
  });
  assert.equal(criacao.status, 201);
  const { personagem } = await criacao.json();

  app.db.prepare('DELETE FROM participantes_mesa WHERE mesa_id = ? AND conta_id = ?')
    .run(mesa.id, jogador.account.id);

  // Simula um registro órfão legado/importado. A FK normalmente o elimina
  // em cascata, mas a API também deve negar acesso se encontrar esse estado.
  app.db.exec('PRAGMA foreign_keys = OFF');
  app.db.prepare(`
    INSERT INTO personagens_locais
      (id, mesa_id, conta_id, nome, dados_json, criada_em, atualizada_em, revisao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(personagem.id, mesa.id, jogador.account.id, personagem.name,
    JSON.stringify(personagem.data), personagem.createdAt, personagem.updatedAt, personagem.revision);
  app.db.exec('PRAGMA foreign_keys = ON');
  assert.equal(app.db.prepare('SELECT COUNT(*) AS total FROM personagens_locais WHERE id = ?').get(personagem.id).total, 1);

  const listar = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', { headers: jogador.headers });
  assert.equal(listar.status, 404);
  const consultar = await fetch(url + '/api/personagens/' + personagem.id, { headers: jogador.headers });
  assert.equal(consultar.status, 404);
  const atualizar = await fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Tentativa após revogação', data: { pv: 99 }, expectedRevision: personagem.revision }),
  });
  assert.equal(atualizar.status, 404);
});
