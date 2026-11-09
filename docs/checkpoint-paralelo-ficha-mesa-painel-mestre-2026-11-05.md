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


## Atualização de continuidade — rodada de 05/11/2026 (após HEAD 76abe2b)
- **CI CONFIRMADA:** os dois workflows concluíram com sucesso nos commits `9c89443`, `1d31188` e `8c6c47d`: compilação do WebApp e verificação da ficha offline. O HEAD `8c6c47d` é o mais recente antes dos testes adicionais desta rodada.
- **Diagnóstico HTTP — TESTADO:** novo caso confirma que resposta HTTP 409 permanece erro de aplicação com status/mensagem originais e sem diagnóstico de transporte; exceção de transporte com mensagem longa tem detalhe limitado a 240 caracteres.
- **Painel do Mestre — CORREÇÃO:** a lista de participantes agora numera jogadores a partir de 1, sem alterar IDs, papéis ou permissões.
- **Ficha — TESTE ADICIONAL:** criado `tests/ficha-continua-sendo-alvo.test.mjs`, cobrindo ficha nula, papel Mestre, troca de Mesa, troca de personagem, geração diferente e gerações inválidas. Isso reforça a proteção contra resposta HTTP tardia reabrir/atualizar ficha errada.
- **CI DO NOVO TESTE:** workflows do commit `21b0550` precisam concluir antes de marcar esta alteração como validada.
- **Próximo passo:** avançar em tarefas independentes e seguras na ficha/Mesa/Painel. QR permanece aprovado como requisito, mas depende da escolha e inclusão controlada de uma biblioteca geradora e da definição técnica do conteúdo/URL LAN; não será improvisado com serviço externo. A migração para apelido também aguarda decisões de normalização, colisões, nomes reservados e recuperação de conta.
- **Testes humanos:** o Gus sinalizou que serão realizados em breve; até lá, não alegar validação em navegador, Windows, celular ou rede física.
- **Limites preservados:** sem deploy, merge, alteração em `main`, Supabase ou banco de produção.


## Continuidade — cobertura da fila de salvamento
- **TESTE ADICIONAL:** `tests/fila-serializada.test.mjs` agora usa uma barreira assíncrona controlada para provar que a segunda gravação não começa enquanto a primeira ainda aguarda confirmação e que `aguardar()` não conclui antes do esvaziamento real da fila.
- **Objetivo:** aproximar o teste unitário da condição de rede lenta que pode ocorrer no salvamento LAN; não substitui teste de integração React nem reprodução no navegador.
- **Commit:** `91b3ceb`; CI ainda pendente.
- **CI:** os workflows dos commits `21b0550` e `b1908c3` ainda estavam em execução na última consulta. O commit mais recente também precisa concluir ambos os workflows.


## Continuidade — retorno dos primeiros testes humanos e correções LAN (05/11/2026)

### Evidência humana recebida
- Inicialização automatizada do servidor LAN: **APROVADA** pelo autor.
- Cadastro/login com o fluxo antigo (e-mail e senha mínima de 12): **FUNCIONOU**, mas revelou divergência com o requisito aprovado de nickname e senha mínima 4.
- Criação de Mesa: **APROVADA**.
- Geração de convite, solicitação de ingresso e aprovação pelo Mestre: **APROVADAS**.
- Recarga da página do Mestre: **REPROVADA** — perdeu a sessão e voltou à etapa de endereço do servidor; após novo login, a Mesa não apareceu na interface.
- Salvamento/recarga da ficha: **INCONCLUSIVO** — os testes seguintes foram interrompidos porque a Mesa não aparecia após a recarga.
- Interface: controles de senha, confirmação, rótulo de login e alinhamento visual foram apontados como divergentes; endereço LAN e QR Codes estavam ausentes.
- Nenhum teste humano posterior às correções deste checkpoint foi executado.

