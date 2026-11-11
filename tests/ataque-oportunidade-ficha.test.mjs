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
