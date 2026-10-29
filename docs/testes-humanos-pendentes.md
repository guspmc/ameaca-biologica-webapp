# Pendências prioritárias — servidor local/LAN e reconexão (29/10/2026)

> Esta fila é a referência atual para o protótipo LAN. Os testes históricos de notas/PWA abaixo não validam esta arquitetura. Executar primeiro o CI do branch fix/lan-websocket-reconnect-2026-10-29; depois realizar os testes manuais com dados fictícios.

## Fila atual

1. **L1 — CI (concluído para o código atual):** GitHub Actions passou no commit 9816838c86185a3aa1be327659a5dc2b762a5cf0: 266 testes passaram, nenhum falhou, e o build TypeScript + Vite terminou com sucesso. Se houver nova alteração de código, validar novamente.
2. **L2 — inatividade visível (fácil e prioritário, após L1):** com servidor no PC e as páginas abertas/visíveis no PC e Android, esperar 3–5 minutos sem enviar mensagens. Enviar Android → PC e PC → Android. Aprovação exige chegada nos dois lados sem F5 e sem duplicatas.
3. **L3 — recuperação após reinício do servidor:** com as páginas abertas, parar o Node com Ctrl+C e iniciá-lo novamente. Confirmar que o navegador volta a conectar sozinho e que as mensagens já gravadas continuam aparecendo sem F5 e sem duplicatas.
4. **L4 — queda e retorno da rede:** mantendo o servidor ligado, desconectar e reconectar o Wi-Fi de um cliente. Confirmar reconexão automática e recuperação do histórico depois que a rede voltar.
5. **L5 — suspensão de Android/navegador:** repetir com tela bloqueada ou navegador em segundo plano por alguns minutos. Registrar se o sistema suspendeu a página e quanto demorou para recuperar. A suspensão do sistema pode interromper a conexão; o critério é recuperação automática ao retomar, não conexão física eterna.
6. **L6 — internet indisponível, LAN ativa:** se for possível sem afetar outras pessoas, desligar apenas o acesso à internet mantendo o Wi-Fi/LAN funcionando e repetir envio nos dois sentidos.
7. **L7 — Android como servidor:** só depois de estabilizar o PC como servidor, investigar execução do Node/SQLite no Android. É uma validação de compatibilidade separada e ainda não está comprovada.

## Evidências já disponíveis

- O usuário relatou que o evento “Teste 2 - Android” só apareceu no PC depois de F5 e que o indicador do canal mudou para vermelho. Isso comprova apenas que o cliente sinalizou uma desconexão; não identifica a causa nem prova que o processo Node parou.
- A versão anterior não tinha reconexão automática nem recuperação do histórico ao reconectar.
- A versão de correção adiciona heartbeat WebSocket, reconexão com espera progressiva, reconciliação do histórico por ID, sincronização quando a aba volta ao primeiro plano e teste automatizado de encerramento de clientes que não respondem ao ping. O código passou no CI do commit 9816838; o reteste real nos dois dispositivos continua **pendente**.
- Não existe temporizador de desligamento do servidor por inatividade no protótipo. O heartbeat não mantém Wi-Fi, sistema operacional ou navegador acordados e não garante conexão física infinita.

---

> **Atualização de direção — 29/10/2026:** os testes de notas locais abaixo continuam como evidência histórica do comportamento da implementação atual; não certificam a arquitetura-alvo. O objetivo agora é um servidor autoritativo em PC/notebook/Android, com clientes em rede local e sem requisito de internet. A trilha de testes genéricos de offline/PWA fica pausada até a arquitetura local/LAN ser implementada. Ver [checkpoint de arquitetura do servidor local/LAN](checkpoint-arquitetura-servidor-local-lan-2026-10-29.md).

## Resultados humanos relatados em 29/10/2026 — rodada anterior de notas/PWA

