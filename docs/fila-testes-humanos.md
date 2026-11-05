# Fila única de testes humanos — 23/10/2026

> Roteiro atual consolidado: [testes-humanos-pendentes.md](testes-humanos-pendentes.md). As seções abaixo preservam o histórico; instruções antigas podem já estar concluídas.

**Estado atual em 26/10/2026:** T18 e MC7.1–MC7.8 aprovados, conforme [resultado escrito](resultado-t18-mc7-parcial-2026-10-26.md). MC7.9 e MC7.10 não confirmados. PC **10/10 T19**, [roteiro](rodada-retomada-pc-2026-10-26.md); celular **10/10**, duas pendências MC7 e oito novas MC8, [fila completa](fila-celular-retomada-2026-10-26.md). Aguardar resultados antes de ampliar.

As confirmações anteriores de Gus permanecem registradas: Origens, Perícias, Habilidades, kits, identidade, flexões, busca, simulação, privacidade dos rascunhos e janela estreita. Não repetir sem mudança relevante.

## 1. Disponível agora: painel fictício, sem banco
Abrir http://127.0.0.1:4174/ameaca-biologica-webapp/tests/ui/disponibilidade.html
1. Antes de Atualizar: nenhum controle de liberação deve aparecer.
2. Atualizar disponibilidade: seis itens inicialmente bloqueados.
3. Liberar Faca: somente Faca muda para Liberado. Bloquear: volta a Bloqueado.
4. Simular falha na próxima operação e tentar liberar: mostrar falha e exigir Atualizar; depois de atualizar, Faca continua bloqueada.
5. Conferir janela estreita: nomes, estados e botões legíveis.
6. F5 reinicia esta fixture; isso é esperado. Ela não prova persistência real, autorização ou uso entre contas.

## 2. Após checkpoint de disponibilidade no TESTE
Não executar enquanto as novas funções não forem aplicadas e conferidas, painel conectado e itens especificamente liberados numa Mesa fictícia.
1. Mestre configura um item na própria Mesa; outra Mesa permanece inalterada.
2. Jogador não pode configurar disponibilidade; chamadas não autorizadas devem falhar.
3. Jogador salva plano permitido da opção C; F5 e reabrir preservam compras, moedas e grade.
4. Repetir pedido de compra sem duplicação. Alterar duas sessões da mesma personagem: plano diferente com revisão antiga deve falhar e manter a prévia local.
5. Bloquear item preserva plano existente, mas recusa nova gravação que ainda contenha item bloqueado. Limpar plano e salvar continua permitido.
6. Trocar kit com compras não vazias: recusa. Limpar e salvar antes: troca permitida.
7. Mestre e outra conta continuam sem acesso ao rascunho.
8. Celular físico: navegação e botões legíveis. Acesso ao servidor local pela rede ainda não foi aberto.

## Evidências e limites
50 testes locais passaram, incluindo PostgreSQL em memória, transporte simulado e renderização estática. Não substituem estes cliques. O painel fictício nunca usa Supabase, Auth ou armazenamento; F5 zera os dados. Concorrência de compra foi validada sequencialmente, sem prova de sobreposição de conexões.

Relatórios: relatorio-compras-integradas.md e relatorio-disponibilidade-local.md.


## Atualização: checkpoint aplicado e painel conectado

Gus confirmou o painel fictício com capturas: liberar/bloquear e falha simulada funcionaram. Esse teste está concluído. As duas funções já foram aplicadas e verificadas somente no TESTE, sem liberar itens. A seção 2 acima agora está disponível para execução humana. Abrir a prévia principal, selecionar uma Mesa fictícia em Participantes e usar o painel do Mestre. Nenhum acesso de celular pela rede foi aberto. Suíte atual: 52 testes aprovados. Relatório: relatorio-disponibilidade-integrada.md.


## Atualização: rodada de compra e bloqueio confirmada

