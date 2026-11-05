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

O servidor tem uma lista CORS explícita e inclui por padrão GitHub Pages e Vite local. A documentação atual do Chrome informa que o mecanismo antigo de Private Network Access (PNA) foi substituído pelo Local Network Access (LNA): não devemos adicionar cabeçalhos PNA como correção. Em origens públicas HTTPS, o Chrome exige permissão do usuário para acessar destinos locais/loopback; essa permissão só pode ser solicitada em contexto seguro. A reprodução precisa registrar se o prompt LNA aparece/foi concedido, origem, URL final, método, status/preflight e log do servidor, sem expor token. A URL padrão do cliente é `http://127.0.0.1:4175`; a documentação do Chrome usa `targetAddressSpace: 'loopback'` nos exemplos de fetch para loopback. O cliente atual não declara essa opção. É uma possível lacuna técnica a validar no navegador, não uma causa confirmada.

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

A documentação atual do Chrome esclarece que Local Network Access (LNA) substitui a abordagem experimental PNA. Para uma página pública HTTPS acessar IP privado ou loopback, o navegador solicita permissão explícita do usuário. O contexto superior precisa ser seguro. O Chrome também documenta `targetAddressSpace: 'loopback'` em chamadas fetch destinadas a `127.0.0.1`/localhost; o cliente atual não define essa opção.

Fontes consultadas em 05/11/2026:
- Chrome for Developers, guia Local Network Access: https://developer.chrome.com/docs/modern-web-guidance/guides/security/local-network-access
- Chrome for Developers, anúncio do prompt LNA e substituição da PNA: https://developer.chrome.com/blog/local-network-access

**Decisão técnica provisória:** não adicionar cabeçalhos PNA. Primeiro validar no Chrome real o prompt LNA, o destino usado (loopback ou IP LAN) e o resultado da chamada. Se a URL for loopback e o navegador bloquear por ausência de `targetAddressSpace`, corrigir o cliente de forma específica e cobrir o comportamento em teste compatível.