- **E1 — persistência da nota após fechar/reabrir a ficha:** aprovado pelo usuário.
- **E2 — privacidade na troca Jogador → Mestre → Jogador:** aprovado pelo usuário; a anotação não apareceu para o Mestre e permaneceu na conta de Jogador.
- **E3 — isolamento entre personagens:** aprovado pelo usuário com base na observação de que a nota da Claire não apareceu nas outras personagens. A segunda parte sugerida (criar uma nota distinta na outra ficha e retornar à Claire) não foi explicitamente confirmada, portanto não é evidência registrada.
- **F1:** aprovado pelo usuário; o detalhe do cenário não foi repetido no relato e não deve ser inferido.
- **F2:** parcial/pendente. Ao tentar o cenário, não apareceu indicação de modo offline/cópia local; a interface mostrou apenas “Atualizações ao vivo” com bolinha verde. Esse indicador não prova conexão com internet nem operação offline.
- **F3:** observado, não aprovado como critério de aceitação. Com DevTools → Rede → Offline, a ficha continuou utilizável e nada pareceu desabilitado; não foi confirmado se alguma gravação compartilhada foi tentada.
- **F4:** inconclusivo. O usuário não conseguiu afirmar se funcionou e não viu aviso ou erro.

Esses testes foram realizados na prévia local da arquitetura atual, que ainda usa Supabase para autenticação e dados compartilhados. A opção Offline do DevTools pode bloquear novas requisições, mas continuar numa página já carregada não prova que existe um servidor LAN autoritativo. Não repetir essa bateria como se validasse a arquitetura-alvo; retomar somente quando houver um marco LAN executável e roteiro específico.

# Testes humanos pendentes — roteiro consolidado

## Nova rodada enfileirada — offline e notas pessoais

### Progresso observado — rodada local de notas (28/10/2026)

- **Preparação/login:** aprovado. A prévia local exibiu `AMBIENTE DE TESTE`; o login passou após Gus corrigir um prefixo `sb` duplicado na chave pública do projeto de teste.
- **Mesa/ficha:** a Mesa `Teste` e a ficha da Claire abriram normalmente na conta de Jogador.
- **E1 — salvar e recuperar nota:** **aprovado por relato do Gus**. A nota `NOTA PRIVADA CLAIRE — teste local 01` foi salva; após voltar à Mesa e reabrir a ficha, o texto continuou presente.
- **E2 — privacidade entre papéis/sessões:** **aprovado por relato do Gus**. A anotação não apareceu na interface do Mestre; ao voltar à conta de Jogador, a nota permaneceu intacta.
- **Ainda pendente:** independência entre personagens e contas; inspeção do service worker/cache; edição de nota offline e proteção dos campos compartilhados.

Próxima ação: validar que a nota é isolada por personagem e conta, sem apagar nem editar dados compartilhados. Depois, verificar o cache/service worker e iniciar a rodada offline.


> **Checkpoint de escopo:** até o lançamento e aprovação do modo local, trabalhar somente nos bloqueios e testes dessa entrega. Itens adiados e o bloqueio atual `Invalid API key` estão registrados em [checkpoint-escopo-modo-local-2026-10-28.md](checkpoint-escopo-modo-local-2026-10-28.md).


A rodada não deve ser solicitada ao Gus até a implementação passar por revisão e testes automatizados. Decisões confirmadas em 28/10/2026: notas pessoais somente no dispositivo, separadas por conta/Mesa/personagem e sem sincronização; autenticação continua obrigatória, inclusive no uso offline. O roteiro passo a passo está em [rodada-offline-notas-locais.md](rodada-offline-notas-locais.md).

Casos novos a agrupar:
- Nota da ficha A persiste após fechar/reabrir e F5; ficha B permanece independente.
- Nota não é mostrada ao Mestre nem a outra conta no mesmo dispositivo.
- Nota continua disponível para a mesma conta após sair e entrar novamente.
- Edição local da nota funciona offline e sobrevive a F5/reconexão; os campos compartilhados continuam somente para consulta.
- Após logout, não é possível entrar/abrir uma sessão nova sem conexão.
- Teste físico em Edge e Samsung Browser será feito na rodada consolidada, depois da preparação do ambiente.

Atualizado em 26/10/2026. Este é o roteiro atual; o histórico foi preservado em [fila-testes-humanos.md](fila-testes-humanos.md).

## Situação atual — retomada da organização

**T16.1–T16.10 e MC5.1–MC5.10 aprovados por Gus em 26/10/2026**: Windows 11/Microsoft Edge e Galaxy S24 FE/Samsung Browser. [Resultado escrito e limites](resultado-t16-mc5-2026-10-26.md). As duas filas anteriores estão encerradas.

**T17.1–T17.10 e MC6.1–MC6.10 aprovados por Gus em 26/10/2026**, conforme [confirmação escrita e limites](resultado-t17-mc6-2026-10-26.md). Não repetir sem mudança relevante.

