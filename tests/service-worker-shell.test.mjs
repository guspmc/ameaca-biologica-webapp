import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const codigo = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');

function ambiente() {
  const eventos = {};
  const guardados = new Map();
  const nomes = ['ameaca-biologica-shell-v0', 'ameaca-biologica-shell-v1'];
  const cache = {
    async put(chave, resposta) { guardados.set(String(chave), resposta); },
    async match(chave) { return guardados.get(typeof chave === 'string' ? chave : chave.url); },
  };
  const self = {
    registration: { scope: 'https://app.test/ameaca-biologica-webapp/' },
    location: { origin: 'https://app.test' },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener(nome, callback) { eventos[nome] = callback; },
  };
  const contexto = {
    self,
    URL,
    Response,
    caches: {
      async open() { return cache; },
      async keys() { return [...nomes]; },
      async delete(nome) { nomes.splice(nomes.indexOf(nome), 1); return true; },
    },
    fetch: async (url) => {
      if (String(url).endsWith('/index.html')) return new Response('<html><script src="./assets/app.js"></script></html>', { status: 200 });
      if (String(url).endsWith('/assets/app.js')) return new Response('app', { status: 200 });
      throw new Error('Rede indisponível no teste');
    },
  };
  vm.runInNewContext(codigo, contexto, { filename: 'sw.js' });
  return { eventos, guardados, nomes, self };
}

test('Service Worker não intercepta API, outros domínios ou métodos de escrita', () => {
  const { eventos } = ambiente();
  for (const request of [
    { method: 'GET', url: 'https://app.test/ameaca-biologica-webapp/rest/v1/personagens', mode: 'cors' },
    { method: 'GET', url: 'https://app.test/ameaca-biologica-webapp/api/mesas', mode: 'cors' },
    { method: 'GET', url: 'https://app.test/ameaca-biologica-webapp/ws', mode: 'cors' },
    { method: 'GET', url: 'https://api.test/rest/v1/personagens', mode: 'cors' },
    { method: 'POST', url: 'https://app.test/ameaca-biologica-webapp/api/mesas', mode: 'cors' },
    { method: 'POST', url: 'https://app.test/ameaca-biologica-webapp/assets/app.js', mode: 'cors' },
  ]) {
    let interceptou = false;
    eventos.fetch({ request, respondWith() { interceptou = true; } });
    assert.equal(interceptou, false, 'não deve interceptar ' + request.method + ' ' + request.url);
  }
});

test('Service Worker usa shell em cache quando uma navegação falha offline', async () => {
  const { eventos, guardados } = ambiente();
  const index = 'https://app.test/ameaca-biologica-webapp/index.html';
  const root = 'https://app.test/ameaca-biologica-webapp/';
  guardados.set(index, new Response('<html>shell offline</html>'));
  guardados.set(root, new Response('<html>shell offline</html>'));

  let resposta;
  eventos.fetch({
    request: { method: 'GET', url: 'https://app.test/ameaca-biologica-webapp/personagens', mode: 'navigate' },
    respondWith(promise) { resposta = promise; },
  });

  const resultado = await resposta;
  assert.equal(resultado.status, 200);
  assert.match(await resultado.text(), /shell offline/);
});

test('Service Worker atualiza apenas cache versionado do shell ao ativar', async () => {
  const { eventos, nomes, self } = ambiente();
  let aguardado;
  eventos.activate({ waitUntil(promise) { aguardado = promise; } });
  await aguardado;
  assert.deepEqual(nomes, ['ameaca-biologica-shell-v1']);
  assert.equal(typeof self.clients.claim, 'function');
});
