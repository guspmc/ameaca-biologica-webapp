# Checkpoint paralelo — Ficha, Mesa e Painel do Mestre
**Data:** 05/11/2026  
**Branch:** `feat/offline-first-ficha`

## Ficha do Jogador
- **IMPLEMENTADO:** salvamento LAN serializado, patches aplicados sobre a última versão confirmada, validação de personagem/Mesa e descarte de respostas tardias.
- **IMPLEMENTADO:** geração de sessão para impedir que uma resposta da sessão anterior altere a interface após novo login, inclusive na mesma conta e ficha.
- **TESTE AUTOMATIZADO ACRESCENTADO:** a função de guarda da geração da sessão verifica igualdade estrita e rejeita valores inválidos.
- **PENDENTE:** CI do HEAD atual e reprodução humana do incidente original no navegador real.

## Mesa
- **IMPLEMENTADO:** exclusão de rascunho pelo proprietário, com confirmação na interface.
- **AUTORIZAÇÃO NO SERVIDOR:** exige sessão válida, propriedade do rascunho e vínculo atual como jogador na Mesa; Mestre e terceiros recebem 404. O servidor confirma a exclusão antes de remover o item da lista local.
- **TESTE AUTOMATIZADO ACRESCENTADO:** nega exclusão por terceiro e Mestre, permite exclusão pelo jogador proprietário e confirma que a leitura/listagem não retorna o rascunho excluído.
- **PENDENTE:** executar CI e teste humano do fluxo na interface. Exclusão não se aplica a personagens ativas/arquivadas: o servidor LAN atual persiste somente rascunhos.

## Painel do Mestre
- **IMPLEMENTADO:** extraído o bloco administrativo da conexão LAN para `src/PainelMestreLocal.tsx`, com contexto explícito de Mesa e papel Mestre.
- **FUNCIONALIDADES CONECTADAS:** gerar/renovar e revogar convite; consultar solicitações; aprovar/recusar ingresso; copiar código.
- **SEGURANÇA:** o componente não concede autorização por si. As operações continuam usando as rotas autenticadas do servidor, que validam papel e vínculo.
- **PENDENTE:** resumo operacional de personagens ativas. Não há ciclo LAN de ativação nem fonte de personagens ativas no servidor; rascunhos não serão exibidos como ativos. O painel não recebe fichas completas.

## Commits desta rodada
- `63364bb`, `e229b9b`, `7ba193a`, `e907143`, `63dcd9e`: guarda de respostas tardias e isolamento por geração de sessão.
- `c58debd`, `8624615`, `1a148e9`, `3c3e4f7`: exclusão autorizada de rascunhos e integração na Mesa.
- `d825897`, `4cdcc6a`: componente administrativo do Painel do Mestre e integração na conexão LAN.

## Limites preservados
Nenhuma alteração em `main`, merge, publicação, Supabase remoto ou banco de produção. Nenhum teste de navegador/rede/dispositivo foi realizado. A autenticação continua por e-mail e a sessão do cliente continua apenas em memória; a migração para nickname e persistência de sessão não foi iniciada. O protótipo LAN permanece restrito a dados fictícios em rede privada confiável, pois não tem proteção de transporte.

## Continuidade após o checkpoint
- **Ficha:** consultas assíncronas de abrir ficha e sincronizar Mesa/listas agora descartam respostas e erros de sessões anteriores.
- **Mesa:** atualização de Mesas, convites, solicitações e ingresso passaram a validar a geração da sessão antes de alterar a interface.
- **Painel do Mestre:** aprovação/recusa de solicitação também está vinculada à geração da sessão; respostas antigas não atualizam a lista de participantes/solicitações após novo login.
- **Teste cliente HTTP:** o fluxo integrado agora também testa exclusão de rascunho pelo cliente LAN e confirmação de 404 na leitura posterior.
- **CI:** workflows do commit `521b78d` concluíram com sucesso. Os workflows das alterações seguintes estão em execução/na fila; validar o HEAD atual antes de considerar a rodada aprovada.

## Continuidade — gestão de participantes e fechamento da fronteira de sessão
- **Mesa/Painel do Mestre:** adicionadas rotas LAN para listar participantes autorizados e remover um jogador. A listagem retorna somente ID interno, papel e data de entrada; não expõe e-mails ou dados de conta.
- **Autorização:** qualquer membro pode consultar a lista; somente Mestre da própria Mesa pode remover; Jogador não pode remover a si mesmo nem terceiros; Mestre não pode remover a própria conta. A exclusão da participação ocorre em transação e a FK elimina os rascunhos associados. O servidor notifica a Mesa e a conta removida.
- **Interface:** o Painel do Mestre permite consultar participantes e remover jogador após confirmação explícita, informando que os rascunhos serão excluídos. A identificação visual é ordinal ("Jogador 1", etc.) porque o login atual ainda usa e-mail e a migração aprovada para apelido não foi iniciada.
- **Realtime:** sincronização recebida pelo Mestre agora atualiza também a equipe da Mesa.
- **Ficha/Mesa:** proteção por geração foi estendida à criação de Mesa, consulta/criação de rascunhos e logout.
- **Testes:** novo teste de integração cobre listagem sem exposição de e-mail, isolamento de terceiros, bloqueio de auto-remoção pelo jogador, remoção pelo Mestre, revogação de acesso e exclusão em cascata dos rascunhos.
- **CI:** a execução offline de `37cec88` concluiu com sucesso. Os workflows posteriores ainda precisam concluir para validar o HEAD atual.

