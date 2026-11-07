import { test } from 'node:test';
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
  modulo.require = (id) => {
    if (id.startsWith('.')) {
      const candidato = resolve(dirname(arquivo), id);
      if (candidato.endsWith('.ts')) return carregarTs(candidato);
      if (readFileSync) {
        try { return carregarTs(candidato + '.ts'); } catch {}
      }
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
const { calcularDerivadosCriacao } = carregarTs('src/derivadosCriacao.ts');
const atributos = { forca: 2, agilidade: 2, vigor: 2, astucia: 1 };

test('fórmulas-base de Agente, Autodidata e Operador preservam seus valores oficiais', () => {
  const esperado = [
    ['Agente', 'anatomia-de-combate', 12, 3, 9, 12],
    ['Autodidata', 'curiosa', 10, 3, 11, 12],
    ['Operador', 'armeiro', 14, 3, 7, 12],
  ];
  for (const [classe, habilidade, pv, sa, bi, defesa] of esperado) {
    const d = calcularDerivadosCriacao({ classe, origem: 'Acadêmico', habilidadeBasica: habilidade, atributos });
    assert.deepEqual([d.pvMaximo, d.saMaximo, d.biMaxima, d.defesa], [pv, sa, bi, defesa]);
    assert.equal(d.inventario, 6);
    assert.equal(d.movimento, 9);
  }
});

test('benefícios numéricos de Origem e Parrudo entram uma única vez nos derivados', () => {
  const cobaia = calcularDerivadosCriacao({ classe: 'Operador', origem: 'Cobaia', habilidadeBasica: 'parrudo', atributos });
  assert.deepEqual([cobaia.pvMaximo, cobaia.biMaxima], [19, 12]);
  const policial = calcularDerivadosCriacao({ classe: 'Agente', origem: 'Policial', habilidadeBasica: 'rolamento', atributos });
  assert.equal(policial.defesa, 14);
  const universitaria = calcularDerivadosCriacao({ classe: 'Autodidata', origem: 'Universitária', habilidadeBasica: 'curiosa', atributos });
  assert.equal(universitaria.saMaximo, 4);
  const mochileiro = calcularDerivadosCriacao({ classe: 'Agente', origem: 'Mochileiro', habilidadeBasica: 'rolamento', atributos });
  assert.equal(mochileiro.inventario, 7);
});

test('recusa Classe, Habilidade, Atributos e Nível inválidos', () => {
  assert.throws(() => calcularDerivadosCriacao({ classe: 'Classe falsa', origem: '', habilidadeBasica: '', atributos }), /Classe inválida/);
  assert.throws(() => calcularDerivadosCriacao({ classe: 'Agente', origem: '', habilidadeBasica: 'parrudo', atributos }), /incompatível/);
  assert.throws(() => calcularDerivadosCriacao({ classe: 'Agente', origem: '', habilidadeBasica: 'rolamento', atributos: { ...atributos, forca: 6 } }), /Atributo inválido/);
  assert.throws(() => calcularDerivadosCriacao({ classe: 'Agente', origem: 'Origem falsa', habilidadeBasica: 'rolamento', atributos }), /Origem inválida/);
  assert.throws(() => calcularDerivadosCriacao({ classe: 'Agente', origem: '', habilidadeBasica: 'rolamento', atributos, nivel: 11 }), /Nível deve/);
});
