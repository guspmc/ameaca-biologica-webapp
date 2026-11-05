import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const arquivo = caminho => new URL(caminho, import.meta.url);

test('inicializador da Ficha offline usa porta exclusiva e compila o modo de teste com PWA', async () => {
  const script = await readFile(arquivo('../scripts/windows/Iniciar_Ficha_Offline.bat'), 'utf8');
  assert.match(script, /VITE_PWA_TESTE=true/i);
  assert.match(script, /vite build --mode teste/i);
  assert.match(script, /vite preview --host 127\.0\.0\.1 --port 4176 --strictPort/i);
  assert.match(script, /4176\/ameaca-biologica-webapp/i);
  assert.doesNotMatch(script, /--port 4174\b/);
});

test('inicializador da Mesa LAN mantém API no loopback e interface na porta LAN', async () => {
  const script = await readFile(arquivo('../scripts/windows/Iniciar_Mesa_LAN.bat'), 'utf8');
  assert.match(script, /server:local -- --host 127\.0\.0\.1 --port 4175/i);
  assert.match(script, /dev:lan/i);
  assert.match(script, /4174/);
  assert.match(script, /4175/);
  assert.match(script, /Get-NetTCPConnection/);
  assert.match(script, /dados ficticios/i);
  assert.doesNotMatch(script, /server:local -- --host 0\.0\.0\.0/i);
});

test('verificador de ambiente exige versões declaradas pelo projeto', async () => {
  const script = await readFile(arquivo('../scripts/windows/Verificar_Ambiente.bat'), 'utf8');
  assert.match(script, /22\.12/);
  assert.match(script, /11\.25\.0/);
  assert.match(script, /where node/i);
  assert.match(script, /where pnpm\.cmd/i);
});
