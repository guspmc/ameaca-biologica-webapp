# Auditoria de alinhamento ao Planejamento v2.1 — 05/11/2026

**Documento de referência:** Documento Mestre de Planejamento v2.1, aditivo aprovado em 03/11/2026.  
**Branch inspecionada:** `feat/offline-first-ficha`  
**HEAD atualizado:** `de3d7837102082278b57ace8c994749dcc0cc7cd`  
**Escopo:** confronto inicial das prioridades 1 e 2 da v2.1 com o código disponível.  
**Limite:** inspeção remota de código e CI; nenhum teste de navegador, rede LAN real ou equipamento do autor foi executado nesta auditoria.

## 1. Precedência aplicada

A v2.1 mantém a v2.0 como linha de base e substitui apenas os pontos expressamente alterados pelo aditivo. Os livros do Jogador e do Mestre continuam sendo a autoridade mecânica. Planejamento aprovado não é evidência de implementação ou teste.

A identidade visual da ficha mobile congelada é referência aprovada de composição e estilo, sem reativar a estrutura funcional antiga dos protótipos. A ficha permanece única e contínua.

## 2. Prioridade 1 — salvamento do rascunho no servidor local

### Evidências no código

- `src/servidorLocal.ts` define `atualizarPersonagem()`, enviando `PUT /api/personagens/{id}` com nome e dados.
- `src/ConexaoServidorLocal.tsx` usa esse método em `salvarDadosFicha()`, exige sessão e papel de jogador, bloqueia salvamentos simultâneos, confere ID e Mesa da resposta e só então atualiza a ficha aberta e apresenta confirmação.
- `server/index.mjs` encaminha requisições para `tratarRotaPersonagensLocal()`.
- `server/personagens-local.mjs` implementa a rota PUT, autentica a conta, verifica propriedade da personagem, atualiza nome/dados no SQLite e devolve o registro persistido.
- `tests/personagens-local.test.mjs` cobre criação, listagem, atualização via PUT e isolamento de leitura por outras contas/papel Mestre.

### Estado

**IMPLEMENTADO:** existe um caminho de atualização cliente → API → SQLite.  
**TESTADO AUTOMATICAMENTE:** a rota PUT é exercitada no teste de integração do servidor, no escopo descrito acima.  
**PENDENTE:** reproduzir e diagnosticar a falha real relatada pelo autor. O teste de rota não comprova que o navegador alcança o endereço configurado nem que a origem efetiva é aceita.

### Hipóteses que não devem ser tratadas como causa

- Falha de alcance/rede ou endereço configurado.
- Política CORS e permissão Local Network Access (LNA) do navegador ao chamar o servidor local a partir de uma origem pública.
- Divergência entre endereço usado para criação/consulta e endereço usado para atualização.
- Falha de autenticação ou sessão.

O servidor tem uma lista CORS explícita e inclui por padrão GitHub Pages e Vite local. A documentação atual do Chrome informa que o mecanismo antigo de Private Network Access (PNA) foi substituído pelo Local Network Access (LNA): não devemos adicionar cabeçalhos PNA como correção. Em origens públicas HTTPS, o Chrome exige permissão do usuário para acessar destinos locais/loopback; essa permissão só pode ser solicitada em contexto seguro. A reprodução precisa registrar se o prompt LNA aparece/foi concedido, origem, URL final, método, status/preflight e log do servidor, sem expor token. A URL inicial da interface continua sendo `http://127.0.0.1:4175`, adequada ao próprio PC; em outro dispositivo, a interface orienta informar o IP LAN real do host. Naquele momento, a ausência de `targetAddressSpace` era uma lacuna ainda não tratada; ela foi endereçada posteriormente, conforme as seções 12 e 14. A declaração no cliente ainda precisa de confirmação no navegador real.

### Próximo teste técnico