Gus confirmou compra permitida e bloqueio de nova compra na mesma Mesa, com Faca salva preservada na grade (uma Faca, duas moedas, 4/5 Espaços). Mestre sem acesso ao rascunho também confirmado. Não repetir esses casos.
Próxima conferência: F5, abrir Revisão da criação e comparar compras/saldo/espaços com a grade. Alterações ainda não salvas não devem mudar a revisão. Persistem conflito de duas sessões, limpeza/troca de kit e celular. Relatório: relatorio-revisao-compras.md.


## Atualização: revisão visual confirmada e navegação enfileirada

Gus confirmou e mostrou Compras do Personalizado sem compras, 3/3 moedas, 3/5 espaços e equipamento inicial consistente. Conferência visual anterior concluída.
Novo item opcional da rodada agrupada: conferir resumo no topo da revisão e o atalho Habilidade Básica pendente, que deve levar a Características. Sem repetir compras, bloqueio ou limpeza. Caso inicial de plano vazio/revisão 0 agora é conferido sem exigir salvamento que não muda a versão. Relatório: relatorio-resumo-revisao.md.


## Atualização: atalhos aprovados; prévia de funcionamento enfileirada

Gus confirmou explicitamente que os atalhos levam às seções exatas. Resumo, navegação e plano vazio encerrados.
Nova rodada agrupada: na revisão, abrir Funcionamento da ficha; verificar Misto com três habilitados e BI/Durabilidade a definir; mudar uma opção, alternar Manual e voltar Misto (opção preservada); Automático habilita todos os controles da prévia; F5 descarta escolhas locais e não altera recursos. Não há salvamento ou automação real nesta prévia. Ver relatorio-funcionamento-previo.md.


## Atualização: F5 da prévia confirmado; persistência preparada localmente

Gus confirmou que F5 retorna ao Misto na prévia e enviou controles visíveis nos três modos. Próximo roteiro depende de checkpoint e integração da persistência; não testar salvamento remoto ainda. Passos futuros completos em contrato-persistencia-funcionamento.md. Continuam pendências independentes anteriores, sem repetir casos aprovados.


## Atualização: preferências agora salvas no TESTE

Checkpoint aplicado e smoke remoto aprovado; Salvar Preferências conectado somente no modo teste. Rodada humana disponível: salvar Manual/F5; voltar Misto e conferir escolhas preservadas; salvar Misto/F5; outra ficha independente; alterações sem salvar descartadas no F5. Recursos e inventário não mudam. Conflito entre sessões e celular continuam enfileirados. Roteiro detalhado: relatorio-funcionamento-integrado.md.


## Atualização: preferências persistidas aprovadas; preparação local do inventário

Gus respondeu Funciona. Comprovado. ao roteiro de salvar/F5, alternar modos preservando opções e conferir outra ficha independente. Rodada de persistência encerrada.
O planejador de instâncias iniciais do inventário está somente em módulo local e testes; nenhum teste humano novo é solicitado. Rodada de inventário ativo será agrupada ao final da integração autorizada. Conflito real entre sessões, troca de kit e celular seguem enfileirados conforme relevância da próxima etapa. Relatório: inventario-criacao-instancias.md.


## Persistência interna do inventário — somente preparação local

Protótipo transacional privado preparado e testado localmente. Nenhum teste humano novo solicitado; manter integração de inventário/ativação, duas contas, resposta interrompida e celular na rodada única ao final. Nenhuma operação remota nesta etapa. Ver inventario-persistencia-local.md.

## Atualização: rodada T1–T4 respondida em 23/10/2026

Gus aprovou T1, T2, T3 e T4 e enviou capturas. T1 mostra conflito de preferências recusado sem perder a escolha local; T3 mostra recusa da troca com compras, seguida de limpeza e troca aceita; T4 confirma descarte do que não foi salvo.

Em T2, Gus relata atualização imediata de B após compras em A, sem erros. Registrar como fluxo/sincronização aprovado, não como prova de uma compra com revisão antiga recusada. A prova controlada desse conflito permanece uma cobertura técnica distinta; nenhuma repetição humana imediata foi solicitada.