### Diagnóstico e alterações implementadas
- **Mesa não exibida após novo login — causa provável identificada no frontend:** o servidor já persistia Mesa e vínculos no SQLite, mas a interface não fazia sincronização inicial automática da lista depois da autenticação. Agora a sincronização é disparada ao estabelecer/restaurar sessão.
- **Caminho do SQLite:** diretório padrão passou a ser resolvido a partir da localização do servidor no repositório, evitando criar outro banco por diferença acidental de diretório de trabalho.
- **Persistência automatizada ampliada:** teste cria Mesa, convite, solicitação, aprovação de jogador, rascunho e atualização de campos; reinicia o servidor com o mesmo diretório e confirma Mesa, vínculo, participante e revisão/dados da ficha.
- **Sessão persistente:** cookie HttpOnly, SameSite=Strict, validade de sete dias; restauração automática no modo LAN após recarga/reabertura. Logout voluntário revoga a sessão e limpa o cookie. O transporte LAN permanece HTTP sem criptografia.
- **Contexto da ficha:** Mesa/personagem abertos e posição de rolagem são preservados localmente; após restauração da sessão, o WebApp reabre a ficha autorizada e tenta restaurar a posição.
- **Senha:** mínimo alterado para quatro caracteres; cadastro ganhou confirmação; controle mostrar/ocultar permanece visível; bloqueio por quantidade de tentativas de cadastro/login por IP foi removido conforme solicitação do autor. Hash de senha continua protegido.
- **Endereço LAN e QR:** API informa os endereços IPv4 detectados; interface mostra URLs no host LAN e QR Codes gerados localmente, sem serviço externo. QR de convite aponta para o endereço LAN, preenche o código e não aprova ingresso automaticamente.
- **Código curto:** convite novo usa oito caracteres Base32, alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (40 bits, sem caracteres visualmente ambíguos), comparação sem diferenciar caixa e tentativa de colisão sob transação. Códigos longos antigos continuam aceitos durante a transição. O QR de convite abre a página e pré-preenche o código; o jogador ainda solicita ingresso e aguarda aprovação.
- **Ficha visual:** navegação foi movida para barra flutuante inferior com quatro atalhos, seção ativa acompanha a rolagem e a posição é restaurada após recarga, alinhando a navegação ao protótipo mobile congelado.
- **Habilidades/Equipamento Inicial:** inspeção do código confirmou que os seletores já existem em `EditorCaracteristicasLocal.tsx` e `EditorInventarioLocal.tsx`; não foram recriados nem considerados testados. A nova navegação facilita o acesso, mas a confirmação visual/funcional humana continua pendente.
- **Painel do Mestre:** resumo administrativo mostra jogadores/10, vagas disponíveis e solicitações pendentes; a numeração de jogadores exclui o Mestre. QR de convite aparece para os endereços LAN detectados. Não foi criado acesso do Mestre à ficha integral.

### Commits desta rodada
- `511370f`: sincronização automática de Mesas após autenticação e caminho SQLite estável.
- `97ec581` / `54eab6c`: sessão persistente por cookie e restauração de contexto/posição da ficha.
- `605caa4`: senha mínima 4, confirmação, mostrar/ocultar e remoção do bloqueio por tentativas.
- `b1fa0cf`: correção do teste de validação IPv4; os dois workflows passaram.
- `7797718`: navegação flutuante inferior na ficha.
- `4b72b46`: gerador local de QR Code, URL LAN e QR de convite com pré-preenchimento.
- `c7466b8`: resumo de vagas/solicitações no Painel do Mestre.
- `e2a63a7`: persistência de convite, aprovação e participante após reinício.
- `c15996b`: persistência de atualização da ficha após reinício.
- `0c9b38b`: validação de cookie HttpOnly através do proxy same-origin.
- `01176cf`: código curto de convite de oito caracteres.
- `ed6770f`: remove parâmetro de convite da URL após solicitação concluída.

