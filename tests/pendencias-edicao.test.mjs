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
    'FuncionamentoFichaLocal.tsx',
  ];
  for (const arquivo of arquivos) {
    const fonte = await ler(arquivo);
    assert.match(fonte, /aoAlterarPendencia\(true\)/, arquivo + ': deve sinalizar edição');
    assert.match(fonte, /aoAlterarPendencia\(false\)/, arquivo + ': deve limpar após salvamento confirmado');
  }
});

test('preferências de funcionamento sinalizam pendência e só confirmam após salvar', async () => {
  const fonte = await ler('FuncionamentoFichaLocal.tsx');
  assert.match(fonte, /aoAlterarPendencia\(true\)/);
  assert.match(fonte, /const confirmado = await aoSalvar/);
  assert.match(fonte, /if \(!confirmado\) throw new Error/);
  assert.match(fonte, /aoAlterarPendencia\(false\)/);
  assert.match(fonte, /Preferências salvas e confirmadas/);
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
  for (const secao of ['Características', 'Identificação', 'Atributos e Perícias', 'Inventário', 'Funcionamento']) {
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

test('a confirmação local de salvamento limpa a seção correspondente antes do fechamento', async () => {
  const fonte = await ler('FichaOfflineApp.tsx');
  assert.match(fonte, /secoesNaoSalvasRef\.current\.delete\('Características'\)/);
  assert.match(fonte, /secoesNaoSalvasRef\.current\.delete\('Atributos e Perícias'\)/);
  assert.match(fonte, /secoesNaoSalvasRef\.current\.delete\('Identificação'\)/);
  assert.match(fonte, /secoesNaoSalvasRef\.current\.delete\('Inventário'\)/);
});

test('salvar Identificação preserva chaves futuras já existentes no objeto narrativo', async () => {
  const fonte = await ler('IdentidadeLocal.tsx');
  assert.match(fonte, /const identidade = \{ \.\.\.identidadeInicial, \.\.\.Object\.fromEntries\(CAMPOS\.map/);
});

test('lista bloqueia abertura, exportacao e selecao de backup enquanto uma operacao esta ocupada', async () => {
  const fonte = await ler('FichaOfflineApp.tsx');
  assert.match(fonte, /disabled=\{!personagens.length \|\| ocupado\}>Exportar backup JSON ↓/);
  assert.match(fonte, /type="file"[^>]*disabled=\{ocupado\}/);
  assert.match(fonte, /onClick=\{\s*\(\)\s*=>\s*void abrirPersonagem\(p\.id\)\}\s*disabled=\{ocupado\}/);
});


test('recarregar a ficha remonta o editor de Identificação com os dados externos atualizados', async () => {
  const fonte = await ler('FichaLocal.tsx');
  assert.match(fonte, /<IdentidadeLocal key=\{JSON\.stringify\(\[nome, ficha\.identidade \?\? \{\}\]\)\}/);
});
