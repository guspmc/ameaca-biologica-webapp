import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const calculadora = await readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');

test('Saber é Poder só é oferecido em Testes puros de AST ou Perícias associadas a AST', () => {
  assert.match(calculadora, /academicoAplicavel = escopo === 'testes' && academicoDisponivel && origem === 'Acadêmico'/);
  assert.match(calculadora, /tipo === 'atributo' \? atributo === 'astucia' : tipo === 'pericia' && atributoAssociado === 'astucia'/);
  assert.match(calculadora, /Usar Saber é Poder neste Teste · Vantagem/);
});

test('Saber é Poder entra na mesma resolução de Vantagem/Desvantagem sem acumular fontes', () => {
  assert.match(calculadora, /academicoAplicavel && usarSaberEAPoder/);
  assert.match(calculadora, /const vantagemEfetiva: VantagemTeste = existeVantagem && existeDesvantagem \? 'normal'/);
  assert.match(calculadora, /Vantagem não acumula com outra fonte/);
});

test('A disponibilidade depende do uso persistido da Origem Acadêmico', () => {
  assert.match(ficha, /usosDescansoCompletoValido\(usosDescanso\)/);
  assert.match(ficha, /\['origem:academico'\] !== true/);
  assert.match(ficha, /academicoDisponivel=\{academicoDisponivel\}/);
});

test('A opção de uso é limpa quando a pessoa muda o tipo ou a Perícia do Teste', () => {
  assert.match(calculadora, /setUsarSaberEAPoder\(false\).*\[tipo, periciaEfetiva, atributo\]/);
});