**T18.1–T18.10 e MC7.1–MC7.8 aprovados por Gus em 26/10/2026. MC7.9 e MC7.10 continuam pendentes.** [Resultado escrito e limites](resultado-t18-mc7-parcial-2026-10-26.md).

**Fila PC: 10/10 — T19.1–T19.10**, [roteiro detalhado](rodada-retomada-pc-2026-10-26.md). **Fila celular: 10/10 — MC7.9–MC7.10 mais MC8.1–MC8.8**, [fila enumerada completa](fila-celular-retomada-2026-10-26.md). Nova simulação conserva pedidos ao atualizar a mesma aba, sem login/banco. [Relatório](organizacao-sessao-local-2026-10-26.md). Aguardar confirmações antes de ampliar. Históricos anteriores preservados.

**T14.1–T14.4 e T15.1–T15.6 aprovados por Gus em 25/10/2026**, com 30 capturas preservadas. [Resultado da rodada encerrada](resultado-testes-humanos-t14-t15-2026-10-25.md). Seus roteiros ficam como histórico de regressão. Desenvolvimento segue o [protocolo de autonomia supervisionada](protocolo-autonomia-supervisionada.md). A aplicação conectada não foi alterada; integração remota permanece condicionada a autorização específica.

- **T1, T3 e T4: aprovados.** Não repetir sem mudança relevante.
- **T5, T6, T7, T8 e T9: aprovados por Gus em 24/10/2026**, com treze capturas da simulação isolada. Não repetir sem mudança relevante. Resultado e limites em [resultado-testes-humanos-2026-10-24.md](resultado-testes-humanos-2026-10-24.md).
- **T13.1–T13.10: aprovados por Gus em 25/10/2026**, com 33 capturas da simulação de recuperação. [Resultado e limites](resultado-testes-humanos-2026-10-25.md). Não repetir sem alteração relevante. T10–T12 continuam futuros e condicionados à integração/acesso; não foram certificados pela simulação.
- **T2: fluxo aprovado por Gus, com sincronização imediata de B após compras em A.** A recusa de uma compra enviada com revisão antiga não foi demonstrada por esse comportamento; manter essa diferença de cobertura registrada, sem pedir repetição manual agora.
- **MC1–MC4 aprovados em Galaxy S24 FE por Gus em 26/10/2026.** [Resultado e correção solicitada das quatro Passivas](resultado-celular-2026-10-26.md). Roteiro antigo preservado em [teste-celular.md](teste-celular.md). A nova rodada MC5 é independente, cobre mudanças posteriores e requer PC/servidor ligado na mesma rede. Reinício do PC exige retomar a prévia; 127.0.0.1 no celular não aponta para o PC.

Resultado e limites: [resultado-testes-humanos-2026-10-23.md](resultado-testes-humanos-2026-10-23.md).

Os passos abaixo ficam preservados como roteiro da rodada realizada, não como pedido de novos testes agora. Usar somente Mesa e personagens fictícias do ambiente TESTE em eventuais regressões futuras. Nenhum caso exige produção, publicação ou ativação de ficha.

## Histórico — T5 a T9 aprovados, somente simulação local

**Rodada encerrada e aprovada.** Os passos abaixo ficam preservados para futuras regressões; não constituem pedido de novos testes. Não usar ficha de campanha nestes casos.

No PC da prévia, abrir http://127.0.0.1:4174/ameaca-biologica-webapp/tests/ui/ativacao.html . Confirmar **SIMULAÇÃO ISOLADA · SEM DADOS DE CAMPANHA**; não há login. F5, trocar cenário ou Reiniciar zera somente a simulação. Cada falha programada acontece uma vez por reinício. Início: Tentativas 0, conjuntos 0, PV 7, SA 1 e BI 3.

### T5 — confirmação normal e resumo do Mestre

1. Selecionar **Normal** e clicar **Conferir criação**.
2. Esperado: Sobrevivente fictícia, conferência 0/10 e caixa desmarcada; Ativar personagem desabilitado.
3. Marcar “Conferi as escolhas...” e clicar **Ativar personagem** uma vez.
4. Esperado: Ativação confirmada, Tentativas 1, conjuntos criados 1. PV 7, SA 1 e BI 3 permanecem. Botão de ativar deixa de aparecer.
5. No painel da direita, clicar **Atualizar resumo** e abrir **Perícias Passivas**.
6. Esperado: Operadora, nível 1, PV 7/15, SA 1/3, BI 3/7, Defesa 12 e doze perícias. Condições não informadas. Sem história, inventário ou edição. Lembrete de Vantagem/Desvantagem não modifica os valores normais.

