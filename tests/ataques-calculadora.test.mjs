import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ui = await readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
const pericias = await readFile(new URL('../src/pericias.ts', import.meta.url), 'utf8');
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');

test('calculadora oferece Ataque Corpo a Corpo com Luta e Ataque à distância com Pontaria', () => {
  assert.match(ui, /ataque-corpo/);
  assert.match(ui, /ataque-distancia/);
  assert.match(ui, /const periciaEfetiva = tipo === 'ataque-corpo' \? 'Luta' : tipo === 'ataque-distancia' \? 'Pontaria'/);
  assert.match(ui, /Ataque Corpo a Corpo: 1d20 \+ Luta/);
  assert.match(ui, /Ataque à distância: 1d20 \+ Pontaria/);
});

test('modo de Ataque não compara com Defesa e mantém os resultados críticos oficiais', () => {
  assert.match(ui, /calcularRolagemAtaqueManual/);
  assert.match(ui, /Compare com a Defesa do alvo na mesa/);
  assert.doesNotMatch(ui, /<label>Defesa do alvo/);
  assert.match(ui, /20 natural: Acerto Crítico automático/);
  assert.match(ui, /1 natural: Falha Crítica; Exposto é ativado automaticamente somente no modo Automático/);
});

test('calculadora não rola dados nem aplica Dano automaticamente', () => {
  assert.match(ui, /sortearDados/);
  assert.match(ui, /Cada rolagem exige comando explícito/);
  assert.match(ui, /não altera dados da personagem/);
  assert.doesNotMatch(ui, /salvarPatchPersonagem|localStorage|aoSalvar/);
  assert.match(ui, /O cálculo de Dano permanece manual/);
  assert.doesNotMatch(ui, /Math\.random|crypto\.getRandomValues/);
});

test('Ataques usam os Atributos oficiais associados a Luta e Pontaria', () => {
  assert.match(pericias, /Luta:\s*'forca'/);
  assert.match(pericias, /Pontaria:\s*'agilidade'/);
});

test('Testes comuns e Ataques aparecem em seções separadas da Ficha', () => {
  assert.match(ui, /escopo\?: 'testes' \| 'ataques'/);
  assert.match(ui, /escopo === 'testes'.*Teste de Perícia/s);
  assert.match(ui, /escopo === 'ataques'.*Ataque Corpo a Corpo/s);
  assert.match(ficha, /CalculadoraTesteLocal escopo="testes"/);
  assert.match(ficha, /CalculadoraTesteLocal escopo="ataques"/);
  const pericias = ficha.slice(ficha.indexOf('id="ficha-local-pericias"'), ficha.indexOf('id="ficha-local-combate"'));
  assert.doesNotMatch(pericias, /ataque-corpo|ataque-distancia|escopo="ataques"/);
});

test('calculadora consulta os catálogos de armas sem afirmar posse ou equipamento', () => {
  assert.match(ui, /listarPerfisArma/);
  assert.match(ui, /listarPerfisArmasFogo/);
  assert.match(ui, /Perfil de arma para consulta \(opcional\)/);
  assert.match(ui, /não confirma posse, equipamento, munição ou proficiência/);
  assert.match(ui, /perfilSelecionado\.dano/);
  assert.match(ui, /perfilSelecionado\.referencia/);
});

test('Origem Operário concede +1 no Ataque somente com a arma escolhida', () => {
  assert.match(ui, /armaOperarioEscolhida = origem === 'Operário' && perfilCorpo\?\.nome === armaOperario/);
  assert.match(ui, /bonusAtaqueOperario\(armaOperarioEscolhida\)/);
  assert.match(ficha, /armaOperario=\{armaOperario\}/);
  assert.match(ui, /Bônus da Origem Operário: \+\{bonusOperario\}/);
});

test('margem crítica usa o perfil consultado e não automatiza dano', () => {
  assert.match(ui, /limiteCritico/);
  assert.match(ui, /multiplicadorCritico/);
  assert.match(ui, /resultadoAtaqueCritico/);
  assert.match(ui, /O cálculo de Dano permanece manual/);
  assert.doesNotMatch(ui, /aoSalvarRecursos|salvarPatchPersonagem/);
});


