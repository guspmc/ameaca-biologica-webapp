import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const habilidades = await readFile(new URL('../src/habilidades.ts', import.meta.url), 'utf8');
const pericias = await readFile(new URL('../src/pericias.ts', import.meta.url), 'utf8');
const progressao = (await readFile(new URL('../src/progressaoHabilidades.ts', import.meta.url), 'utf8'))
  .replace(/^import .*;\r?\n/gm, '');
const source = pericias + '\n' + habilidades + '\n' + progressao;
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { ganhosProgressaoAte, validarProgressaoHabilidades, validarGanhoAtributoProgressao, validarGanhoPericiaProgressao, HABILIDADES_PROGRESSAO } =
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
  assert.equal(validarProgressaoHabilidades('Agente', 1, [{ nivel: 1, habilidadeId: 'anatomia-de-combate', admin: true }]).valida, false);
  assert.equal(validarProgressaoHabilidades('Agente', 1, [{ nivel: 1, habilidadeId: 'anatomia-de-combate' }, { nivel: 1, habilidadeId: 'nao-vai-escapar' }]).valida, false);
});

test('ganhos de Atributo ocorrem somente nos níveis previstos e respeitam teto 5', () => {
  assert.equal(validarGanhoAtributoProgressao(3, 'forca', 4).valido, true);
  assert.equal(validarGanhoAtributoProgressao(5, 'astucia', 5).valido, false);
  assert.equal(validarGanhoAtributoProgressao(4, 'forca', 2).valido, false);
  assert.equal(validarGanhoAtributoProgressao(7, 'atributo-falso', 2).valido, false);
});

test('ganhos de Perícia ocorrem nos níveis 4 e 8 e só aceitam Perícias da Classe abaixo de Mestre', () => {
  assert.equal(validarGanhoPericiaProgressao('Agente', 4, 'Luta', 1).valido, true);
  assert.equal(validarGanhoPericiaProgressao('Agente', 8, 'Pontaria', 0).valido, true);
  assert.equal(validarGanhoPericiaProgressao('Agente', 4, 'Medicina', 0).valido, false);
  assert.equal(validarGanhoPericiaProgressao('Operador', 4, 'Fortitude', 2).valido, false);
  assert.equal(validarGanhoPericiaProgressao('Operador', 5, 'Luta', 0).valido, false);
});

test('validadores de progressão recusam Classe e nível inválidos sem lançar exceção', () => {
  assert.equal(validarProgressaoHabilidades('Criatura', 1, []).valida, false);
  assert.equal(validarProgressaoHabilidades('Agente', 0, []).valida, false);
  assert.equal(validarProgressaoHabilidades('Agente', 11, []).valida, false);
  assert.equal(validarGanhoAtributoProgressao(0, 'forca', 1).valido, false);
  assert.equal(validarGanhoAtributoProgressao(11, 'forca', 1).valido, false);
  assert.equal(validarGanhoPericiaProgressao('Criatura', 4, 'Luta', 0).valido, false);
  assert.equal(validarGanhoPericiaProgressao('Agente', 11, 'Luta', 0).valido, false);
});

test('escolhas de Habilidade precisam ser objetos simples, sem protótipo personalizado', () => {
  const escolha = Object.assign(Object.create({ admin: true }), {
    nivel: 1, habilidadeId: 'anatomia-de-combate',
  });
  assert.equal(validarProgressaoHabilidades('Agente', 1, [escolha]).valida, false);
});

test('sequência completa até o nível 10 respeita ramos e Habilidade Avassaladora de cada Classe', () => {
  const sequencias = [
    ['Agente', [
      { nivel: 1, habilidadeId: 'anatomia-de-combate' },
      { nivel: 2, habilidadeId: 'nao-vai-escapar' },
      { nivel: 4, habilidadeId: 'finalizacao-a-distancia' },
      { nivel: 6, habilidadeId: 'na-minha-mira' },
      { nivel: 8, habilidadeId: 'luta-livre' },
      { nivel: 10, habilidadeId: 'voce-aparou-um-missil' },
    ]],
    ['Autodidata', [
      { nivel: 1, habilidadeId: 'ambidestria' },
      { nivel: 2, habilidadeId: 'curiosa' },
      { nivel: 4, habilidadeId: 'armeira-autodidata' },
      { nivel: 6, habilidadeId: 'tentativa-e-erro' },
      { nivel: 8, habilidadeId: 'arsenal-improvavel' },
      { nivel: 10, habilidadeId: 'code-veronica' },
    ]],
    ['Operador', [
      { nivel: 1, habilidadeId: 'golpe-sujo' },
      { nivel: 2, habilidadeId: 'armeiro' },
      { nivel: 4, habilidadeId: 'casca-grossa' },
      { nivel: 6, habilidadeId: 'armamento-especial' },
      { nivel: 8, habilidadeId: 'briga-de-gente-grande' },
      { nivel: 10, habilidadeId: 'socador-de-pedras' },
    ]],
  ];
  for (const [classe, escolhas] of sequencias) {
    const resultado = validarProgressaoHabilidades(classe, 10, escolhas);
    assert.equal(resultado.valida, true, classe + ': ' + JSON.stringify(resultado.pendencias));
    assert.deepEqual(resultado.pendencias, []);
  }
});