### T6 — pendências e Mesa lotada

1. Selecionar **Escolhas pendentes**, clicar Conferir criação.
2. Esperado: pendência de Pontos de Perícia e de duas opções do Misto. Sem botão para ativar; Tentativas 0 e conjuntos 0.
3. Selecionar **Dez vagas ocupadas**, clicar Conferir criação.
4. Esperado: 10/10, aviso de lotação, sem botão para ativar; Tentativas 0 e conjuntos 0.

### T7 — dados alterados antes da confirmação

1. Selecionar **Dados mudaram antes de confirmar**, conferir, marcar a caixa e ativar.
2. Esperado: aviso de dados alterados pedindo nova conferência; Tentativas 1, conjuntos 0, sem confirmação de sucesso.
3. Clicar **Conferir criação** novamente; caixa volta desmarcada.
4. Marcar e ativar novamente. Esperado: sucesso, Tentativas 2, conjuntos 1; recursos iguais aos iniciais.

### T8 — nova tentativa após falha, sem duplicar

1. Selecionar **Falha antes de gravar**, conferir, marcar e ativar.
2. Esperado: erro, Tentativas 1, conjuntos 0; botão **Tentar novamente**, nova conferência/caixa desabilitadas enquanto a resposta está incerta.
3. Clicar Tentar novamente. Esperado: sucesso, Tentativas 2, conjuntos 1; mesmos recursos.
4. Selecionar **Resposta perdida após gravar**, conferir, marcar e ativar.
5. Esperado: erro de resposta perdida, Tentativas 1, conjuntos 1; ainda sem “Ativação confirmada”.
6. Clicar Tentar novamente. Esperado: sucesso, Tentativas 2 e conjuntos **ainda 1**, sem restaurar recursos. Atualizar resumo mostra uma única personagem.

Falhas simuladas: não desligar internet nem tentar clicar simultaneamente.

### T9 — recusa de resumo, janela estreita e reinício

1. Após ativação fictícia em T5, T7 ou T8, clicar Atualizar resumo; conferir cartão visível.
2. Clicar **Simular recusa do próximo resumo** e Atualizar resumo.
3. Esperado: aviso de acesso recusado; cartão anterior desaparece, sem exibir dados antigos como atuais.
4. Atualizar resumo novamente. Esperado: cartão recuperado com mesmos valores.
5. Reduzir largura da janela do PC. Conferir leitura, botões, caixa e Passivas, sem rolagem horizontal ou controles escondidos.
6. F5. Esperado: Normal, Tentativas 0, conjuntos 0, revisão não conferida; resumo só consultado ao clicar Atualizar resumo. Nenhuma personagem real alterada.

Registrar: **T5 aprovado; T6 aprovado; T7 falhou no passo 2 — mensagem...**. Captura do problema basta; não enviar credenciais.

### Futura integração — ainda não executar

Arquivamento/retomada, saída/readmissão e Baú ensaiados somente em banco local descartável. Testes com contas de TESTE serão preparados após integração/checkpoint próprios. Não remover participantes nem apagar fichas ou Mesas para testar esta página.

**Celular físico** continua aguardando acesso adequado. Largura emulada de 390 px já inspecionada automaticamente, sem validar toque/teclado/rolagem/salvamento no aparelho. Avaliar acesso depois; não expor servidor nesta rodada.

Relatório: [ciclo-e-interface-local.md](ciclo-e-interface-local.md).

## Próxima rodada condicionada — ainda indisponível

Esta seção refere-se a T10–T12 da futura integração. A nova página fictícia de recuperação é T13, disponível no roteiro indicado no topo; sua aprovação não encerra os testes conectados abaixo.

O [contrato de integração](contrato-integracao-ativacao.md) está em preparação local. Os casos abaixo ficam enfileirados; **não executar na aplicação conectada agora**. Os endpoints, recuperação após reinício e mudança segura de contexto precisam existir antes de preparar a rodada. Usar apenas fixtures descartáveis acordadas no TESTE, após checkpoint específico; não adaptar estes passos a fichas humanas existentes.

