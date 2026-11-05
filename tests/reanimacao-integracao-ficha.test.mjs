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

test('painel exige resultados manuais e não executa rolagem virtual presumida', () => {
  assert.match(painel, /resultadoValido/);
  assert.match(painel, /informe dois resultados de d20/);
  assert.match(painel, /rolagem virtual ainda não está implementada/);
  assert.match(painel, /não rola dados, não avança turnos/);
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
  assert.match(painel, /1 natural no Teste de Medicina: Falha Crítica e Exposto para quem realizou o Teste/);
});

test('1 natural sinaliza Falha Crítica e Exposto sem administrar a Condição automaticamente', () => {
  assert.match(painel, /Falha Crítica e Exposto/);
  assert.match(painel, /não administra Condições automaticamente/);
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
