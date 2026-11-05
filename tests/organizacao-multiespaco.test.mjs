import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const uri = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
async function carregar(arquivo, substituir = {}) {
  let source = await readFile(new URL(arquivo, import.meta.url), 'utf8');
  source = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const [de, para] of Object.entries(substituir)) source = source.replaceAll(de, para);
  return import(uri(source));
}
const consulta = await carregar('../src/inventarioConsulta.ts');
const organizacao = await carregar('../src/organizacaoInventario.ts', {
  "'./inventarioConsulta'": JSON.stringify((await import('node:url')).pathToFileURL(new URL('../src/inventarioConsulta.ts', import.meta.url).pathname).href)
});
const A = 'a1000000-0000-4000-8000-000000000001';
const B = 'a1000000-0000-4000-8000-000000000002';
const C = 'a1000000-0000-4000-8000-000000000003';
const personagem = 'b1000000-0000-4000-8000-000000000001';
const arma = (instanciaId, posicao, espacos = 1) => ({
  instanciaId, catalogoId: 'lemi', nome: 'Item de teste', quantidade: 1, espacos,
  local: 'inventario', posicao,
  estado: { tipo: 'arma_fogo', calibre: '9mm', carregada: 10, capacidade: 10, equipada: false },
});
const inventario = (...itens) => ({ personagemId: personagem, revisao: 4, capacidade: 6, itens });

test('consulta aceita exemplares de múltiplos Espaços e rejeita sobreposição', () => {
  const v = inventario(arma(A, 0, 2), arma(B, 2));
  assert.equal(consulta.lerInventarioConsulta(v, personagem).itens[0].espacos, 2);
  assert.throws(() => consulta.lerInventarioConsulta(inventario(arma(A, 0, 2), arma(B, 1)), personagem), /Inventário não verificado/);
  assert.throws(() => consulta.lerInventarioConsulta(inventario(arma(A, 0, 0)), personagem), /Inventário não verificado/);
});

test('consulta preserva inventário excedente após redução de capacidade, sem descartar itens', () => {
  const v = inventario(arma(A, 4, 2));
  v.capacidade = 5;
  const lido = consulta.lerInventarioConsulta(v, personagem);
  assert.equal(lido.itens.length, 1);
  assert.equal(lido.itens[0].posicao, 4);
});

test('organização move item de múltiplos Espaços para área livre', () => {
  const v = inventario(arma(A, 0, 2), arma(B, 2));
  const plano = organizacao.planejarOrganizacao(v, A, 4);
  assert.equal(plano.depois.itens[0].posicao, 4);
  assert.equal(plano.depois.itens[1].posicao, 2);
  assert.equal(plano.depois.revisao, 5);
});

test('organização troca itens de tamanhos diferentes quando ambos cabem', () => {
  const v = inventario(arma(A, 0, 2), arma(B, 3));
  const plano = organizacao.planejarOrganizacao(v, A, 3);
  assert.equal(plano.depois.itens[0].posicao, 3);
  assert.equal(plano.depois.itens[1].posicao, 0);
  assert.equal(plano.trocadoId, B);
});

test('organização recusa troca que causaria sobreposição ou destino com vários itens', () => {
  const sobreposicao = inventario(arma(A, 0), arma(B, 1, 2));
  assert.throws(() => organizacao.planejarOrganizacao(sobreposicao, A, 1), /sobreposição/);
  const varios = inventario(arma(A, 0, 2), arma(B, 2), arma(C, 3));
  assert.throws(() => organizacao.planejarOrganizacao(varios, A, 2), /mais de um exemplar/);
});

test('organização não move item para além da capacidade ou sobre outro exemplar sem troca válida', () => {
  const v = inventario(arma(A, 0, 2), arma(B, 2));
  assert.throws(() => organizacao.planejarOrganizacao(v, A, 5), /capacidade/);
});
