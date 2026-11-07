import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const paths = [
  'atributosCriacao.ts','pericias.ts','origens.ts','periciasCriacao.ts',
  'habilidades.ts','progressaoHabilidades.ts','progressaoCriacao.ts',
];
let source = '';
for (const path of paths) {
  source += (await readFile(new URL('../src/' + path, import.meta.url), 'utf8'))
    .replace(/^import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"];?\s*$/gm, '') + '\n';
}
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const api = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

function entrada(nivel = 10) {
  return {
    classe: 'Agente', origem: 'Acadêmico', nivel,
    atributosIniciais: { forca: 2, agilidade: 2, vigor: 2, astucia: 1 },
    periciaOrigemTreinada: 'Investigação', periciaOrigemExtra: null,
    distribuicaoPericiasInicial: { Luta: 2, Pontaria: 2 },
    habilidades: [
      { nivel: 1, habilidadeId: 'anatomia-de-combate' },
      { nivel: 2, habilidadeId: 'nao-vai-escapar' },
      { nivel: 4, habilidadeId: 'finalizacao-a-distancia' },
      { nivel: 6, habilidadeId: 'na-minha-mira' },
      { nivel: 8, habilidadeId: 'luta-livre' },
      { nivel: 10, habilidadeId: 'voce-aparou-um-missil' },
    ],
    ganhosAtributo: [
      { nivel: 3, atributo: 'forca' },
      { nivel: 5, atributo: 'agilidade' },
      { nivel: 7, atributo: 'vigor' },
      { nivel: 9, atributo: 'astucia' },
    ],
    ganhosPericia: [
      { nivel: 4, pericia: 'Percepção' },
      { nivel: 8, pericia: 'Furtividade' },
    ],
  };
}

test('criação em nível 10 percorre a progressão desde o nível 1 sem exigir Missões ou Descanso', () => {
  const resultado = api.avaliarProgressaoCriacao(entrada());
  assert.equal(resultado.valida, true, resultado.pendencias.join('; '));
  assert.deepEqual(resultado.atributosFinais, { forca: 3, agilidade: 3, vigor: 3, astucia: 2 });
  assert.deepEqual(resultado.distribuicaoPericiasFinal, { Luta: 2, Pontaria: 2, Percepção: 1, Furtividade: 1 });
});

test('criação de nível 1 exige somente os benefícios do primeiro nível', () => {
  const base = entrada(1);
  base.habilidades = [{ nivel: 1, habilidadeId: 'anatomia-de-combate' }];
  base.ganhosAtributo = [];
  base.ganhosPericia = [];
  const resultado = api.avaliarProgressaoCriacao(base);
  assert.equal(resultado.valida, true, resultado.pendencias.join('; '));
  assert.deepEqual(resultado.atributosFinais, base.atributosIniciais);
  assert.deepEqual(resultado.distribuicaoPericiasFinal, base.distribuicaoPericiasInicial);
});

test('criação superior recusa ganhos ausentes, duplicados ou em níveis que não concedem benefício', () => {
  const semAtributo = entrada();
  semAtributo.ganhosAtributo.pop();
  assert.equal(api.avaliarProgressaoCriacao(semAtributo).valida, false);
  const nivelErrado = entrada();
  nivelErrado.ganhosPericia[0].nivel = 5;
  assert.equal(api.avaliarProgressaoCriacao(nivelErrado).valida, false);
  const duplicado = entrada();
  duplicado.ganhosAtributo[1].nivel = 3;
  assert.equal(api.avaliarProgressaoCriacao(duplicado).valida, false);
});

test('criação superior respeita os limites de Atributo, Perícia e Habilidade', () => {
  const atributoExcedido = entrada();
  atributoExcedido.atributosIniciais = { forca: 3, agilidade: 2, vigor: 1, astucia: 1 };
  atributoExcedido.ganhosAtributo = [
    { nivel: 3, atributo: 'forca' }, { nivel: 5, atributo: 'agilidade' },
    { nivel: 7, atributo: 'vigor' }, { nivel: 9, atributo: 'astucia' },
  ];
  assert.equal(api.avaliarProgressaoCriacao(atributoExcedido).valida, false);
  const periciaExcedida = entrada();
  periciaExcedida.ganhosPericia[0].pericia = 'Medicina';
  assert.equal(api.avaliarProgressaoCriacao(periciaExcedida).valida, false);
  const habilidadeSemPreRequisito = entrada();
  habilidadeSemPreRequisito.habilidades[2].habilidadeId = 'retaliacao';
  assert.equal(api.avaliarProgressaoCriacao(habilidadeSemPreRequisito).valida, false);
});

test('validador de criação em nível superior recusa estruturas-base malformadas sem lançar exceção', () => {
  const semAtributos = entrada();
  semAtributos.atributosIniciais = null;
  assert.equal(api.avaliarProgressaoCriacao(semAtributos).valida, false);
  const semPericias = entrada();
  semPericias.distribuicaoPericiasInicial = null;
  assert.equal(api.avaliarProgressaoCriacao(semPericias).valida, false);
  assert.equal(api.avaliarProgressaoCriacao(null).valida, false);
});
