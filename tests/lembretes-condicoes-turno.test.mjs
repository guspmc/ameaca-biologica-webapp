import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/condicoesFicha.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const api = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('lembretes de turno refletem Queimadura e Corrosão sem aplicar efeitos', () => {
  const condicoes = [
    { id:'q', condicao:'queimadura', fonte:'Ataque incendiário', observacao:'', estado:'ativa', encerradaEm:null },
    { id:'c', condicao:'corrosao', fonte:'Toxina', observacao:'', estado:'ativa', encerradaEm:null },
  ];
  const lembretes = api.lembretesCondicoesPorTurno(condicoes);
  assert.deepEqual(lembretes.inicio, [
    'Queimadura: faça Reflexos DT 12; em sucesso, apague as chamas.',
    'Corrosão: faça Fortitude DT 12; em sucesso, encerre antes do Dano.',
  ]);
  assert.deepEqual(lembretes.fim, [
    'Queimadura: aplique 1d6 de Dano ao final do turno, se ainda estiver ativa.',
    'Corrosão: se permaneceu ativa após o Teste do início do turno, aplique 1d4 de Dano.',
  ]);
});

test('lembretes de Surpreendido e Exposto exigem conferência da duração, sem expiração automática', () => {
  const condicoes = [
    { id:'s', condicao:'surpreendido', fonte:'Emboscada', observacao:'', estado:'ativa', encerradaEm:null },
    { id:'e', condicao:'exposto', fonte:'Falha Crítica', observacao:'', estado:'ativa', encerradaEm:null },
  ];
  const lembretes = api.lembretesCondicoesPorTurno(condicoes);
  assert.deepEqual(lembretes.inicio, []);
  assert.match(lembretes.fim[0], /primeiro turno da própria criatura/);
  assert.match(lembretes.fim[1], /Falha Crítica/);
  assert.match(lembretes.fim[1], /contagem antes de encerrar/);
});

test('condições encerradas e dados inválidos não geram lembretes', () => {
  const encerrada = { id:'q', condicao:'queimadura', fonte:'Fogo', observacao:'', estado:'encerrada', encerradaEm:'2026-11-08T12:00:00.000Z' };
  assert.deepEqual(api.lembretesCondicoesPorTurno([encerrada]), { inicio:[], fim:[] });
  assert.deepEqual(api.lembretesCondicoesPorTurno({ condicoes:'inválidas' }), { inicio:[], fim:[] });
});

test('Painel de Ações apresenta os lembretes e não automatiza rolagens ou efeitos', async () => {
  const ui = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /lembretesCondicoesPorTurno\(dados\.condicoes\)/);
  assert.match(ui, /Condições que exigem atenção neste turno/);
  assert.match(ui, /não faz Testes, não aplica Dano e não encerra Condições automaticamente/);
});
