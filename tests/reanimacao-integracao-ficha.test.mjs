import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [ficha, painel, recursos] = await Promise.all([
  readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/ReanimacaoFichaLocal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/RecursosFichaLocal.tsx', import.meta.url), 'utf8'),
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
  assert.match(painel, /Informe dois resultados de d20/);
  assert.match(painel, /rolagem virtual ainda não está implementada/);
  assert.match(painel, /não rola dados, não avança turnos/);
});

test('cura em 0 PV é direcionada à acumulação da Reanimação, sem botão de cura direta', () => {
  assert.match(recursos, /recursos\.pvAtual === 0/);
  assert.match(recursos, /cura deve ser registrada no painel de Reanimação/);
  assert.match(painel, /Acumular cura sem despertar/);
});

test('Reanimação não sobrescreve outras seções ainda pendentes', () => {
  assert.match(ficha, /bloqueado=\{secoesPendentes\.size > 0\}/);
  assert.match(painel, /Salve ou descarte outras alterações pendentes/);
});
