import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bonusAtaqueOperario,
  calcularDanoArma,
  consultarPerfilArma,
  listarPerfisArma,
  resolverAtaqueArma,
} from '../src/catalogoArmas.ts';

test('catálogo inicial contém armas dos conjuntos de criação e da Origem Operário', () => {
  const perfis = listarPerfisArma();
  for (const id of ['bastao', 'hatchet', 'sentinel-nine', 'jmb-hp3', 'lemi', 'cutelo', 'machadinha', 'martelo', 'machado', 'marreta', 'motosserra']) {
    assert.ok(consultarPerfilArma(id), `perfil ausente: ${id}`);
  }
  assert.equal(perfis.length, 18);
});


test('catálogo corpo a corpo cobre os 15 modelos e seus dados canônicos de equipamento', () => {
  const perfis = listarPerfisArma().filter(perfil => perfil.categoria === 'corpo-a-corpo');
  const ids = [
    'bastao', 'cutelo', 'faca', 'machadinha', 'martelo', 'punhal',
    'replica-espada', 'replica-katana', 'cassetete', 'faca-combate',
    'hatchet', 'machado', 'machete', 'marreta', 'motosserra',
  ];
  assert.equal(perfis.length, 15);
  for (const id of ids) {
    const perfil = consultarPerfilArma(id);
    assert.ok(perfil, 'perfil ausente: ' + id);
    assert.ok(['Comum', 'Tática'].includes(perfil.grau));
    assert.ok(Array.isArray(perfil.maos) && perfil.maos.length > 0);
    assert.ok(perfil.maos.every(mao => mao === 1 || mao === 2));
    assert.ok(Number.isInteger(perfil.espacos) && perfil.espacos >= 0);
    assert.ok(Number.isInteger(perfil.pecas) && perfil.pecas >= 0);
    assert.ok(perfil.durabilidade === 'Indestrutível' || Number.isInteger(perfil.durabilidade));
    assert.equal(perfil.alcance, 'Curto');
    assert.ok(typeof perfil.aquisicao === 'string' && perfil.aquisicao.length > 0);
  }
  assert.deepEqual(consultarPerfilArma('bastao').maos, [1, 2]);
  assert.deepEqual(consultarPerfilArma('replica-katana').maos, [1, 2]);
  assert.equal(consultarPerfilArma('hatchet').durabilidade, 'Indestrutível');
  assert.equal(consultarPerfilArma('hatchet').pecas, 3);
  assert.equal(consultarPerfilArma('motosserra').dano, '3d6');
});

test('perfis retornados não permitem alterar o catálogo interno', () => {
  const perfil = consultarPerfilArma('hatchet');
  assert.ok(perfil);
  perfil.propriedades.push('alteração externa');
  assert.equal(consultarPerfilArma('hatchet')?.propriedades.includes('alteração externa'), false);
  assert.equal(consultarPerfilArma('inexistente'), null);
});

test('resultado natural 20 é acerto crítico automático e fecha reações defensivas', () => {
  const perfil = consultarPerfilArma('sentinel-nine');
  assert.deepEqual(resolverAtaqueArma(20, 2, 30, perfil), {
    sucesso: true, critico: true, falhaCritica: false, fechaReacoesDefensivas: true, aplicaExposto: false,
  });
});

test('resultado natural 1 é Falha Crítica e aplica Exposto', () => {
  const perfil = consultarPerfilArma('sentinel-nine');
  assert.deepEqual(resolverAtaqueArma(1, 40, 1, perfil), {
    sucesso: false, critico: false, falhaCritica: true, fechaReacoesDefensivas: false, aplicaExposto: true,
  });
});

test('margem crítica 19–20 exige alcançar Defesa no 19 e não fecha Reações', () => {
  const perfil = { ...consultarPerfilArma('sentinel-nine'), criticoNatural: 19 };
  assert.equal(resolverAtaqueArma(19, 14, 15, perfil).critico, false);
  assert.deepEqual(resolverAtaqueArma(19, 15, 15, perfil), {
    sucesso: true, critico: true, falhaCritica: false, fechaReacoesDefensivas: false, aplicaExposto: false,
  });
});

test('dano crítico multiplica Dados e Atributo associado', () => {
  const perfil = consultarPerfilArma('sentinel-nine');
  const resultado = calcularDanoArma({ dadosRolados: 8, valorAtributo: 3, critico: true, perfil });
  assert.equal(resultado.total, 22);
  assert.equal(resultado.multiplicador, 2);
});

test('Operário adiciona 2 × FOR, mas o FOR adicional não é multiplicado no crítico', () => {
  const perfil = consultarPerfilArma('cutelo');
  const resultado = calcularDanoArma({ dadosRolados: 8, valorAtributo: 3, critico: true, perfil, armaOperarioEscolhida: true });
  assert.equal(resultado.total, 36);
  assert.equal(resultado.atributoMultiplicado, 9);
  assert.equal(resultado.bonusOperarioNaoMultiplicado, 3);
  assert.equal(bonusAtaqueOperario(true), 1);
  assert.equal(bonusAtaqueOperario(false), 0);
});

test('dado adicional já rolado pode ser incluído sem rolagem automática', () => {
  const perfil = consultarPerfilArma('bastao');
  const resultado = calcularDanoArma({ dadosRolados: 6, dadosAdicionais: 4, valorAtributo: 2, critico: false, perfil });
  assert.equal(resultado.total, 12);
  assert.throws(() => calcularDanoArma({ dadosRolados: -1, valorAtributo: 2, critico: false, perfil }));
});