Foi adicionado `tests/cliente-servidor-local.test.mjs` para exercitar o cliente HTTP real contra o servidor Node/SQLite de teste, usando o mesmo endereço e token para cadastro, login, criação de Mesa/personagem, consulta, PUT e releitura persistida. A execução do novo teste está pendente no CI. Depois, quando houver acesso ao navegador do autor, reproduzir pela origem efetivamente usada e comparar a rota de criação/consulta com a rota PUT. A lista de métodos CORS foi corrigida na branch para anunciar `GET, POST, PUT, DELETE, OPTIONS`, mantendo a lista explícita de origens permitidas. A alteração foi coberta por `tests/cors-metodos-local.test.mjs`, que verifica preflight para PUT/DELETE e rejeição de origem não autorizada. O teste não amplia origens, não usa curingas e não concede autorização de acesso aos dados; a autorização real continua na rota por sessão/propriedade.

## 3. Prioridade 2 — autenticação local e sessão

### Divergências observadas

- `server/auth-local.mjs` ainda usa e-mail como identificador e exige senha mínima de 12 caracteres.
- `src/servidorLocal.ts` e `src/ConexaoServidorLocal.tsx` expõem cadastro/login por e-mail.
- O token fica somente na memória React; recarregar ou reabrir a página perde a sessão do cliente. O próprio texto da interface informa isso.
- A sessão no servidor tem validade de sete dias; perder o token no navegador não equivale a revogá-la.

### Decisão v2.1

**PLANEJADO/APROVADO:** nickname exclusivo sem solicitar e-mail; senha mínima de quatro caracteres sem complexidade adicional não aprovada; sessão preservada após recarga/fechamento/reabertura em condições normais. Senha continua armazenada de forma protegida.

**PENDENTE de especificação:** normalização/unicidade de nickname, recuperação de conta/senha sem e-mail e política de nomes reservados. O mecanismo de persistência/renovação é decisão técnica.

Não implementar a mudança de autenticação antes de concluir a prioridade 1, conforme a ordem expressa da v2.1.

## 4. Outras prioridades v2.1

- Convite curto: aprovado; tamanho, alfabeto e estratégia anticolisão pendentes.
- QR Code: deve abrir diretamente a página de login pelo endereço LAN real do host, nunca `localhost` no dispositivo remoto.
- Exclusão de rascunhos: aprovada, com confirmação e autorização exclusiva do proprietário; proteger fichas ativas/arquivadas.
- Alinhamento visual: comparar a implementação com os protótipos congelados em desktop e celular, sem copiar fluxos antigos.

## 5. Relação com a frente ficha offline

A branch contém uma ficha local baseada em IndexedDB, com validação compartilhada, backup e gravação por patches. Essa frente é distinta do caminho de rascunhos da Mesa servido por Node.js/SQLite. A existência de persistência offline no IndexedDB **não corrige nem comprova** o salvamento do rascunho na API LAN.

A decisão registrada pelo autor de deixar o Baú para a etapa final de integração via LAN permanece vigente. O trabalho atual de Inventário não deve implementar Baú, transferências ou sincronização compartilhada.

## 6. CI da frente offline — commit anterior à correção do build

No commit `78b676975eb2098aff7fd9f22ce707fc3d0a9d56`:
- A suíte automatizada concluiu com **372/372 testes aprovados**.
- O build TypeScript/Vite falhou em `src/backupFicha.ts`: o predicado com parâmetro opcional booleano foi passado diretamente a `Array.every`, cujo segundo argumento é o índice numérico.
- Correção mínima aplicada em commit posterior: envolver a chamada em callback unário `personagem => personagemValido(personagem)`. A validação do novo commit permanece pendente no CI.

## 7. Proteções de escopo

Nenhuma alteração em `main`, merge, publicação, Supabase ou banco de produção. Não foram executados testes manuais no navegador/LAN. Não foram alteradas regras do RPG.

## 8. Correção CORS e CI — 05/11/2026

