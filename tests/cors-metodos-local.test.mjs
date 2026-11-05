import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../server/index.mjs';

test('preflight CORS autoriza PUT da ficha e DELETE de convites sem liberar outras origens', async t => {
  const dataDir = await mkdtemp(join(tmpdir(), 'ameaca-biologica-cors-'));
  const app = createLocalServer({ host: '127.0.0.1', port: 0, dataDir });
  await app.listen();

  t.after(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  const base = `http://127.0.0.1:${app.address.port}`;
  const origem = 'https://guspmc.github.io';

  for (const metodo of ['PUT', 'DELETE']) {
    const resposta = await fetch(`${base}/api/personagens/${'a'.repeat(32)}`, {
      method: 'OPTIONS',
      headers: {
        origin: origem,
        'access-control-request-method': metodo,
        'access-control-request-headers': 'authorization,content-type',
      },
    });

    assert.equal(resposta.status, 204, `preflight de ${metodo} deve ser aceito`);
    assert.equal(resposta.headers.get('access-control-allow-origin'), origem);
    const metodosPermitidos = resposta.headers.get('access-control-allow-methods') ?? '';
    assert.match(metodosPermitidos, new RegExp(`(^|,\\s*)${metodo}($|,)`));
    assert.match(metodosPermitidos, /GET/);
    assert.match(metodosPermitidos, /POST/);
  }

  const origemBloqueada = await fetch(`${base}/api/personagens/${'a'.repeat(32)}`, {
    method: 'OPTIONS',
    headers: {
      origin: 'https://origem-nao-autorizada.example',
      'access-control-request-method': 'PUT',
    },
  });
  assert.equal(origemBloqueada.status, 403);
  assert.equal(origemBloqueada.headers.get('access-control-allow-origin'), null);
});
