import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ler = async caminho => readFile(new URL('../src/' + caminho, import.meta.url), 'utf8');

test('trocar Treinamento ou segunda Perícia preserva os pontos distribuídos', async () => {
  const fonte = await ler('EditorAtributosPericiasLocal.tsx');
  assert.match(fonte, /setTreinada\(e\.target\.value\);setMensagem/);
  assert.match(fonte, /setExtra\(e\.target\.value\);setMensagem/);
  assert.doesNotMatch(fonte, /setDistribuicao\(\{\}\)/);
});

test('Perícias antigas permanecem visíveis e incompatíveis não recebem pontos novos', async () => {
  const fonte = await ler('EditorAtributosPericiasLocal.tsx');
  assert.match(fonte, /const validas = new Set\(permitidas\)/);
  assert.match(fonte, /\.\.\.Object\.keys\(distribuicao\)/);
  assert.match(fonte, /delta === 1 && \(!validas\.has\(nome\)/);
  assert.match(fonte, /disabled=\{ocupado\|\|gasto===0\}/);
  assert.match(fonte, /role="alert"/);
});

test('mudanças de Classe e Origem preservam escolhas dependentes até revisão explícita', async () => {
  const editor = await ler('EditorCaracteristicasLocal.tsx');
  assert.match(editor, /classe: e\.target\.value\s*\}\)/);
  assert.match(editor, /origem: e\.target\.value\s*\}\)/);
  assert.match(editor, /incompatível com a Classe/);
  assert.match(editor, /!habilidades\.some/);
  assert.match(editor, /!kits\.some/);
  assert.match(editor, /aoSalvar\(\{ \.\.\.dados \}\)/);
});

test('a ficha reinicializa o editor ao mudar Classe/Origem e mostra escolhas salvas incompatíveis', async () => {
  const fonte = await ler('FichaLocal.tsx');
  assert.match(fonte, /key=\{JSON\.stringify\(\[classe, origem, atributos, treinada, extra, distribuicao\]\)\}/);
  assert.match(fonte, /\.\.\.Object\.keys\(distribuicao\)/);
  assert.match(fonte, /Revisão da criação necessária/);
});
