import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/condicoesFicha.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const api = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('lembretes de condição permanecem como consulta pura, sem aplicar efeitos', () => {
  const condicoes = [
    { id:'q', condicao:'queimadura', fonte:'Ataque incendiário', observacao:'', estado:'ativa', encerradaEm:null },
    { id:'c', condicao:'corrosao', fonte:'Toxina', observacao:'', estado:'ativa', encerradaEm:null },
  ];
  const lembretes = api.lembretesCondicoesPorTurno(condicoes);
  assert.equal(lembretes.inicio.length, 2);
  assert.equal(lembretes.fim.length, 2);
});

test('lembretes de Surpreendido e Exposto não alteram nem encerram condições', () => {
  const condicoes = [
    { id:'s', condicao:'surpreendido', fonte:'Emboscada', observacao:'', estado:'ativa', encerradaEm:null },
    { id:'e', condicao:'exposto', fonte:'Falha Crítica', observacao:'', estado:'ativa', encerradaEm:null },
  ];
  const lembretes = api.lembretesCondicoesPorTurno(condicoes);
  assert.equal(lembretes.inicio.length, 0);
  assert.equal(lembretes.fim.length, 2);
});

test('condições encerradas e dados inválidos não geram lembretes', () => {
  const encerrada = { id:'q', condicao:'queimadura', fonte:'Fogo', observacao:'', estado:'encerrada', encerradaEm:'2026-11-08T12:00:00.000Z' };
  assert.deepEqual(api.lembretesCondicoesPorTurno([encerrada]), { inicio:[], fim:[] });
  assert.deepEqual(api.lembretesCondicoesPorTurno({ condicoes:'inválidas' }), { inicio:[], fim:[] });
});

test('Ficha não exibe lembretes de início/fim de turno nem administra sua contagem', async () => {
  const ui = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
  const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(ui, /lembretesCondicoesPorTurno|Condições que exigem atenção neste turno|Controle do turno/);
  assert.doesNotMatch(ficha, /carregarEstadoTurnoCombate|estadoTurnoCombate/);
});
