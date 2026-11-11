import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Module from 'node:module';
import ts from 'typescript';

const raiz = resolve(dirname(new URL(import.meta.url).pathname), '..');
const cache = new Map();
function carregarTs(caminho) {
  const arquivo = resolve(raiz, caminho);
  if (cache.has(arquivo)) return cache.get(arquivo).exports;
  const modulo = new Module(arquivo);
  cache.set(arquivo, modulo);
  modulo.filename = arquivo;
  modulo.paths = Module._nodeModulePaths(dirname(arquivo));
  const exigirOriginal = modulo.require.bind(modulo);
  modulo.require = id => {
    if (id.startsWith('.')) {
      const candidato = resolve(dirname(arquivo), id);
      try { return carregarTs(candidato.endsWith('.ts') ? candidato : candidato + '.ts'); } catch {}
    }
    return exigirOriginal(id);
  };
  const codigo = readFileSync(arquivo, 'utf8');
  const compilado = ts.transpileModule(codigo, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  modulo._compile(compilado, arquivo);
  return modulo.exports;
}

const { aumentarCategoriaDano, categoriasAtaqueUniversal } = carregarTs('src/progressaoDano.ts');

test('progressão de Dano segue a sequência oficial de categorias', () => {
  assert.equal(aumentarCategoriaDano('1d4', 1), '1d6');
  assert.equal(aumentarCategoriaDano('1d6', 1), '1d8');
  assert.equal(aumentarCategoriaDano('1d4', 2), '1d8');
  assert.equal(aumentarCategoriaDano('1d12', 1), '2d6');
});

test('Lutador aumenta uma categoria em Ataque Desarmado e Arma Improvisada', () => {
  assert.equal(categoriasAtaqueUniversal('Lutador', false, 'universal-ataque-desarmado'), 1);
  assert.equal(categoriasAtaqueUniversal('Lutador', false, 'universal-arma-improvisada'), 1);
  assert.equal(aumentarCategoriaDano('1d4', categoriasAtaqueUniversal('Lutador', false, 'universal-ataque-desarmado')), '1d6');
  assert.equal(aumentarCategoriaDano('1d6', categoriasAtaqueUniversal('Lutador', false, 'universal-arma-improvisada')), '1d8');
});

test('Lutador acumula com Casca-Grossa somente no Ataque Desarmado', () => {
  assert.equal(categoriasAtaqueUniversal('Lutador', true, 'universal-ataque-desarmado'), 2);
  assert.equal(aumentarCategoriaDano('1d4', 2), '1d8');
  assert.equal(categoriasAtaqueUniversal('Lutador', true, 'universal-arma-improvisada'), 1);
  assert.equal(categoriasAtaqueUniversal('Lutador', true, 'arma-corpo-a-corpo'), 0);
});

test('Casca-Grossa isolada não altera Arma Improvisada e Coronhada fica fora deste perfil', () => {
  assert.equal(categoriasAtaqueUniversal('', true, 'universal-ataque-desarmado'), 1);
  assert.equal(categoriasAtaqueUniversal('', true, 'universal-arma-improvisada'), 0);
  assert.equal(categoriasAtaqueUniversal('Lutador', false, 'coronhada'), 0);
});

test('progressão de Dano rejeita fórmulas, passos e contextos inválidos', () => {
  assert.throws(() => aumentarCategoriaDano('1d20', 1), /progressão de categoria/);
  assert.throws(() => aumentarCategoriaDano('1d4', -1), /inválida/);
  assert.throws(() => aumentarCategoriaDano('1d4', 1.5), /inválida/);
  assert.throws(() => categoriasAtaqueUniversal('Lutador', 'sim', 'universal-ataque-desarmado'), /Contexto/);
});
