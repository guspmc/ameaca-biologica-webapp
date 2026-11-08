import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function importarTS(caminho) {
  const source = await readFile(new URL(caminho, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
}

test('catálogo contém as três Classes e os nove Ramos com todos os graus previstos', async () => {
  const [basicas, progressao] = await Promise.all([
    importarTS('../src/habilidades.ts'),
    importarTS('../src/progressaoHabilidades.ts'),
  ]);
  assert.equal(basicas.HABILIDADES_BASICAS.length, 9);
  assert.equal(progressao.HABILIDADES_AVANCADAS.length, 9);
  assert.equal(progressao.HABILIDADES_SUPERIORES.length, 9);
  assert.equal(progressao.HABILIDADES_AVASSALADORAS.length, 3);
  for (const classe of ['Agente', 'Autodidata', 'Operador']) {
    assert.equal(basicas.HABILIDADES_BASICAS.filter(h => h.classe === classe).length, 3, classe);
    assert.equal(progressao.HABILIDADES_AVANCADAS.filter(h => h.classe === classe).length, 3, classe);
    assert.equal(progressao.HABILIDADES_SUPERIORES.filter(h => h.classe === classe).length, 3, classe);
    assert.equal(progressao.HABILIDADES_AVASSALADORAS.filter(h => h.classe === classe).length, 1, classe);
  }
});

test('cada Habilidade cadastrada possui ID único, referência e descrição de efeito', async () => {
  const [progressao, efeitos] = await Promise.all([
    importarTS('../src/progressaoHabilidades.ts'),
    importarTS('../src/efeitosHabilidades.ts'),
  ]);
  const habilidades = progressao.HABILIDADES_PROGRESSAO;
  assert.equal(new Set(habilidades.map(h => h.id)).size, habilidades.length);
  for (const habilidade of habilidades) {
    assert.ok(habilidade.referencia, habilidade.id + ' sem referência');
    assert.ok(efeitos.descricaoEfeitoHabilidade(habilidade.id).trim(), habilidade.id + ' sem efeito');
  }
});
