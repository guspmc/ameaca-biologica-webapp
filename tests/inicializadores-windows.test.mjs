import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const arquivo = caminho => new URL(caminho, import.meta.url);

test('inicializador da Ficha offline usa porta exclusiva, verifica disponibilidade e aguarda a previa', async () => {
  const script = await readFile(arquivo('../scripts/windows/Iniciar_Ficha_Offline.bat'), 'utf8');
  assert.match(script, /VITE_PWA_TESTE=true/i);
  assert.match(script, /vite build --mode teste/i);
  assert.match(script, /vite preview --host 127\\.0\\.0\\.1 --port 4176 --strictPort/i);
  assert.match(script, /4176\\/ameaca-biologica-webapp/i);
  assert.match(script, /Get-NetTCPConnection.*4176/is);
  assert.match(script, /Invoke-WebRequest/is);
  assert.match(script, /Preparar_Dependencias\\.bat/i);
  assert.doesNotMatch(script, /--port 4174\\b/);
});

test('inicializador da Mesa LAN mantém API no loopback e aguarda API e proxy', async () => {
  const script = await readFile(arquivo('../scripts/windows/Iniciar_Mesa_LAN.bat'), 'utf8');
  assert.match(script, /server:local -- --host 127\\.0\\.0\\.1 --port 4175/i);
  assert.match(script, /dev:lan/i);
  assert.match(script, /4174/);
  assert.match(script, /4175/);
  assert.match(script, /Get-NetTCPConnection/);
  assert.match(script, /Invoke-RestMethod/is);
  assert.match(script, /Preparar_Dependencias\\.bat/i);
  assert.match(script, /dados ficticios/i);
  assert.doesNotMatch(script, /server:local -- --host 0\\.0\\.0\\.0/i);
});

test('preparacao compartilhada serializa a instalacao e respeita o lockfile', async () => {
  const script = await readFile(arquivo('../scripts/windows/Preparar_Dependencias.bat'), 'utf8');
  assert.match(script, /System\\.Threading\\.Mutex/);
  assert.match(script, /WaitOne/);
  assert.match(script, /pnpm\\.cmd install --frozen-lockfile --ignore-scripts/);
  assert.match(script, /node_modules\\/\\.modules\\.yaml/);
});

test('menu permite iniciar os ambientes em paralelo sem compartilhar portas', async () => {
  const script = await readFile(arquivo('../scripts/windows/Menu_Testes.bat'), 'utf8');
  const ficha = await readFile(arquivo('../scripts/windows/Iniciar_Ficha_Offline.bat'), 'utf8');
  const lan = await readFile(arquivo('../scripts/windows/Iniciar_Mesa_LAN.bat'), 'utf8');
  assert.match(script, /Iniciar_Ficha_Offline\\.bat/i);
  assert.match(script, /Iniciar_Mesa_LAN\\.bat/i);
  assert.match(script, /goto ambos/i);
  assert.match(ficha, /4176/);
  assert.match(lan, /4174/);
});

test('verificador de ambiente exige versões declaradas pelo projeto e aceita chamada silenciosa', async () => {
  const script = await readFile(arquivo('../scripts/windows/Verificar_Ambiente.bat'), 'utf8');
  assert.match(script, /22\\.12/);
  assert.match(script, /11\\.25\\.0/);
  assert.match(script, /where node/i);
  assert.match(script, /where pnpm\\.cmd/i);
  assert.match(script, /\\/silencioso/i);
});
