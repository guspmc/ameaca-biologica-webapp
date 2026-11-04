import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  criarBackup,
  lerArquivoBackup,
  serializarBackup,
  validarBackup,
  FORMATO_BACKUP,
  VERSAO_BACKUP,
} from '../src/backupFicha.ts';

const personagem = (id = 'p-1', nome = 'Claire') => ({
  id,
  nome,
  criadoEm: '2026-11-01T10:00:00.000Z',
  atualizadoEm: '2026-11-02T10:00:00.000Z',
  dados: { classe: 'Operador', atributos: { vigor: 2 } },
});

test('backup válido preserva fichas e pode ser serializado e lido novamente', () => {
  const original = [personagem()];
  const backup = criarBackup(original, '2026-11-03T12:00:00.000Z');
  const texto = serializarBackup(backup);
  const restaurado = lerArquivoBackup(texto);

  assert.equal(restaurado.formato, FORMATO_BACKUP);
  assert.equal(restaurado.versao, VERSAO_BACKUP);
  assert.deepEqual(restaurado.personagens, original);
});

test('backup cria cópia independente dos dados recebidos', () => {
  const original = [personagem()];
  const backup = criarBackup(original);
  original[0].dados.atributos.vigor = 4;

  assert.equal(backup.personagens[0].dados.atributos.vigor, 2);
});

test('rejeita formato desconhecido e versão incompatível', () => {
  const base = criarBackup([personagem()]);
  assert.throws(() => validarBackup({ ...base, formato: 'outro-formato' }), /não é um backup/);
  assert.throws(() => validarBackup({ ...base, versao: 999 }), /não é compatível/);
});

test('rejeita JSON inválido e estrutura de backup incompleta', () => {
  assert.throws(() => lerArquivoBackup('{json quebrado'), /JSON válido/);
  assert.throws(() => validarBackup({ formato: FORMATO_BACKUP, versao: VERSAO_BACKUP }), /data do backup/);
});

test('rejeita personagens inválidos e identificadores duplicados', () => {
  const base = criarBackup([personagem()]);
  assert.throws(() => criarBackup([{ ...personagem(), nome: ' ' }]), /fichas inválidas/);
  assert.throws(() => validarBackup({
    ...base,
    personagens: [personagem('duplicado'), personagem('duplicado', 'Outra')],
  }), /identificadores duplicados/);
});

test('rejeita datas inválidas no backup', () => {
  const base = criarBackup([personagem()]);
  assert.throws(() => validarBackup({
    ...base,
    exportadoEm: 'ontem',
  }), /data do backup/);
});
