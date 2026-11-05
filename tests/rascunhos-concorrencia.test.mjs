import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../server/index.mjs';

test('gravações concorrentes com a mesma revisão preservam somente uma alteração', async t => {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-concorrencia-'));
  const app = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await app.listen();
  t.after(async () => { await app.close(); await rm(dataDir, { recursive: true, force: true }); });
  const url = 'http://127.0.0.1:' + app.address.port;

  async function criarConta(email) {
    const credenciais = { email, password: 'senha-local-comprida-2026' };
    const cadastro = await fetch(url + '/api/auth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credenciais),
    });
    assert.equal(cadastro.status, 201);
    const login = await fetch(url + '/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credenciais),
    });
    assert.equal(login.status, 200);
    const sessao = await login.json();
    return { account: sessao.account, headers: { authorization: 'Bearer ' + sessao.token } };
  }

  const mestre = await criarConta('mestre-concorrencia@example.test');
  const jogador = await criarConta('jogador-concorrencia@example.test');
  const respostaMesa = await fetch(url + '/api/mesas', {
    method: 'POST', headers: { ...mestre.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mesa de concorrência' }),
  });
  assert.equal(respostaMesa.status, 201);
  const { mesa } = await respostaMesa.json();
  app.db.prepare('INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)')
    .run(mesa.id, jogador.account.id, 'jogador', new Date().toISOString());

  const criar = await fetch(url + '/api/mesas/' + mesa.id + '/personagens', {
    method: 'POST', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Claire', data: { pv: 10, anotacao: 'inicial' } }),
  });
  assert.equal(criar.status, 201);
  const { personagem } = await criar.json();

  const alteracoes = [['Sessão A', 9], ['Sessão B', 8]];
  const respostas = await Promise.all(alteracoes.map(([sessao, pv]) => fetch(url + '/api/personagens/' + personagem.id, {
    method: 'PUT', headers: { ...jogador.headers, 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Claire ' + sessao, data: { pv, anotacao: sessao },
      expectedRevision: personagem.revision,
    }),
  })));

  assert.deepEqual(respostas.map(r => r.status).sort(), [200, 409]);
  const consulta = await fetch(url + '/api/personagens/' + personagem.id, { headers: jogador.headers });
  assert.equal(consulta.status, 200);
  const { personagem: salvo } = await consulta.json();
  assert.equal(salvo.revision, personagem.revision + 1);
  assert.ok(['Sessão A', 'Sessão B'].includes(salvo.data.anotacao));
  assert.equal(salvo.data.pv, salvo.data.anotacao === 'Sessão A' ? 9 : 8);
});