### Alteração

No commit `a0e07f2dd18ec169bd0ec9da0ee20972f65c24f3`, `server/index.mjs` passou a anunciar os métodos `PUT` e `DELETE` no cabeçalho `Access-Control-Allow-Methods`, além de GET/POST/OPTIONS. A lista de origens autorizadas permanece explícita e sem curingas.

No commit `76d14161c4a729016741665943d4bd051ed5d3ea`, foi adicionado `tests/cors-metodos-local.test.mjs`, cobrindo preflight PUT e DELETE para a origem GitHub Pages e rejeição de origem externa não autorizada.

### Evidência automatizada

Os dois workflows do GitHub Actions para o HEAD `76d14161c4a729016741665943d4bd051ed5d3ea` concluíram com sucesso:
- Verificação da ficha offline: **373/373 testes aprovados**, build Vite aprovado.
- Validação do WebApp: **373/373 testes aprovados**, TypeScript, build Vite e verificação UI aprovados.

### Limites restantes

**IMPLEMENTADO E TESTADO AUTOMATICAMENTE:** correção do anúncio dos métodos e regressão de preflight CORS no servidor. Também foi criado teste de integração do cliente HTTP com a API real de teste; seu resultado aguarda CI.

**PENDENTE:** teste real de navegador HTTPS → servidor LAN, incluindo permissão Local Network Access do Chrome, alcance do IP/porta, possível necessidade de declarar `targetAddressSpace: 'loopback'` no endereço padrão e gravação persistida conferida após recarga. A correção CORS não comprova sozinha conectividade LAN nem salvamento real.

A sequência da v2.1 permanece: fechar prioridade 1 antes de iniciar a migração para nickname e sessão persistente.


## 9. Integração do cliente HTTP — 05/11/2026

Foi adicionado `tests/cliente-servidor-local.test.mjs`. O teste utiliza `criarClienteServidorLocal()` diretamente contra uma instância temporária do servidor Node/SQLite e percorre cadastro, login, confirmação de sessão, criação de Mesa, criação de rascunho, consulta, atualização PUT e nova consulta para confirmar os dados persistidos. O vínculo jogador/Mesa é preparado no banco de teste, sem alterar dados de produção.

**STATUS:** teste adicionado no commit `de3d7837102082278b57ace8c994749dcc0cc7cd`; execução CI pendente no momento do registro.

## 10. Chrome Local Network Access — esclarecimento técnico

A documentação atual do Chrome esclarece que Local Network Access (LNA) substitui a abordagem experimental PNA. Para uma página pública HTTPS acessar IP privado ou loopback, o navegador solicita permissão explícita do usuário. O contexto superior precisa ser seguro. O Chrome também documenta `targetAddressSpace: 'loopback'` em chamadas fetch destinadas a `127.0.0.1`/localhost. Na data deste registro, a opção ainda não estava implementada; a correção posterior está descrita nas seções 12 e 14.

Fontes consultadas em 05/11/2026:
- Chrome for Developers, guia Local Network Access: https://developer.chrome.com/docs/modern-web-guidance/guides/security/local-network-access
- Chrome for Developers, anúncio do prompt LNA e substituição da PNA: https://developer.chrome.com/blog/local-network-access

**Decisão técnica provisória:** não adicionar cabeçalhos PNA. Primeiro validar no Chrome real o prompt LNA, o destino usado (loopback ou IP LAN) e o resultado da chamada. Se a URL for loopback e o navegador bloquear por ausência de `targetAddressSpace`, corrigir o cliente de forma específica e cobrir o comportamento em teste compatível.


## 11. Resultado do CI no commit 99bffe2 — 05/11/2026

O HEAD da branch `feat/offline-first-ficha` avançou para `99bffe2c7a4b6010c308aa3a69ad20f726a5fab0`. Os dois workflows disparados por esse commit concluíram com sucesso:

