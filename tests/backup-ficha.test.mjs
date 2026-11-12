import test from 'node:test';
import assert from 'node:assert/strict';
import { criarBackup, lerArquivoBackup, serializarBackup, validarBackup } from '../src/backupFicha.ts';

const ficha = (id = 'char-1') => ({
  id, geracao: 'geracao-' + id, nome: 'Claire Redfield',
  criadoEm: '2026-11-03T10:00:00.000Z',
  atualizadoEm: '2026-11-03T11:00:00.000Z',
  dados: { classe: 'Agente', atributos: { forca: 1, agilidade: 2, vigor: 2, astucia: 2 }, recursos: { pv: 12, sa: 4, bi: 10 } },
});

test('gera backup versionado e recupera todos os dados sem alterar a origem', () => {
  const origem = [ficha()];
  const backup = criarBackup(origem, '2026-11-03T12:00:00.000Z');
  const texto = serializarBackup(backup);
  const recuperado = lerArquivoBackup(texto);
  assert.equal(recuperado.formato, 'ameaca-biologica-backup');
  assert.equal(recuperado.versao, 1);
  assert.deepEqual(recuperado.personagens, origem);
  assert.equal(origem.length, 1);
});

test('recusa JSON corrompido, formato estranho e versão futura', () => {
  assert.throws(() => lerArquivoBackup('{quebrado'), /JSON válido/);
  assert.throws(() => validarBackup({ formato: 'outro', versao: 1, exportadoEm: '2026-11-03', personagens: [] }), /não é um backup/);
  assert.throws(() => validarBackup({ formato: 'ameaca-biologica-backup', versao: 99, exportadoEm: '2026-11-03', personagens: [] }), /não é compatível/);
});

test('recusa ficha inválida e IDs duplicados sem gerar backup parcial', () => {
  assert.throws(() => criarBackup([{ ...ficha(), nome: '' }]), /fichas inválidas/);
  assert.throws(() => criarBackup([ficha(), ficha()]), /IDs duplicados/);
  assert.throws(() => validarBackup({ formato: 'ameaca-biologica-backup', versao: 1, exportadoEm: '2026-11-03', personagens: [ficha(), ficha()] }), /duplicados/);
});

test('recupera o conteúdo de um backup importado com todos os campos aninhados', () => {
  const original = ficha();
  original.dados.combate = { armas: [{ id: 'pistola', municao: { atual: 9, reserva: 30 } }] };
  const recuperado = lerArquivoBackup(serializarBackup(criarBackup([original])));
  assert.deepEqual(recuperado.personagens[0], original);
});

test('backup preserva os campos narrativos da identidade sem achatá-los', () => {
  const original = ficha();
  original.dados.identidade = {
    idade: '31', genero: 'Feminino', ocupacao: 'Médica',
    apelido: 'Claire', afiliacao: 'R.P.D.', aparencia: 'Cabelos castanhos',
    personalidade: 'Corajosa', objetivo: 'Encontrar sobreviventes',
    medo: 'Perder os amigos', lacos: 'Chris', historia: 'História de exemplo',
  };
  const recuperado = lerArquivoBackup(serializarBackup(criarBackup([original])));
  assert.deepEqual(recuperado.personagens[0].dados.identidade, original.dados.identidade);
});


test('backup legado sem geração recebe uma nova geração ao ser validado', () => {
  const legado = ficha();
  delete legado.geracao;
  const recuperado = validarBackup({
    formato: 'ameaca-biologica-backup',
    versao: 1,
    exportadoEm: '2026-11-03T12:00:00.000Z',
    personagens: [legado],
  });
  assert.equal(typeof recuperado.personagens[0].geracao, 'string');
  assert.ok(recuperado.personagens[0].geracao.length > 0);
  assert.notEqual(recuperado.personagens[0].geracao, undefined);
});

test('exportação atual exige geração e rejeita dados que o JSON perderia', () => {
  const semGeracao = ficha();
  delete semGeracao.geracao;
  assert.throws(() => criarBackup([semGeracao]), /fichas inválidas/);
  const comValorNaoSerializavel = ficha();
  comValorNaoSerializavel.dados.valorFuturo = undefined;
  assert.throws(() => criarBackup([comValorNaoSerializavel]), /fichas inválidas/);
});


test('backup preserva a Economia de Ações e seu espelho de SA após restauração', async () => {
  const { economiaAcoesInicial, comprarRecursoPorEsforco } = await import('../src/economiaAcoes.ts');
  let economia = comprarRecursoPorEsforco(economiaAcoesInicial(4), 'movimento');
  const original = ficha();
  original.dados.saAtual = economia.saAtual;
  original.dados.economiaAcoes = economia;
  const recuperado = lerArquivoBackup(serializarBackup(criarBackup([original])));
  assert.equal(recuperado.personagens[0].dados.saAtual, 3);
  assert.deepEqual(recuperado.personagens[0].dados.economiaAcoes, economia);
  assert.equal(recuperado.personagens[0].geracao, original.geracao);
});