### CI e pendências
- **CI CONFIRMADA:** ambos os workflows passaram nos commits `4b72b46`, `c7466b8`, `f9e6905`, `e2a63a7`, `c15996b` e `0c9b38b`.
- **CI PENDENTE no momento do checkpoint:** workflows de `01176cf` e HEAD `ed6770f` ainda em execução; verificar novamente antes de declarar HEAD validado.
- **Nickname:** campo ainda usa e-mail. Migração de coluna/contrato e política de normalização continuam pendentes de decisão do autor; preservar contas existentes é obrigatório.
- **Recuperação de senha:** fluxo solicitado pelo autor (informar nickname e cadastrar nova senha sem e-mail) ainda não implementado. Qualquer pessoa que conheça o nickname poderá assumir a conta; registrar essa consequência na interface.
- **QR e convite:** QR local implementado; formato curto agora implementado, sujeito ao CI. Leitura real em celular e conectividade entre dispositivos continuam pendentes.
- **Falha original de salvamento:** persistência e reabertura foram cobertas por testes automatizados; a causa original do erro observado no ambiente Windows/celular ainda não foi reproduzida. Não declarar incidente totalmente resolvido antes de novo teste humano.
- **Limites preservados:** alterações somente na branch `feat/offline-first-ficha`; sem merge, deploy, alteração em `main`, Supabase ou banco de produção.


## Atualização de continuidade — sessão por cookie e persistência SQLite (06/11/2026)

- **HEAD validado:** `4e3a50e1fec8b55e6655382a76256f82bc4d237a` na branch `feat/offline-first-ficha`.
- **CI CONFIRMADA:** os dois workflows do HEAD concluíram com sucesso em 06/11/2026:
  - “Verificação da ficha offline” — run `42214600759`.
  - “Validar compilação do WebApp” — run `42214600724`.
- **TESTE AUTOMATIZADO NOVO:** `tests/sessao-cookie-persistencia.test.mjs` registra uma conta, autentica, verifica atributos do cookie HttpOnly/SameSite=Strict/Path=/, cria e lista uma Mesa enviando apenas o cookie, reinicia a API com o mesmo diretório SQLite e confirma que a sessão e a Mesa continuam acessíveis.
- **LIMITE DO TESTE:** o teste injeta manualmente o cabeçalho Cookie nas requisições Node. Ele valida a API, o cookie emitido e a persistência SQLite, mas não simula o armazenamento automático de cookies pelo navegador nem o reload real da página.
- **INSPEÇÃO DO FLUXO DE NAVEGAÇÃO:** `src/main.tsx` seleciona `ConexaoServidorLocal` quando a URL contém `?servidor=local`. O script `scripts/windows/Iniciar_Mesa_LAN.bat` abre a aplicação com esse parâmetro. O único `history.replaceState` encontrado na aplicação Supabase preserva `window.location.search`; no fluxo LAN, a remoção do parâmetro `convite` usa `URL.searchParams.delete('convite')` e preserva os demais parâmetros, inclusive `servidor=local`.
- **INSPEÇÃO DO TRANSPORTE:** no modo LAN, `enderecoInicial()` usa `window.location.origin`; o Vite encaminha `/api` e `/ws` para a API local; `src/servidorLocal.ts` usa `credentials: 'include'`. Portanto, o desenho atual é same-origin e permite ao navegador enviar o cookie sem expor o token no armazenamento JavaScript.
- **INSPEÇÃO DO RESTORE:** ao montar em modo LAN, `ConexaoServidorLocal` consulta `/api/health` e depois `/api/auth/me`; com sessão válida, define a conta e dispara sincronização inicial das Mesas. Se a verificação de saúde falhar, a sessão não chega a ser consultada. Isso é um ponto de observação para a reprodução do retorno à tela de endereço, mas ainda não identifica a causa.
- **PENDENTE CRÍTICO:** não foi reproduzido o reload real no navegador Windows nem no celular; não se pode afirmar que a sessão persistente esteja corrigida. A causa do retorno à tela de endereço e o relato de Mesa ausente após novo login continuam sem confirmação humana posterior às correções.
- **BANCO:** `server/index.mjs` resolve o diretório padrão `.ameaca-local` a partir da localização do arquivo do servidor, e o script oficial informa esse caminho e mantém as duas janelas abertas. O teste de reinício usa explicitamente o mesmo `dataDir`; ainda não comprova que dois processos iniciados manualmente pelo usuário apontem sempre para o mesmo banco.
- **LIMITES PRESERVADOS:** nenhum deploy, merge, alteração em `main`, modificação no Supabase remoto ou uso de dados reais. Testes de navegador/rede/dispositivo permanecem pendentes.