- **Validar compilação do WebApp** — run [41956551991](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/41956551991): 377/377 testes aprovados; verificação TypeScript; build Vite concluído.
- **Verificação da ficha offline** — run [41956552001](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/41956552001): 377/377 testes aprovados; build validado.

O teste de integração `tests/cliente-servidor-local.test.mjs` está incluído nessa suíte aprovada. Ele exercita o cliente HTTP contra o servidor Node/SQLite temporário e confirma a releitura dos dados após atualização PUT. O primeiro erro observado foi exclusivamente na fixture do teste (inserção duplicada do participante que já é criado como Mestre); o cenário foi corrigido para atualizar o papel existente. O commit `99bffe2` contém essa correção.

## 12. Declaração de espaço de endereço e teste unitário — 05/11/2026

A sequência de commits `0750ebd`, `adab7ed` e `713fd59` acrescentou ao cliente HTTP a identificação do espaço de endereço do destino e a opção `targetAddressSpace` apenas para destinos classificados como locais ou loopback. O helper identifica loopback IPv4/IPv6 e endereços privados/link-local, além de hostname `.local`; destinos públicos não recebem a opção. A detecção foi corrigida em commit subsequente após revisão do tratamento de endereços IPv6.

Foi adicionado `tests/espaco-endereco-local.test.mjs`, cobrindo exemplos de loopback, redes privadas, link-local, IPv6 e destino público. Os 377 testes aprovados no CI do commit `99bffe2` incluem esse teste.

**IMPLEMENTADO E TESTADO AUTOMATICAMENTE:** declaração de espaço de endereço para destinos reconhecidos e regressão unitária; CORS PUT/DELETE; integração HTTP cliente → servidor SQLite, incluindo persistência e releitura.

**AINDA PENDENTE — TESTE REAL DE NAVEGADOR:** confirmar no Chrome a permissão Local Network Access, o comportamento de `targetAddressSpace` para o endereço efetivamente configurado, o acesso a partir da origem HTTPS usada pelo autor e o salvamento/reabertura real da ficha. A suíte automatizada não substitui esse teste. Se o host for um nome DNS personalizado que resolve para IP privado e não terminar em `.local`, a classificação atual pode não reconhecê-lo; verificar a forma de endereço aceita pela interface antes de declarar esse caso coberto.

## 13. Proteções mantidas

As alterações foram feitas somente na branch `feat/offline-first-ficha`. Não houve merge em `main`, publicação, alteração no Supabase de produção ou modificação do cânone do RPG.


## 14. Integração HTTP em modo de escuta LAN — 05/11/2026

### Alteração e cobertura

No commit `3bb7f0686ec75da7da6875fccf645add013d5cf4`, o teste `tests/cliente-servidor-local.test.mjs` passou a iniciar o servidor com bind `0.0.0.0`, o mesmo modo de escuta explícito usado para disponibilizar a API na rede local. O cliente de teste continua acessando por loopback para manter o cenário isolado no próprio runner.

O cenário percorre cadastro, login, consulta da sessão, criação de Mesa e personagem, consulta, preflight OPTIONS para PUT com os cabeçalhos Authorization/Content-Type, atualização PUT e releitura dos dados persistidos. A origem simulada é uma das origens locais permitidas. O teste não simula o mecanismo de permissão LNA do Chrome nem uma conexão de outro dispositivo.

### Evidência automatizada

Os dois workflows do GitHub Actions para o commit `3bb7f0686ec75da7da6875fccf645add013d5cf4` concluíram com sucesso:
- **Validar compilação do WebApp** — run [41958215902](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/41958215902): job TypeScript/Vite e verificações PostgreSQL concluídos com sucesso.
- **Verificação da ficha offline** — run [41958215876](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/41958215876): suíte automatizada e build concluídos com sucesso.

### Estado atualizado da prioridade 1

