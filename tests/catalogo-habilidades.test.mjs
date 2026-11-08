import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [basicas, progressao, efeitos] = await Promise.all([
  readFile(new URL('../src/habilidades.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/progressaoHabilidades.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/efeitosHabilidades.ts', import.meta.url), 'utf8'),
]);
const idsBasicas = [...basicas.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
const habilidadesPorGrau = {
  avancada: [...progressao.matchAll(/\{ id:\s*'([^']+)'[^\n]*grau:\s*'avancada'/g)].map(m => m[1]),
  superior: [...progressao.matchAll(/\{ id:\s*'([^']+)'[^\n]*grau:\s*'superior'/g)].map(m => m[1]),
  avassaladora: [...progressao.matchAll(/\{ id:\s*'([^']+)'[^\n]*grau:\s*'avassaladora'/g)].map(m => m[1]),
};
const idsEfeitos = [...efeitos.matchAll(/^\s*'([^']+)':\s*'/gm)].map(m => m[1]);

test('catálogo contém as três Classes e os nove Ramos com todos os graus previstos', () => {
  assert.equal(idsBasicas.length, 9);
  assert.equal(habilidadesPorGrau.avancada.length, 9);
  assert.equal(habilidadesPorGrau.superior.length, 9);
  assert.equal(habilidadesPorGrau.avassaladora.length, 3);
  for (const classe of ['Agente', 'Autodidata', 'Operador']) {
    assert.equal((basicas.match(new RegExp("classe:'" + classe + "'", 'g')) || []).length, 3, classe + ' Básicas');
    assert.equal((progressao.match(new RegExp("classe: '" + classe + "'", 'g')) || []).length, 7, classe + ' progressões');
  }
});

test('cada Habilidade cadastrada possui ID único, referência e descrição de efeito', () => {
  const ids = [...idsBasicas, ...Object.values(habilidadesPorGrau).flat()];
  assert.equal(new Set(ids).size, ids.length);
  const comEfeito = new Set([...idsBasicas, ...idsEfeitos]);
  for (const id of ids) {
    assert.ok(comEfeito.has(id), id + ' sem descrição de efeito');
  }
  for (const id of [...idsBasicas, ...Object.values(habilidadesPorGrau).flat()]) {
    const origem = id in Object.fromEntries(idsBasicas.map(x => [x, true])) ? basicas : progressao;
    assert.match(origem, new RegExp("id:\\s*'" + id + "'"));
  }
});
