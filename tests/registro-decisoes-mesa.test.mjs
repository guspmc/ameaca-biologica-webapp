import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/registroDecisoesMesa.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const api = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

const base = {
  id: 'evento-1',
  tipo: 'morte',
  descricao: 'O Mestre decidiu registrar a morte após avaliar a situação.',
  responsavel: 'Mestre',
  ocorridoEm: '2026-11-12T15:00:00.000Z',
  registradoEm: '2026-11-12T15:05:00.000Z',
};

test('valida e acrescenta decisões sem alterar registros anteriores', () => {
  assert.equal(api.registroDecisaoMesaValido(base), true);
  const lista = api.adicionarDecisaoMesa([], base);
  assert.deepEqual(lista, [base]);
  assert.equal(api.listaDecisoesMesaValida(lista), true);
  assert.equal(api.adicionarDecisaoMesa(lista, { ...base, id: 'evento-2', tipo: 'retificacao', retificaRegistroId: 'evento-1' }).length, 2);
  assert.equal(lista.length, 1);
});

test('recusa tipos, textos, datas, chaves extras e IDs duplicados', () => {
  assert.equal(api.registroDecisaoMesaValido({ ...base, tipo: 'inventado' }), false);
  assert.equal(api.registroDecisaoMesaValido({ ...base, descricao: ' ' }), false);
  assert.equal(api.registroDecisaoMesaValido({ ...base, responsavel: '' }), false);
  assert.equal(api.registroDecisaoMesaValido({ ...base, ocorridoEm: 'ontem' }), false);
  assert.equal(api.registroDecisaoMesaValido({ ...base, extra: true }), false);
  assert.equal(api.registroDecisaoMesaValido({ ...base, tipo: 'retificacao' }), false);
  assert.equal(api.registroDecisaoMesaValido({ ...base, tipo: 'retificacao', retificaRegistroId: 'evento-1' }), true);
  assert.equal(api.listaDecisoesMesaValida([base, base]), false);
  assert.throws(() => api.adicionarDecisaoMesa([base], base), /Identificador/);
  assert.equal(api.listaDecisoesMesaValida([{ ...base, tipo: 'retificacao', retificaRegistroId: 'inexistente' }]), false);
  assert.equal(api.listaDecisoesMesaValida([{ ...base, tipo: 'retificacao', retificaRegistroId: base.id }]), false);
  assert.throws(() => api.adicionarDecisaoMesa([base], { ...base, id: 'evento-2', tipo: 'retificacao', retificaRegistroId: 'inexistente' }), /referência da Retificação/);
});

test('limita o histórico a 30 registros e protege contra lista inválida', () => {
  const lista = Array.from({ length: 30 }, (_, i) => ({ ...base, id: 'evento-' + i }));
  assert.equal(api.listaDecisoesMesaValida(lista), true);
  assert.throws(() => api.adicionarDecisaoMesa(lista, { ...base, id: 'novo' }), /Limite de 30/);
  assert.throws(() => api.adicionarDecisaoMesa([base, base], { ...base, id: 'novo' }), /inválido/);
});

test('gerador de IDs funciona sem randomUUID', () => {
  assert.match(api.gerarIdDecisaoMesa(null), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('a interface salva após confirmação e não aplica efeitos automaticamente', async () => {
  const ui = await readFile(new URL('../src/RegistroDecisoesMesaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /dados\.registrosMesa === undefined \? \[\] : dados\.registrosMesa/);
  assert.match(ui, /window\.confirm/);
  assert.match(ui, /aoSalvar\(\{ registrosMesa: atualizados \}\)/);
  assert.match(ui, /não altera PV, BI, Condições, Reanimação/);
  assert.match(ui, /Responsável informado/);
  assert.match(ui, /Retificação/);
  assert.match(ui, /Registro anterior que será retificado/);
  assert.match(ui, /retificaRegistroId/);
  assert.match(ui, /Vincular ao desfecho de Reanimação pendente/);
});


test('decisões de Mesa podem apontar para uma instância específica de Reanimação', () => {
  const vinculada = { ...base, reanimacaoId: 'reanimacao-1' };
  assert.equal(api.registroDecisaoMesaValido(vinculada), true);
  assert.equal(api.listaDecisoesMesaValida([vinculada]), true);
  assert.equal(api.registroDecisaoMesaValido({ ...base, reanimacaoId: '' }), false);
});
