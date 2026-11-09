import test from 'node:test';
import assert from 'node:assert/strict';
import { consultarMunicao, listarMunicoes } from '../src/catalogoMunicoes.ts';

test('catálogo reúne os 13 tipos de munição da tabela oficial', () => {
  const itens = listarMunicoes();
  assert.equal(itens.length, 13);
  assert.equal(new Set(itens.map(item => item.id)).size, 13);
  for (const item of itens) {
    assert.ok(Number.isInteger(item.unidadesPorEspaco) && item.unidadesPorEspaco > 0);
    assert.ok(item.aquisicao.trim());
    assert.ok(item.grupoPilha.trim());
    assert.ok(item.uso.trim());
    assert.equal(item.referencia, 'Arquivo do Jogador v1.0, p. 65–66');
  }
});

test('quantidades por Espaço e preços reproduzem a tabela de munições', () => {
  const esperados = [
    ['9mm',30,'15 por 1 Moeda Antiga'],
    ['calibre-12',15,'8 por 2 Moedas Antigas'],
    ['cargas',10,'Exploração'],
    ['cartucho-gm79-acido',10,'Exploração'],
    ['cartucho-gm79-explosivo',10,'Exploração'],
    ['cartucho-gm79-incendiario',10,'Exploração'],
    ['cartuchos-gm79',10,'Exploração'],
    ['combustivel',100,'Exploração'],
    ['foguete',1,'Exploração'],
    ['magnum',10,'5 por 4 Moedas Antigas'],
    ['rifle',50,'25 por 3 Moedas Antigas'],
    ['submetralhadora',70,'35 por 1 Moeda Antiga'],
    ['virotes',10,'Exploração'],
  ];
  for (const [id, quantidade, preco] of esperados) {
    const item = consultarMunicao(id);
    assert.ok(item, 'munição ausente: '+id);
    assert.equal(item.unidadesPorEspaco, quantidade);
    assert.equal(item.aquisicao, preco);
  }
});

test('cartuchos GM 79 compartilham a mesma pilha e Cargas mantêm regra própria', () => {
  for (const id of ['cartucho-gm79-acido','cartucho-gm79-explosivo','cartucho-gm79-incendiario','cartuchos-gm79']) {
    assert.equal(consultarMunicao(id).grupoPilha, 'cartuchos-gm79');
  }
  assert.match(consultarMunicao('cargas').observacoes.join(' '), /Disparo Carregado consome 3/);
  assert.match(consultarMunicao('combustivel').observacoes.join(' '), /consome 10/);
  assert.match(consultarMunicao('foguete').observacoes.join(' '), /Espaço de Inventário inteiro/);
});

test('consulta e listagem protegem as observações internas contra mutação', () => {
  const item = consultarMunicao('9mm');
  item.observacoes.push('alteração externa');
  assert.equal(consultarMunicao('9mm').observacoes.includes('alteração externa'), false);
  const lista = listarMunicoes();
  lista[0].observacoes.push('mutação externa');
  assert.equal(consultarMunicao('9mm').observacoes.includes('mutação externa'), false);
  assert.equal(consultarMunicao('inexistente'), null);
});