Celular não executado por indisponibilidade de acesso à prévia local. A captura da falha de abertura não valida layout ou interação da ficha. Não houve abertura de rede nem publicação. Relatório: [resultado-testes-humanos-2026-10-23.md](resultado-testes-humanos-2026-10-23.md).

## Preparação de ativação e resumo — sem novos cliques humanos

Ativação transacional interna, revisão integral e proposta de resumo operacional foram preparadas e testadas em banco local descartável. Nenhuma alteração remota ou nova funcionalidade de interface nesta etapa. Não repetir T1–T4 agora. A rodada de ativação/resumo, inventário em uso e celular será agrupada quando a integração estiver disponível e autorizada. Limites e próximos passos em [ativacao-sql-local.md](ativacao-sql-local.md).

## Continuação em 24/10: ciclo local e rodada fictícia T5–T9 enfileirada

Arquivamento, retomada, saída e limpeza de rascunhos preparados e testados somente em PostgreSQL local descartável, preservando instâncias e recursos. Sem operação remota nova, integração de ciclo ou alteração de dados humanos.

Página fictícia em `tests/ui/ativacao.html`, sem Supabase/Auth/armazenamento. Enfileirados **T5 confirmação/resumo; T6 pendências/teto; T7 revisão antiga; T8 falhas/repetição; T9 recusa/reinício/janela estreita**. Passos no topo do [roteiro consolidado](testes-humanos-pendentes.md). Sem obrigação de executar agora ou repetir casos aprovados.

106 testes, TypeScript e compilação aprovados localmente. Navegador conferido em desktop e largura emulada de 390 px; celular físico pendente. Acesso será avaliado depois, conforme pedido de Gus; sem abertura de rede. Limites em [ciclo-e-interface-local.md](ciclo-e-interface-local.md).

## Resultado em 24/10: T5–T9 aprovados por Gus

Gus confirmou os cinco casos explicitamente e enviou treze capturas: confirmação/resumo, pendências/lotação, revisão antiga/nova conferência, falhas antes/depois da gravação simulada sem duplicação, recusa/recuperação do resumo e janela estreita no PC. Também confirmou o roteiro T9 completo, cujo F5 não tem captura própria nesta mensagem.

Rodada da simulação encerrada; não repetir sem mudança relevante. Celular físico continua pendente de acesso adequado. Integração remota, ciclo real e concorrência não são aprovados por estes resultados. Nenhuma autorização complementar de banco ou publicação inferida. Registro completo em [resultado-testes-humanos-2026-10-24.md](resultado-testes-humanos-2026-10-24.md).

## Continuação: contrato de transporte preparado, sem nova rodada executável

Módulo RPC desconectado com validação de conferência/recibo/resumo, argumentos mínimos e recuperação pelo mesmo pedido. Não consulta na criação, não faz repetição automática e não altera a simulação aprovada ou aplicação conectada. Oito testes novos de transporte simulado; relatório em [contrato-integracao-ativacao.md](contrato-integracao-ativacao.md).

T10 (ativação integrada/resultado após F5), T11 (privacidade e troca de contexto) e T12 (celular físico) enfileirados como **condicionados e indisponíveis**. Precisam de implementação/checkpoint/acesso antes de qualquer execução. Sem solicitação humana agora e sem repetição de T5–T9.

## Continuação: recuperação e proteção de contexto preparadas localmente

Controlador com armazenamento mínimo injetado, pedido preservado antes do envio, consulta antes da repetição e descarte de respostas de contexto encerrado. Outro controlador ignora respostas de Mesa/sessão anterior, inclusive A→B→A e atualizações fora de ordem. Doze ensaios novos usam memória/callbacks simulados; não certificam F5 ou sessão no aplicativo conectado.

T10/T11 receberam os casos futuros de falha de armazenamento e respostas atrasadas, mas continuam indisponíveis. T5–T9 não precisam ser repetidos e celular permanece para depois. Limites e validações em [recuperacao-e-contexto-local.md](recuperacao-e-contexto-local.md).