### T10 — ativação integrada e recuperação de resultado

1. Após liberação específica, conferir uma fixture apta e confirmar uma única vez. Esperado: ficha completa e um conjunto de itens, sem restaurar recursos.
2. Usar o cenário controlado de resposta interrompida que será preparado; anotar o identificador do pedido. Não desligar serviços ou alterar o banco manualmente.
3. Atualizar/reabrir a aplicação. Esperado: recuperar o estado real/recibo autorizado, sem anunciar fracasso falso, gerar outro pedido às cegas ou duplicar itens.
4. Esperado: nenhuma alteração em outras fichas/Mesas. Evidência: mensagem, estado final e identificador do pedido; sem tokens ou credenciais.

Quando o cenário isolado de recuperação estiver integrado, incluir falha controlada de armazenamento: a primeira ativação não pode ser enviada sem preservar o pedido. Após recriar o controlador/F5, a consulta deve recuperar o mesmo pedido sem duplicar efeitos. Ainda não há esse cenário executável na interface; os testes locais do módulo não encerram T10.

### T11 — privacidade e troca de contexto entre contas/Mesas

1. Após integração autorizada, usar contas fictícias de Jogador/Mestre e duas Mesas de ensaio.
2. Esperado: autoria pode conferir seu rascunho; Mestre não recebe rascunho nem ficha integral, apenas resumo autorizado de completas. Outra conta não pode ativar a ficha.
3. Durante consulta com atraso controlado, trocar a Mesa selecionada. Esperado: resultado antigo não aparece no novo contexto; recusa não conserva cartão anterior.
4. Repetir a troca após sair da sessão. Esperado: nenhum dado do usuário anterior na nova sessão. Não remover participantes reais para simular o caso.

Incluir retorno Mesa A→B→A e duas atualizações da mesma Mesa em ordem invertida. Esperado: somente o resultado da consulta mais recente aparece. Ainda depende de integração dos eventos reais; os testes locais do controlador não encerram T11.

### T12 — celular físico após preparação de acesso

1. Somente depois de definir acesso apropriado, abrir a versão exata indicada no aparelho. O endereço 127.0.0.1 do PC não serve diretamente no celular.
2. Abrir ficha, usar quatro atalhos, percorrer Inventário/Revisão e preencher um campo fictício. Conferir teclado, toque, botões e rolagem em retrato/paisagem.
3. Salvar e reabrir a fixture. Esperado: dados salvos preservados, controles acessíveis e nenhuma rolagem horizontal indevida.
4. Registrar aparelho, navegador e versão testada, sem enviar dados pessoais. Até preparar o acesso, marcar **não executável**, não reprovado.

Nenhum destes casos representa autorização para mudar banco, permissões, publicar ou abrir rede. T5–T9 continuam aprovados; não repetir sua simulação por causa do transporte ainda desconectado.

## Histórico — roteiro T1 a T4 já respondido

## Preparação — cerca de 3 minutos
1. No PC que executa a prévia, abrir http://127.0.0.1:4174/ameaca-biologica-webapp/ . Se não abrir, informar que a prévia está indisponível; isso não é resultado de falha da ficha.
2. Conferir o aviso de ambiente de teste no topo.
3. Separar uma personagem fictícia sua. Anotar ou fotografar as preferências e o plano atuais, caso queira restaurá-los no final. Os testes incluem salvamentos intencionais nessa personagem.
4. Para os testes de conflito, abrir **duas abas com a mesma conta de Jogador, na mesma Mesa e na mesma personagem**. Podem ser duas abas na mesma janela anônima já autenticada. A janela do Mestre permanece separada.
5. Chamar as abas de A e B. Não atualizar, fechar ou reabrir B entre o carregamento inicial e a tentativa de salvar nela: B precisa manter a versão antiga.

Duas contas diferentes não servem para produzir conflito na mesma ficha, pois o rascunho é privado.

## T1 — conflito de preferências em duas abas
Tempo estimado: 3 minutos.

