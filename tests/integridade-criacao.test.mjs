import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ler = async caminho => readFile(new URL('../src/' + caminho, import.meta.url), 'utf8');

test('trocar Treinamento ou segunda Perícia preserva os pontos distribuídos', async () => {
  const fonte = await ler('EditorAtributosPericiasLocal.tsx');
  assert.match(fonte, /setTreinada\(e\.target\.value\);marcarAlteracao\(\)/);
  assert.match(fonte, /setExtra\(e\.target\.value\);marcarAlteracao\(\)/);
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
  assert.doesNotMatch(editor, /equipamentoInicial/);
  const inventario = await ler('EditorInventarioLocal.tsx');
  assert.match(inventario, /!opcoes\.some/);
  assert.match(inventario, /incompatível com a Classe/);
  assert.match(editor, /useSalvamentoEditorLocal/);
  assert.match(editor, /valor: dados/);
});

test('a ficha sincroniza o editor ao mudar Classe/Origem sem desmontá-lo', async () => {
  const fonte = await ler('FichaLocal.tsx');
  const editor = await ler('EditorAtributosPericiasLocal.tsx');
  const tag = fonte.match(/<EditorAtributosPericiasLocal\b[\s\S]*?\/>/)?.[0] ?? '';
  assert.ok(tag);
  assert.doesNotMatch(tag, /\bkey=/);
  assert.match(editor, /useEffect/);
  assert.match(editor, /if \(sujo\) return/);
  assert.match(fonte, /\.\.\.Object\.keys\(distribuicao\)/);
  assert.match(fonte, /Revisão da criação necessária/);
});

test('rascunho preserva escolhas incompletas e a revisão final aponta o que falta', async () => {
  const editor = await ler('EditorCaracteristicasLocal.tsx');
  const revisao = await ler('RevisaoCriacaoLocal.tsx');
  assert.match(editor, /useSalvamentoEditorLocal/);
  assert.doesNotMatch(editor, /validar:/);
  assert.match(revisao, /revisarCriacao\(ficha\)/);
  assert.match(revisao, /finalização ainda não está disponível/i);
});


test('Equipamento Inicial tem uma única fonte de edição no Inventário', async () => {
  const caracteristicas = await ler('EditorCaracteristicasLocal.tsx');
  const inventario = await ler('EditorInventarioLocal.tsx');
  const ficha = await ler('FichaLocal.tsx');
  assert.doesNotMatch(caracteristicas, /equipamentoInicial/);
  assert.match(inventario, /equipamentoInicial/);
  assert.match(inventario, /incompatível com a Classe/);
  assert.match(ficha, /Editar Equipamento Inicial e compras/);
  assert.match(ficha, /Equipamento Inicial/);
});
