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
