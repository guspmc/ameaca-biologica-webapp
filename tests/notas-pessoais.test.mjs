import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const helper = await readFile(new URL('../src/notasPessoais.ts', import.meta.url), 'utf8');
const component = await readFile(new URL('../src/AnotacoesPessoais.tsx', import.meta.url), 'utf8');
const sheet = await readFile(new URL('../src/FichasJogador.tsx', import.meta.url), 'utf8');

test('chave da nota separa conta, Mesa e personagem', () => {
  assert.match(helper, /PREFIXO = 'ameaca-biologica:notas-pessoais:v1'/);
  assert.match(helper, /encodeURIComponent\(usuarioId\)/);
  assert.match(helper, /encodeURIComponent\(mesaId\)/);
  assert.match(helper, /encodeURIComponent\(personagemId\)/);
});

test('notas usam apenas armazenamento local e não chamam o Supabase', () => {
  assert.match(component, /window\.localStorage/);
  assert.match(helper, /getItem\(chaveNotaPessoal/);
  assert.match(helper, /setItem\(chave, texto\)/);
  assert.doesNotMatch(component + helper, /supabase|\.from\(|\.rpc\(|fetch\(/i);
});

test('o componente de notas só é mostrado à pessoa proprietária da ficha', () => {
  assert.match(sheet, /dona && <AnotacoesPessoais/);
  assert.match(component, /Esta nota pertence a esta conta e a esta personagem/);
  assert.match(component, /não é enviada ao servidor/);
});

test('limpar uma nota remove somente a chave da mesma conta, Mesa e personagem', () => {
  assert.match(helper, /if \(texto\.length === 0\)/);
  assert.match(helper, /armazenamento\.removeItem\(chave\)/);
});
