import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
const calculadora = await readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
const estilos = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
const recursos = await readFile(new URL('../src/RecursosFichaLocal.tsx', import.meta.url), 'utf8');
test('Combate apresenta Defesa, Deslocamento e Iniciativa em cartões', () => {
  for (const label of ['DEFESA ATUAL','DESLOCAMENTO','INICIATIVA']) assert.ok(ficha.includes('<small>'+label+'</small>'));
  assert.ok(ficha.includes('ficha-local-combate-resumo'));
});
test('Habilidades/equipamento e Bio-Infecção ficam recolhíveis', () => {
  assert.ok(ficha.includes('<summary>Habilidades e equipamento'));
  assert.ok(ficha.includes('<summary>Bio-Infecção'));
});
test('Combate separa Ataque Corpo a Corpo e Ataque à Distância', () => {
  assert.ok(ficha.includes('<summary>Ataque Corpo a Corpo <span>Luta</span></summary>'));
  assert.ok(ficha.includes('<summary>Ataque à Distância <span>Pontaria</span></summary>'));
  assert.ok(calculadora.includes("tipoAtaqueFixo?: 'ataque-corpo' | 'ataque-distancia'"));
});
test('Barra fixa superior mostra PV/SA/BI e concentra ajustes manuais de SA', () => {
  assert.ok(ficha.includes('ficha-local-recursos-sticky'));
  assert.ok(ficha.includes('Diminuir 1 SA'));
  assert.ok(ficha.includes('Aumentar 1 SA'));
  assert.ok(ficha.includes("getElementById('ficha-local-administrar-recursos')"));
  assert.ok(recursos.includes('id="ficha-local-administrar-recursos"'));
  assert.ok(estilos.includes('.ficha-local-recursos-sticky{position:sticky'));
});
test('Manobras estão em Combate e bloqueiam custo acima do SA atual ou máximo', () => {
  assert.ok(ficha.includes('<h3 className="ficha-local-subtitulo">Manobras</h3>'));
  assert.ok(painel.includes('saAtual < manobra.custo || saMaximo < manobra.custo'));
  assert.ok(painel.includes('saAtual < 1 || saMaximo < 1'));
  assert.ok(!painel.includes('salvarSA(-1') && !painel.includes('salvarSA(1'));
});
test('Progressão e Registro de Decisões aparecem depois da seção Inventário', () => {
  assert.ok(ficha.indexOf('id="ficha-local-inventario"') < ficha.indexOf('<ProgressaoFichaLocal'));
  assert.ok(ficha.indexOf('id="ficha-local-inventario"') < ficha.indexOf('<RegistroDecisoesMesaLocal'));
});
test('Ficha não administra turnos', () => {
  assert.ok(!ficha.includes('estadoTurnoCombate'));
  assert.ok(!painel.includes('turnoEmAndamento'));
});
