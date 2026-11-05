import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = (await readFile(new URL('../src/reanimacaoFicha.ts', import.meta.url), 'utf8'));
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const api = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

function aplicar(r, resultado, pvMaximo = 12, cobaia = false) {
  return api.resolverTesteReanimacao(r, resultado, pvMaximo, cobaia);
}
function tresSucessos(causa, pvMaximo = 12, cobaia = false) {
  let r = api.iniciarTurnoReanimacao(api.iniciarReanimacao(causa));
  for (let i = 0; i < 3; i++) r = aplicar(r, cobaia ? [12, 4] : 12, pvMaximo, cobaia).reanimacao;
  return r;
}

test('Reanimação por 0 PV aguarda o próximo turno e não rola automaticamente', () => {
  const r = api.iniciarReanimacao('pv_zero');
  assert.equal(r.estado, 'aguardando_proximo_turno');
  assert.equal(r.tentativas, 0);
  assert.throws(() => aplicar(r, 20), /apta/);
  assert.equal(api.iniciarTurnoReanimacao(r).estado, 'em_andamento');
});

test('0 PV: três sucessos despertam com pelo menos 1 PV ou cura acumulada, respeitando o máximo', () => {
  let r = api.iniciarTurnoReanimacao(api.iniciarReanimacao('pv_zero'));
  r = api.acumularCuraDuranteReanimacao(r, 5);
  assert.equal(r.curaAcumulada, 5);
  let out;
  out = aplicar(r, 12); r = out.reanimacao;
  assert.equal(out.pvAoDespertar, null);
  out = aplicar(r, 12); r = out.reanimacao;
  assert.equal(out.pvAoDespertar, null);
  out = aplicar(r, 12); r = out.reanimacao;
  assert.equal(out.pvAoDespertar, 5);
  assert.equal(r.estado, 'concluida');
  assert.equal(aplicar(tresSucessos('pv_zero'), 12).reanimacao.estado, 'concluida');
  let curada = api.acumularCuraDuranteReanimacao(api.iniciarTurnoReanimacao(api.iniciarReanimacao('pv_zero')), 30);
  let final;
  for (let i = 0; i < 3; i++) final = aplicar(curada, 12, 8), curada = final.reanimacao;
  assert.equal(final.pvAoDespertar, 8);
});

test('0 PV: três falhas sinalizam Morte para registro do Mestre, sem morte automática', () => {
  let r = api.iniciarTurnoReanimacao(api.iniciarReanimacao('pv_zero'));
  let out;
  for (let i = 0; i < 3; i++) out = aplicar(r, 1), r = out.reanimacao;
  assert.equal(r.estado, 'morte_a_registrar');
  assert.equal(out.morteParaRegistroDoMestre, true);
  assert.equal(out.transformacaoPendente, false);
  assert.throws(() => aplicar(r, 20), /apta/);
});

test('sucesso em Medicina DT 15 concede Vantagem ao próximo Teste e consome a Vantagem', () => {
  let r = api.iniciarTurnoReanimacao(api.iniciarReanimacao('pv_zero'));
  r = api.concederAjudaMedicina(r, true);
  assert.equal(r.vantagemProximoTeste, true);
  let out = aplicar(r, [4, 12]);
  assert.equal(out.reanimacao.sucessos, 1);
  assert.equal(out.reanimacao.vantagemProximoTeste, false);
  assert.equal(aplicar(out.reanimacao, 12).reanimacao.sucessos, 2);
  assert.equal(api.concederAjudaMedicina(r, false).vantagemProximoTeste, false);
});

test('Colapso: Cobaia rola dois d20, três sucessos mantêm Desacordado até BI abaixo do máximo', () => {
  let r = tresSucessos('colapso_bi', 12, true);
  assert.equal(r.estado, 'desacordada_ate_reducao_bi');
  assert.throws(() => aplicar(r, [20, 20], 12, true), /apta/);
  assert.throws(() => api.encerrarColapsoPorReducaoBI(r, 10, 10), /abaixo/);
  assert.equal(api.encerrarColapsoPorReducaoBI(r, 9, 10).estado, 'concluida');
});

test('Colapso: três falhas deixam transformação pendente para o próximo turno', () => {
  let r = api.iniciarTurnoReanimacao(api.iniciarReanimacao('colapso_bi'));
  let out;
  for (let i = 0; i < 3; i++) out = aplicar(r, 1, 12), r = out.reanimacao;
  assert.equal(r.estado, 'transformacao_no_proximo_turno');
  assert.equal(out.transformacaoPendente, true);
  assert.equal(out.morteParaRegistroDoMestre, false);
});

test('causa, faixa de resultados, vantagem e estados terminais são validados', () => {
  assert.throws(() => api.iniciarReanimacao('outro'), /Causa/);
  const r = api.iniciarTurnoReanimacao(api.iniciarReanimacao('pv_zero'));
  assert.throws(() => aplicar(r, 0), /resultado/);
  assert.throws(() => aplicar(r, [10, 12]), /um resultado/);
  assert.throws(() => api.acumularCuraDuranteReanimacao(r, -1), /Cura/);
  assert.throws(() => api.concederAjudaMedicina(api.iniciarTurnoReanimacao(api.iniciarReanimacao('colapso_bi')), true), /Ajuda/);
});
