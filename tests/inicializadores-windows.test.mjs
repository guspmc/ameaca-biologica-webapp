import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const arquivo = caminho => new URL(caminho, import.meta.url);

test('inicializador da Ficha offline usa porta exclusiva, verifica disponibilidade e aguarda a previa', async () => {
  const script = await readFile(arquivo('../scripts/windows/Iniciar_Ficha_Offline.bat'), 'utf8');
  assert.ok(script.includes('VITE_PWA_TESTE=true'));
  assert.ok(script.includes('vite build --mode teste'));
  assert.ok(script.includes('vite preview --host 127.0.0.1 --port 4176 --strictPort'));
  assert.ok(script.includes('4176/ameaca-biologica-webapp'));
  assert.ok(script.includes('Get-NetTCPConnection -State Listen -LocalPort 4176'));
  assert.ok(script.includes('Invoke-WebRequest'));
  assert.ok(script.includes('Preparar_Dependencias.bat'));
  assert.ok(!script.includes('--port 4174'));
});

test('inicializador da Mesa LAN mantém API no loopback e aguarda API e proxy', async () => {
  const script = await readFile(arquivo('../scripts/windows/Iniciar_Mesa_LAN.bat'), 'utf8');
  assert.ok(script.includes('server:local -- --host 127.0.0.1 --port 4175'));
  assert.ok(script.includes('dev:lan'));
  assert.ok(script.includes('4174'));
  assert.ok(script.includes('4175'));
  assert.ok(script.includes('Get-NetTCPConnection'));
  assert.ok(script.includes('Invoke-RestMethod'));
  assert.ok(script.includes('Preparar_Dependencias.bat'));
  assert.ok(script.toLowerCase().includes('dados ficticios'));
  assert.ok(!script.includes('server:local -- --host 0.0.0.0'));
});

test('preparacao compartilhada serializa a instalacao e respeita o lockfile', async () => {
  const script = await readFile(arquivo('../scripts/windows/Preparar_Dependencias.bat'), 'utf8');
  assert.ok(script.includes('System.Threading.Mutex'));
  assert.ok(script.includes('WaitOne'));
  assert.ok(script.includes('pnpm.cmd install --frozen-lockfile --ignore-scripts'));
  assert.ok(script.includes('node_modules/.modules.yaml'));
});

test('menu permite iniciar os ambientes em paralelo sem compartilhar portas', async () => {
  const script = await readFile(arquivo('../scripts/windows/Menu_Testes.bat'), 'utf8');
  const ficha = await readFile(arquivo('../scripts/windows/Iniciar_Ficha_Offline.bat'), 'utf8');
  const lan = await readFile(arquivo('../scripts/windows/Iniciar_Mesa_LAN.bat'), 'utf8');
  assert.ok(script.includes('Iniciar_Ficha_Offline.bat'));
  assert.ok(script.includes('Iniciar_Mesa_LAN.bat'));
  assert.ok(script.includes('goto ambos'));
  assert.ok(ficha.includes('4176'));
  assert.ok(lan.includes('4174'));
});

test('verificador de ambiente exige versões declaradas pelo projeto e aceita chamada silenciosa', async () => {
  const script = await readFile(arquivo('../scripts/windows/Verificar_Ambiente.bat'), 'utf8');
  assert.ok(script.includes('22.12'));
  assert.ok(script.includes('11.25.0'));
  assert.ok(script.toLowerCase().includes('where node'));
  assert.ok(script.toLowerCase().includes('where pnpm.cmd'));
  assert.ok(script.includes('/silencioso'));
});
