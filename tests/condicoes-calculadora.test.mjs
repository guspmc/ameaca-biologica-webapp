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

test('Imobilizado impõe Desvantagem em Reflexos, inclusive na Esquiva', () => {
  assert.deepEqual(api.condicoesQueImpoemDesvantagem(['imobilizado'], {
    escopo:'testes', tipoTeste:'pericia', pericia:'Reflexos', atributo:'agilidade',
  }), ['imobilizado']);
  assert.deepEqual(api.condicoesQueImpoemDesvantagem(['imobilizado'], {
    escopo:'testes', tipoTeste:'pericia', pericia:'Fortitude', atributo:'vigor',
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
  assert.match(ficha, /condicoesRegistradasIds = listaCondicoesValida\(dados\.condicoes\)/);
  assert.match(ficha, /desacordadoPorRecursos = recursosAtuais\.pvAtual <= 0 \|\| faseBi\.estado === 'colapso'/);
  assert.match(ficha, /condicoesAtivasIds: CondicaoId\[\]/);
  assert.match(ficha, /condicoesAtivas=\{condicoesAtivasIds\}/);
  assert.match(ficha, /calcularDefesaComCondicoes\(defesa, numero\(atributos\.agilidade\), condicoesAtivasIds\)/);
  assert.match(ficha, /DEFESA ATUAL/);
});


test('Condições que proíbem Ações ou Atacar geram lembretes sem bloquear rolagens', () => {
  assert.deepEqual(api.restricoesDeAtaquePorCondicoes(['desorientado','desacordado','atordoado','incapacitado','surpreendido']), [
    { condicao: 'desorientado', motivo: 'Desorientado: não pode usar Atacar.' },
    { condicao: 'desacordado', motivo: 'Desacordado: não pode realizar Ações nem Reações e não percebe conscientemente o ambiente.' },
    { condicao: 'atordoado', motivo: 'Atordoado: não pode realizar Ações, Reações ou Movimento.' },
    { condicao: 'incapacitado', motivo: 'Incapacitado: não pode realizar Ações nem Reações.' },
    { condicao: 'surpreendido', motivo: 'Surpreendido: no primeiro turno, não pode se mover nem realizar Ações; enquanto durar, não pode usar Reações nem gastar SA.' },
  ]);
  assert.deepEqual(api.restricoesDeAtaquePorCondicoes(['caido','imobilizado','intoxicado']), []);
});

test('Calculadora aplica bloqueios operacionais; painel de Manobras não administra turnos ou Condições', async () => {
  const calc = await readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
  const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
  assert.match(calc, /restricoesDeAtaquePorCondicoes/);
  assert.ok(calc.includes('disabled={ataqueBloqueadoPorCondicao}'));
  assert.ok(calc.includes('if (ataqueBloqueadoPorCondicao)'));
  assert.doesNotMatch(painel, /restricoesDeAtaquePorCondicoes|Condições que restringem sua atuação|turnoEmAndamento/);
  const condicoes = await readFile(new URL('../src/CondicoesFichaLocal.tsx', import.meta.url), 'utf8');
  assert.ok(condicoes.includes('adicionarInstanciaCondicao(itens, {'));
  assert.ok(condicoes.includes('encerrarInstanciaCondicao(itens, id)'));
});

test('Reflexos de Sobrevivente usa a maior Defesa atual ou 10 + Acrobacia somente quando ativo', () => {
  assert.equal(api.calcularDefesaComReflexosSobrevivente(14, 2, true), 14);
  assert.equal(api.calcularDefesaComReflexosSobrevivente(12, 4, true), 14);
  assert.equal(api.calcularDefesaComReflexosSobrevivente(12, 4, false), 12);
  assert.throws(() => api.calcularDefesaComReflexosSobrevivente(-1, 2, true), /Defesa alternativa inválidos/);
  assert.throws(() => api.calcularDefesaComReflexosSobrevivente(12, -1, true), /Defesa alternativa inválidos/);
});

test('Ficha apresenta Defesa alternativa e lembrete contextual de Parede Humana', async () => {
  const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ficha, /valorBasePericia\('Acrobacia'/);
  assert.match(ficha, /calcularDefesaComReflexosSobrevivente\(defesaAtual, acrobaciaAtual, reflexosSobreviventeAtivo\)/);
  assert.match(ficha, /DEFESA CONTRA ATAQUES — REFLEXOS DE SOBREVIVENTE/);
  assert.match(ficha, /paredeHumanaAtiva &&/);
  assert.match(ficha, /se não tiver gasto o recurso Movimento/);
});


test('Ficha apresenta todos os benefícios contextuais de Reflexos de Sobrevivente e Rolamento', async () => {
  const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ficha, /Uma vez por rodada, pode Esquivar sem gastar Reação/);
  assert.match(ficha, /próxima Ação Bônus fica comprometida/);
  assert.match(ficha, /atravessar espaços ocupados por personagens ou inimigos Médios e menores/);
  assert.match(ficha, /habilidadesAtivasIds\.includes\('rolamento'\)/);
  assert.match(ficha, /reposicionar-se até 3 m sem provocar Ataques de Oportunidade/);
});

test('Bloqueios operacionais seguem apenas proibições explícitas das Condições', () => {
  const vazio = api.avaliarBloqueiosOperacionaisPorCondicoes([]);
  assert.deepEqual(vazio, { acao: false, movimento: false, reacao: false, gastarSA: false, ataque: false });

  assert.deepEqual(api.avaliarBloqueiosOperacionaisPorCondicoes(['desacordado']), {
    acao: true, movimento: false, reacao: true, gastarSA: false, ataque: true,
  });
  assert.deepEqual(api.avaliarBloqueiosOperacionaisPorCondicoes(['atordoado']), {
    acao: true, movimento: true, reacao: true, gastarSA: false, ataque: true,
  });
  assert.deepEqual(api.avaliarBloqueiosOperacionaisPorCondicoes(['incapacitado']), {
    acao: true, movimento: false, reacao: true, gastarSA: false, ataque: true,
  });
  assert.deepEqual(api.avaliarBloqueiosOperacionaisPorCondicoes(['desorientado']), {
    acao: false, movimento: false, reacao: false, gastarSA: false, ataque: true,
  });
});

test('Condições que zeram Movimento bloqueiam seu uso e compra por Esforço', () => {
  for (const condicao of ['agarrado', 'imobilizado', 'atordoado']) {
    assert.equal(api.avaliarBloqueiosOperacionaisPorCondicoes([condicao]).movimento, true, condicao);
  }
  assert.equal(api.avaliarBloqueiosOperacionaisPorCondicoes(['caido']).movimento, false);
  assert.equal(api.avaliarBloqueiosOperacionaisPorCondicoes(['intoxicado']).movimento, false);
});

test('Surpreendido bloqueia Reação e gasto de SA, mas não presume o primeiro turno', () => {
  assert.deepEqual(api.avaliarBloqueiosOperacionaisPorCondicoes(['surpreendido']), {
    acao: false, movimento: false, reacao: true, gastarSA: true, ataque: false,
  });
});

test('Condições combinadas acumulam bloqueios sem duplicar categorias', () => {
  assert.deepEqual(api.avaliarBloqueiosOperacionaisPorCondicoes([
    'desacordado', 'atordoado', 'incapacitado', 'desorientado', 'surpreendido',
  ]), {
    acao: true,
    movimento: true,
    reacao: true,
    gastarSA: true,
    ataque: true,
  });
});

test('Remover uma Condição recalcula os bloqueios sem manter estado residual', () => {
  const antes = api.avaliarBloqueiosOperacionaisPorCondicoes(['atordoado', 'surpreendido']);
  assert.deepEqual(antes, {
    acao: true, movimento: true, reacao: true, gastarSA: true, ataque: true,
  });

  const depois = api.avaliarBloqueiosOperacionaisPorCondicoes(['surpreendido']);
  assert.deepEqual(depois, {
    acao: false, movimento: false, reacao: true, gastarSA: true, ataque: false,
  });

  const encerradas = api.avaliarBloqueiosOperacionaisPorCondicoes([]);
  assert.deepEqual(encerradas, {
    acao: false, movimento: false, reacao: false, gastarSA: false, ataque: false,
  });
});

test('Ação Bônus e Interação Gratuita não são bloqueadas por inferência a partir de Ação', () => {
  const bloqueios = api.avaliarBloqueiosOperacionaisPorCondicoes(['atordoado', 'incapacitado']);
  assert.equal(bloqueios.acao, true);
  assert.equal(bloqueios.movimento, true);
  assert.equal(bloqueios.reacao, true);
  // O retorno não bloqueia Ação Bônus nem Interação Gratuita.
  assert.equal(Object.hasOwn(bloqueios, 'acaoBonus'), false);
  assert.equal(Object.hasOwn(bloqueios, 'interacaoGratuita'), false);
});

