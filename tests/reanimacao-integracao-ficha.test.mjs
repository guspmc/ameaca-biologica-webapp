import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [ficha, painel, recursos, descanso] = await Promise.all([
  readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/ReanimacaoFichaLocal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/RecursosFichaLocal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/DescansoFichaLocal.tsx', import.meta.url), 'utf8'),
]);

test('painel de Reanimação está integrado à ficha contínua e aos salvamentos', () => {
  assert.match(ficha, /import ReanimacaoFichaLocal from '\.\/ReanimacaoFichaLocal'/);
  assert.match(ficha, /<ReanimacaoFichaLocal[\s\S]*?aoSalvar=\{aoSalvarRecursos\}/);
  assert.match(ficha, /bloqueado=\{secoesPendentes\.size > 0\}/);
  assert.match(painel, /reanimacao: proxima/);
  assert.match(painel, /O armazenamento não confirmou a alteração da Reanimação/);
});

test('painel inicia Colapso Viral automaticamente e registra resultados sem controlar turnos', () => {
  assert.match(painel, /sortearDados\(2, 20\)/);
  assert.match(painel, /sortearDados\(1, 20\)\[0\]/);
  assert.match(painel, /Colapso Viral e a Reanimação específica são registrados automaticamente/);
  assert.match(painel, /void iniciar\('colapso_bi'\)/);
  assert.doesNotMatch(painel, /Iniciar Testes no próximo turno/);
});
test('Primeiros Socorros e cura acumulada ficam disponíveis durante Reanimação por 0 PV', () => {
  assert.match(painel, /estadoPV0 &&/);
  assert.match(painel, /Registrar sucesso/);
  assert.match(painel, /Acumular cura sem despertar/);
});
test('um novo evento crítico pode iniciar outra Reanimação após a anterior ser concluída', () => {
  assert.match(painel, /reanimacaoAnteriorConcluida/);
  assert.match(painel, /reanimacao === null \|\| reanimacaoAnteriorConcluida/);
});

test('cura em 0 PV é direcionada à acumulação da Reanimação, sem botão de cura direta', () => {
  assert.match(recursos, /recursos\.pvAtual === 0/);
  assert.match(recursos, /registre toda cura no painel de Reanimação/);
  assert.match(painel, /Acumular cura sem despertar/);
});

test('Teste de Medicina registra apenas sucesso ou falha, sem falha crítica', () => {
  assert.doesNotMatch(painel, /Registrar falha crítica \(1 natural\)/);
  assert.doesNotMatch(painel, /falhaCritica/);
  assert.match(painel, /Registrar sucesso/);
  assert.match(painel, /Registrar falha/);
});
test('a interface não classifica 1 natural como Falha Crítica em Reanimação', () => {
  assert.doesNotMatch(painel, /Falha Crítica no Teste de Reanimação/);
  assert.doesNotMatch(painel, /falhaCritica/);
});
test('resumo da BI informa corretamente que Colapso Viral inicia Reanimação automaticamente', () => {
  assert.match(ficha, /Ao confirmar BI igual ou superior ao máximo, o módulo Reanimação registra o Colapso Viral automaticamente/);
  assert.doesNotMatch(ficha, /nem inicia Reanimação/);
});

