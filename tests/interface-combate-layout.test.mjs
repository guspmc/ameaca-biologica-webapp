import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
const calculadora = await readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
const estilos = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

test('Combate apresenta Defesa, Deslocamento e Iniciativa em um único conjunto de cartões', () => {
  assert.match(ficha, /ficha-local-combate-resumo/);
  assert.match(ficha, /<small>DEFESA ATUAL<\\/small>/);
  assert.match(ficha, /<small>DESLOCAMENTO<\\/small>/);
  assert.match(ficha, /<small>INICIATIVA<\\/small>/);
  assert.match(ficha, /\\+\\{numero\\(atributos\\.agilidade\\)\\}/);
  assert.doesNotMatch(ficha, /MODIFICADOR DE INICIATIVA/);
});

test('Habilidades/equipamento e Bio-Infecção ficam em seções recolhíveis', () => {
  assert.match(ficha, /<details className="ficha-local-acordeao">\\s*<summary>Habilidades e equipamento/);
  assert.match(ficha, /<details className="ficha-local-acordeao">\\s*<summary>Bio-Infecção/);
});

test('Combate separa cartões de Ataque Corpo a Corpo e Ataque à Distância', () => {
  assert.match(ficha, /<summary>Ataque Corpo a Corpo <span>Luta<\\/span><\\/summary>/);
  assert.match(ficha, /<summary>Ataque à Distância <span>Pontaria<\\/span><\\/summary>/);
  assert.match(ficha, /tipoAtaqueFixo="ataque-corpo"/);
  assert.match(ficha, /tipoAtaqueFixo="ataque-distancia"/);
  assert.match(calculadora, /tipoAtaqueFixo\\?: 'ataque-corpo' \\| 'ataque-distancia'/);
  assert.match(calculadora, /!tipoAtaqueFixo && <label>/);
});

test('cartões de Combate se adaptam a telas estreitas sem redesign global', () => {
  assert.match(estilos, /\\.ficha-local-combate-resumo\\{grid-template-columns:repeat\\(3,minmax\\(0,1fr\\)\\)\\}/);
  assert.match(estilos, /\\.ficha-local-cartoes-ataque\\{grid-template-columns:repeat\\(2,minmax\\(0,1fr\\)/);
  assert.match(estilos, /@media\\(max-width:600px\\)\\{\\s*\\.ficha-local-combate-resumo,\\.ficha-local-cartoes-ataque\\{grid-template-columns:1fr\\}/);
});

test('Ficha não conta turnos nem mantém o painel antigo de ações e reações', () => {
  assert.doesNotMatch(ficha, /estadoTurnoCombate|carregarEstadoTurnoCombate/);
  assert.doesNotMatch(painel, /turnoEmAndamento|iniciarTurno|encerrarTurno|Controle do turno|Condições que exigem atenção neste turno/);
  assert.doesNotMatch(painel, /Ajudar|Ataque de Oportunidade|Ação Completa|Combate com Duas Armas|Reações defensivas/);
});

test('Painel de SA permite ajustes manuais e registra custos das manobras', () => {
  assert.match(ficha, /PainelAcoesLocal dados=\\{dados\\} saAtual=\\{recursosAtuais\\.saAtual\\} saMaximo=\\{sa\\} aoSalvar=\\{aoSalvarRecursos\\}/);
  assert.match(painel, /−1 SA/);
  assert.match(painel, /\\+1 SA/);
  assert.match(painel, /Mirar · 1 SA/);
  assert.match(painel, /nome: 'Finalizar', custo: 3/);
  assert.match(painel, /nome: 'Fuga', custo: 1/);
  assert.match(painel, /nome: 'Contra-Ataque', custo: 1/);
  assert.match(painel, /mirarPreparado: true/);
});
