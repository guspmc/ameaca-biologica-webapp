import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/condicoesFicha.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const api = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));


test('gerador de IDs tolera randomUUID ausente ou não funcional em WebViews', () => {
  const indisponivel = api.gerarIdCondicao(null);
  const naoFuncional = api.gerarIdCondicao({ randomUUID: 'não é função' });
  assert.match(indisponivel, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.match(naoFuncional, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const provedor = { randomUUID: () => 'id-nativo' };
  assert.equal(api.gerarIdCondicao(provedor), 'id-nativo');
});

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
  const semDuracao = { id:'b', condicao:'exposto', fonte:'Habilidade', observacao:'', estado:'ativa', encerradaEm:null };
  assert.equal(api.instanciaCondicaoValida(semDuracao), true);
  assert.equal(api.instanciaCondicaoValida({ ...semDuracao, duracao:' ' }), false);
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
test('condições encerradas preservam histórico e deixam de produzir efeito ativo', () => {
  const ativa = { id:'a', condicao:'exposto', fonte:'Falha Crítica', duracao:'1 turno', observacao:'' };
  const encerrada = { ...ativa, estado:'encerrada', encerradaEm:'2026-11-07T12:00:00.000Z' };
  assert.equal(api.listaCondicoesValida([ativa]), true); // compatibilidade com fichas antigas
  assert.equal(api.listaCondicoesValida([encerrada]), true);
  const lista = api.encerrarInstanciaCondicao([ativa], 'a', '2026-11-07T12:00:00.000Z');
  assert.equal(lista.length, 1);
  assert.equal(lista[0].estado, 'encerrada');
  assert.deepEqual(api.condicoesAtivas(lista), []);
  assert.deepEqual(api.condicoesComEfeitoUnico(lista), []);
  assert.equal(api.condicoesAtivas([ativa]).length, 1);
  assert.throws(() => api.encerrarInstanciaCondicao(lista, 'a'), /Condição ativa/);
});

test('Vulnerável é derivada do limite de um quinto dos PV sem arredondamento', () => {
  assert.equal(api.vulneravelPorPV(20,100), true);
  assert.equal(api.vulneravelPorPV(21,100), false);
  assert.equal(api.vulneravelPorPV(1,1), false);
  assert.equal(api.vulneravelPorPV(0,1), true);
  assert.throws(() => api.vulneravelPorPV(-1,10), /PV inválidos/);
});

test('a Ficha permite ativar e encerrar Condições com confirmação e salvamento', async () => {
  const ui = await readFile(new URL('../src/CondicoesFichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /pvMaximo > 0 \? vulneravelPorPV\(pvAtual, pvMaximo\) : null/);
  assert.match(ui, /window\.confirm/);
  assert.match(ui, /aoSalvar\(\{ condicoes: atualizadas \}\)/);
  assert.match(ui, /Ativar Condição/);
  assert.match(ui, /Encerrar Condição/);
  assert.match(ui, /Histórico/);
  assert.match(ui, /Offline, não há contador de rodadas/);
  assert.match(ui, /Mestre acompanha a duração em rodadas separadamente na aba Combate/);
  assert.doesNotMatch(ui, /Duração ou critério de remoção|setDuracao/);
});

test('Colapso Viral é condição derivada da BI e não pode ser registrada manualmente', async () => {
  const fs = await import('node:fs/promises');
  const ui = await fs.readFile(new URL('../src/CondicoesFichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /biAtual >= biMaximo/);
  assert.match(ui, /colapsoViral && <li>/);
  assert.match(ui, /id !== 'colapso-viral'/);
  assert.match(ui, /não podem ser ativados ou encerrados manualmente/);
  const reanimacao = await fs.readFile(new URL('../src/ReanimacaoFichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(reanimacao, /void iniciar\('colapso_bi'\)/);
  assert.match(reanimacao, /colapsoAutoTentado/);
});

test('Desacordado é derivado de 0 PV ou Colapso Viral e não pode ser ativado manualmente', async () => {
  const fs = await import('node:fs/promises');
  const ui = await fs.readFile(new URL('../src/CondicoesFichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /const desacordado = pvAtual <= 0 \|\| colapsoViral/);
  assert.match(ui, /desacordado && <li>/);
  assert.match(ui, /id !== 'desacordado'/);
  assert.match(ui, /Vulnerável, Desacordado e Colapso Viral são derivados/);
});


test('catálogo descreve integralmente as transformações e identifica seus efeitos não automatizados na UI', async () => {
  const catalogo = await readFile(new URL('../src/condicoesFicha.ts', import.meta.url), 'utf8');
  const ui = await readFile(new URL('../src/CondicoesFichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(catalogo, /deve atacar a criatura consciente mais próxima/);
  assert.match(catalogo, /permanece inerte por 1 hora/);
  assert.match(catalogo, /fica Desacordada por 1 hora/);
  assert.match(catalogo, /também causam \+2 BI/);
  assert.match(ui, /Registro informativo de transformação/);
  assert.match(ui, /não aplica automaticamente recuperação de Dados de Vida/);
});


test('Cabeça Carmesim com BI zero sinaliza reversão, hora Desacordada e limite de Descanso', async () => {
  const ui = await readFile(new URL('../src/CondicoesFichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /item\.condicao === 'cabeca-carmesim' && biAtual === 0/);
  assert.match(ui, /BI reduzida a 0: o cânone determina a reversão da transformação e 1 hora Desacordada/);
  assert.match(ui, /só então encerre a Condição/);
});
