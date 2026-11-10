import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = (await readFile(new URL('../src/recursosFicha.ts', import.meta.url), 'utf8'));
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const api = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('recursos iniciais respeitam máximos e BI começa em zero', () => {
  assert.deepEqual(api.recursosIniciais({}, 12, 4), { pvAtual: 12, pvTemporarios: 0, saAtual: 4, biAtual: 0 });
  assert.deepEqual(api.recursosIniciais({ pvAtual: 5, pvTemporarios: 2, saAtual: 1, biAtual: 8 }, 12, 4), { pvAtual: 5, pvTemporarios: 2, saAtual: 1, biAtual: 8 });
});

test('cura só altera PV Atuais e respeita máximo', () => {
  const r = { pvAtual: 5, pvTemporarios: 3, saAtual: 2, biAtual: 1 };
  assert.equal(api.curarPV(r, 2, 10).pvAtual, 7);
  assert.equal(api.curarPV(r, 20, 10).pvAtual, 10);
  assert.equal(api.curarPV(r, 2, 10).pvTemporarios, 3);
});

test('dano consome Temporários antes dos PV Atuais', () => {
  const r = { pvAtual: 8, pvTemporarios: 3, saAtual: 2, biAtual: 0 };
  assert.deepEqual(api.aplicarDanoPV(r, 2, 10, 4), { ...r, pvTemporarios: 1 });
  assert.deepEqual(api.aplicarDanoPV(r, 5, 10, 4), { ...r, pvTemporarios: 0, pvAtual: 6 });
  assert.deepEqual(api.aplicarDanoPV(r, 20, 10, 4), { ...r, pvTemporarios: 0, pvAtual: 0 });
});

test('PV Temporários novos conservam o maior valor sem somar', () => {
  const r = { pvAtual: 8, pvTemporarios: 4, saAtual: 2, biAtual: 0 };
  assert.equal(api.definirPVTemporarios(r, 3, 10, 4).pvTemporarios, 4);
  assert.equal(api.definirPVTemporarios(r, 7, 10, 4).pvTemporarios, 7);
});

test('SA fica entre zero e máximo; BI pode alcançar e ultrapassar máximo', () => {
  const r = { pvAtual: 8, pvTemporarios: 0, saAtual: 2, biAtual: 9 };
  assert.equal(api.ajustarSA(r, -1, 10, 4).saAtual, 1);
  assert.throws(() => api.ajustarSA(r, -3, 10, 4), /SA Atual/);
  assert.throws(() => api.ajustarSA(r, 3, 10, 4), /SA Atual/);
  assert.equal(api.ajustarBI(r, 2, 10, 4).biAtual, 11);
  assert.throws(() => api.ajustarBI(r, -10, 10, 4), /BI Atual/);
});

test('validação rejeita PV ou SA acima do máximo e valores fracionários', () => {
  assert.equal(api.recursosValidos({ pvAtual: 11, pvTemporarios: 0, saAtual: 4, biAtual: 0 }, 10, 4), false);
  assert.equal(api.recursosValidos({ pvAtual: 10, pvTemporarios: 0, saAtual: 5, biAtual: 0 }, 10, 4), false);
  assert.equal(api.recursosValidos({ pvAtual: 10.5, pvTemporarios: 0, saAtual: 4, biAtual: 0 }, 10, 4), false);
  assert.equal(api.recursosValidos({ pvAtual: 10, pvTemporarios: 0, saAtual: 4, biAtual: 50 }, 10, 4), true);
});

test('a interface liga recursos ao salvamento do rascunho e explica os limites', async () => {
  const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/FichaOfflineApp.tsx', import.meta.url), 'utf8');
  const servidor = await readFile(new URL('../src/ConexaoServidorLocal.tsx', import.meta.url), 'utf8');
  const laboratorio = await readFile(new URL('../src/LaboratorioLocal.tsx', import.meta.url), 'utf8');
  const ui = await readFile(new URL('../src/RecursosFichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ficha, /<RecursosFichaLocal/);
  assert.match(ficha, /origem=\{origem\}/);
  assert.match(ui, /ajustarBI\(recursos, 1, pvMaximo, saMaximo, origem\)/);
  const painelRecursos = ficha.match(/<RecursosFichaLocal\b[\s\S]*?\/>/)?.[0] ?? '';
  assert.ok(painelRecursos);
  assert.doesNotMatch(painelRecursos, /\bkey=/);
  assert.match(ui, /useEffect/);
  assert.match(ui, /if \(sujo\) return/);
  assert.doesNotMatch(ficha, /key=\{JSON\.stringify\(\[pv, sa, bi/);
  assert.match(app, /aoSalvarRecursos=\{recursos => salvarDados\(recursos\)\}/);
  assert.match(servidor, /aoSalvarRecursos=\{recursos => salvarDadosFicha\(recursos\)\}/);
  assert.match(laboratorio, /aoSalvarRecursos=\{async recursos =>/);
  assert.match(ui, /Dano consome PV Temporários antes dos PV Atuais/);
  assert.match(ui, /Alcançar ou ultrapassar BI Máxima sinaliza Colapso Viral/);
  assert.match(ui, /PV Atuais<input type=\"number\"/);
  assert.match(ui, /useSalvamentoEditorLocal/);
  assert.match(ui, /autoSalvar/);
  assert.match(ui, /Salvar recursos/);
  assert.doesNotMatch(ui, /Descartar alterações não salvas/);
  assert.match(ui, /Desfazer último ajuste/);
});

test('Vulnerável é exibida como condição derivada dos PV, sem edição manual', async () => {
  const fonte = await readFile(new URL('../src/RecursosFichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(fonte, /vulneravelPorPV\(recursos\.pvAtual, pvMaximo\)/);
  assert.match(fonte, /Vulnerável · PV atuais iguais ou inferiores a 1\/5 dos PV máximos/);
});

test('Origem Desgarrado recebe PV Temporários ao aumentar BI, sem acumular valores', () => {
  const base = { pvAtual: 8, pvTemporarios: 0, saAtual: 2, biAtual: 1 };
  assert.deepEqual(api.ajustarBI(base, 1, 10, 4, 'Desgarrado'), {
    pvAtual: 8, pvTemporarios: 1, saAtual: 2, biAtual: 2,
  });
  const comTemporarios = { ...base, pvTemporarios: 3, biAtual: 4 };
  assert.deepEqual(api.ajustarBI(comTemporarios, 1, 10, 4, 'Desgarrado'), {
    pvAtual: 8, pvTemporarios: 3, saAtual: 2, biAtual: 5,
  });
  assert.deepEqual(api.ajustarBI(base, 1, 10, 4, 'Agente'), {
    ...base, biAtual: 2,
  });
  assert.deepEqual(api.ajustarBI({ ...base, biAtual: 4 }, -1, 10, 4, 'Desgarrado'), {
    ...base, biAtual: 3,
  });
});
