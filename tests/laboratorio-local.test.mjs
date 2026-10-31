import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAVE_LABORATORIO,
  criarEstadoLaboratorio,
  lerLaboratorio,
  salvarLaboratorio,
  gravarRegistroLaboratorio,
  removerRegistroLaboratorio,
  limparLaboratorio,
} from '../src/persistenciaLaboratorio.ts';

function armazenamentoFalso() {
  const dados = new Map();
  return {
    getItem: chave => dados.has(chave) ? dados.get(chave) : null,
    setItem: (chave, valor) => dados.set(chave, valor),
    removeItem: chave => dados.delete(chave),
    dados,
  };
}

const mesa = (id = 'lab-mesa-1') => ({
  id, tipo: 'mesa', nome: 'Mesa Fictícia', atualizadoEm: '2026-10-30T12:00:00.000Z',
  dados: { ficticia: true },
});

test('inicia vazio e marca explicitamente o ambiente como laboratório local', () => {
  const storage = armazenamentoFalso();
  const estado = lerLaboratorio(storage);
  assert.equal(estado.ambiente, 'laboratorio-local');
  assert.equal(estado.versao, 1);
  assert.deepEqual(estado.registros, []);
  assert.equal(storage.getItem(CHAVE_LABORATORIO), null);
});

test('grava e recupera registros após uma nova leitura do armazenamento', () => {
  const storage = armazenamentoFalso();
  gravarRegistroLaboratorio(storage, mesa(), '2026-10-30T12:01:00.000Z');
  const recuperado = lerLaboratorio(storage);
  assert.equal(recuperado.registros.length, 1);
  assert.equal(recuperado.registros[0].nome, 'Mesa Fictícia');
  assert.equal(recuperado.registros[0].dados.ficticia, true);
  assert.equal(recuperado.atualizadoEm, '2026-10-30T12:01:00.000Z');
});

test('atualizar um id substitui o registro em vez de duplicá-lo', () => {
  const storage = armazenamentoFalso();
  gravarRegistroLaboratorio(storage, mesa(), '2026-10-30T12:00:00.000Z');
  gravarRegistroLaboratorio(storage, { ...mesa(), nome: 'Mesa Renomeada' }, '2026-10-30T12:02:00.000Z');
  const estado = lerLaboratorio(storage);
  assert.equal(estado.registros.length, 1);
  assert.equal(estado.registros[0].nome, 'Mesa Renomeada');
});

test('recusa JSON corrompido sem sobrescrever o conteúdo original', () => {
  const storage = armazenamentoFalso();
  storage.setItem(CHAVE_LABORATORIO, '{quebrado');
  assert.throws(() => lerLaboratorio(storage), /corrompidos/);
  assert.equal(storage.getItem(CHAVE_LABORATORIO), '{quebrado');
});

test('recusa versão desconhecida e ids duplicados', () => {
  const storage = armazenamentoFalso();
  storage.setItem(CHAVE_LABORATORIO, JSON.stringify({
    ...criarEstadoLaboratorio(), versao: 99,
  }));
  assert.throws(() => lerLaboratorio(storage), /versão inválidos/);
  const estado = criarEstadoLaboratorio();
  estado.registros = [mesa(), mesa()];
  assert.throws(() => salvarLaboratorio(storage, estado), /inválido/);
});

test('remove um registro específico e permite limpar apenas a chave do laboratório', () => {
  const storage = armazenamentoFalso();
  gravarRegistroLaboratorio(storage, mesa('mesa-1'));
  gravarRegistroLaboratorio(storage, mesa('mesa-2'));
  removerRegistroLaboratorio(storage, 'mesa-1');
  assert.deepEqual(lerLaboratorio(storage).registros.map(r => r.id), ['mesa-2']);
  limparLaboratorio(storage);
  assert.equal(storage.getItem(CHAVE_LABORATORIO), null);
});

test('se o navegador negar gravação, a operação falha em vez de indicar sucesso', () => {
  const storage = {
    getItem: () => null,
    setItem: () => { throw new Error('QuotaExceededError'); },
    removeItem: () => {},
  };
  assert.throws(() => salvarLaboratorio(storage, criarEstadoLaboratorio()), /QuotaExceededError/);
});

