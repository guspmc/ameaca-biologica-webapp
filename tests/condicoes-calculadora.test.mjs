import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/condicoesCalculadora.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const api = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('Condições próprias aplicam Desvantagem a Ataques conforme o tipo', () => {
  assert.deepEqual(api.condicoesQueImpoemDesvantagem(['caido','cego','imobilizado','intoxicado'], {
    escopo:'ataques', tipoAtaque:'corpo-a-corpo',
  }), ['caido','cego','imobilizado','intoxicado']);
  assert.deepEqual(api.condicoesQueImpoemDesvantagem(['infectado-especial'], {
    escopo:'ataques', tipoAtaque:'distancia',
  }), ['infectado-especial']);
  assert.deepEqual(api.condicoesQueImpoemDesvantagem(['infectado-especial'], {
    escopo:'ataques', tipoAtaque:'corpo-a-corpo',
  }), []);
});

test('Enfraquecido afeta Testes baseados em FOR, Fortitude e Ataques corpo a corpo', () => {
  assert.deepEqual(api.condicoesQueImpoemDesvantagem(['enfraquecido'], {
    escopo:'testes', tipoTeste:'atributo', atributo:'forca',
  }), ['enfraquecido']);
  assert.deepEqual(api.condicoesQueImpoemDesvantagem(['enfraquecido'], {
    escopo:'testes', tipoTeste:'pericia', pericia:'Fortitude', atributo:'vigor',
  }), ['enfraquecido']);
  assert.deepEqual(api.condicoesQueImpoemDesvantagem(['enfraquecido'], {
    escopo:'ataques', tipoAtaque:'corpo-a-corpo',
  }), ['enfraquecido']);
  assert.deepEqual(api.condicoesQueImpoemDesvantagem(['enfraquecido'], {
    escopo:'ataques', tipoAtaque:'distancia',
  }), []);
});

test('Desorientado e Intoxicado afetam Testes de Perícia; Intoxicado não afeta Testes de Atributo', () => {
  assert.deepEqual(api.condicoesQueImpoemDesvantagem(['desorientado','intoxicado'], {
    escopo:'testes', tipoTeste:'pericia', pericia:'Investigação', atributo:'astucia',
  }), ['desorientado','intoxicado']);
  assert.deepEqual(api.condicoesQueImpoemDesvantagem(['intoxicado'], {
    escopo:'testes', tipoTeste:'atributo', atributo:'astucia',
  }), []);
});

test('Defesa atual aplica Exposto e remove AGI por Desorientado sem duplicar efeitos', () => {
  assert.equal(api.calcularDefesaComCondicoes(14, 2, []), 14);
  assert.equal(api.calcularDefesaComCondicoes(14, 2, ['exposto']), 12);
  assert.equal(api.calcularDefesaComCondicoes(14, 2, ['desorientado']), 12);
  assert.equal(api.calcularDefesaComCondicoes(14, 2, ['desorientado','exposto']), 10);
  assert.equal(api.calcularDefesaComCondicoes(14, 2, ['exposto','exposto']), 12);
  assert.throws(() => api.calcularDefesaComCondicoes(14, 6, []), /Agilidade inválida/);
});

test('Ficha alimenta os cálculos com Condições ativas e cancela Vantagem/Desvantagem normalmente', async () => {
  const calc = await readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
  const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(calc, /condicoesQueImpoemDesvantagem\(condicoesAtivas/);
  assert.match(calc, /const existeDesvantagem = vantagem === 'desvantagem' \\|\\| desvantagemBI \\|\\| desvantagensCondicao.length > 0 \\|\\| desvantagemDesarmado/);
  assert.match(calc, /const vantagemEfetiva: VantagemTeste = existeVantagem && existeDesvantagem \? 'normal'/);
  assert.match(ficha, /condicoesAtivasIds = listaCondicoesValida\(dados\.condicoes\)/);
  assert.match(ficha, /condicoesAtivas=\{condicoesAtivasIds\}/);
  assert.match(ficha, /calcularDefesaComCondicoes\(defesa, numero\(atributos\.agilidade\), condicoesAtivasIds\)/);
  assert.match(ficha, /DEFESA ATUAL/);
});


test('Condições que proíbem Ações ou Atacar geram lembretes sem bloquear rolagens', () => {
  assert.deepEqual(api.restricoesDeAtaquePorCondicoes(['desorientado','atordoado','incapacitado','surpreendido']), [
    { condicao: 'desorientado', motivo: 'Desorientado: não pode usar Atacar.' },
    { condicao: 'atordoado', motivo: 'Atordoado: não pode realizar Ações, Reações ou Movimento.' },
    { condicao: 'incapacitado', motivo: 'Incapacitado: não pode realizar Ações nem Reações.' },
    { condicao: 'surpreendido', motivo: 'Surpreendido: no primeiro turno, não pode se mover nem realizar Ações.' },
  ]);
  assert.deepEqual(api.restricoesDeAtaquePorCondicoes(['caido','imobilizado','intoxicado']), []);
});

test('Calculadora de Ataques apresenta restrições sem desabilitar ou resolver ações', async () => {
  const calc = await readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
  assert.match(calc, /restricoesDeAtaquePorCondicoes/);
  assert.match(calc, /Condições que restringem Ataques/);
  assert.match(calc, /Este aviso não bloqueia a rolagem/);
});
