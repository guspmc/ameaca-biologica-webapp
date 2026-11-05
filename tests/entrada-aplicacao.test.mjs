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