test('calculadora manual de Dano usa resultados informados e atributos do perfil', () => {
  assert.match(ui, /calcularDanoArma/);
  assert.match(ui, /Soma dos Dados de Dano/);
  assert.match(ui, /atributoDano = tipo === 'ataque-corpo' \? atributos\.forca : atributos\.agilidade/);
  assert.match(ui, /Aplicar Acerto Crítico/);
  assert.match(ui, /Dano calculado:/);
  assert.match(ui, /não rola dados nem altera PV/);
});

test('Dano do Operário preserva FOR adicional fora do multiplicador crítico', () => {
  assert.match(ui, /armaOperarioEscolhida/);
  assert.match(ui, /FOR adicional; esse bônus não é multiplicado no Crítico/);
  assert.match(ui, /bonusOperarioNaoMultiplicado/);
});

test('perfis com fórmulas especiais não recebem cálculo genérico', () => {
  assert.match(ui, /formulaDanoConvencional/);
  assert.match(ui, /fórmula ou condição especial de Dano/);
});


test('resultado do Ataque preenche automaticamente o estado de Crítico no cálculo de Dano', () => {
  assert.match(ui, /const ataqueFoiCritico = ehAtaque/);
  assert.match(ui, /if \(ehAtaque\) setCriticoDano\(ataqueFoiCritico\)/);
  assert.match(ui, /setCriticoDano\(false\)/);
});

test('Ataque Desarmado e Arma Improvisada estão disponíveis na calculadora', () => {
  assert.match(ui, /consultarPerfilAtaqueUniversal/);
  assert.match(ui, /universal:arma-improvisada/);
  assert.match(ui, /universal:ataque-desarmado/);
  assert.match(ui, /desvantagemDesarmado = perfilCorpo\?\.id === 'universal-ataque-desarmado'/);
  assert.match(ui, /Ataque Desarmado: Desvantagem padrão aplicada/);
});

test('cálculo manual aceita soma de Dados adicionais já rolados sem presumir Peças instaladas', () => {
  assert.match(ui, /Soma de Dados adicionais já rolados \(opcional\)/);
  assert.match(ui, /dadosAdicionais: adicionais/);
  assert.match(ui, /A calculadora não presume que você os possui/);
});

test('modos especiais de Spark Shot e Lança-Chamas oferecem fórmulas manuais canônicas', () => {
  assert.match(ui, /consultarFormulaDanoEspecial/);
  assert.match(ui, /Disparo Carregado · Ação Completa · 3 Cargas · 4d4/);
  assert.match(ui, /Início \/ reinício · 3d6/);
  assert.match(ui, /3 ou mais turnos consecutivos · 6d6/);
  assert.match(ui, /não consome Combustível nem registra turnos ou Movimento/);
});

test('Motosserra orienta informar os dados extras de explosão sem rolagem automática', () => {
  assert.match(ui, /Motosserra, informe aqui a soma dos dados extras gerados por cada resultado 6/);
  assert.match(ui, /incluindo os encadeamentos/);
});

test('GM 79 apresenta procedimentos de cartuchos e modos direto/área', () => {
  assert.match(ui, /consultarProcedimentoGM79/);
  assert.match(ui, /Cartucho GM 79/);
  assert.match(ui, /Disparo contra ponto do cenário · Área/);
  assert.match(ui, /Todo disparo deixa a GM 79 vazia; recarga por Movimento/);
  assert.match(ui, /Disparo em Área: sem Acerto Crítico/);
});

test('GM 79 em Área não oferece rolagem de Ataque nem permite multiplicador crítico', () => {
  assert.match(ui, /!ataqueEmAreaGM79 && <button type="button" className="botao-claro" onClick={registrarRolagem}/);
  assert.match(ui, /critico: criticoDano && !ataqueEmAreaGM79/);
  assert.match(ui, /Disparo em Área da GM 79: não existe Teste de Ataque/);
});

test('Rajada é procedimento em área sem rolagem de Ataque ou Crítico', () => {
  assert.match(ui, /Rajada: não existe Teste de Ataque/);
  assert.match(ui, /Todos os alvos no cone de 4,5 m, inclusive aliados, fazem Reflexos DT 12/);
  assert.match(ui, /const ataqueEmArea = ataqueEmAreaGM79 \|\| rajadaSelecionada/);
});

