import test from 'node:test';
import assert from 'node:assert/strict';
import {
  consultarPecaExtra,
  listarCategoriasPecas,
  listarPecasExtras,
  listarTiposPecas,
} from '../src/catalogoPecas.ts';

test('catálogo reúne as 30 Peças Extras descritas nas páginas 62–64', () => {
  const pecas = listarPecasExtras();
  assert.equal(pecas.length, 30);
  assert.equal(new Set(pecas.map(item => item.id)).size, 30);
  assert.deepEqual(listarCategoriasPecas(), ['corpo-a-corpo', 'arma-de-fogo']);
  assert.deepEqual(listarTiposPecas(), ['generica', 'especifica']);
  assert.equal(pecas.filter(item => item.tipo === 'generica' && item.categoria === 'corpo-a-corpo').length, 5);
  assert.equal(pecas.filter(item => item.tipo === 'generica' && item.categoria === 'arma-de-fogo').length, 16);
  assert.equal(pecas.filter(item => item.tipo === 'especifica').length, 9);
  for (const item of pecas) {
    assert.ok(item.nome.trim());
    assert.ok(item.compatibilidade.length > 0);
    assert.ok(item.efeito.trim());
    assert.ok(item.aquisicao.trim());
    assert.match(item.referencia, /Arquivo do Jogador v1\.0, p\. (62–63|64)/);
  }
});

test('peças genéricas preservam compatibilidade e efeitos especiais', () => {
  assert.match(consultarPecaExtra('bandoleira').aquisicao, /Submetralhadora/);
  assert.match(consultarPecaExtra('compensador-submetralhadora').efeito, /Não concede Rajada/);
  assert.match(consultarPecaExtra('coronha-escopeta').efeito, /Estabilidade/);
  assert.match(consultarPecaExtra('freio-boca-magnum').compatibilidade[0], /exceto Requiem/);
  assert.match(consultarPecaExtra('mira-laser').efeito, /não consome SA/);
  assert.match(consultarPecaExtra('pente-estendido-magnum').compatibilidade[0], /Wolfsbane/);
  assert.match(consultarPecaExtra('silenciador-9mm').efeito, /posição pelo som/);
});

test('peças específicas preservam as armas e modificações correspondentes', () => {
  assert.deepEqual(consultarPecaExtra('cano-longo-wolfsbane').compatibilidade, ['M1851 Wolfsbane']);
  assert.match(consultarPecaExtra('cano-ventilado-requiem').efeito, /permite disparar com 1 mão/);
  assert.match(consultarPecaExtra('coronha-matilda').efeito, /3 cartuchos em vez de 5/);
  assert.match(consultarPecaExtra('engate-triplo-besta').efeito, /Teste de Ataque para cada virote/);
  assert.match(consultarPecaExtra('valvula-acao-rapida-lancachamas').efeito, /6 m/);
});

test('consultas e listagens clonam arrays e não permitem mutar o catálogo interno', () => {
  const item = consultarPecaExtra('alca');
  item.compatibilidade.push('compatibilidade falsa');
  assert.equal(consultarPecaExtra('alca').compatibilidade.includes('compatibilidade falsa'), false);
  const lista = listarPecasExtras();
  lista[0].compatibilidade.push('mutação externa');
  assert.equal(consultarPecaExtra(lista[0].id).compatibilidade.includes('mutação externa'), false);
  assert.equal(consultarPecaExtra('inexistente'), null);
});
