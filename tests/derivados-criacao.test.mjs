import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/derivadosCriacao.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const exports = {};
new Function('exports', 'require', outputText)(exports, (specifier) => {
  if (specifier === './classesFicha.ts') return require('../src/classesFicha.ts');
  if (specifier === './equipamento.ts') return require('../src/equipamento.ts');
  if (specifier === './habilidades.ts') return require('../src/habilidades.ts');
  throw new Error('Import inesperado: ' + specifier);
});
const { calcularDerivadosCriacao } = exports;

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
  assert.throws(() => calcularDerivadosCriacao({ classe: 'Agente', origem: '', habilidadeBasica: 'rolamento', atributos, nivel: 11 }), /Nível deve/);
});
