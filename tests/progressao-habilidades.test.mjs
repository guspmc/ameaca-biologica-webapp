import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const habilidades = await readFile(new URL('../src/habilidades.ts', import.meta.url), 'utf8');
const progressao = (await readFile(new URL('../src/progressaoHabilidades.ts', import.meta.url), 'utf8'))
  .replace(/^import .*;\\r?\\n/m, '');
const source = habilidades + '\\n' + progressao;
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { ganhosProgressaoAte, validarProgressaoHabilidades, HABILIDADES_PROGRESSAO } =
  await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('catálogo contém habilidades de todos os graus e classes conforme o Arquivo do Jogador', () => {
  for (const classe of ['Agente', 'Autodidata', 'Operador']) {
    for (const grau of ['basica', 'avancada', 'superior', 'avassaladora']) {
      assert.ok(HABILIDADES_PROGRESSAO.some(h => h.classe === classe && h.grau === grau), classe + ' / ' + grau);
    }
  }
  assert.equal(HABILIDADES_PROGRESSAO.length, 30);
});

test('progressão concede escolhas e ganhos nos níveis canônicos', () => {
  assert.deepEqual(ganhosProgressaoAte(1), {
    habilidades: [{ nivel: 1, grau: 'basica' }], atributos: [], pontosPericia: [],
  });
  assert.deepEqual(ganhosProgressaoAte(4), {
    habilidades: [{ nivel: 1, grau: 'basica' }, { nivel: 2, grau: 'basica' }, { nivel: 4, grau: 'avancada' }],
    atributos: [3], pontosPericia: [4],
  });
  assert.deepEqual(ganhosProgressaoAte(10).atributos, [3, 5, 7, 9]);
  assert.deepEqual(ganhosProgressaoAte(10).pontosPericia, [4, 8]);
  assert.equal(ganhosProgressaoAte(10).habilidades.length, 6);
  assert.throws(() => ganhosProgressaoAte(11), /entre 1 e 10/);
});

test('valida habilidades Básica, Avançada e Superior com pré-requisitos e outro Ramo no nível 2', () => {
  const escolhas = [
    { nivel: 1, habilidadeId: 'anatomia-de-combate' },
    { nivel: 2, habilidadeId: 'nao-vai-escapar' },
    { nivel: 4, habilidadeId: 'finalizacao-a-distancia' },
    { nivel: 6, habilidadeId: 'na-minha-mira' },
    { nivel: 8, habilidadeId: 'luta-livre' },
  ];
  const resultado = validarProgressaoHabilidades('Agente', 8, escolhas);
  assert.equal(resultado.valida, true);
  assert.deepEqual(resultado.pendencias, []);
});

test('recusa grau de outra Classe, ausência de pré-requisito e Habilidade repetida', () => {
  assert.equal(validarProgressaoHabilidades('Agente', 1, [
    { nivel: 1, habilidadeId: 'herbalista' },
  ]).valida, false);
  assert.equal(validarProgressaoHabilidades('Agente', 4, [
    { nivel: 1, habilidadeId: 'anatomia-de-combate' },
    { nivel: 2, habilidadeId: 'nao-vai-escapar' },
    { nivel: 4, habilidadeId: 'retaliacao' },
  ]).valida, false);
  assert.equal(validarProgressaoHabilidades('Agente', 2, [
    { nivel: 1, habilidadeId: 'anatomia-de-combate' },
    { nivel: 2, habilidadeId: 'anatomia-de-combate' },
  ]).valida, false);
});

test('dados de progressão malformados são recusados sem interromper a conferência', () => {
  assert.equal(validarProgressaoHabilidades('Agente', 1, null).valida, false);
  assert.equal(validarProgressaoHabilidades('Agente', 1, [null]).valida, false);
  assert.equal(validarProgressaoHabilidades('Agente', 1, [{ nivel: 1 }]).valida, false);
});