## Nova rodada concreta: T13 — recuperação e contexto na fixture

Consulta autorizada de recibo ensaiada em PostgreSQL local, transporte ligado à página fictícia `tests/ui/recuperacao.html`. Agora é possível conferir F5 sem duplicar conjunto, recuperação sem referência local, falha de armazenamento e respostas atrasadas, sem banco ou contas reais.

T13.1–T13.6 disponíveis em [teste-humano-recuperacao.md](teste-humano-recuperacao.md). T5–T9 permanecem aprovados; T10–T12 continuam futuros/condicionados. Somente T13 está sendo apresentado para a próxima rodada humana; o acesso físico pelo celular fica para depois. Relatório e limites em [consulta-resultado-e-qa.md](consulta-resultado-e-qa.md).

## 25/10/2026 — ampliação autorizada para dez casos

Gus pediu mais quatro interações humanas, totalizando dez. Acrescentados T13.7–T13.10 na mesma simulação isolada: consulta recusada, recibo inválido, completa sem recibo e resultado de outro pedido. T13.1–T13.6 continuam pendentes; não dependem destas novas confirmações. T10–T12 futuros continuam separados. Validação técnica: 141 testes, TypeScript, compilação e os quatro fluxos no navegador. Relatório: [rodada-recuperacao-ampliada-2026-10-25.md](rodada-recuperacao-ampliada-2026-10-25.md). Sem alterações remotas; mudanças salvas localmente sobre 7fbfc8c, sem novo commit nesta etapa.

## 25/10/2026 — T13 encerrado e continuação local

Gus confirmou T13.1–T13.10 e enviou 33 capturas. Todos os dez casos foram encerrados; evidências preservadas com SHA-256 fora do Git. Resultado: [resultado-testes-humanos-2026-10-25.md](resultado-testes-humanos-2026-10-25.md). T10–T12 permanecem condicionados à integração/acesso, celular físico pendente. Preparado ciclo local de seleção/encerramento da recuperação, sem alterar login ou aplicação conectada: [sessao-recuperacao-local.md](sessao-recuperacao-local.md). 145 testes aprovados. Nenhuma nova interação humana executável foi criada nesta etapa.

## 25/10/2026 — protocolo até dez e gateway local

Gus confirmou continuidade autônoma com até dez casos humanos, sem contar celular e com interrupção antecipada apenas por necessidade indispensável. Protocolo consolidado em [protocolo-autonomia-supervisionada.md](protocolo-autonomia-supervisionada.md). Gateway local de conferência/confirmação preparado e oito novos ensaios SQL aprovados; suíte total 153. Sem integração remota ou mudança na interface conectada. Fila executável nova: 0/10. [Relatório e limites](gateway-ativacao-local.md).

## 25/10/2026 — contexto de criação e quatro casos enfileirados

Preparadas leitura e gestão explícita do contexto Padrão nível 1, somente localmente. Pausar novas finalizações não encerra a Mesa ou altera rascunhos. Preparação de Mesa legada com personagens é recusada; sem mudança de método sem votação. 164 testes locais aprovados; simulação conferida no navegador. Fila 4/10: T14.1–T14.4, pendentes para rodada posterior. [Roteiro](teste-humano-contexto.md) e [relatório](contexto-criacao-local.md). T13 encerrado; celular fora da contagem; nada aplicado remotamente.

## 25/10/2026 — composição local do fluxo

T14.1–T14.4 permanecem pendentes. Acrescentados T15.1–T15.3, somente simulação em memória: confirmação explícita/reabertura, pausa e recuperação de resposta perdida sem segundo envio. Roteiro: [teste-humano-fluxo.md](teste-humano-fluxo.md). Fila executável 7/10; pode aguardar. T13 não reaberto; T10–T12 e celular separados. Nenhuma integração remota nesta etapa.

