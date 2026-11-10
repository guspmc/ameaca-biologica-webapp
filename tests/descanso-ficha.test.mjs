import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const paths = ['recursosFicha.ts', 'descansoFicha.ts'];
let source = '';
for (const path of paths) source += (await readFile(new URL('../src/' + path, import.meta.url), 'utf8')).replace(/^import .*;$/gm, '') + '\n';
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const api = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('Dado de Vida depende da Classe', () => {
  assert.equal(api.dadoVidaClasse('Autodidata'), 8);
  assert.equal(api.dadoVidaClasse('Agente'), 10);
  assert.equal(api.dadoVidaClasse('Operador'), 12);
  assert.throws(() => api.dadoVidaClasse('Outra'), /Classe/);
});

test('Descanso Parcial usa resultado informado, cura PV e preserva SA, BI e Temporários', () => {
  const r = { pvAtual: 3, pvTemporarios: 2, saAtual: 1, biAtual: 4 };
  assert.deepEqual(api.concluirDescansoParcial(r, 6, 10, 12, 4), { pvAtual: 9, pvTemporarios: 2, saAtual: 1, biAtual: 4 });
  assert.deepEqual(api.concluirDescansoParcial(r, 10, 10, 6, 4), { pvAtual: 6, pvTemporarios: 2, saAtual: 1, biAtual: 4 });
  assert.throws(() => api.concluirDescansoParcial(r, 11, 10, 12, 4), /Resultados físicos/);
});

test('Descanso Parcial soma um Dado de Vida por Nível e rejeita quantidade incompleta', () => {
  const r = { pvAtual: 1, pvTemporarios: 2, saAtual: 1, biAtual: 4 };
  assert.deepEqual(api.concluirDescansoParcial(r, [6, 4, 8], 10, 20, 4, 3), {
    pvAtual: 19, pvTemporarios: 2, saAtual: 1, biAtual: 4,
  });
  assert.throws(() => api.concluirDescansoParcial(r, [6, 4], 10, 20, 4, 3), /Resultados físicos/);
  assert.throws(() => api.concluirDescansoParcial(r, [6, 4, 11], 10, 20, 4, 3), /Resultados físicos/);
});

test('Descanso Completo restaura PV e SA, encerra Temporários e preserva BI', () => {
  const r = { pvAtual: 2, pvTemporarios: 5, saAtual: 0, biAtual: 7 };
  assert.deepEqual(api.concluirDescansoCompleto(r, 12, 4), { pvAtual: 12, pvTemporarios: 0, saAtual: 4, biAtual: 7 });
});

test('local permitido diferencia Descanso Parcial e Completo', () => {
  assert.equal(api.localPermiteDescanso('parcial', 'sala_descanso'), true);
  assert.equal(api.localPermiteDescanso('parcial', 'sala_segura'), true);
  assert.equal(api.localPermiteDescanso('completo', 'sala_descanso'), true);
  assert.equal(api.localPermiteDescanso('completo', 'sala_segura'), false);
  assert.equal(api.localPermiteDescanso('completo', ''), false);
});

test('painel respeita dados físicos, virtuais e mistos e salva somente após ação expressa', async () => {
  const ui = await readFile(new URL('../src/DescansoFichaLocal.tsx', import.meta.url), 'utf8');
  const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
  const progressao = await readFile(new URL('../src/ProgressaoFichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /useState<LocalDescanso \| ''>\(''\)/);
  assert.match(ui, /resultadosValidos/);
  assert.match(ui, /resultados\.map\(Number\)/);
  assert.match(ficha, /nivel=\{nivelAtual\}/);
  assert.match(ficha, /const nivelAtual = Number\.isSafeInteger\(ficha\.nivel\)/);
  assert.match(ui, /!bloqueado &&/);
  assert.match(ficha, /bloqueado=\{secoesPendentes\.size > 0(?: \|\| reanimacaoEmCurso)?\}/);
  assert.match(ui, /sortearDados\(nivel, dadoVida!\)/);
  assert.match(ui, /modoDados === 'mistos'/);
  assert.match(ui, /Método dos Dados de Vida/);
  assert.match(ui, /Concluir Descanso Completo/);
  assert.match(ui, /renovarUsosDescansoCompleto\(\)/);
  assert.match(ui, /usos limitados renovados/);
  const painelDescanso = ficha.match(/<DescansoFichaLocal\b[\s\S]*?\/>/)?.[0] ?? '';
  assert.ok(painelDescanso, 'o painel de Descanso deve permanecer montado na Ficha');
  assert.doesNotMatch(painelDescanso, /\bkey=/, 'o painel não deve ser remontado após o salvamento, preservando a confirmação visual');
  assert.match(painelDescanso, /origemDados=\{origemDados\}/);
  assert.match(painelDescanso, /aoPrepararPatchCompleto=\{\(\) =>/);
  assert.match(ui, /\.\.\.\(aoPrepararPatchCompleto\?\.\(\) \?\? \{\}\)/);
  assert.match(ficha, /pedidoAtual\.estado === 'descanso_confirmado'/);
  assert.match(progressao, /Cancelar solicitação/);
});

test('rolagem virtual de Descanso Parcial ocorre somente após confirmação expressa', async () => {
  const ui = await readFile(new URL('../src/DescansoFichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /tipo === 'parcial' \? \(metodo === 'virtual'/);
  assert.match(ui, /Concluir Descanso Parcial/);
  assert.match(ui, /Dados de Vida virtuais/);
});

test('rolador virtual de Descanso Parcial fica restrito ao modo Automático', async () => {
  const ui = await readFile(new URL('../src/DescansoFichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /rolagemVirtualAtiva = modo === 'automatico' && metodo === 'virtual'/);
  assert.match(ui, /modo === 'automatico' && modoDados === 'mistos'/);
  assert.match(ui, /modo !== 'automatico' && <p>Modo/);
});