## Continuidade — layout independente, Origem Operário e auditoria da ativação LAN
**Atualização:** 07/11/2026 · branch `feat/offline-first-ficha`

### Painel e ficha responsiva
- **IMPLEMENTADO:** Painel do Mestre abre em tela própria, selecionado pela Mesa, e oferece retorno ao hub sem encerrar a sessão.
- **IMPLEMENTADO:** em telas baixas na orientação paisagem, a ficha ocupa a viewport sem a moldura com altura mínima; a navegação inferior permanece fixa.
- **CI CONFIRMADA:** workflows dos commits `d53f2b3` e `d130284` concluíram com sucesso (build e testes).

### Origem Operário
- **IMPLEMENTADO:** a revisão do jogador exige uma arma da lista permitida para a Origem Operário.
- **CORREÇÃO NO SERVIDOR:** `validarCriacaoServidor.ts` agora encaminha `armaOperario` à revisão compartilhada; sem isso, uma escolha válida seria tratada como ausente no servidor.
- **TESTES:** cobertura de ausência, arma permitida e arma incompatível na revisão; teste de integração do validador compartilhado.
- **CI CONFIRMADA:** commit `31dfe94` — 516 testes aprovados, zero falhas; build e verificações de tipos aprovados. O workflow adicional do commit `c925b90` ainda estava em execução no momento deste registro.

### Ativação e resumo operacional — bloqueio arquitetural identificado
- **IMPLEMENTADO:** validação de criação de nível 1 no servidor LAN para os dados atualmente cobertos por `validarCriacaoNoServidor`.
- **PENDENTE:** o banco LAN persiste personagens somente como rascunhos; não há estado de personagem ativa, operação de finalização/ativação nem inventário materializado no servidor local.
- **PENDENTE:** o resumo operacional do Mestre já possui componentes/controlador e uma proposta SQL de referência, mas o serviço disponível nessa proposta usa RPC Supabase. Não integrar nem reativar Supabase: a versão LAN precisa de serviço HTTP e autorização própria no servidor local.
- **DECISÃO DE IMPLEMENTAÇÃO:** não exibir rascunhos no resumo nem simular ativação no cliente. Implementar primeiro o ciclo LAN de finalização, com revisão otimista, idempotência, teto de 10 personagens ativas e materialização transacional do inventário; depois conectar o resumo somente leitura do Mestre.
- **REGRAS DE REFERÊNCIA:** Planejamento v2.1, seções 3.3–3.5, 4 e 5.1–5.5. A finalização deve revalidar método, nível permitido, capacidade ativa e dados no servidor; os rascunhos continuam privados e não ocupam vagas.
- **LIMITAÇÃO ATUAL:** a criação e a revisão de ficha cobrem nível 1. Criação em níveis superiores, Regra da Casa e benefícios de progressão ainda não estão integrados ao fluxo LAN. Não declarar criação completa.

### Limites preservados
Nenhuma alteração em `main`, merge, publicação, Supabase remoto ou banco de produção. Nenhum teste humano de navegador/dispositivo foi realizado nesta atualização.
