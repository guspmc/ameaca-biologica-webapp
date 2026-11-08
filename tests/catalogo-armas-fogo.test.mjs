import test from 'node:test';
import assert from 'node:assert/strict';
import {
  consultarPerfilArmaFogo,
  listarCategoriasArmasFogo,
  listarPerfisArmasFogo,
} from '../src/catalogoArmasFogo.ts';

test('catálogo contém os 34 modelos das sete categorias de armas de fogo e especiais', () => {
  const perfis = listarPerfisArmasFogo();
  assert.equal(perfis.length, 34);
  assert.deepEqual(listarCategoriasArmasFogo(), [
    'Pistola 9 mm', 'Escopeta', 'Submetralhadora', 'Rifle',
    'Rifle de Precisão', 'Magnum', 'Arma Especial',
  ]);
  for (const categoria of listarCategoriasArmasFogo()) {
    assert.ok(perfis.some(perfil => perfil.categoria === categoria), 'categoria sem modelos: ' + categoria);
  }
  assert.equal(new Set(perfis.map(perfil => perfil.id)).size, perfis.length);
});

test('tabelas de pistolas 9 mm preservam grau, dano, crítico, pente e aquisição', () => {
  const jmb = consultarPerfilArmaFogo('jmb-hp3');
  assert.deepEqual(
    [jmb.grau, jmb.dano, jmb.critico, jmb.capacidade, jmb.pecas, jmb.aquisicao],
    ['Comum', '1d8', 'x2', 13, 2, '1 Moeda Antiga'],
  );
  const albert = consultarPerfilArmaFogo('albert-01r');
  assert.deepEqual(
    [albert.grau, albert.dano, albert.critico, albert.capacidade],
    ['Tática', '1d10', '19–20 x3', 3],
  );
  assert.equal(consultarPerfilArmaFogo('punisher').regrasEspeciais.length, 1);
});

test('escopetas e submetralhadoras preservam diferenças operacionais', () => {
  assert.deepEqual(
    [consultarPerfilArmaFogo('hydra').dano, consultarPerfilArmaFogo('hydra').alcance, consultarPerfilArmaFogo('hydra').maos],
    ['4d6', 'Curto', 1],
  );
  assert.ok(consultarPerfilArmaFogo('w-870').propriedades.includes('Ação por bombeamento'));
  assert.ok(consultarPerfilArmaFogo('chicago-sweeper').regrasEspeciais[0].includes('só pode atacar por Rajada'));
  assert.ok(consultarPerfilArmaFogo('gal').propriedades.includes('Sem Disparo Único'));
});

test('rifles e rifles de precisão preservam alcance e regras de disparo', () => {
  assert.equal(consultarPerfilArmaFogo('clatter-carbine').dano, '2d10');
  assert.ok(consultarPerfilArmaFogo('clatter-carbine').regrasEspeciais[0].includes('5 cartuchos'));
  assert.equal(consultarPerfilArmaFogo('stingray').alcance, 'Longo/Muito Longo');
  assert.ok(consultarPerfilArmaFogo('svd').propriedades.some(item => item.includes('Manejar Ferrolho')));
});

test('Magnums preservam suas exigências, capacidades e exceção modular da Requiem', () => {
  for (const id of ['elephant-killer', 'killer7', 'm1851-wolfsbane', 'requiem', 'sw-m29']) {
    assert.equal(consultarPerfilArmaFogo(id).categoria, 'Magnum');
    assert.equal(consultarPerfilArmaFogo(id).maos, 2);
    assert.ok(consultarPerfilArmaFogo(id).propriedades.some(item => item.includes('Coice de Magnum')));
  }
  assert.equal(consultarPerfilArmaFogo('requiem').espacos, '1–2');
  assert.ok(consultarPerfilArmaFogo('sw-m29').regrasEspeciais.some(item => item.includes('Fortitude DT 15')));
});

test('armas especiais preservam seus procedimentos próprios sem inventar dano para RPG-7', () => {
  assert.equal(consultarPerfilArmaFogo('besta').critico, '19–20 x2');
  assert.ok(consultarPerfilArmaFogo('gm-79').propriedades.includes('Tiro único'));
  assert.equal(consultarPerfilArmaFogo('lanca-chamas-quimico').capacidade, 100);
  assert.equal(consultarPerfilArmaFogo('redemption').maos, 1);
  assert.equal(consultarPerfilArmaFogo('rpg-7').dano, null);
  assert.equal(consultarPerfilArmaFogo('rpg-7').critico, null);
  assert.equal(consultarPerfilArmaFogo('spark-shot').capacidade, 7);
});

test('consultas e listagens não permitem mutar o catálogo interno', () => {
  const arma = consultarPerfilArmaFogo('punisher');
  arma.propriedades.push('mutação externa');
  arma.regrasEspeciais.push('mutação externa');
  const original = consultarPerfilArmaFogo('punisher');
  assert.equal(original.propriedades.includes('mutação externa'), false);
  assert.equal(original.regrasEspeciais.includes('mutação externa'), false);
  const lista = listarPerfisArmasFogo();
  lista[0].propriedades.push('mutação externa');
  assert.equal(consultarPerfilArmaFogo(lista[0].id).propriedades.includes('mutação externa'), false);
  assert.equal(consultarPerfilArmaFogo('inexistente'), null);
});