test('Disparo Cadenciado e Perfuração exibem procedimentos sem assumir equipamento', () => {
  assert.match(ui, /Disparo Cadenciado usa Ataque normal e acrescenta \+2 Dados de Dano/);
  assert.match(ui, /Confirmar Coronha específica da Matilda instalada/);
  assert.match(ui, /A calculadora não controla a Linha, os alvos subsequentes/);
});

test('Bear Commander separa rifle e lançador integrado com reserva e dano próprios', () => {
  assert.match(ui, /Bear Commander — sistema de disparo/);
  assert.match(ui, /Lança-granadas integrado · 4d6 · Cartucho GM 79/);
  assert.match(ui, /capacidade separada de 1 Cartucho GM 79/);
  assert.match(ui, /reserva independente dos cartuchos do rifle/);
  assert.match(ui, /Recarga por Ação Bônus/);
  assert.match(ui, /const bearLauncherSelecionado = perfilFogo\?\.id === 'bear-commander'/);
  assert.match(ui, /const formulaDanoConvencional = bearLauncherSelecionado \? '4d6'/);
  assert.match(ui, /const multiplicadorCriticoDano = bearLauncherSelecionado \? 4/);
});


test('procedimentos especiais do RPG-7 e Spark Shot são exibidos sem automação de efeitos', () => {
  assert.match(ui, /consultarProcedimentoArmaEspecial/);
  assert.match(ui, /rpg-7/);
  assert.match(ui, /não escolhe avanço de fase\/efeito de ficha/);
  assert.match(ui, /Fortitude DT 15/);
  assert.match(ui, /Atordoado até o fim do próximo turno e Imobilizado por 1d4 rodadas/);
  assert.match(ui, /não rola Fortitude e não aplica Condições/);
});


