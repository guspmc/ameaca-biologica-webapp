import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/condicoesFicha.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const api = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('catálogo cobre Condições e transformações do Arquivo do Jogador', () => {
  for (const id of ['agarrado','amedrontado','atordoado','caido','cego','colapso-viral','corrosao','desacordado','desorientado','enfraquecido','exposto','imobilizado','incapacitado','intoxicado','queimadura','surdo','surpreendido','vulneravel','infectado-especial','cabeca-carmesim']) assert.ok(api.CATALOGO_CONDICOES[id], id);
});
test('instâncias da mesma Condição preservam fonte e duração separadamente sem acumular efeitos', () => {
  const a = { id:'a', condicao:'exposto', fonte:'Falha Crítica', duracao:'até o fim do próximo turno', observacao:'' };
  const b = { id:'b', condicao:'exposto', fonte:'Habilidade', duracao:'até o fim da rodada', observacao:'' };
  const lista = api.adicionarInstanciaCondicao([a], b);
  assert.equal(lista.length, 2);
  assert.deepEqual(api.condicoesComEfeitoUnico(lista), ['exposto']);
});
test('validação recusa campos extras, IDs duplicados, fontes vazias e condições desconhecidas', () => {
  const item = { id:'a', condicao:'exposto', fonte:'Falha Crítica', duracao:'1 turno', observacao:'' };
  assert.equal(api.instanciaCondicaoValida(item), true);
  assert.equal(api.instanciaCondicaoValida({ ...item, admin:true }), false);
  assert.equal(api.instanciaCondicaoValida({ ...item, fonte:' ' }), false);
  assert.equal(api.instanciaCondicaoValida({ ...item, condicao:'inventada' }), false);
  assert.equal(api.listaCondicoesValida([item,item]), false);
  assert.throws(() => api.adicionarInstanciaCondicao([item], item), /Identificador/);
});
test('remover uma fonte não remove outra instância da mesma Condição', () => {
  const lista = [
    { id:'a', condicao:'exposto', fonte:'Falha Crítica', duracao:'1 turno', observacao:'' },
    { id:'b', condicao:'exposto', fonte:'Habilidade', duracao:'2 turnos', observacao:'' },
  ];
  assert.deepEqual(api.removerInstanciaCondicao(lista,'a'), [lista[1]]);
});
test('Vulnerável é derivada do limite de um quinto dos PV sem arredondamento', () => {
  assert.equal(api.vulneravelPorPV(20,100), true);
  assert.equal(api.vulneravelPorPV(21,100), false);
  assert.equal(api.vulneravelPorPV(1,1), false);
  assert.equal(api.vulneravelPorPV(0,1), true);
  assert.throws(() => api.vulneravelPorPV(-1,10), /PV inválidos/);
});

test('a Ficha do Jogador consulta Condições sem administrar registros do Mestre', async () => {
  const ui = await readFile(new URL('../src/CondicoesFichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /Consulta das Condições recebidas/);
  assert.match(ui, /pvMaximo > 0 \? vulneravelPorPV\(pvAtual, pvMaximo\) : null/);
  assert.match(ui, /vulneravel === null \? 'Não calculável'/);
  assert.match(ui, /registro e a administração dos efeitos são feitos pelo Mestre/);
  assert.doesNotMatch(ui, /Registrar Condição|Remover registro|aoSalvar|setItens/);
});
