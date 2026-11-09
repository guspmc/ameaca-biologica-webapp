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
    'RecursosFichaLocal.tsx',
  ];
  const hook = await ler('useSalvamentoEditorLocal.ts');
  assert.match(hook, /aoAlterarPendencia\(false\)/, 'o hook compartilhado deve limpar após confirmação');
  for (const arquivo of arquivos) {
    const fonte = await ler(arquivo);
    assert.match(fonte, /aoAlterarPendencia\(true\)/, arquivo + ': deve sinalizar edição');
    assert.match(fonte, /useSalvamentoEditorLocal/, arquivo + ': deve usar o fluxo compartilhado de salvamento');
  }
});

test('preferências de funcionamento sinalizam pendência e só confirmam após salvar', async () => {
  const fonte = await ler('FuncionamentoFichaLocal.tsx');
  assert.match(fonte, /aoAlterarPendencia\(true\)/);
  assert.match(fonte, /useSalvamentoEditorLocal/);
  assert.match(fonte, /autoSalvar/);
  const hook = await ler('useSalvamentoEditorLocal.ts');
  assert.match(hook, /aoAlterarPendencia\(false\)/);
  assert.match(fonte, /Preferências confirmadas pelo servidor\./);
  assert.match(fonte, /Preferências salvas neste dispositivo\./);
  assert.match(fonte, /value=\{config\.modoDados\}/);
  assert.match(fonte, /value=\{config\.visibilidadeRolagem\}/);
  assert.match(fonte, /value="fisicos"/);
  assert.match(fonte, /value="virtuais"/);
  assert.match(fonte, /value="mistos"/);
});

test('ficha contínua integra revisão local e ativação explícita pelo servidor', async () => {
  const ficha = await ler('FichaLocal.tsx');
  assert.match(ficha, /<RevisaoCriacaoLocal ficha=\{fichaRevisao\}/);
  assert.match(ficha, /<AtivacaoPersonagemLocal revision=\{revisaoFicha\}/);
  assert.match(ficha, /const fichaRevisao: FichaRevisao/);
  const revisao = await ler('RevisaoCriacaoLocal.tsx');
  assert.match(revisao, /revisarCriacao\(ficha\)/);
  assert.match(revisao, /conferidos\}\//);
  assert.match(revisao, /não ativa a personagem/);
  assert.doesNotMatch(revisao, /finalização ainda não está disponível/i);
  const ativacao = await ler('AtivacaoPersonagemLocal.tsx');
  assert.match(ativacao, /Conferir criação no servidor/);
  assert.match(ativacao, /Ativar personagem/);
  assert.match(ficha, /estadoFicha === 'rascunho'\s*\? <details id="ficha-local-editor-caracteristicas"/);
  assert.match(ficha, /estadoFicha === 'rascunho'\s*\? <details id="ficha-local-editor-pericias"/);
  assert.match(ficha, /estadoFicha === 'rascunho'\s*\? <details id="ficha-local-editor-inventario"/);
  assert.match(ficha, /O equipamento inicial foi materializado na ativação/);
});

test('calculadora manual está integrada à seção de Perícias e não rola nem salva dados', async () => {
  const ficha = await ler('FichaLocal.tsx');
  assert.match(ficha, /<CalculadoraTesteLocal atributos=\{atributos\}/);
  const calculadora = await ler('CalculadoraTesteLocal.tsx');
  assert.match(calculadora, /calcularTesteManual/);
  assert.match(calculadora, /modoDados === 'virtuais'/);
  assert.match(calculadora, /rolagem virtual ainda não foi implementada/);
  assert.match(ficha, /modoDados=\{configuracaoFuncionamento\.modoDados\}/);
  assert.match(calculadora, /resultado físico do d20/i);
  assert.match(calculadora, /não rola dados, não registra uma rolagem e não altera a ficha/i);
  assert.doesNotMatch(calculadora, /Math\.random|aoSalvar|fetch\(/);
});

test('campos narrativos e nome sinalizam pendência de edição', async () => {
  const fonte = await ler('IdentidadeLocal.tsx');
  assert.match(fonte, /setNome\(evento\.target\.value\); marcarAlteracao\(\)/);
  assert.match(fonte, /setDados\(atual => \(\{ \.\.\.atual, \[campo\.id\]: evento\.target\.value \}\)\); marcarAlteracao\(\)/);
});

test('prévia de compras sincroniza alterações na LAN e mantém aplicação manual fora dela', async () => {
  const fonte = await ler('PreviaCompras.tsx');
  const editor = await ler('EditorInventarioLocal.tsx');
  assert.match(fonte, /if \(autoSalvar\) aoAlterarPlano\?\.\(proximo\)/);
  assert.match(fonte, /aoAlterarPlano\?\.\(planoLocal\)/);
  assert.match(fonte, /autoSalvar \? 'As quantidades desta prévia seguem automaticamente/);
  assert.match(editor, /useSalvamentoEditorLocal/);
  assert.match(editor, /autoSalvar=\{autoSalvar\}/);
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
  assert.match(fonte, /Aguardando confirmação do servidor:/);
  assert.match(fonte, /Há alterações pendentes em:/);
});

test('navegacao para fora alerta quando existem edicoes locais pendentes', async () => {
  const fonte = await ler('FichaOfflineApp.tsx');
  assert.match(fonte, /temEdicoesPendentes/);
  assert.match(fonte, /window\.addEventListener\('beforeunload', prevenirSaida\)/);
  assert.match(fonte, /evento\.preventDefault\(\)/);
  assert.match(fonte, /evento\.returnValue = ''/);
  assert.match(fonte, /window\.removeEventListener\('beforeunload', prevenirSaida\)/);
});

test('autosave só é ativado na conexão LAN e espera confirmação antes de limpar pendência', async () => {
  const ficha = await ler('FichaLocal.tsx');
  const conexao = await ler('ConexaoServidorLocal.tsx');
  const offline = await ler('FichaOfflineApp.tsx');
  const hook = await ler('useAutoSaveLocal.ts');
  assert.match(ficha, /autoSalvar = false/);
  assert.match(conexao, /<FichaLocal\s+autoSalvar/);
  assert.doesNotMatch(offline, /<FichaLocal[^>]*autoSalvar/);
  assert.match(hook, /await referencias\.current\.aoSalvar\(atual\)/);
  assert.match(hook, /setEstado\('salvo'\)/);
  assert.match(hook, /referencias\.current\.aoConfirmar\(\)/);
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


test('recarregar a ficha sincroniza Identificação sem desmontar o editor', async () => {
  const fonte = await ler('FichaLocal.tsx');
  const identidade = await ler('IdentidadeLocal.tsx');
  const tag = fonte.match(/<IdentidadeLocal\b[\s\S]*?\/>/)?.[0] ?? '';
  assert.ok(tag);
  assert.doesNotMatch(tag, /\bkey=/);
  assert.match(identidade, /useEffect/);
  assert.match(identidade, /if \(sujo\) return/);
});