## 25/10/2026 — fila fechada em dez casos

Adicionados T15.4–T15.6: falha antes da gravação/repetição explícita, revisões divergentes com referência preservada e falha de armazenamento sem envio. Fila executável 10/10: quatro T14 e seis T15. Índice: [rodada-10-testes-locais.md](rodada-10-testes-locais.md). Aguardar rodada humana antes de ampliar. Celular fora da contagem; T13 permanece encerrado. Nenhuma mudança remota.

## 25/10/2026 — T14 e T15 aprovados por Gus

Confirmação explícita dos dez casos T14.1–T14.4 e T15.1–T15.6, com 30 capturas originais preservadas fora do Git e índice SHA-256. Resultado: [resultado-testes-humanos-t14-t15-2026-10-25.md](resultado-testes-humanos-t14-t15-2026-10-25.md). Rodada encerrada; fila executável atual 0/10. Não repetir sem mudança relevante. T13 preservado como aprovado; T10–T12 e celular continuam separados. Aprovação somente das simulações, sem autorização de integração remota, publicação ou merge.

## 26/10/2026 — preparação para celular físico

Prévia estática de interfaces fictícias preparada e servida em IPv4 privado, sem firewall ou publicação externa. MC1–MC4 em [teste-celular.md](teste-celular.md), fora da fila comum, que permanece 0/10. Acesso do aparelho ainda não confirmado; teste no PC não certifica conectividade/toque/teclado/rotação. T14/T15 continuam aprovados. Relatório: [previa-celular-local.md](previa-celular-local.md).


## 05/11/2026 — nova fila: prioridade 1 LAN e salvamento de rascunho

Por orientação do Gus, continuar primeiro as pendências técnicas e agrupar os testes humanos para o final, antecipando apenas validações críticas. Não solicitar execução enquanto a preparação técnica e a auditoria de segurança não estiverem concluídas.

### H1 — acesso do navegador ao servidor local (CRÍTICO; bloqueia encerramento da prioridade 1)

**Pré-requisitos técnicos:** CI aprovado no commit `99bffe2`; correções CORS PUT/DELETE e declaração `targetAddressSpace` implementadas. Falta confirmar o fluxo no Chrome real. O teste deverá usar apenas conta/Mesa/personagem fictícias e rede privada confiável; o servidor ainda usa HTTP sem TLS.

Casos a agrupar:
1. Iniciar o frontend de desenvolvimento e o servidor Node com bind LAN explícito; informar no formulário o IP LAN real do PC servidor, não `localhost` quando o alvo for a interface de rede.
2. Confirmar se o Chrome apresenta a solicitação de acesso à rede local quando aplicável; conceder e verificar a saúde do servidor. Registrar origem, destino, prompt e resultado, sem capturar tokens.
3. Recusar a permissão em perfil/janela de teste isolada e confirmar que o app apresenta erro compreensível, sem declarar conexão ou salvamento concluído; depois conceder a permissão e repetir.
4. Cadastrar/entrar com conta experimental, criar Mesa e personagem rascunho, abrir a ficha, alterar um campo e salvar.
5. Confirmar que a interface só informa confirmação após resposta do servidor; atualizar a página, autenticar novamente e reabrir o rascunho para verificar o valor persistido.
6. Com o servidor parado ou inacessível, tentar salvar uma alteração e confirmar que a interface não anuncia sucesso nem perde silenciosamente a edição local. Reiniciar o servidor e repetir conscientemente.
7. Confirmar no terminal do servidor que a requisição PUT chega; correlacionar método/status sem registrar cabeçalhos de autorização ou tokens.
8. Abrir o mesmo rascunho em duas sessões/dispositivos. Salvar uma alteração na sessão A; tentar salvar uma alteração feita na versão antiga da sessão B. O servidor deve recusar a versão desatualizada com conflito, sem substituir o conteúdo confirmado em A; a edição local de B deve permanecer disponível para revisão e a ficha deve ser reaberta/atualizada antes de nova tentativa.

