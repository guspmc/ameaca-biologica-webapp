import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarClienteServidorLocal } from '../src/servidorLocal.ts';

async function capturarEspaco(baseUrl) {
  let configuracao;
  const fetcher = async (_url, init) => {
    configuracao = init;
    return new Response(JSON.stringify({ account: { id: 'conta-teste', email: 'teste@example.test' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  await criarClienteServidorLocal({ baseUrl, token: 'token-teste', fetcher }).minhaConta();
  return configuracao?.targetAddressSpace;
}

test('cliente declara loopback ao acessar localhost e 127/8', async () => {
  assert.equal(await capturarEspaco('http://127.0.0.1:4175'), 'loopback');
  assert.equal(await capturarEspaco('http://127.20.30.40:4175'), 'loopback');
  assert.equal(await capturarEspaco('http://localhost:4175'), 'loopback');
  assert.equal(await capturarEspaco('http://[::1]:4175'), 'loopback');
});

test('cliente declara local ao acessar IP privado, link-local ou nome .local', async () => {
  assert.equal(await capturarEspaco('http://10.0.0.8:4175'), 'local');
  assert.equal(await capturarEspaco('http://172.20.0.8:4175'), 'local');
  assert.equal(await capturarEspaco('http://192.168.1.20:4175'), 'local');
  assert.equal(await capturarEspaco('http://169.254.10.2:4175'), 'local');
  assert.equal(await capturarEspaco('http://[fc00::1]:4175'), 'local');
  assert.equal(await capturarEspaco('http://[fe80::1]:4175'), 'local');
  assert.equal(await capturarEspaco('http://servidor.local:4175'), 'local');
});

test('cliente não declara espaço local para destino público', async () => {
  assert.equal(await capturarEspaco('https://api.example.com'), undefined);
});