**IMPLEMENTADO E TESTADO AUTOMATICAMENTE:** caminho HTTP do cliente contra servidor Node/SQLite; atualização PUT e releitura persistida; bind do servidor em modo LAN; preflight CORS com PUT e Authorization; lista explícita de origens; declaração de `targetAddressSpace` para loopback, IPs privados/link-local, IPv6 local e nomes `.local`, com testes unitários.

**PENDENTE — TESTE HUMANO CRÍTICO:** navegador Chrome real a partir da origem HTTPS publicada, permissão Local Network Access, endereço LAN real do PC, firewall/rede, salvamento da ficha e confirmação após fechar/reabrir ou consultar novamente. O teste automatizado não comprova o comportamento do navegador, a conectividade de outro dispositivo nem o fluxo real de edição da interface.

A interface começa com `http://127.0.0.1:4175`, mas esse endereço só alcança o próprio dispositivo. Para o teste com Android ou outro computador, deve ser informado o endereço LAN exibido pelo servidor no PC (por exemplo, `http://192.168.x.x:4175`, usando o endereço real apresentado no terminal). O servidor precisa ser iniciado explicitamente com `--host 0.0.0.0`; o padrão permanece restrito ao loopback.

Nenhuma alteração em `main`, publicação, Supabase de produção ou cânone do RPG.


## 15. Revisão otimista de rascunhos e estado atualizado — 05/11/2026

### Proteção contra gravação desatualizada

A prioridade 1 recebeu controle de revisão por personagem:
- Migration 8 acrescenta revisao com valor inicial 1 aos registros já existentes, preservando os dados anteriores.
- O servidor devolve a revisão atual e só aceita PUT quando expectedRevision coincide com a revisão persistida; uma gravação confirmada incrementa a revisão.
- Uma edição baseada em versão antiga recebe HTTP 409 e não substitui o conteúdo mais recente.
- O cliente envia a revisão recebida na abertura/última confirmação e mantém o salvamento bloqueado enquanto há uma gravação em andamento.
- Testes cobrem atualização e releitura, conflito entre versões, integridade após conflito, migração de banco legado e bloqueio de escrita por outra conta/Mestre.

Commits de implementação/teste relevantes: 594e311e, c997d52b, 035d0e04, 20b61241, 340a6b09, d3e6a06a e e6303bf3. As primeiras execuções revelaram problemas nos testes de migração/fixture; foram corrigidos. Os workflows do commit e6303bf3fe823bcef6ae10df06de55fc26186b5d concluíram com sucesso.

### Estado LAN

O teste de integração HTTP também passou a iniciar o servidor com bind 0.0.0.0 e verificar preflight OPTIONS para PUT, incluindo Authorization e Content-Type, sem simular indevidamente a permissão LNA do Chrome. O teste permanece isolado no runner e usa loopback como cliente.

**IMPLEMENTADO E TESTADO AUTOMATICAMENTE:** migration 8; revisão otimista no PUT; rejeição de versão antiga; integridade após conflito; CORS PUT/DELETE; cliente HTTP/servidor SQLite; bind LAN em fixture; declaração targetAddressSpace para endereços locais reconhecidos.

**PENDENTE — TESTE HUMANO H1:** Chrome real a partir da origem HTTPS, permissão Local Network Access, endereço LAN do PC, firewall/rede e fluxo de salvamento/reabertura; incluir também duas sessões com a mesma ficha para confirmar a mensagem de conflito e que a versão mais recente permanece intacta. O CI não substitui esse teste.

### Proteções

Todas as alterações continuam somente na branch feat/offline-first-ficha. Não houve merge, publicação, alteração em main nem modificação no Supabase de produção.


## 16. Rechecagem de continuidade e organização paralela — 05/11/2026

### HEAD e CI

Branch inspecionada: `feat/offline-first-ficha`  
HEAD observado: `cc69b3dcbe6e148a1263c4f43fd2ff1485638f09` (`Atualiza roteiro para menu unificado de testes`).

