import test from 'node:test';
import assert from 'node:assert/strict';
import { consultarColete, listarColetes } from '../src/catalogoColetes.ts';

test('catálogo contém quatro coletes convencionais e quatro configurações do Kendo', () => {
  const itens = listarColetes();
  assert.equal(itens.length, 8);
  assert.equal(new Set(itens.map(item => item.id)).size, 8);
  assert.equal(itens.filter(item => !item.caracteristico).length, 4);
  assert.equal(itens.filter(item => item.caracteristico).length, 4);
  for (const item of itens) {
    assert.ok(Number.isInteger(item.defesa) && item.defesa >= 1 && item.defesa <= 3);
    assert.ok(Number.isInteger(item.reducaoDano) && item.reducaoDano >= 0 && item.reducaoDano <= 3);
    assert.equal(item.referencia, 'Arquivo do Jogador v1.0, p. 66–67');
    assert.ok(item.observacoes.some(texto => texto.includes('não usam Durabilidade')));
  }
});

test('coletes convencionais preservam Defesa, RD e contribuição de AGI', () => {
  assert.deepEqual(
    ['colete-acolchoado','colete-balistico-leve','colete-balistico-medio','colete-balistico-pesado']
      .map(id => { const c=consultarColete(id); return [c.defesa,c.reducaoDano,c.contribuicaoAgilidade]; }),
    [[1,0,'total'],[1,1,'total'],[2,2,'maximo-2'],[3,3,'nenhuma']],
  );
});

test('Colete de Placas Kendo registra progressão de 0 a 3 placas sem virar compra comum', () => {
  assert.deepEqual(
    [0,1,2,3].map(placas => { const c=consultarColete('colete-kendo-'+placas); return [c.defesa,c.reducaoDano,c.contribuicaoAgilidade]; }),
    [[1,0,'total'],[1,1,'total'],[2,2,'maximo-2'],[3,3,'nenhuma']],
  );
  const inicial=consultarColete('colete-kendo-0');
  assert.equal(inicial.caracteristico,true);
  assert.match(inicial.aquisicao,/Item Característico/);
  assert.ok(inicial.observacoes.some(texto=>texto.includes('Começa com 0 placas')));
  assert.ok(inicial.observacoes.some(texto=>texto.includes('máximo de 3')));
});

test('consulta e listagem não permitem mutar observações internas', () => {
  const item=consultarColete('colete-acolchoado');
  item.observacoes.push('mutação');
  assert.equal(consultarColete('colete-acolchoado').observacoes.includes('mutação'),false);
  const lista=listarColetes();
  lista[0].observacoes.push('mutação');
  assert.equal(consultarColete('colete-acolchoado').observacoes.includes('mutação'),false);
  assert.equal(consultarColete('inexistente'),null);
});
