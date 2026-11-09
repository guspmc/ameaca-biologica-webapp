import test from 'node:test';
import assert from 'node:assert/strict';
import { listarPecasExtras } from '../src/catalogoPecas.ts';
import { listarPerfisArma } from '../src/catalogoArmas.ts';
import { listarPerfisArmasFogo } from '../src/catalogoArmasFogo.ts';

const pecas = listarPecasExtras();
const armas = [...listarPerfisArma(), ...listarPerfisArmasFogo()];
const porId = new Map(armas.map(arma => [arma.id, arma]));

// Compatibilidades específicas conferidas no Arquivo do Jogador v1.0, p. 64.
const alvosEspecificos = {
  'bateria-alta-capacidade': 'spark-shot',
  'cano-longo-wolfsbane': 'm1851-wolfsbane',
  'cano-ventilado-requiem': 'requiem',
  'cilindro-alta-capacidade-wolfsbane': 'm1851-wolfsbane',
  'coronha-gm79': 'gm-79',
  'coronha-matilda': 'matilda',
  'empunhadura-pesada-requiem': 'requiem',
  'engate-triplo-besta': 'besta',
  'protetor-cano-requiem': 'requiem',
  'valvula-acao-rapida-lancachamas': 'lanca-chamas-quimico',
};

test('todas as Peças Específicas apontam para arma existente com Espaço de Peça', () => {
  const especificas = pecas.filter(item => item.tipo === 'especifica');
  assert.equal(especificas.length, Object.keys(alvosEspecificos).length);
  for (const [pecaId, armaId] of Object.entries(alvosEspecificos)) {
    const peca = especificas.find(item => item.id === pecaId);
    const arma = porId.get(armaId);
    assert.ok(peca, 'Peça Específica ausente: ' + pecaId);
    assert.ok(arma, 'arma-alvo ausente: ' + armaId);
    assert.ok(arma.pecas > 0, 'arma-alvo não possui Espaço de Peça: ' + armaId);
    assert.deepEqual(peca.compatibilidade, [arma.nome], 'compatibilidade divergente: ' + pecaId);
  }
});

test('Peças Genéricas possuem candidatos reais compatíveis com a família declarada', () => {
  const genericas = pecas.filter(item => item.tipo === 'generica');
  assert.equal(genericas.length, 21);
  for (const peca of genericas) {
    let candidatas = [];
    if (peca.categoria === 'corpo-a-corpo') {
      candidatas = armas.filter(arma => arma.categoria === 'corpo-a-corpo' && (arma.pecas ?? 0) > 0);
    } else {
      const compat = peca.compatibilidade.join(' ').toLocaleLowerCase('pt-BR');
      if (compat.includes('submetralhadora')) candidatas = armas.filter(arma => arma.categoria === 'Submetralhadora' && arma.pecas > 0);
      else if (compat.includes('escopeta')) candidatas = armas.filter(arma => arma.categoria === 'Escopeta' && arma.pecas > 0);
      else if (compat.includes('rifle de precisão')) candidatas = armas.filter(arma => arma.categoria === 'Rifle de Precisão' && arma.pecas > 0);
      else if (compat.includes('rifle')) candidatas = armas.filter(arma => (arma.categoria === 'Rifle' || arma.categoria === 'Rifle de Precisão') && arma.pecas > 0);
      else if (compat.includes('magnum')) candidatas = armas.filter(arma => arma.categoria === 'Magnum' && arma.pecas > 0);
      else if (compat.includes('9 mm') || compat.includes('pistolas')) candidatas = armas.filter(arma => arma.categoria === 'Pistola 9 mm' && arma.pecas > 0);
      else if (compat.includes('arma de 1 mão')) candidatas = armas.filter(arma => (arma.pecas ?? 0) > 0);
      else candidatas = armas.filter(arma => (arma.pecas ?? 0) > 0);
    }
    assert.ok(candidatas.length > 0, 'Peça Genérica sem candidato com Espaço de Peça: ' + peca.id);
  }
});

test('compatibilidades especiais que restringem grupos continuam explícitas', () => {
  assert.match(pecas.find(item => item.id === 'compensador-submetralhadora').compatibilidade.join(' '), /Rajada/);
  assert.match(pecas.find(item => item.id === 'freio-boca-magnum').compatibilidade.join(' '), /exceto Requiem/);
  assert.match(pecas.find(item => item.id === 'pente-estendido-magnum').compatibilidade.join(' '), /Wolfsban e Elephant/);
  assert.match(pecas.find(item => item.id === 'mira-telescopica').compatibilidade.join(' '), /Rifle de Precisão/);
});