import { ARMAS_OPERARIO, armaOperarioValida } from '../src/armaOperario.ts';

test('Origem Operário oferece exatamente as seis armas aprovadas', () => {
  assert.deepEqual(ARMAS_OPERARIO, [
    'Cutelo', 'Martelo', 'Machadinha', 'Machado', 'Marreta', 'Motosserra',
  ]);
});

test('valida somente uma arma pertencente à lista da Origem Operário', () => {
  for (const arma of ARMAS_OPERARIO) assert.equal(armaOperarioValida(arma), true);
  assert.equal(armaOperarioValida('Faca'), false);
  assert.equal(armaOperarioValida('Pistola'), false);
  assert.equal(armaOperarioValida(null), false);
});


import { atributosIniciaisValidos, pontosRestantesAtributos } from '../src/atributosCriacao.ts';

test('valida a distribuição inicial oficial de Atributos', () => {
  assert.equal(atributosIniciaisValidos({ forca: 1, agilidade: 1, vigor: 1, astucia: 4 }), false);
  assert.equal(atributosIniciaisValidos({ forca: 2, agilidade: 2, vigor: 2, astucia: 1 }), true);
  assert.equal(atributosIniciaisValidos({ forca: 0, agilidade: 3, vigor: 2, astucia: 2 }), true);
  assert.equal(atributosIniciaisValidos({ forca: 0, agilidade: 0, vigor: 3, astucia: 4 }), false);
  assert.equal(atributosIniciaisValidos({ forca: 3, agilidade: 3, vigor: 1, astucia: 1 }), false);
});

test('calcula os pontos restantes sem alterar os Atributos', () => {
  const iniciais = { forca: 1, agilidade: 1, vigor: 1, astucia: 1 };
  assert.equal(pontosRestantesAtributos(iniciais), 3);
  assert.deepEqual(iniciais, { forca: 1, agilidade: 1, vigor: 1, astucia: 1 });
});


import { distribuicaoPericiasValida, periciasPermitidasNaCriacao } from '../src/periciasCriacao.ts';

test('aplica Treinamento gratuito da Origem e libera a outra Perícia para pontos da Classe', () => {
  const permitidas = periciasPermitidasNaCriacao('Agente','Atleta','Acrobacia');
  assert.equal(permitidas.includes('Atletismo'), true);
  assert.equal(permitidas.includes('Acrobacia'), true);
  assert.equal(distribuicaoPericiasValida('Agente','Atleta','Acrobacia',{
    Atletismo: 1, Investigação: 1, Luta: 1, Percepção: 1,
  }), true);
});

test('respeita o limite de Mestre e não permite gastar pontos fora das opções', () => {
  assert.equal(distribuicaoPericiasValida('Agente','Atleta','Acrobacia',{
    Acrobacia: 2, Investigação: 1, Luta: 1,
  }), false);
  assert.equal(distribuicaoPericiasValida('Agente','Atleta','Acrobacia',{
    Atletismo: 1, Medicina: 1, Luta: 1, Percepção: 1,
  }), false);
});

test('Amnésico escolhe duas Perícias distintas e inclui a segunda nas opções da Classe', () => {
  const permitidas = periciasPermitidasNaCriacao('Operador','Amnésico','Medicina','Acrobacia');
  assert.equal(permitidas.includes('Acrobacia'), true);
  assert.equal(distribuicaoPericiasValida('Operador','Amnésico','Medicina',{
    Acrobacia: 1, Atletismo: 1, Fortitude: 1,
  },'Acrobacia'), true);
  assert.equal(distribuicaoPericiasValida('Operador','Amnésico','Medicina',{
    Atletismo: 1, Fortitude: 1, Investigação: 1,
  },'Medicina'), false);
});


test('permite deixar pontos de Perícia da Classe sem gastar', () => {
  assert.equal(distribuicaoPericiasValida('Agente','Atleta','Acrobacia',{
    Investigação: 1, Luta: 1,
  }), true);
});
