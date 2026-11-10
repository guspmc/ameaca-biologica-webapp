import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [ficha, painel, recursos, descanso] = await Promise.all([
  readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/ReanimacaoFichaLocal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/RecursosFichaLocal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/DescansoFichaLocal.tsx', import.meta.url), 'utf8'),
]);

test('painel de Reanimação está integrado à ficha contínua e aos salvamentos', () => {
  assert.match(ficha, /import ReanimacaoFichaLocal from '\.\/ReanimacaoFichaLocal'/);
  assert.match(ficha, /<ReanimacaoFichaLocal[\s\S]*?aoSalvar=\{aoSalvarRecursos\}/);
  assert.match(ficha, /bloqueado=\{secoesPendentes\.size > 0\}/);
  assert.match(painel, /reanimacao: proxima/);
  assert.match(painel, /O armazenamento não confirmou a alteração da Reanimação/);
});

test('painel inicia Colapso Viral automaticamente sem presumir rolagens ou avançar turnos', () => {
  assert.match(painel, /resultadoValido/);
  assert.match(painel, /informe dois resultados físicos de d20/);
  assert.match(painel, /sortearDados\(2, 20\)/);
  assert.match(painel, /Colapso Viral e a Reanimação específica são iniciados automaticamente/);
  assert.match(painel, /void iniciar\('colapso_bi'\)/);
  assert.match(painel, /não avança turnos/);
});

test('Primeiros Socorros e cura acumulada ficam disponíveis enquanto aguarda o próximo turno', () => {
  assert.match(painel, /estadoPV0 &&/);
  assert.match(painel, /Registrar sucesso/);
  assert.match(painel, /Acumular cura sem despertar/);
});

test('um novo evento crítico pode iniciar outra Reanimação após a anterior ser concluída', () => {
  assert.match(painel, /reanimacaoAnteriorConcluida/);
  assert.match(painel, /reanimacao === null \|\| reanimacaoAnteriorConcluida/);
});

test('cura em 0 PV é direcionada à acumulação da Reanimação, sem botão de cura direta', () => {
  assert.match(recursos, /recursos\.pvAtual === 0/);
  assert.match(recursos, /registre toda cura no painel de Reanimação/);
  assert.match(painel, /Acumular cura sem despertar/);
});

test('Teste de Medicina também permite registrar resultado crítico de 1 natural', () => {
  assert.match(painel, /Registrar falha crítica \(1 natural\)/);
  assert.match(painel, /1 natural no Teste de Medicina: Falha Crítica/);
  assert.match(painel, /não ativa Exposto automaticamente/);
  assert.match(painel, /Teste de Medicina DT 15 na própria Ficha/);
  assert.doesNotMatch(painel, /Falha Crítica e Exposto para quem realizou o Teste/);
});

test('1 natural em Reanimação é Falha Crítica, mas não ativa Exposto por não ser Ataque', () => {
  assert.match(painel, /Falha Crítica no Teste de Reanimação/);
  assert.match(painel, /não ativa Exposto automaticamente/);
  assert.doesNotMatch(painel, /Falha Crítica e Exposto/);
});

test('resumo da BI informa corretamente que Colapso Viral inicia Reanimação automaticamente', () => {
  assert.match(ficha, /Ao confirmar BI igual ou superior ao máximo, o módulo Reanimação registra automaticamente o Colapso Viral/);
  assert.doesNotMatch(ficha, /nem inicia Reanimação/);
});

test('PV Atuais não podem ser alterados diretamente durante Reanimação por 0 PV', () => {
  assert.match(ficha, /bloquearPV=\{recursosAtuais\.pvAtual === 0 \|\| reanimacaoPV0EmCurso\}/);
  assert.match(recursos, /bloquearPV\?: boolean/);
  assert.match(recursos, /value=\{recursos\.pvAtual\} disabled=\{ocupado \|\| bloquearPV\}/);
  assert.match(recursos, /disabled=\{ocupado \|\| bloquearPV \|\| recursos\.pvAtual/);
});

test('Reanimação não sobrescreve outras seções ainda pendentes', () => {
  assert.match(ficha, /bloqueado=\{secoesPendentes\.size > 0\}/);
  assert.match(painel, /Salve ou descarte outras alterações pendentes/);
});

test('descanso não restaura PV enquanto Reanimação ou transformação estiver pendente', () => {
  assert.match(ficha, /reanimacaoEmCurso/);
  assert.match(ficha, /bloqueado=\{secoesPendentes\.size > 0 \|\| reanimacaoEmCurso\}/);
  assert.match(descanso, /bloqueado/);
});

test('Reanimação respeita dados físicos, virtuais e mistos sem presumir resultados', () => {
  assert.match(painel, /sortearDados\(2, 20\)/);
  assert.match(painel, /sortearDados\(1, 20\)\[0\]/);
  assert.match(painel, /modoDados === 'mistos'/);
  assert.match(painel, /Rolar e registrar Teste/);
  assert.match(painel, /Dados físicos registrados/);
});

test('0 PV inicia automaticamente o estado de Reanimação, aguardando o próximo turno', () => {
  assert.match(painel, /pvZeroAutoTentado/);
  assert.match(painel, /void iniciar\('pv_zero'\)/);
  assert.match(painel, /recursos\.pvAtual > 0/);
  assert.match(painel, /aguardando_proximo_turno/);
  assert.match(painel, /Iniciar Testes no próximo turno/);
});

test('Reanimação virtual não é bloqueada e Teste de Medicina comum não ativa Exposto', () => {
  assert.doesNotMatch(painel, /bloqueioVirtual/);
  assert.match(painel, /sortearDados\(2, 20\)/);
  assert.match(painel, /não ativa Exposto automaticamente/);
});

test('roladores de Reanimação ficam disponíveis somente no modo Automático', () => {
  assert.match(painel, /rolagemVirtualAtiva = modo === 'automatico' && metodo === 'virtual'/);
  assert.match(painel, /modo === 'automatico' && modoDados === 'mistos'/);
  assert.match(painel, /modo !== 'automatico' && <p>Modo/);
});