**Limite:** a sessão ainda é mantida somente em memória no navegador. F5/fechamento encerra o estado de autenticação do cliente; isso é uma divergência conhecida da prioridade 2 e não deve ser confundida com falha de persistência do rascunho. Não testar recuperação de sessão nesta rodada.

### H2 — autenticação e sessão local (depois da correção da prioridade 1)

Enfileirado, ainda sem execução:
- cadastro/login com nickname exclusivo, sem e-mail;
- senha mínima de quatro caracteres, sem regras extras não aprovadas;
- persistência de sessão após recarga e fechamento/reabertura normais;
- logout voluntário, sessão expirada/revogada e troca de endereço do servidor;
- isolamento entre duas contas distintas e rejeição de acesso a Mesa/personagem alheia.

**Bloqueio:** não iniciar implementação nem teste humano antes de encerrar H1 e revisar o contrato de segurança da sessão persistida.

### H3 — convites curtos, QR e remoção de rascunho

Enfileirado após H2:
- convite curto válido, inválido, expirado, revogado e colisão/renovação;
- QR abre a página de login usando o endereço LAN real do servidor, nunca `localhost` no dispositivo remoto;
- remoção de rascunho pelo proprietário, com confirmação;
- tentativa de remoção por outra conta/Mestre e proteção de personagens ativos/arquivados.

**Bloqueio:** a política de alfabeto/tamanho/colisão do convite e a regra de recuperação de conta sem e-mail precisam estar implementadas e cobertas tecnicamente antes da rodada.

### H4 — inventário integrado e dispositivos móveis

Permanece agrupado para etapa posterior, sem antecipar o Baú:
- kits A/B/C, aplicação do plano, salvamento e reabertura;
- falhas e alternância de kit sem sobrescrever estado confirmado;
- operações do inventário ativo quando implementadas;
- navegação contínua, teclado, rolagem, toque, orientação e legibilidade em celular físico.

**Baú:** fora desta rodada; permanece adiado para a integração final via LAN, conforme decisão aprovada.

### Política da fila

Nenhum caso acima está marcado como TESTADO por estar descrito aqui. H1 é o único ponto que poderá interromper o trabalho autônomo antes do fechamento de outras pendências, por ser a validação crítica do caminho de salvamento. H2–H4 serão chamados em rodadas agrupadas quando seus pré-requisitos técnicos estiverem concluídos. Casos já aprovados em rodadas antigas não serão repetidos sem mudança relevante.


### Complemento H4 — funcionalidades da ficha em revisão técnica (05/11/2026)

Foram acrescentados ao protótipo local, ainda sem rodada humana:
- preferências de funcionamento Automático/Misto/Manual, gravadas por personagem e preservando escolhas do Misto;
- cálculo do valor base das Perícias (Atributo associado + Treinamento) e do Passivo;
- exibição da fase de Bio-Infecção a partir de BI atual/máxima, incluindo Colapso Viral; o cálculo não altera BI, não executa efeitos nem inicia Reanimação;
- painel de revisão das escolhas salvas, com contagem de pendências e atalhos para as seções, sem ativar a personagem.

Quando H4 for chamado, acrescentar à rodada:
1. Alterar modo e opções do Misto; salvar, fechar e reabrir a ficha; confirmar persistência e preservação das escolhas ao alternar modos.
2. Conferir valores de Perícia e Passivo em exemplos com diferentes Atributos, Treinamento de Origem e pontos da Classe; confirmar que o Atributo não é somado duas vezes.
3. Conferir BI inicial 0, limites das cinco fases e Colapso Viral com valores de teste; confirmar que a interface apenas apresenta o estado e não aumenta BI, rola dados ou executa Reanimação.
4. Conferir a revisão da criação com ficha incompleta e completa; testar atalhos para Características, Perícias e Inventário; confirmar que a revisão não altera nem ativa a ficha.

