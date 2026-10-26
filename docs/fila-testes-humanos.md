# Fila única de testes humanos — 23/10/2026

> Roteiro atual consolidado: [testes-humanos-pendentes.md](testes-humanos-pendentes.md). As seções abaixo preservam o histórico; instruções antigas podem já estar concluídas.

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