1. Em A, abrir Revisão da criação > Funcionamento da ficha · preferências. Selecionar Misto e clicar em **Salvar Preferências**. Esperar confirmação.
2. Em B, pressionar F5, reabrir a mesma ficha e o mesmo painel. Conferir que A e B mostram a mesma **Versão carregada**. Anotar esse número.
3. Em A, selecionar **Manual**, clicar em Salvar Preferências e aguardar sucesso. A versão deve avançar.
4. Sem recarregar B, selecionar **Automático** e clicar em Salvar Preferências.
5. Esperado em B: mensagem de conflito/versão desatualizada; a escolha local Automático permanece visível. O salvamento de A não pode ser sobrescrito silenciosamente.
6. Fotografar a mensagem e a versão em B. Só então pressionar F5 e reabrir a ficha.
7. Esperado após F5: **Manual**, que foi salvo em A. O Automático recusado não deve ter sido persistido.

Manual e Automático são usados para garantir dois pedidos diferentes. Repetir exatamente a configuração já salva pode ser aceito sem alteração; isso é comportamento intencional e não testa conflito.

## T2 — conflito de plano de compras em duas abas
Tempo estimado: 4 minutos. Este teste modifica o plano da personagem fictícia escolhida.

Pré-requisitos: kit **C · Personalizado**, capacidade de pelo menos **5 Espaços**, Faca liberada pelo Mestre **na mesma Mesa da personagem**. Se algum pré-requisito não estiver disponível, registrar T2 como não executado, sem alterar atributos para forçar o cenário.

1. Em A, abrir Itens > Compras iniciais · plano e prévia. Clicar em **Limpar prévia de compras** e depois **Salvar Plano de Compras**. Esperar confirmação.
2. Em B, pressionar F5, reabrir a mesma ficha e o painel de compras. Conferir que ambas mostram plano vazio e a mesma Versão carregada.
3. Em A, buscar Faca, adicionar **uma** e salvar. Esperado: sucesso, uma Faca, duas moedas, 4 Espaços ocupados e versão avançada.
4. Sem atualizar B, adicionar **duas** Facas e salvar.
5. Esperado em B: erro de versão; sua prévia de duas Facas permanece visível. O plano salvo em A não pode ser sobrescrito.
6. Fotografar mensagem, prévia e Versão carregada em B. Pressionar F5 e reabrir.
7. Esperado: o plano de A, com **uma Faca**, duas moedas e 4 Espaços ocupados. As duas Facas da tentativa recusada não devem aparecer como compra salva.

Se aparecer “Item indisponível”, conferir primeiro a Mesa no painel do Mestre. Esse erro não comprova o teste de conflito; a Faca precisa estar liberada durante T2.

## T3 — proteção ao trocar kit com compras salvas
Tempo estimado: 3 minutos. Pode continuar na personagem de T2.

1. Garantir que exista uma Faca **salva** no plano C. Se T2 foi executado, essa condição já está pronta.
2. Em Equipamento inicial, selecionar **B** e clicar em **Salvar Equipamento Inicial**.
3. Esperado: recusa informando a necessidade de limpar o plano antes da troca. A opção C e a compra salva permanecem na ficha/grade. Apenas selecionar B não deve apagar nada.
4. No painel de compras ainda associado ao kit C salvo, clicar em Limpar prévia de compras e em Salvar Plano de Compras.
5. Esperado: plano vazio salvo, três moedas e 3 Espaços ocupados.
6. Voltar ao seletor de equipamento, escolher B e salvar.
7. Esperado: troca aceita. Pressionar F5 e reabrir; a opção B deve permanecer, com seu conjunto inicial, sem acumular a Faca comprada anteriormente.
8. Se desejar retornar ao Personalizado, selecionar C e salvar. Essa é uma nova escolha intencional; não recupera automaticamente o plano apagado.

## T4 — alteração não salva é descartada
Tempo estimado: 2 minutos. A persistência de preferências já foi aprovada; aqui o foco é somente não salvar.

1. Com a ficha carregada, abrir Funcionamento da ficha e anotar o modo e as opções salvos.
2. Mudar para um modo diferente. Se estiver no Misto, pode também alterar uma opção.
3. **Não clicar em Salvar Preferências**. Pressionar F5 e reabrir.
4. Esperado: configuração anteriormente salva, sem as alterações locais.
5. No plano C, se estiver disponível, adicionar ou retirar um item **sem salvar**, observar que a grade salva e a Revisão da criação continuam refletindo o plano já salvo, e pressionar F5.
6. Esperado: o plano salvo anterior permanece. O descarte deve afetar somente a prévia local.