test('lembretes de armas especiais derivam do catálogo único de procedimentos', async () => {
  const [especial, catalogo] = await Promise.all([
    readFile(new URL('../src/procedimentosArmasEspeciais.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/catalogoProcedimentosArmas.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(especial, /consultarProcedimentoArma\(id\)/);
  assert.match(especial, /procedimento\.emCombate\.find/);
  assert.match(catalogo, /RPG-7: após o disparo/);
  assert.match(catalogo, /Spark Shot: disparo normal consome 1 Carga/);
});


test('CODE VERONICA é passado à calculadora e concede Vantagem somente em Testes de Perícia', () => {
  assert.match(ficha, /habilidadesAtivas=\{habilidadesAtivasIds\}/);
  assert.match(ui, /codeVeronicaAtiva = escopo === 'testes' && tipo === 'pericia'/);
  assert.match(ui, /const existeVantagem = vantagem === 'vantagem' \\|\\| codeVeronicaAtiva \\|\\| parrudoAtivo/);
  assert.match(ui, /naturalDe2a9Como10: codeVeronicaAtiva/);
  assert.match(ui, /CODE VERONICA: Vantagem automática em Testes de Perícia/);
});


test('PARRUDO concede Vantagem somente em Testes de Fortitude', () => {
  assert.match(ficha, /habilidadesAtivas=\{habilidadesAtivasIds\}/);
  assert.match(ui, /parrudoAtivo = escopo === 'testes' && tipo === 'pericia' && periciaEfetiva === 'Fortitude' && habilidadesAtivas.includes\('parrudo'\)/);
  assert.match(ui, /PARRUDO: Vantagem automática em Testes de Fortitude/);
});


test('CURIOSA apresenta lembrete contextual sem conceder Vantagem automaticamente', () => {
  assert.match(ui, /curiosaAtiva = escopo === 'testes' && tipo === 'pericia' && habilidadesAtivas.includes\('curiosa'\)/);
  assert.match(ui, /\['Percepção', 'Investigação'\]\.includes\(periciaEfetiva\)/);
  assert.match(ui, /Se a situação cumprir os requisitos, selecione Vantagem manualmente/);
  assert.match(ui, /Uma vez por Descanso Completo, também permite Teste de AST DT 12/);
});


test('Habilidades de combate são passadas à calculadora e exibem lembretes sem presumir contexto', () => {
  assert.match(ficha, /escopo="ataques"[^>]*habilidadesAtivas=\{habilidadesAtivasIds\}/);
  assert.match(ui, /quantoMaisMelhorAtiva = escopo === 'ataques' && habilidadesAtivas.includes\('quanto-mais-melhor'\)/);
  assert.match(ui, /Confirme a circunstância com a Mesa e selecione Vantagem manualmente/);
  assert.match(ui, /armeiroAtivo = escopo === 'ataques' && habilidadesAtivas.includes\('armeiro'\)/);
  assert.match(ui, /informe o bônus no modificador manual/);
  assert.match(ui, /ARMEIRA AUTODIDATA: Armas de Fogo modificadas causam \+1d4 de Dano por Peça Extra instalada/);
});


test('Habilidades de combate adicionais exibem lembretes sem automatizar ação ou geometria', () => {
  assert.match(ui, /cascaGrossaAtiva = escopo === 'ataques' && habilidadesAtivas.includes\('casca-grossa'\)/);
  assert.match(ui, /Dano Desarmado ou de Coronhada sobe uma categoria de Dado/);
  assert.match(ui, /não registra usos por turno/);
  assert.match(ui, /armamentoEspecialAtivo = escopo === 'ataques' && habilidadesAtivas.includes\('armamento-especial'\)/);
  assert.match(ui, /nunca abaixo de Interação Gratuita com Objeto/);
  assert.match(ui, /controleDeFogoAtivo = escopo === 'ataques' && habilidadesAtivas.includes\('controle-de-fogo'\)/);
  assert.match(ui, /até 6 espaços conectados entre si/);
});


test('ANATOMIA DE COMBATE apresenta procedimento de Medicina e Vantagem no próximo Ataque', () => {
  assert.match(ui, /anatomiaDeCombateAtiva = escopo === 'ataques' && habilidadesAtivas.includes\('anatomia-de-combate'\)/);
  assert.match(ui, /ANATOMIA DE COMBATE: como Ação Bônus, faça Medicina DT 15/);
  assert.match(ui, /Vantagem no próximo Ataque contra ele, utilizável até o fim do seu próximo turno/);
  assert.match(ui, /a Ficha não acompanha o alvo nem a duração do benefício/);
});

test('GOLPE SUJO apresenta as três opções sem executar Manobras ou aplicar Condições', () => {
  assert.match(ui, /golpeSujoAtivo = escopo === 'ataques' && tipo === 'ataque-corpo'/);
  assert.match(ui, /após causar Dano Corpo a Corpo, você pode gastar Movimento para tentar Derrubar/);
  assert.match(ui, /Pisão contra alvo Caído acrescenta 1 Dado ao Ataque Desarmado/);
  assert.match(ui, /Cabeçada é Ataque Desarmado/);
  assert.match(ui, /a calculadora não executa as Manobras nem aplica Condições/);
});


test('AMBIDESTRIA apresenta Ataque adicional com Pistola 9 mm na outra mão', () => {
  assert.match(ui, /ambidestriaAtiva = escopo === 'ataques' && tipo === 'ataque-distancia' && habilidadesAtivas.includes\('ambidestria'\)/);
  assert.match(ui, /AMBIDESTRIA: se estiver empunhando uma Pistola 9 mm em cada mão/);
  assert.match(ui, /Ataque adicional com a outra como Ação Bônus, uma vez por turno/);
  assert.match(ui, /Esse Ataque adiciona AGI ao Dano normalmente/);
  assert.match(ui, /a Ficha não controla armas nas mãos nem limita o uso por turno/);
});


test('Origem Lutador e Casca-Grossa aplicam categorias de Dano em ataques universais', async () => {
  const progressao = await readFile(new URL('../src/progressaoDano.ts', import.meta.url), 'utf8');
  assert.match(ui, /categoriasAtaqueUniversal\(origem, cascaGrossaAtiva, perfilCorpo\.id\)/);
  assert.match(ui, /aumentarCategoriaDano\(formulaDanoBase, categoriasDanoUniversal\)/);
  assert.match(ui, /LUTADOR: Ataque Desarmado e Arma Improvisada sobem automaticamente uma categoria/);
  assert.match(ui, /acumula com Casca-Grossa no Ataque Desarmado/);
  assert.match(ui, /Em Coronhada, aplique a categoria manualmente/);
  assert.match(progressao, /origem === 'Lutador'/);
  assert.match(progressao, /perfilId === 'universal-ataque-desarmado'/);
});


test('multiplicador de Crítico só pode ser aplicado por 20 natural ou 19 natural com margem ampliada confirmado pela Mesa', () => {
  assert.match(ui, /const resultadoAtaqueCritico = escopo === 'ataques' && calculado\.resultado\?\.dadoEscolhido === 20/);
  assert.match(ui, /const permiteConfirmacaoCritico19 = escopo === 'ataques' && limiteCritico === 19/);
  assert.match(ui, /calculado\.resultado\?\.dadoEscolhido === 19 && calculado\.resultado\.total !== null/);
  assert.match(ui, /criticoDanoAplicado = resultadoAtaqueCritico \|\| \(permiteConfirmacaoCritico19 && criticoDano\)/);
  assert.match(ui, /A Mesa confirmou que o total do 19 natural alcançou a Defesa/);
  assert.doesNotMatch(ui, /Aplicar Acerto Crítico \(×\{multiplicadorCriticoDano\}\)/);
});

test('alterar os dados ou o total da rolagem invalida a confirmação manual de Crítico', () => {
  assert.match(ui, /setDado1\(evento\.target\.value\); setDadosConfirmados\(null\); setCriticoDano\(false\)/);
  assert.match(ui, /setDado2\(evento\.target\.value\); setDadosConfirmados\(null\); setCriticoDano\(false\)/);
  assert.match(ui, /calculado\.resultado\?\.total, perfilSelecionado\?\.id, valorTeste, modificador/);
  assert.match(ui, /critico: criticoDanoAplicado && !ataqueEmArea/);
});


test('Mirar aplica +2 somente no Teste de Ataque e preserva Desvantagem', () => {
  assert.match(ui, /mirarPreparado\?: boolean/);
  assert.match(ui, /const bonusMirar = escopo === 'ataques' && mirarPreparado && !ataqueEmArea \? 2 : 0/);
  assert.match(ui, /const valorTeste = valorTesteBase \+ bonusMirar/);
  assert.match(ui, /existeDesvantagem = vantagem === 'desvantagem' \|\| desvantagemBI \|\| desvantagensCondicao\.length > 0 \|\| desvantagemDesarmado/);
  assert.match(ui, /Mirar ativo: \+2 no Teste de Ataque/);
  assert.match(ui, /não aumenta Dano, não remove Desvantagem e não torna possível um Ataque impossível/);
});

test('Mirar exige informar a região específica antes de confirmar a rolagem', () => {
  assert.match(ui, /Região específica escolhida no alvo/);
  assert.match(ui, /(!mirarPreparado \|\| Boolean\(regiaoMirada\.trim\(\)\))/);
});

test('Ataque normal pode ser registrado sem Mirar e libera o requisito de Duas Armas', () => {
  assert.match(painel, /!economia\.turnoEmAndamento \|\| economia\.normaisUsados\.acao/);
  assert.match(painel, /Registrar Ataque · consome Mirar/);
  assert.match(painel, /Registrar Ataque · Ação/);
  assert.match(painel, /registrarAtaque\)\.estado/);
  assert.match(ficha, /mirarPreparado=\{estadoTurnoCombateAtual\.valido && estadoTurnoCombateAtual\.estado\.manobras\.mirarPreparado\}/);
});


test('Mirar informa o bônus também nos modos Misto/Manual e identifica região no resultado automático', () => {
  assert.match(painel, /em Misto\/Manual, aplique \+2 manualmente/);
  assert.match(painel, /Próximo Ataque: \+2 no Teste; escolha uma região específica/);
  assert.match(ui, /Mirar aplicado: \+2 no Teste · Região escolhida:/);
});

test('4ª Fase da BI lembra o +1d4 no Dano Corpo a Corpo sem rolagem automática', () => {
  assert.match(ficha, /danoCorpoACorpoAdicionalBI=\{faseBi\.danoCorpoACorpoAdicional\}/);
  assert.match(ui, /danoCorpoACorpoAdicionalBI\?: string \| null/);
  assert.match(ui, /tipo === 'ataque-corpo' && danoCorpoACorpoAdicionalBI/);
  assert.match(ui, /role \{danoCorpoACorpoAdicionalBI\} adicional de Dano Corpo a Corpo/);
  assert.match(ui, /não se aplica a Ataques à distância e não é rolado automaticamente/);
});