Os dois workflows deste HEAD concluíram com sucesso:
- Verificação da ficha offline — run [42112346006](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42112346006).
- Validar compilação do WebApp — run [42112346022](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42112346022).

Os jobs executaram testes e builds sem falha. Isso não substitui teste humano em navegador, Windows ou dispositivos conectados à LAN.

### Revisão do salvamento

Na revisão do código em `cc69b3d`, o cliente `src/servidorLocal.ts` usa a mesma `baseUrl` normalizada e o mesmo token para criação, consulta e atualização. A atualização usa `PUT /api/personagens/{id}`, envia `expectedRevision` e só retorna confirmação à interface após resposta positiva. A rota correspondente em `server/personagens-local.mjs` persiste os dados no SQLite e incrementa a revisão.

O teste `tests/cliente-servidor-local.test.mjs` percorre criação, consulta, preflight CORS, PUT, releitura persistida e conflito de revisão. Portanto:

- **IMPLEMENTADO:** caminho cliente → API → SQLite e controle de revisão.
- **TESTADO AUTOMATICAMENTE:** integração HTTP em processo Node/SQLite de teste e CI verde no HEAD acima.
- **PENDENTE:** reproduzir a falha original no Chrome real e registrar origem da página, URL de destino, permissão Local Network Access, resultado de preflight/PUT e log do servidor. Não registrar nem compartilhar token de sessão.
- **HIPÓTESES NÃO CONFIRMADAS:** bloqueio/permissão LNA, endereço LAN incorreto, firewall ou comportamento específico do navegador/rede. Não alterar a API sem evidência.

### Frentes paralelas e referência visual

Por orientação do autor, o desenvolvimento será organizado em frentes paralelas, integradas ao mesmo produto:
1. Ficha do Jogador — continuidade da ficha única e contínua, com persistência e criação/ativação.
2. Mesa — acesso local, participantes, convites, aprovação e sincronização LAN.
3. Painel do Mestre — estrutura operacional conforme os destinos aprovados Mesa/Encontros/Arquivos.

Os arquivos `Ameaca_Biologica_Ficha_Mobile_Prototipo_v02_CONGELADO.html` e `Ameaca_Biologica_Painel_Mestre_Prototipo_v02_CONGELADO.html` permanecem referências visuais obrigatórias. Devem orientar composição, hierarquia, paleta, tipografia, cartões, divisores, ícones, densidade e adaptação mobile; não se importam automaticamente seus antigos fluxos demonstrativos. A ficha continua única e contínua.

### Autenticação e QR Codes

Decisão funcional reiterada pelo autor: autenticação por **Usuário e senha**, sem exigir e-mail, com senha mínima de quatro caracteres conforme v2.1. O código atual ainda utiliza e-mail e senha mínima de 12 caracteres; migração e interface continuam pendentes. A sequência de prioridades da v2.1 permanece: fechar o diagnóstico humano da prioridade 1 antes de implementar a migração de autenticação.

QR Codes aprovados como atalhos de acesso:
- QR do convite/código da Mesa para facilitar o fluxo de solicitação de ingresso, sem aprovação automática.
- QR do endereço LAN do Laboratório, apontando para o endereço vigente do host na rede, nunca para `localhost` no celular.

O QR Code não autentica nem concede acesso por si só. Não adicionar infraestrutura externa ou serviços de internet para estes recursos; o cenário previsto é offline/LAN. Permanecem as verificações funcionais de conta, papel e vínculo necessárias ao próprio funcionamento do aplicativo, sem introduzir camadas de segurança desnecessárias.

### Limites de alteração

Este registro não autoriza publicação, merge, alteração de `main`, mudança no Supabase legado ou mudança no cânone do RPG. A implementação deve continuar em incrementos pequenos, com arquivos e testes inspecionados antes de alterar.