**Estado:** funcionalidades implementadas e verificadas automaticamente; testes humanos ainda pendentes. A ativação, o Inventário ativo, o combate operacional e as automações de jogo continuam fora do escopo concluído.


### H4 — complemento: calculadora manual de Testes (05/11/2026)

Foi integrada à seção de Perícias uma calculadora de conferência que recebe resultados de dados físicos, sem gerar rolagens nem registrar resultados. Enfileirar:
5. Teste de Perícia e Teste puro de Atributo; verificar soma do valor-base e modificador.
6. Vantagem e Desvantagem com dois resultados físicos, conferindo melhor/pior face.
7. 20 natural, 1 natural e tarefa Impossível; confirmar sucesso automático, Falha Crítica/Exposto e ausência de rolagem em tarefa impossível.
8. Confirmar que o painel não salva rolagem, não altera PV/SA/BI, não consome itens e não dispara ações.


### H4 — refinamentos alinhados à v2.1 (05/11/2026)

- Perícias: conferir valor total (Atributo + Treinamento) e somente o Passivo normal; a interface deve exibir o lembrete de +5 com Vantagem e -5 com Desvantagem, sem mostrar três valores passivos calculados.
- Bio-Infecção: conferir modificador de Movimento (+3 m nas fases 2–4; -6 m na fase 5), bônus de Testes de Ataque (+2 na fase 3; +3 total na fase 4), +1d4 de Dano Corpo a Corpo na fase 4 e Desvantagem na fase 5; confirmar que a fase não executa os efeitos.
- Calculadora: além dos casos já listados, conferir 20 natural em Teste de Ataque (acerto automático, fecha Reações defensivas normais e causa Crítico) sem tentar resolver automaticamente arma/Dano.
- Método de dados Físicos/Virtuais/Mistos e histórico/visibilidade continuam pendentes; a calculadora atual é somente de entrada manual de dados físicos.


### H4 — complemento: preferências de dados e visibilidade (05/11/2026)

9. Conferir padrão inicial Mistos/Pública; alterar para Físicos, Virtuais e Mistos, bem como Pública/Privada; salvar, fechar e reabrir a ficha e confirmar persistência por personagem.
10. Abrir uma configuração antiga sem os novos campos; confirmar que a interface apresenta Mistos/Pública por normalização, preserva as escolhas de Automação e só grava o formato completo após salvar.
11. Confirmar que mudar a preferência não gera rolagem, não cria histórico e não revela/oculta registros inexistentes. A execução virtual, histórico e privacidade efetiva continuam pendentes do módulo de rolagens.


### H4 — complemento: recursos atuais da ficha (05/11/2026)

Foi integrado ao rascunho o controle manual de PV, PV Temporários, SA e BI. A rodada humana deverá conferir:
12. Em ficha recém-criada e com Classe definida, confirmar PV Atuais e SA Atuais inicializados nos respectivos máximos e BI Atual em 0, conforme a decisão anterior de criação.
13. Aplicar dano com PV Temporários disponíveis: conferir que os Temporários são consumidos antes dos PV Atuais; aplicar cura e confirmar que ela altera somente PV Atuais e não ultrapassa o máximo.
14. Definir novos PV Temporários menores e maiores que o valor atual; confirmar que o maior é conservado, sem soma.
15. Ajustar SA entre 0 e o máximo; tentar ultrapassar os limites e confirmar bloqueio. Ajustar BI até as cinco fases e além do máximo, confirmando apenas a sinalização de Colapso, sem rolagem ou Reanimação automática.
16. Testar ajuste direto, desfazer o último ajuste ainda não salvo, descartar alterações pendentes e salvar/reabrir a ficha nos caminhos offline, Laboratório e servidor local.
17. Alterar Atributos/Classe depois de registrar recursos; confirmar que os valores atuais não são sobrescritos silenciosamente. Se ficarem acima de um máximo reduzido, devem ser preservados e exigir correção explícita antes de salvar.

