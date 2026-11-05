import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('entrada principal preserva a Ficha offline e abre a Mesa LAN sob demanda', async () => {
  const codigo = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8');
  assert.match(codigo, /import FichaOfflineApp from '\.\/FichaOfflineApp'/);
  assert.match(codigo, /import ConexaoServidorLocal from '\.\/ConexaoServidorLocal'/);
  assert.match(codigo, /parametros\.get\('servidor'\) === 'local' \? ConexaoServidorLocal : FichaOfflineApp/);
  assert.match(codigo, /createRoot\(root\)\.render\(<React\.StrictMode><Aplicacao \/><\/React\.StrictMode>\)/);
});


test('modo LAN encaminha API e WebSocket pelo mesmo host e mantém a Ficha offline como padrão', async () => {
  const vite = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');
  const pacote = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const tela = await readFile(new URL('../src/ConexaoServidorLocal.tsx', import.meta.url), 'utf8');
  assert.equal(pacote.scripts['dev:lan'], 'vite --mode lan');
  assert.match(vite, /mode === 'lan'/);
  assert.match(vite, /host: '0\\.0\\.0\\.0'/);
  // Verifica apenas uma propriedade ativa; comentários podem mencionar a configuração proibida.
  assert.doesNotMatch(vite, /^\\s*allowedHosts\\s*:\\s*true\\s*,?/m);
  assert.match(vite, /'\\/api'.*target: 'http:\\/\\/127\\.0\\.0\\.1:4175'/);
  assert.match(vite, /'\\/ws'.*target: 'ws:\\/\\/127\\.0\\.0\\.1:4175'.*ws: true/);
  assert.match(tela, /import\\.meta\\.env\\.MODE === 'lan'.*window\\.location\\.origin/s);
  assert.match(tela, /emitirTicketWebSocket/);
  assert.match(tela, /type: 'subscribe'/);
  assert.match(tela, /mesa\\.changed/);
  assert.match(tela, /account\\.changed/);
});
