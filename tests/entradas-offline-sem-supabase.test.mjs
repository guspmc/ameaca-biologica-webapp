import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const entradas = ['main.tsx'];

async function existe(caminho) {
  try {
    await access(caminho);
    return true;
  } catch {
    return false;
  }
}

async function resolverImportacao(origem, especificador) {
  if (!especificador.startsWith('.')) return null;
  const base = resolve(dirname(origem), especificador);
  const extensao = extname(base);
  if (extensao) {
    if (!['.ts', '.tsx', '.js', '.jsx', '.mjs'].includes(extensao)) return null;
    if (await existe(base)) return base;
    throw new Error('Import relativo não encontrado: ' + especificador + ' em ' + origem);
  }
  for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs']) {
    if (await existe(base + ext)) return base + ext;
  }
  for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs']) {
    const indice = resolve(base, 'index' + ext);
    if (await existe(indice)) return indice;
  }
  throw new Error('Import relativo não resolvido: ' + especificador + ' em ' + origem);
}

function importsEstaticos(codigo) {
  const encontrados = new Set();
  const padraoComFrom = /\b(?:import|export)\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
  const padraoLateral = /\bimport\s+['"]([^'"]+)['"]/g;
  const padraoDinamico = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const padrao of [padraoComFrom, padraoLateral, padraoDinamico]) {
    for (const resultado of codigo.matchAll(padrao)) encontrados.add(resultado[1]);
  }
  return [...encontrados];
}

test('as entradas Offline e LAN não carregam módulos Supabase no grafo ativo', async () => {
  const visitados = new Set();
  const pendentes = entradas.map(nome => resolve(raiz, nome));
  const dependenciasSupabase = [];
  while (pendentes.length) {
    const arquivo = pendentes.pop();
    if (visitados.has(arquivo)) continue;
    visitados.add(arquivo);

    const codigo = await readFile(arquivo, 'utf8');
    if (/@supabase\/supabase-js|supabase\.co/i.test(codigo)) {
      dependenciasSupabase.push(arquivo);
    }

    for (const especificador of importsEstaticos(codigo)) {
      const dependencia = await resolverImportacao(arquivo, especificador);
      if (dependencia) pendentes.push(dependencia);
    }
  }

  assert.deepEqual(
    dependenciasSupabase,
    [],
    'O caminho ativo da Ficha Offline e da Mesa LAN não deve importar o legado Supabase.'
  );
  assert.ok(visitados.has(resolve(raiz, 'FichaOfflineApp.tsx')));
  assert.ok(visitados.has(resolve(raiz, 'ConexaoServidorLocal.tsx')));
});
