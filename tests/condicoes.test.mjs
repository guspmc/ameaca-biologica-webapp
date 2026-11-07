import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/condicoes.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const api = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
const { CATALOGO_CONDICOES, criarEstadoCondicoes, adicionarCondicao, encerrarCondicao, ajustarDuracaoCondicao, condicoesMecanicasAtivas, estadoCondicoesValido } = api;
const instante = '2026-11-07T12:00:00.000Z';
const instancia = (id, extra = {}) => ({
  id, condicao: 'exposto', fonte: 'Falha Crítica', alvoId: 'personagem-1',
  regra: 'Defesa -2 até o fim do próximo turno.', aplicadaEm: instante,
  duracao: { tipo: 'turnos', restante: 1, marco: 'fim_turno' },
  ...extra,
});

test('catálogo contém as condições do Arquivo do Jogador e exclui estados de transformação', () => {
  for (const id of ['agarrado','amedrontado','atordoado','caido','cego','corrosao','desacordado','desorientado','enfraquecido','exposto','imobilizado','incapacitado','intoxicado','queimadura','surdo','surpreendido']) {
    assert.ok(CATALOGO_CONDICOES.some(item => item.id === id), id);
  }
  assert.equal(CATALOGO_CONDICOES.some(item => ['vulneravel','colapso-viral','infectado-especial','cabeca-carmesim'].includes(item.id)), false);
});

test('Vulnerável é derivada quando PV atuais são iguais ou inferiores a um quinto do máximo', () => {
  assert.equal(api.estaVulneravel(2, 10), true);
  assert.equal(api.estaVulneravel(1, 10), true);
  assert.equal(api.estaVulneravel(3, 10), false);
  assert.equal(api.estaVulneravel(0, 10), true);
  assert.throws(() => api.estaVulneravel(11, 10), /PV inválidos/);
  assert.throws(() => api.estaVulneravel(0, 0), /PV inválidos/);
});

test('cria estado vazio e adiciona uma instância com fonte, alvo, regra e marco de duração', () => {
  const vazio = criarEstadoCondicoes();
  assert.equal(estadoCondicoesValido(vazio), true);
  const estado = adicionarCondicao(vazio, instancia('cond-1'));
  assert.equal(estado.ativas.length, 1);
  assert.equal(estado.ativas[0].fonte, 'Falha Crítica');
  assert.equal(estado.ativas[0].duracao.marco, 'fim_turno');
});

test('duas fontes da mesma Condição mantêm contadores separados sem duplicar o modificador', () => {
  let estado = adicionarCondicao(criarEstadoCondicoes(), instancia('cond-1'));
  estado = adicionarCondicao(estado, instancia('cond-2', {
    fonte: 'Habilidade especial',
    duracao: { tipo: 'rodadas', restante: 3, marco: 'fim_rodada' },
  }));
  assert.equal(estado.ativas.length, 2);
  assert.deepEqual(condicoesMecanicasAtivas(estado), ['exposto']);
  estado = ajustarDuracaoCondicao(estado, 'cond-1', -1);
  assert.equal(estado.ativas[0].duracao.restante, 0);
  assert.equal(estado.ativas[1].duracao.restante, 3);
});

test('encerrar uma instância preserva histórico e não encerra outras fontes', () => {
  let estado = adicionarCondicao(criarEstadoCondicoes(), instancia('cond-1'));
  estado = adicionarCondicao(estado, instancia('cond-2'));
  estado = encerrarCondicao(estado, 'cond-1', '2026-11-07T12:10:00.000Z', 'Duração concluída');
  assert.deepEqual(estado.ativas.map(x => x.id), ['cond-2']);
  assert.equal(estado.historico.length, 1);
  assert.equal(estado.historico[0].estado, 'encerrada');
  assert.equal(estado.historico[0].motivoEncerramento, 'Duração concluída');
});

test('não inventa dano contínuo nem Testes de encerramento ao ajustar contadores', () => {
  const estado = adicionarCondicao(criarEstadoCondicoes(), instancia('cond-1'));
  const atualizado = ajustarDuracaoCondicao(estado, 'cond-1', -1);
  assert.equal(atualizado.ativas[0].duracao.restante, 0);
  assert.equal(atualizado.ativas.length, 1);
  assert.equal(atualizado.historico.length, 0);
});

test('recusa condições, durações, protótipos, campos e identificadores malformados', () => {
  assert.throws(() => adicionarCondicao(criarEstadoCondicoes(), instancia('cond-1', { condicao: 'vulneravel' })), /inválida/);
  assert.throws(() => adicionarCondicao(criarEstadoCondicoes(), instancia('cond-1', { duracao: { tipo: 'turnos', restante: -1, marco: 'fim_turno' } })), /inválida/);
  assert.throws(() => adicionarCondicao(criarEstadoCondicoes(), instancia('cond-1', { duracao: { tipo: 'rodadas', restante: 2, marco: 'fim_turno' } })), /inválida/);
  assert.throws(() => adicionarCondicao(criarEstadoCondicoes(), instancia('cond-1', { duracao: { tipo: 'narrativa', restante: 2, marco: 'narrativa' } })), /inválida/);
  assert.throws(() => adicionarCondicao(criarEstadoCondicoes(), instancia('cond-1', { extra: true })), /inválida/);
  const malformado = Object.assign(Object.create({ admin: true }), instancia('cond-x'));
  assert.equal(estadoCondicoesValido({ ativas: [malformado], historico: [] }), false);
  let estado = adicionarCondicao(criarEstadoCondicoes(), instancia('cond-1'));
  assert.throws(() => adicionarCondicao(estado, instancia('cond-1')), /Identificador/);
  assert.throws(() => ajustarDuracaoCondicao(estado, 'cond-1', -2), /negativo/);
});
