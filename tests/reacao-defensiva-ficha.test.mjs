import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');

test('A interface avalia a janela com resultado total e d20 natural, sem inferir o gatilho', () => {
  assert.match(painel, /avaliarJanelaReacao/);
  assert.match(painel, /Resultado total do Ataque/);
  assert.match(painel, /Dado natural do Ataque/);
  assert.match(painel, /Habilidade ou regra autoriza Esquivar/);
});

test('A interface só declara Esquiva quando a janela a autoriza e registra o custo pela transição integrada', () => {
  assert.match(painel, /janelaDefensiva\.podeEsquivar/);
  assert.match(painel, /registrarReacaoDefensiva\(\{ economia: economiaAtual, manobra: 'esquivar'/);
  assert.match(painel, /aplicarReacaoCombate/);
});

test('Aparar não é registrado sem estado confiável de equipamento e Durabilidade', () => {
  assert.match(painel, /Aparar seria permitido pelo gatilho, mas o registro está bloqueado/);
  assert.doesNotMatch(painel, /manobra: 'aparar'/);
});

test('20 natural é informado como fechamento da janela e a Esquiva não resolve Teste ou efeitos automaticamente', () => {
  assert.match(painel, /20 natural: não é possível declarar Reação defensiva normal/);
  assert.match(painel, /Resolva o Teste defensivo manualmente/);
  assert.match(painel, /não rola o d20 nem aplica Defesa, Dano ou efeitos/);
});