**Limites conhecidos:** o painel não registra histórico durável de cada ajuste, não oferece Desfazer após confirmação e não implementa Descanso, Reanimação, efeitos, dano de combate ou automações de recursos. Esses fluxos permanecem em etapas posteriores.


### H4 — complemento: Descanso Parcial e Completo (05/11/2026)

Foram integrados controles de descanso à ficha, ainda sem cronômetro, rolagem virtual, gestão de Condições ou usos de Habilidades. Acrescentar:
18. Classe e Dado de Vida: Agente d10, Autodidata d8 e Operador d12. Conferir que o botão Parcial exige resultado físico informado e recusa face fora do dado.
19. Descanso Parcial em Sala de Descanso e Sala Segura: aplicar resultado, conferir PV Atuais até o máximo e preservar SA, BI e PV Temporários; confirmar que Condições não são pausadas.
20. Descanso Completo em Sala de Descanso: restaurar PV e SA, encerrar PV Temporários e preservar BI. Em Sala Segura, confirmar que a ação fica indisponível.
21. Com método Virtual, confirmar que Descanso Parcial não aceita nem presume resultado; com Físicos/Mistos, aceitar somente resultado informado. Descanso Completo não exige rolagem.
22. Reabrir a ficha após cada modalidade e confirmar persistência; verificar que o aplicativo não usa cronômetro, não fiscaliza localização e não atualiza ainda Habilidades, Condições ou progressões.


23. Com qualquer seção da ficha em edição não salva, tentar concluir Descanso Parcial ou Completo; confirmar bloqueio até salvar ou descartar a pendência, evitando que o descanso sobrescreva valores ainda não confirmados.


### H4 — complemento: Reanimação (integrada e aprovada automaticamente; teste humano pendente)

A integração está na branch e a CI passou no commit b246a19322a5195a5b6747680957e9f5953e9f91 (430/430 testes, TypeScript, build Vite e PostgreSQL). Acrescentar à rodada agrupada H4:
24. PV chega a 0: personagem fica Desacordada e a Reanimação aguarda o próximo turno; conferir que nenhum Teste é rolado ou presumido automaticamente.
25. Testes de 0 PV: DT 12, sem modificador salvo regra específica; três sucessos em até cinco tentativas despertam com pelo menos 1 PV. Testar cura recebida durante 0 PV: acumula e só é aplicada ao terceiro sucesso, pelo maior valor entre 1 PV e a cura acumulada.
26. Três falhas em até cinco tentativas no estado de 0 PV: conferir sinalização de morte e encaminhamento ao registro do Mestre, sem que a interface invente consequências adicionais.
27. Primeiros Socorros: registrar o resultado final do Teste de Medicina DT 15; somente sucesso concede Vantagem ao próximo Teste de Reanimação, consumida nesse Teste. Registrar também falha crítica (1 natural): não concede Vantagem e sinaliza Exposto na ficha de quem realizou o Teste, sem aplicar a Condição automaticamente.
28. BI alcança ou ultrapassa o máximo: Colapso Viral inicia Reanimação imediatamente, mesmo com PV restantes; não aguarda o próximo turno.
29. Colapso Viral: três sucessos mantêm a personagem Desacordada e sem transformação até a BI ser reduzida abaixo do máximo; três falhas deixam o retorno como Zumbi Especial pendente para o próximo turno.
30. Origem Cobaia: cada Teste de Reanimação durante Colapso usa Vantagem (dois d20, melhor resultado); confirmar que essa Vantagem não é aplicada à Reanimação por 0 PV.
31. Fechar/reabrir a ficha nos estados em andamento e terminais; confirmar persistência da causa, sucessos, falhas, tentativas, cura acumulada e Vantagem pendente sem misturar os dois tipos de Reanimação.

32. Após concluir uma Reanimação, provocar em teste um novo evento crítico (0 PV ou novo Colapso Viral) e confirmar que um novo processo pode ser iniciado sem reutilizar contadores/cura/Vantagem do anterior. Confirmar também que a interface não apresenta histórico durável que ainda não existe.