test('PV Atuais não podem ser alterados diretamente durante Reanimação por 0 PV', () => {
  assert.match(ficha, /bloquearPV=\{recursosAtuais\.pvAtual === 0 \|\| reanimacaoPV0EmCurso\}/);
  assert.match(recursos, /bloquearPV\?: boolean/);
  assert.match(recursos, /value=\{pvDigitado\} disabled=\{ocupado \|\| !!pendencia \|\| bloquearPV\}/);
  assert.match(recursos, /if \(ocupado \|\| pendencia \|\| bloquearPV\) return/);
  assert.match(recursos, /disabled=\{ocupado \|\| !!pendencia \|\| bloquearPV \|\| recursos\.pvAtual/);
});

test('Reanimação não sobrescreve outras seções ainda pendentes', () => {
  assert.match(ficha, /bloqueado=\{secoesPendentes\.size > 0\}/);
  assert.match(painel, /Salve ou descarte outras alterações pendentes/);
});

test('Descanso Completo é bloqueado durante as horas de transformação que não concedem seus benefícios', () => {
  assert.match(ficha, /periodoTransformacaoSemDescansoCompleto = \(condicoesRegistradasIds\.includes\('infectado-especial'\)/);
  assert.match(ficha, /bloquearDescansoCompleto=\{periodoTransformacaoSemDescansoCompleto\}/);
  assert.match(descanso, /bloquearDescansoCompleto\?: boolean/);
  assert.match(descanso, /!bloquearDescansoCompleto/);
  assert.match(descanso, /A Ficha não mede o tempo/);
});

test('descanso não restaura PV enquanto Reanimação ou transformação estiver pendente', () => {
  assert.match(ficha, /reanimacaoEmCurso/);
  assert.match(ficha, /bloqueado=\{secoesPendentes\.size > 0 \|\| reanimacaoEmCurso\}/);
  assert.match(descanso, /bloqueado/);
});

test('Reanimação respeita modos e tipos de dados sem exigir faces físicas na Ficha', () => {
  assert.match(painel, /sortearDados\(2, 20\)/);
  assert.match(painel, /sortearDados\(1, 20\)\[0\]/);
  assert.match(painel, /modoDados === 'mistos'/);
  assert.match(painel, /Registrar sucesso/);
  assert.match(painel, /Registrar falha/);
  assert.doesNotMatch(painel, /Resultado do d20/);
  assert.doesNotMatch(painel, /Segundo d20/);
});
test('Transformações a 0 PV exibem o cânone como referência e permitem registrar a decisão da Mesa', () => {
  assert.match(ficha, /transformacaoAtiva=\{condicoesRegistradasIds\.includes\('infectado-especial'\)/);
  assert.match(painel, /transformacaoPVZero = transformacaoAtiva !== null && recursos\.pvAtual <= 0/);
  assert.match(painel, /1 hora inerte antes da transformação em Cabeça Carmesim/);
  assert.match(painel, /cânone prevê morte da personagem/);
  assert.match(painel, /Este texto é referência, não decisão automática/);
  assert.match(painel, /não mata, transforma nem bloqueia registros decididos pela Mesa/);
  assert.match(painel, /Registrar Reanimação por 0 PV conforme decisão da Mesa/);
  assert.match(painel, /Registrar Reanimação por Colapso conforme decisão da Mesa/);
  assert.match(painel, /A Ficha apenas registrará a decisão/);
  assert.doesNotMatch(painel, /controles estão bloqueados para evitar aplicar o fluxo errado/);
  assert.match(painel, /Confirma que a Mesa decidiu registrar este fluxo de Reanimação/);
  assert.doesNotMatch(painel, /reanimacaoEmConflito/);
  assert.doesNotMatch(painel, /estado === 'aguardando_proximo_turno' && !transformacao/);
});

test('três falhas registram resultado mecânico e deixam o desfecho para a Mesa', () => {
  assert.match(painel, /resultado mecânico registrado — decisão da Mesa pendente/);
  assert.match(painel, /Consulte o desfecho previsto no cânone e registre a decisão da Mesa no histórico/);
  assert.match(painel, /a Ficha não declara morte, não transforma a personagem e não aplica consequências narrativas/i);
  assert.match(painel, /Registro de Decisões da Mesa/);
  assert.doesNotMatch(painel, /Morte sinalizada para registro do Mestre|retorno como Zumbi Especial pendente para o próximo turno/);
});

test('0 PV inicia Reanimação após haver PV Máximos; a Ficha não controla turnos', () => {
  assert.match(painel, /podeIniciarPV = !registroReanimacaoInvalido && pvMaximo > 0 && !transformacaoPVZero && recursos\.pvAtual === 0/);
  assert.match(painel, /pvZeroAutoTentado/);
  assert.match(painel, /void iniciar\('pv_zero'\)/);
  assert.match(painel, /registrarResultadoReanimacao/);
  assert.doesNotMatch(painel, /Iniciar Testes no próximo turno/);
  assert.doesNotMatch(painel, /iniciarTurnoReanimacao/);
});

test('Reanimação virtual continua disponível no modo Automático', () => {
  assert.doesNotMatch(painel, /bloqueioVirtual/);
  assert.match(painel, /sortearDados\(2, 20\)/);
  assert.match(painel, /sortearDados\(1, 20\)\[0\]/);
});
test('roladores de Reanimação ficam disponíveis somente no modo Automático', () => {
  assert.match(painel, /rolagemVirtualAtiva = modo === 'automatico' && metodo === 'virtual'/);
  assert.match(painel, /modo === 'automatico' && modoDados === 'mistos'/);
  assert.match(painel, /modo !== 'automatico' && <p>Modo/);
});


test('decisão vinculada substitui o aviso de pendência sem executar efeitos narrativos', () => {
  assert.match(painel, /decisoesVinculadas/);
  assert.match(painel, /Decisão da Mesa registrada/);
  assert.match(painel, /vincule-a a esta Reanimação/i);
  assert.match(painel, /Preparar vínculo para esta Reanimação/);
  assert.match(painel, /gerarIdReanimacao/);
  assert.match(painel, /não executa consequências narrativas/);
  assert.match(painel, /item\.retificaRegistroId && <small> Retifica o registro/);
});

test('dados físicos registram sucesso ou falha sem pedir faces de d20', () => {
  assert.match(painel, /onClick=\{\(\) => void registrarTeste\(true\)\}>Registrar sucesso/);
  assert.match(painel, /onClick=\{\(\) => void registrarTeste\(false\)\}>Registrar falha/);
  assert.match(painel, /rolagemVirtualAtiva \? <>/);
  assert.doesNotMatch(painel, /Resultado do d20/);
  assert.doesNotMatch(painel, /Segundo d20/);
});