O caso de compras de T4 é opcional se a personagem terminou T3 no kit B; não é necessário trocar novamente só para executá-lo.

## Como registrar o resultado
Para cada caso, informar: T1/T2/T3/T4, passou/falhou/não executado, passo em que parou e mensagem exibida. Em conflitos, uma captura antes de F5 com versão e erro, e outra depois de reabrir, ajudam a comparar. Evitar mostrar e-mails, senhas ou dados pessoais; não preciso dessas informações.

## Celular físico — aguardando acesso adequado
A janela estreita no PC já foi aprovada. O teste em aparelho físico permanece pendente, mas **a prévia está limitada ao próprio PC**: 127.0.0.1 no celular aponta para o celular, não para o computador.

Não há endereço de rede preparado nem abertura de firewall nesta etapa. Quando houver acesso local apropriado, o roteiro será: abrir ficha, usar os quatro atalhos, preencher e salvar um campo, percorrer Inventário e Revisão, verificar teclado/botões/rolagem e reabrir após atualização. Até lá, marcar como **não executável nesta prévia**, sem tentar expor o servidor.

## Não entram na rodada conectada T1–T4
- Ativação/resumo reais, inventário em uso, equipar/consumir/recarregar e teto coletivo real de dez ativas precisam de integração/checkpoint próprios. T5–T9 acima exercitam somente simulação isolada de ativação/resumo.
- Requisições realmente simultâneas, falha de rede no meio da resposta e repetição após ativação: exigem um ensaio técnico controlado. Não é necessário tentar clicar simultaneamente em várias janelas.
- Remover e readmitir participante, apagar rascunhos ou mudar permissões: dependem de proposta e autorização específica; não executar como parte destes testes.

## Casos já aprovados — não repetir sem mudança relevante
Origens, Perícias, Habilidades, kits e persistência; identidade/flexões; busca e compras; liberação/bloqueio na Mesa correta; preservação da compra salva após bloqueio; limpeza do plano; privacidade dos rascunhos; revisão, contagens e atalhos; janela estreita; preferências salvas após F5 e independentes por ficha. As confirmações e capturas anteriores continuam válidas.


## Nova trilha — servidor local LAN (29/10/2026)

A rodada genérica F2–F4 da PWA não comprova a arquitetura LAN-first e fica separada desta trilha. O primeiro protótipo está em `server/`; ele só armazena mensagens demonstrativas e não tem autenticação.

### Antes do teste manual
- [x] CI no GitHub Actions passou para a árvore validada: [testes do servidor LAN](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/40811908864) e [build/validações do WebApp](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/40811908875). A árvore atual foi conferida como idêntica à validada.
- [ ] Conferir o workflow [ci-local-server.yml](../.github/workflows/ci-local-server.yml): instalação congelada, testes e build aprovados.
- [ ] Baixar a branch `feat/origens-rascunho-alfa04` e executar os comandos do [guia do protótipo local](servidor-local-prototipo.md).
- [ ] Confirmar `pnpm.cmd test` sem falhas.
- [ ] Confirmar `pnpm.cmd run build` concluído.

### Teste manual — PC
- [ ] Iniciar com `pnpm.cmd run server:local`.
- [ ] Abrir `http://localhost:4175/`, enviar uma mensagem fictícia e confirmar que aparece na lista.
- [ ] Encerrar com Ctrl+C, iniciar novamente e confirmar que a mensagem permanece.

### Teste manual — dois dispositivos na LAN
- [ ] No PC servidor, iniciar com `pnpm.cmd run server:local -- --host 0.0.0.0`.
- [ ] Abrir o endereço LAN que o terminal mostrar em outro dispositivo na mesma rede.
- [ ] Enviar uma mensagem fictícia no dispositivo A e verificar que aparece no dispositivo B sem recarregar.
- [ ] Repetir no sentido inverso.
- [ ] Repetir com internet/WAN indisponível, mantendo a LAN/Wi-Fi entre dispositivos ativa.
- [ ] Parar o servidor e confirmar que o segundo dispositivo deixa de receber eventos.

**Critério de aprovação deste marco:** testes automatizados e build aprovados, persistência após reinício confirmada e eventos vistos nos dois dispositivos pela LAN sem internet. Isso valida apenas a base técnica do servidor; não valida autenticação, permissões, Mesas ou fichas.