test('backup e restauração preservam Habilidades adquiridas e usos limitados a Descanso Completo', () => {
  const original = ficha();
  original.dados = {
    versaoModelo: 1,
    estadoFicha: 'rascunho',
    classe: 'Autodidata',
    origem: 'Acadêmico',
    nivel: 2,
    habilidadeBasica: 'ambidestria',
    habilidadesAdquiridas: [
      { nivel: 1, habilidadeId: 'ambidestria' },
      { nivel: 2, habilidadeId: 'curiosa' },
    ],
    usosDescansoCompleto: {
      'habilidade:curiosa': true,
      'origem:academico': true,
    },
  };
  const restaurado = lerArquivoBackup(serializarBackup(criarBackup([original])));
  assert.deepEqual(restaurado.personagens[0].dados.habilidadesAdquiridas, original.dados.habilidadesAdquiridas);
  assert.deepEqual(restaurado.personagens[0].dados.usosDescansoCompleto, original.dados.usosDescansoCompleto);
});


test('backup preserva o planejamento parcial de criação em Nível superior', () => {
  const original = ficha();
  original.dados = {
    versaoModelo: 1,
    estadoFicha: 'rascunho',
    classe: 'Agente',
    planejamentoCriacao: {
      nivelAlvo: 4,
      habilidades: [
        { nivel: 1, habilidadeId: 'anatomia-de-combate' },
        { nivel: 2, habilidadeId: 'nao-vai-escapar' },
      ],
    },
  };
  const restaurado = lerArquivoBackup(serializarBackup(criarBackup([original])));
  assert.deepEqual(restaurado.personagens[0].dados.planejamentoCriacao, original.dados.planejamentoCriacao);
});


test('backup preserva Progressão persistente e recusa estado malformado', () => {
  const progressao = {
  versao: 1, nivelAtual: 1, metodo: 'missoes', missoesCompletadas: 0,
  marcoNarrativoConcedido: false, missoesCompletadasNaUltimaMorte: null,
  nivelNaUltimaMorte: null, marcoNarrativoAposUltimaMorte: false,
  penalidadeMorteNivel1: false, beneficiosPorNivel: [],
};
  const original = ficha();
  original.dados = { versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', nivel: 1, progressao };
  const restaurado = lerArquivoBackup(serializarBackup(criarBackup([original])));
  assert.deepEqual(restaurado.personagens[0].dados.progressao, progressao);
  const invalido = { ...original, dados: { ...original.dados, progressao: { ...progressao, campoExtra: true } } };
  assert.throws(() => criarBackup([invalido]), /fichas inválidas/);
});


test('backup preserva o Registro de Decisões da Mesa e recusa evento malformado', () => {
  const original = ficha();
  original.dados.registrosMesa = [{
    id: 'evento-1',
    tipo: 'transformacao',
    descricao: 'O Mestre confirmou a transformação após avaliar a situação.',
    responsavel: 'Mestre',
    ocorridoEm: '2026-11-12T15:00:00.000Z',
    registradoEm: '2026-11-12T15:05:00.000Z',
    reanimacaoId: 'reanimacao-1',
  }, {
    id: 'evento-2',
    tipo: 'retificacao',
    descricao: 'Retifica a decisão anterior, que foi registrada incorretamente.',
    responsavel: 'Mestre',
    ocorridoEm: '2026-11-12T16:00:00.000Z',
    registradoEm: '2026-11-12T16:05:00.000Z',
    retificaRegistroId: 'evento-1',
    reanimacaoId: 'reanimacao-1',
  }];
  original.dados.reanimacao = {
    id: 'reanimacao-1', causa: 'pv_zero', estado: 'morte_a_registrar',
    sucessos: 0, falhas: 3, tentativas: 3, curaAcumulada: 0, vantagemProximoTeste: false,
  };
  const restaurado = lerArquivoBackup(serializarBackup(criarBackup([original])));
  assert.deepEqual(restaurado.personagens[0].dados.registrosMesa, original.dados.registrosMesa);
  assert.deepEqual(restaurado.personagens[0].dados.reanimacao, original.dados.reanimacao);
  const invalido = ficha();
  invalido.dados.registrosMesa = [{ ...original.dados.registrosMesa[0], descricao: '' }];
  assert.throws(() => criarBackup([invalido]), /fichas inválidas/);
});


test('backup rejeita retificação sem referência válida ao registro anterior', () => {
  const original = ficha();
  original.dados.registrosMesa = [{
    id: 'retificacao-sem-alvo', tipo: 'retificacao',
    descricao: 'Tentativa de corrigir um registro.', responsavel: 'Mestre',
    ocorridoEm: '2026-11-12T16:00:00.000Z', registradoEm: '2026-11-12T16:05:00.000Z',
    retificaRegistroId: 'nao-existe',
  }];
  assert.throws(() => criarBackup([original]), /fichas inválidas/);
});
