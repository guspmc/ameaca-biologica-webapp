import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ui = await readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
const pericias = await readFile(new URL('../src/pericias.ts', import.meta.url), 'utf8');
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');

test('calculadora oferece Ataque Corpo a Corpo com Luta e Ataque à distância com Pontaria', () => {
  assert.match(ui, /ataque-corpo/);
  assert.match(ui, /ataque-distancia/);
  assert.match(ui, /const periciaEfetiva = tipo === 'ataque-corpo' \? 'Luta' : tipo === 'ataque-distancia' \? 'Pontaria'/);
  assert.match(ui, /Ataque Corpo a Corpo: 1d20 \+ Luta contra a Defesa do alvo/);
  assert.match(ui, /Ataque à distância: 1d20 \+ Pontaria contra a Defesa do alvo/);
});

test('modo de Ataque usa Defesa do alvo e mantém os resultados críticos oficiais', () => {
  assert.match(ui, /Defesa do alvo/);
  assert.match(ui, /20 natural: acerto automático e Crítico/);
  assert.match(ui, /1 natural: Falha Crítica; Exposto é ativado automaticamente somente no modo Automático/);
});

test('calculadora não rola dados nem aplica Dano automaticamente', () => {
  assert.match(ui, /sortearDados/);
  assert.match(ui, /Cada rolagem exige comando explícito/);
  assert.match(ui, /não altera dados da personagem/);
  assert.doesNotMatch(ui, /salvarPatchPersonagem|localStorage|aoSalvar/);
  assert.match(ui, /O cálculo de Dano permanece manual/);
  assert.doesNotMatch(ui, /Math\.random|crypto\.getRandomValues/);
});

test('Ataques usam os Atributos oficiais associados a Luta e Pontaria', () => {
  assert.match(pericias, /Luta:\s*'forca'/);
  assert.match(pericias, /Pontaria:\s*'agilidade'/);
});

test('Testes comuns e Ataques aparecem em seções separadas da Ficha', () => {
  assert.match(ui, /escopo\?: 'testes' \| 'ataques'/);
  assert.match(ui, /escopo === 'testes'.*Teste de Perícia/s);
  assert.match(ui, /escopo === 'ataques'.*Ataque Corpo a Corpo/s);
  assert.match(ficha, /CalculadoraTesteLocal escopo="testes"/);
  assert.match(ficha, /CalculadoraTesteLocal escopo="ataques"/);
  const pericias = ficha.slice(ficha.indexOf('id="ficha-local-pericias"'), ficha.indexOf('id="ficha-local-combate"'));
  assert.doesNotMatch(pericias, /ataque-corpo|ataque-distancia|escopo="ataques"/);
});

test('calculadora consulta os catálogos de armas sem afirmar posse ou equipamento', () => {
  assert.match(ui, /listarPerfisArma/);
  assert.match(ui, /listarPerfisArmasFogo/);
  assert.match(ui, /Perfil de arma para consulta \(opcional\)/);
  assert.match(ui, /não confirma posse, equipamento, munição ou proficiência/);
  assert.match(ui, /perfilSelecionado\.dano/);
  assert.match(ui, /perfilSelecionado\.referencia/);
});

test('Origem Operário concede +1 no Ataque somente com a arma escolhida', () => {
  assert.match(ui, /armaOperarioEscolhida = origem === 'Operário' && perfilCorpo\?\.nome === armaOperario/);
  assert.match(ui, /bonusAtaqueOperario\(armaOperarioEscolhida\)/);
  assert.match(ficha, /armaOperario=\{armaOperario\}/);
  assert.match(ui, /Bônus da Origem Operário: \+\{bonusOperario\}/);
});

test('margem crítica usa o perfil consultado e não automatiza dano', () => {
  assert.match(ui, /limiteCritico/);
  assert.match(ui, /multiplicadorCritico/);
  assert.match(ui, /resultadoAtaqueCritico/);
  assert.match(ui, /O cálculo de Dano permanece manual/);
  assert.doesNotMatch(ui, /aoSalvarRecursos|salvarPatchPersonagem/);
});


test('calculadora manual de Dano usa resultados informados e atributos do perfil', () => {
  assert.match(ui, /calcularDanoArma/);
  assert.match(ui, /Soma dos Dados de Dano/);
  assert.match(ui, /atributoDano = tipo === 'ataque-corpo' \? atributos\.forca : atributos\.agilidade/);
  assert.match(ui, /Aplicar Acerto Crítico/);
  assert.match(ui, /Dano calculado:/);
  assert.match(ui, /não rola dados nem altera PV/);
});

test('Dano do Operário preserva FOR adicional fora do multiplicador crítico', () => {
  assert.match(ui, /armaOperarioEscolhida/);
  assert.match(ui, /FOR adicional; esse bônus não é multiplicado no Crítico/);
  assert.match(ui, /bonusOperarioNaoMultiplicado/);
});

test('perfis com fórmulas especiais não recebem cálculo genérico', () => {
  assert.match(ui, /formulaDanoConvencional/);
  assert.match(ui, /fórmula ou condição especial de Dano/);
});


test('resultado do Ataque preenche automaticamente o estado de Crítico no cálculo de Dano', () => {
  assert.match(ui, /const ataqueFoiCritico = ehAtaque/);
  assert.match(ui, /if \(ehAtaque\) setCriticoDano\(ataqueFoiCritico\)/);
  assert.match(ui, /setCriticoDano\(false\)/);
});
