import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');

test('Ataque de Oportunidade aparece na Ficha com os três requisitos contextuais explícitos', () => {
  assert.match(painel, /<h4>Ataque de Oportunidade<\/h4>/);
  assert.match(painel, /A saída da criatura foi voluntária/);
  assert.match(painel, /saiu de um quadrado ameaçado por mim/);
  assert.match(painel, /não estava protegida contra Ataque de Oportunidade/);
});

test('Ataque de Oportunidade usa a transição persistente de Reação e não executa o Ataque', () => {
  assert.match(painel, /avaliarAtaqueOportunidade/);
  assert.match(painel, /registrarAtaqueOportunidade/);
  assert.match(painel, /aplicarReacaoCombate/);
  assert.match(painel, /não realiza o Ataque nem verifica posições/);
  assert.match(painel, /O Movimento do alvo não é interrompido/);
});

test('compra Reação adicional somente quando a Reação normal já foi usada', () => {
  assert.match(painel, /economia\.normaisUsados\.reacao \? 'Sua Reação normal já foi usada/);
  assert.match(painel, /economia\.normaisUsados\.reacao && \(economia\.saAtual < 1 \|\| janela >= 3\)/);
});


test('Brecha Tática amplia os gatilhos e explicita interrupção e Vantagem', () => {
  assert.match(painel, /brecha-tatica/);
  assert.match(painel, /ações vulneráveis durante Movimento\/Ação/);
  assert.match(painel, /Se o Ataque causar Dano, interrompe a ação provocadora/);
  assert.match(painel, /seus Ataques de Oportunidade têm Vantagem/);
});

test('Finalização à Distância e Luta Livre exibem seus requisitos sem automatizar efeitos', () => {
  assert.match(painel, /finalizacao-a-distancia/);
  assert.match(painel, /no máximo, até Alcance Médio/);
  assert.match(painel, /luta-livre/);
  assert.match(painel, /até 12 m em linha reta/);
  assert.match(painel, /máximo 10d8/);
  assert.match(painel, /não reconhece essa exceção e sempre registra 3 SA/);
});
