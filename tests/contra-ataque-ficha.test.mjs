import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');

test('Ajudar é integrado ao painel e consome a Ação por meio do helper de domínio', () => {
  assert.match(painel, /registrarAjudar/);
  assert.match(painel, /aplicarManobraCombate\(atual, registrarAjudar\)/);
  assert.match(painel, /Registrar Ajudar · Ação/);
  assert.match(painel, /Ajudar consome sua Ação/);
});

test('Ajudar exige confirmação contextual de elegibilidade sem inventar requisitos', () => {
  assert.match(painel, /Confirmo que a tarefa admite auxílio e que cumpro os requisitos de treinamento/);
  assert.match(painel, /!confirmouAjudarElegivel/);
  assert.match(painel, /A Ficha não decide se a tarefa pode ser ajudada nem quais requisitos se aplicam/);
});

test('Servidor Público exige confirmação de Treinamento/Mestria e informa Vantagem +2', () => {
  assert.match(painel, /origem === 'Servidor Público'/);
  assert.match(painel, /sou Treinado ou Mestre na Perícia do Teste do aliado/);
  assert.match(painel, /aliado recebe Vantagem e \+2 no Teste de Perícia/);
  assert.match(painel, /!confirmouTreinamentoAjudar/);
});

test('A Origem da personagem é fornecida ao painel sem depender do Inventário', () => {
  assert.match(ficha, /PainelAcoesLocal dados=\{dados\}[^>]*origem=\{origem\}/);
});


test('Contra-Ataque exige confirmação de defesa bem-sucedida e do gatilho Corpo a Corpo', () => {
  assert.match(painel, /Confirmo que Aparar ou Esquivar foi bem-sucedido/);
  assert.match(painel, /O Ataque que originou a defesa foi Corpo a Corpo/);
  assert.match(painel, /prepararContraAtaque/);
  assert.match(painel, /economia\.saAtual < \(economia\.normaisUsados\.reacao/);
});

test('Contra-Ataque Instintivo e Retaliação dependem das Habilidades realmente ativas', () => {
  assert.match(ficha, /habilidadesAtivas=\{habilidadesAtivasIds\}/);
  assert.match(painel, /habilidadesAtivas\.includes\('contra-ataque-instintivo'\)/);
  assert.match(painel, /habilidadesAtivas\.includes\('retaliacao'\)/);
  assert.match(painel, /agressor fica Atordoado/);
  assert.match(painel, /acrescenta 1 dado de Dano se acertar/);
});

test('Contra-Ataque não executa o Ataque nem resolve efeitos do alvo', () => {
  assert.match(painel, /não executa o Ataque/);
  assert.match(painel, /Execute o Ataque manualmente/);
});
