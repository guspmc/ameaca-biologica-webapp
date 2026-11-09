import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ler = arquivo => readFile(new URL('../src/' + arquivo, import.meta.url), 'utf8');

test('status genérico de autosave não presume servidor no fluxo local', async () => {
  const ui = await ler('AutoSaveStatusLocal.tsx');
  assert.match(ui, /Salvando alterações/);
  assert.match(ui, /O salvamento não foi confirmado/);
  assert.doesNotMatch(ui, /Sincronizando com o servidor/);
  assert.doesNotMatch(ui, /O servidor não confirmou/);
});

test('Ficha propaga a origem de persistência aos painéis compartilhados', async () => {
  const ficha = await ler('FichaLocal.tsx');
  assert.match(ficha, /<PainelAcoesLocal[\s\S]*?origemDados=\{origemDados\}/);
  assert.match(ficha, /<FuncionamentoFichaLocal origemDados=\{origemDados\}/);
});

test('Recursos informa corretamente confirmação local ou do servidor', async () => {
  const ui = await ler('RecursosFichaLocal.tsx');
  assert.match(ui, /origemDados === 'servidor' \? 'Recursos confirmados pelo servidor\.' : 'Recursos salvos neste dispositivo\.'/);
  assert.match(ui, /mensagemSucesso: origemDados === 'servidor'/);
});

test('Funcionamento informa corretamente confirmação local ou do servidor', async () => {
  const ui = await ler('FuncionamentoFichaLocal.tsx');
  assert.match(ui, /origemDados\?: 'local' \| 'servidor'/);
  assert.match(ui, /Preferências confirmadas pelo servidor\./);
  assert.match(ui, /Preferências salvas neste dispositivo\./);
  assert.match(ui, /mensagemSucesso=\{origemDados === 'servidor'/);
});

test('Economia de Ações informa corretamente confirmação local ou do servidor', async () => {
  const ui = await ler('PainelAcoesLocal.tsx');
  assert.match(ui, /origemDados\?: 'local' \| 'servidor'/);
  assert.match(ui, /Economia de ações confirmada pelo servidor\./);
  assert.match(ui, /Economia de ações salva neste dispositivo\./);
  assert.match(ui, /O salvamento não foi confirmado/);
});


test('editores da Ficha usam confirmação local por padrão e só mencionam servidor quando a origem é explícita', async () => {
  const arquivos = [
    ['EditorCaracteristicasLocal.tsx', 'Características salvas neste dispositivo.'],
    ['EditorAtributosPericiasLocal.tsx', 'Atributos e Perícias salvos neste dispositivo.'],
    ['IdentidadeLocal.tsx', 'Identificação salva neste dispositivo.'],
    ['EditorInventarioLocal.tsx', 'Planejamento do inventário salvo neste dispositivo.'],
  ];
  for (const [arquivo, mensagem] of arquivos) {
    const fonte = await readFile(new URL('../src/' + arquivo, import.meta.url), 'utf8');
    assert.match(fonte, new RegExp(mensagem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(fonte, /confirmad[oa]s? pelo servidor/);
  }
  const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ficha, /origemDados === 'servidor' \? 'Características confirmadas pelo servidor\.'/);
  assert.match(ficha, /origemDados === 'servidor' \? 'Identificação confirmada pelo servidor\.'/);
});
