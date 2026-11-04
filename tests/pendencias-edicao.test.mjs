import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ler = async caminho => readFile(new URL('../src/' + caminho, import.meta.url), 'utf8');

test('todos os editores sinalizam alterações locais e limpam a pendência após salvar', async () => {
  const arquivos = [
    'EditorCaracteristicasLocal.tsx',
    'EditorAtributosPericiasLocal.tsx',
    'EditorInventarioLocal.tsx',
    'IdentidadeLocal.tsx',
  ];
  for (const arquivo of arquivos) {
    const fonte = await ler(arquivo);
    assert.match(fonte, /aoAlterarPendencia\(true\)/, arquivo + ': deve sinalizar edição');
    assert.match(fonte, /aoAlterarPendencia\(false\)/, arquivo + ': deve limpar após salvamento confirmado');
  }
});

test('campos narrativos e nome sinalizam pendência de edição', async () => {
  const fonte = await ler('IdentidadeLocal.tsx');
  assert.match(fonte, /setNome\(evento\.target\.value\); aoAlterarPendencia\(true\)/);
  assert.match(fonte, /setDados\(atual => \(\{ \.\.\.atual, \[campo\.id\]: evento\.target\.value \}\)\); aoAlterarPendencia\(true\)/);
});

test('prévia de compras sinaliza alteração e limpeza do plano', async () => {
  const fonte = await ler('PreviaCompras.tsx');
  assert.match(fonte, /function mudar\([^]*?aoAlterarPendencia\?\.\(true\)/);
  assert.match(fonte, /setPlano\(\{\}\);aoAlterarPendencia\?\.\(true\)/);
});

test('a ficha offline recebe pendências de cada seção editável', async () => {
  const fonte = await ler('FichaLocal.tsx');
  for (const secao of ['Características', 'Identificação', 'Atributos e Perícias', 'Inventário']) {
    assert.ok(fonte.includes("registrarPendencia('" + secao + "'"), 'seção sem rastreamento: ' + secao);
  }
  const app = await ler('FichaOfflineApp.tsx');
  assert.match(app, /secoesNaoSalvasRef\.current\.size > 0/);
  assert.match(app, /window\.confirm\([^]*?alterações ainda não salvas[^]*?serão descartadas/);
});

test('entradas alternativas da ficha também protegem edições pendentes ao fechar', async () => {
  const fonte = await ler('FichaLocal.tsx');
  assert.match(fonte, /pendenciasInternas\.current\.size > 0/);
  assert.match(fonte, /Há alterações não salvas em:/);
});

test('navegacao para fora alerta quando existem edicoes locais pendentes', async () => {
  const fonte = await ler('FichaOfflineApp.tsx');
  assert.match(fonte, /temEdicoesPendentes/);
  assert.match(fonte, /window\.addEventListener\('beforeunload', prevenirSaida\)/);
  assert.match(fonte, /evento\.preventDefault\(\)/);
  assert.match(fonte, /evento\.returnValue = ''/);
  assert.match(fonte, /window\.removeEventListener\('beforeunload', prevenirSaida\)/);
});

test('alterar a prévia depois de aplicá-la invalida o plano aplicado', async () => {
  const fonte = await ler('EditorInventarioLocal.tsx');
  assert.match(fonte, /aoAlterarPendencia=\{pendente => \{ aoAlterarPendencia\(pendente\); if \(pendente\) setPlanoAplicado\(false\); \}\}/);
  assert.match(fonte, /setPlanoAplicado\(true\)/);
  assert.match(fonte, /kit === 'C' && !planoAplicado/);
});
