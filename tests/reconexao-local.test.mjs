import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calcularAtrasoReconexao } from '../src/reconexaoLocal.ts';

test('reconexão aumenta a espera progressivamente até o teto de 30 segundos', () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 20].map(calcularAtrasoReconexao),
    [3000, 6000, 12000, 24000, 30000, 30000, 30000],
  );
});

test('tentativas inválidas ou negativas usam a espera inicial', () => {
  assert.equal(calcularAtrasoReconexao(-1), 3000);
  assert.equal(calcularAtrasoReconexao(Number.NaN), 3000);
});


test('retorno da aba ao primeiro plano sincroniza dados e recupera o canal LAN', async () => {
  const componente = await readFile(new URL('../src/ConexaoServidorLocal.tsx', import.meta.url), 'utf8');
  assert.match(componente, /document\\.addEventListener\\('visibilitychange'/);
  assert.match(componente, /document\\.removeEventListener\\('visibilitychange'/);
  assert.match(componente, /aoRetornarAoPrimeiroPlano[\\s\\S]*?sincronizarDadosRecebidos\\(\\)/);
  assert.match(componente, /calcularAtrasoReconexao\\(tentativasReconexao\\)/);
  assert.match(componente, /problema\\.status === 401/);
});