- **Privacidade do Painel:** a API de solicitações deixou de retornar e-mail do solicitante; a interface apresenta apenas uma ordem de solicitação. O teste de integração confirma que a resposta não contém e-mail.
- **Validação pendente:** os workflows do HEAD `409cf0f` estão executando; a fila do GitHub está lenta e ainda não há resultado final desta rodada.

## Continuidade — limite de jogadores e salvamento via proxy LAN
- **Mesa:** o servidor já contava jogadores na aprovação dentro de `BEGIN IMMEDIATE`; o limite de 10 estava implementado, mas sem teste de integração específico no servidor LAN.
- **Teste novo:** `tests/servidor-local.test.mjs` simula duas aprovações concorrentes com nove jogadores existentes. Resultado esperado: uma aprovação HTTP 200, uma rejeição HTTP 409, exatamente dez jogadores e uma solicitação preservada como pendente.
- **Ficha:** `tests/lan-proxy-integration.test.mjs` agora percorre criação, PUT de atualização e reabertura de rascunho pelo proxy same-origin do Vite em modo LAN. Verifica revisão incrementada e preservação de duas seções independentes.
- **Diagnóstico de salvamento:** inspeção confirmou que o cliente em modo LAN usa `window.location.origin`, portanto chama `/api/personagens/:id` pelo proxy same-origin; a camada HTTP transforma exceções de rede em mensagem genérica. O teste de integração foi ampliado para verificar esse trajeto, mas ainda não reproduz o erro do ambiente Windows/celular do usuário. Causa raiz continua **PENDENTE**; não declarar o incidente corrigido.
- **CI:** workflows do commit `20b51e8` ainda estavam em execução no momento deste checkpoint.

## Atualização de continuidade — HEAD 011a5a2
- **HEAD confirmado:** `011a5a20f731e608bd04f7502793fbe3a6fd6586` na branch `feat/offline-first-ficha`.
- **CI CONFIRMADA:** em 05/11/2026, os dois workflows desse SHA concluíram com `success`: “Validar compilação do WebApp” (run `42125680264`) e “Verificação da ficha offline” (run `42125680289`).
- **Correção de fixture:** o teste de concorrência do limite de jogadores passou a preparar contas e sessões diretamente no SQLite temporário de teste, evitando acionar repetidamente o endpoint público de cadastro e seu limitador antiabuso. A mudança é restrita ao teste; não altera autenticação de produção.
- **Teste de concorrência da Mesa:** cobre duas aprovações simultâneas com nove jogadores já presentes; espera uma resposta 200, uma 409, dez jogadores no total e uma solicitação ainda pendente.
- **Teste do proxy LAN:** percorre criação, atualização e reabertura de rascunho por `/api` same-origin através do proxy Vite; verifica incremento de revisão e preservação de seções independentes. Também verifica a conexão WebSocket pelo proxy.
- **Diagnóstico do salvamento — PENDENTE:** a rota de rede e a persistência foram exercitadas automaticamente, mas a causa do erro originalmente observado no ambiente Windows/celular ainda não foi reproduzida. A mensagem genérica de falha de rede continua ocultando a causa técnica original; não declarar o incidente corrigido.
- **Limites preservados:** nenhum teste humano de navegador/dispositivo/rede; nenhum deploy, merge, alteração em `main` ou modificação do Supabase.


## Atualização de continuidade — diagnóstico de transporte e CI do HEAD 76abe2b
- **HEAD confirmado:** `76abe2bed8203ae23ca3aeb5f56edb986aa3471b` na branch `feat/offline-first-ficha`.
- **CI CONFIRMADA:** os dois workflows do HEAD concluíram com sucesso: “Validar compilação do WebApp” (run `42132268730`) e “Verificação da ficha offline” (run `42132268735`). Os commits intermediários `74efc34` e `a24987d` também tiveram ambos os workflows concluídos com sucesso.
- **Diagnóstico de salvamento — IMPLEMENTADO:** quando o `fetch` falha antes de receber resposta HTTP, `ErroServidorLocal` preserva apenas nome e mensagem da exceção, limitados em tamanho, sem cabeçalhos ou token. A interface de salvamento apresenta esse detalhe junto da mensagem amigável. Respostas HTTP de erro continuam sendo tratadas separadamente, sem serem classificadas como falha de transporte.
- **TESTE AUTOMATIZADO:** o cliente HTTP tem teste para rejeição do fetcher com `TypeError('Failed to fetch')`, verificando status 0, mensagem amigável e diagnóstico preservado. CI verde no HEAD.
- **LIMITE IMPORTANTE:** isso melhora a observabilidade; não corrige nem comprova a causa raiz do incidente de salvamento. A reprodução em navegador/Windows/celular permanece pendente, conforme decisão de adiar testes humanos.
- **Próximo trabalho:** continuar a cobertura automatizada da fila de salvamento e avançar em paralelo nas áreas de Mesa/Painel e ficha onde não houver decisão de cânone pendente. QR foi aprovado funcionalmente, mas o projeto ainda não contém biblioteca de QR; qualquer inclusão deve ser pequena e validada no lockfile/CI antes de integrar.
- **Limites preservados:** sem deploy, merge, alteração em `main`, Supabase ou banco de produção; testes humanos continuam adiados.
