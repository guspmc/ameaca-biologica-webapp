# Desenho técnico proposto — cache local e sincronização da Ficha LAN

**Data:** 10/11/2026  
**Status:** proposta técnica para revisão; não implementada e ainda não aprovada como arquitetura final. A primeira allowlist funcional foi aprovada em 10/11/2026 e está registrada na seção 4.1.  
**Base de código inspecionada:** branch `feat/offline-first-ficha`; HEAD consultado antes deste documento: `1678a96e99e9aa295add4dcddc2357f2084563e7`.

Este desenho traduz as decisões já confirmadas por Gus em uma proposta incremental. Não altera o cânone do RPG, não aprova a minuta do Planejamento v2.6 e não autoriza alterações no branch principal.

## 1. Evidências do código atual

### Entradas

- `src/main.tsx` escolhe `ConexaoServidorLocal` quando a URL contém `?servidor=local`; sem esse parâmetro, inicia `FichaOfflineApp`.
- O fluxo Offline é independente de conta/Mesa e persiste fichas no IndexedDB.
- O fluxo LAN autentica por cookie HttpOnly, consulta Mesas/personagens e utiliza o SQLite do servidor.
- A Ficha visual comum é `FichaLocal`, mas seus adaptadores de persistência são diferentes.

### Persistência local

- `src/persistenciaFicha.ts` usa o banco IndexedDB `ameaca-biologica-ficha`, versão 2, store `personagens`.
- `PersonagemLocal` tem `id` UUID local, `geracao`, nome, datas e `dados`. Não tem vínculo com conta, Mesa ou ID LAN.
- `salvarPatchPersonagem` faz leitura e gravação em uma transação `readwrite`, verifica geração e valores-base das chaves alteradas e recusa conflitos na mesma chave.
- O módulo local não importa transporte de rede nem autenticação.

### Salvamento LAN

- `ConexaoServidorLocal.abrirFicha` consulta a personagem no servidor e guarda em localStorage apenas o contexto de navegação `accountId`, `mesaId`, `personagemId`.
- `salvarDadosFicha` enfileira os salvamentos, monta `dadosAtualizados` a partir do snapshot LAN em memória e chama `atualizarPersonagem` com `expectedRevision`.
- O cliente `src/servidorLocal.ts` envia o objeto completo `{ name, data, expectedRevision }` por PUT.
- O servidor valida sessão, autoria e vínculo atual de Jogador na Mesa. O PUT genérico compara revisão e retorna 409 se ela divergir.
- O fluxo LAN atual não grava a Ficha em `persistenciaFicha.ts`.

### Restrições atuais do servidor

- Progressão persistente não pode ser criada/removida pelo PUT genérico; Classe/Nível e campos protegidos da Progressão exigem fluxos próprios.
- Em personagem ativa, o PUT genérico impede alterações nos campos de criação e equipamento inicial listados em `server/personagens-local.mjs`.
- Economia de Ações e estado do turno possuem validações de consistência.
- A tabela de personagens possui estado, revisão e inventário separado; ativação usa recibo próprio e não pode ser revertida.
- Não existe hoje allowlist geral e explícita de campos que uma sincronização Local > LAN pode atualizar.

## 2. Arquitetura proposta

### 2.1 Vínculo local explícito

Ao abrir uma personagem pela LAN, depois de autenticar e confirmar autorização no servidor, criar/atualizar um registro local vinculado à personagem remota. O vínculo deve conter, no mínimo:

- ID local UUID;
- ID da conta;
- ID da Mesa;
- ID da personagem LAN (32 caracteres hexadecimais);
- geração local;
- estado da personagem (rascunho/ativa);
- versão local monotônica ou identificador de snapshot;
- estado da sincronização e referência da última operação confirmada.

O ID local e o ID LAN continuam distintos. Não associar personagens por nome, posição na lista ou semelhança de conteúdo. A primeira associação entre uma ficha Offline independente e uma personagem LAN exige ação explícita do jogador.

**Ponto de desenho:** avaliar se o vínculo será metadado opcional no registro local ou store separado no IndexedDB. Store separado isola melhor fichas pessoais Offline das fichas vinculadas a Mesas; a escolha depende da estratégia de migração e backup. Não modificar o banco antes de fechar esse detalhe.

### 2.2 Abertura online

1. Restaurar/validar a sessão pelo mecanismo atual do servidor.
2. Consultar a personagem e confirmar conta proprietária, Mesa e papel de Jogador.
3. Criar ou atualizar o cache local vinculado.
4. A partir desse momento, a Ficha deve operar sobre a persistência local como primeira confirmação.
5. Se o servidor estiver disponível, enviar a versão local válida para sincronização; não considerar a ficha sincronizada antes da confirmação do servidor.

Na primeira abertura, ainda é necessário definir como tratar uma cópia local anterior já existente e se ela é uma ficha Offline independente ou cache da personagem LAN. Não mesclar automaticamente.

### 2.3 Salvamento durante a sessão

- Reutilizar a transação local e as proteções de geração/conflito de `salvarPatchPersonagem`.
- Confirmar primeiro a gravação local.
- Após a confirmação local, marcar sincronização pendente e tentar envio LAN.
- Se o servidor estiver indisponível, manter a edição e a cópia local; não bloquear o jogador.
- Se o servidor confirmar, atualizar somente metadados de sincronização e a revisão LAN recebida. A resposta do servidor não pode substituir o snapshot local por dados mais antigos.
- A interface precisa distinguir “Salvo neste dispositivo” de “Sincronizado com a LAN”.

### 2.4 Reconexão

1. Detectar disponibilidade LAN sem depender exclusivamente do WebSocket; a conexão HTTP autenticada é a verificação efetiva.
2. Revalidar a sessão com o cookie HttpOnly e consultar autorização atual da conta na Mesa/personagem.
3. Se autenticação/autorização falhar, preservar a cópia local e manter sincronização pendente. Não liberar operações compartilhadas.
4. Enviar o último snapshot local íntegro e confirmado, com identificador idempotente da operação, geração e versão local.
5. O servidor valida o escopo e persiste a operação em transação.
6. Se a resposta se perder, repetir a mesma operação idempotente e recuperar o recibo, sem duplicar efeitos.
7. Após confirmação, marcar aquele snapshot como sincronizado. Se uma edição local mais nova ocorreu durante o envio, manter pendência e enviar a versão seguinte.

A revisão LAN pode ser registrada e incrementada, mas não deve ser usada para dar precedência à cópia do servidor sobre a cópia local aprovada.

## 3. Contrato de servidor proposto

Criar rota/ação dedicada de sincronização, em vez de enfraquecer o PUT genérico atual.

Requisitos:

- autenticar a conta em cada chamada;
- confirmar que a personagem pertence à conta e que a conta ainda é Jogador da Mesa;
- conferir que Mesa e personagem enviados correspondem ao vínculo existente;
- aceitar apenas payload versionado e validado;
- aplicar allowlist de campos sincronizáveis;
- preservar os fluxos próprios de Progressão, ativação e Inventário;
- gravar snapshot e recibo idempotente na mesma transação;
- associar `operationId` à conta, Mesa, personagem, geração e versão local;
- ao repetir o mesmo `operationId` com o mesmo conteúdo, devolver o recibo anterior; se o conteúdo divergir, rejeitar;
- não permitir que a rota atualize personagem de outro jogador, mude autoria, Mesa, estado de ativação ou inventário protegido;
- emitir evento de atualização apenas depois do commit.

Não criar endpoint de sobrescrita irrestrita. Não remover a proteção de revisão do PUT genérico nem relaxar as verificações existentes.

## 4. Campos e fichas ativas: delimitação obrigatória

A interface `FichaLocal` chama adaptadores distintos para Identidade, Características, Atributos/Perícias, Inventário, Configuração de Funcionamento e Recursos. O servidor atual tem regras específicas para Progressão, Economia de Ações, turno, criação e equipamento inicial.

A primeira allowlist funcional já foi aprovada, mas isso não aprova a arquitetura completa de sincronização. Antes de habilitar sync para personagens ativas, construir uma matriz explícita:

| Grupo | Evidência atual | Tratamento proposto |
|---|---|---|
| Identidade | Há callback próprio para nome e `identidade` | Validar campos e incluir somente os autorizados |
| Características/criação | Callback próprio; campos protegidos após ativação | Não sincronizar alterações protegidas em ficha ativa |
| Atributos e Perícias | Callback próprio; campos protegidos após ativação | Não sincronizar alterações protegidas em ficha ativa |
| Inventário inicial | Callback próprio e inventário separado no servidor | Preservar fluxo/proteção atual; Baú e transferências nunca offline |
| Configuração de Funcionamento | Callback próprio | Candidato a campo sincronizável; validar esquema |
| Recursos/estado operacional | Callback genérico; inclui estados com validação específica | Mapear chave por chave antes de permitir sync |
| Progressão persistente | Regras de servidor e fluxo próprio | Excluir da rota genérica de sync; usar fluxo próprio |
| Estado de ativação/recibos | Controlado pelo servidor | Nunca aceitar do snapshot local como autoridade |

A tabela é orientação de análise, não uma allowlist já aprovada. Os nomes exatos e as estruturas de cada campo precisam ser conferidos com os tipos/validadores e com as regras oficiais antes de implementação.

### 4.1 Primeira allowlist aprovada em 10/11/2026

O responsável aprovou o seguinte escopo inicial para sincronização restrita:
- **Nome da personagem:** permitido, com validação server-side alinhada ao limite de 2–80 caracteres já exigido pela interface e pelo armazenamento local.
- **`configuracaoFuncionamento`:** permitido somente após o servidor executar o validador compartilhado `configuracaoFuncionamentoValida()` (ou validação equivalente sem divergência) e os testes cobrirem entradas válidas e inválidas.
- **`identidade`:** expressamente fora da primeira allowlist; depende de schema e validação server-side específicos.

Esta decisão não autoriza enviar o objeto completo da Ficha, não torna o PUT genérico uma rota de sync e não libera nenhum outro campo. O endpoint dedicado deverá aceitar somente patches explícitos desses campos, validar sessão/autoria/vínculo de Jogador na Mesa, registrar operação idempotente e preservar a cópia local. O contrato exato de rota, payload, recibo e persistência ainda será especificado antes da implementação.

## 5. Acesso offline e segurança

Decisão funcional já aprovada: a última cópia local válida pode ser aberta no mesmo dispositivo/navegador e contexto de conta/Mesa anteriormente utilizado; a Ficha continua funcionando; não armazenar senha ou token; reautenticar e revalidar autorização antes de sincronizar.

Implicações:

- localStorage/IndexedDB são mecanismos de localização e continuidade, não prova criptográfica de identidade;
- não armazenar cookie, token de sessão, senha ou credencial em IndexedDB/localStorage;
- o cache deve ficar separado por conta/Mesa/personagem para evitar exibição cruzada acidental;
- quando a LAN retornar, se a conta perdeu o vínculo com a Mesa ou a personagem foi removida, bloquear sincronização e operações online, preservar os dados locais e informar claramente o motivo;
- definir posteriormente a UX para dispositivo compartilhado e troca de conta, sem apagar automaticamente dados locais pendentes.

## 6. Riscos e questões ainda abertas

1. **Múltiplos dispositivos:** cada dispositivo pode ter uma cópia local diferente. A decisão Local > LAN define a precedência local, mas ainda não especifica como arbitrar duas cópias locais válidas em dispositivos diferentes. Não inventar regra de “último timestamp vence”.
2. **Ficha ativa:** é necessária uma allowlist completa e a separação entre campos operacionais editáveis e campos protegidos/geridos por fluxos próprios.
3. **Primeiro vínculo:** definir a UX para vincular uma ficha Offline preexistente a uma personagem LAN sem inferência por nome.
4. **Migração IndexedDB:** definir store separado ou metadados e compatibilidade com backup JSON já existente.
5. **Edição durante sincronização:** definir coalescência de snapshots e recibos para que uma versão local mais nova nunca seja marcada como sincronizada por uma resposta referente à versão anterior.
6. **Revogação enquanto offline:** a cópia local permanece preservada; a autorização só pode ser revalidada quando o servidor voltar.

## 7. Plano incremental sugerido

1. Fechar a matriz de campos sincronizáveis e a política para múltiplos dispositivos.
2. Definir e testar o modelo de vínculo local sem alterar ainda o fluxo de salvamento.
3. Implementar persistência/cache local para uma personagem LAN, com testes de isolamento por conta/Mesa/personagem.
4. Implementar salvamento local-first no fluxo LAN, mantendo sincronização desativada até o contrato servidor estar pronto.
5. Implementar endpoint dedicado, validação de campos, transação e recibo idempotente.
6. Integrar envio online e reconexão automática.
7. Implementar estados visuais separados de persistência local e sincronização LAN.
8. Testar rascunhos e depois fichas ativas, duas contas, duas abas, dois dispositivos, perda de rede, resposta ambígua, revogação e regressões de ativação/Progressão/Inventário.

## 8. Classificação

- **DECIDIDO:** Ficha local prevalece; salvamento local-first; reconexão automática; uso offline no mesmo dispositivo/navegador sem guardar credenciais; reautenticação antes de sincronizar; Baú/transferências compartilhadas LAN-only; política de divergência multi-dispositivo; primeira allowlist (nome e `configuracaoFuncionamento` após validação server-side; identidade excluída).
- **IMPLEMENTADO:** persistência IndexedDB Offline; persistência LAN em SQLite; autenticação por cookie HttpOnly; PUT LAN com revisão otimista; validação de autoria/Mesa; fila de salvamento LAN; transação local com geração e conflito por chave.
- **NÃO IMPLEMENTADO:** vínculo local-LAN; cache local da Ficha LAN; salvamento duplo; abertura offline da Ficha LAN; rota idempotente Local > LAN; sincronização automática; estados de sync na UI.
- **NÃO TESTADO:** fluxo integrado de cache, desconexão, reautenticação e reconexão.
- **PENDENTE:** contrato exato da operação idempotente para a primeira allowlist; modelo de vínculo/backup; UX de primeiro vínculo e troca de conta; demais campos operacionais e de criação.


## Política para divergência entre dispositivos — aprovada em 10/11/2026

Gus aprovou a proposta de não escolher automaticamente entre duas cópias locais válidas da mesma personagem quando elas divergirem após uso em dispositivos diferentes.

- Não usar timestamp, revisão LAN ou ordem de reconexão como critério automático para descartar uma das versões.
- Detectar e sinalizar a divergência entre a cópia local e a versão atualmente persistida no servidor.
- Preservar ambas as versões até que o conflito seja resolvido, sem sobrescrita silenciosa.
- A sincronização dessa personagem fica suspensa enquanto a divergência não for resolvida; outras personagens sem conflito podem continuar sincronizando.
- A resolução deverá permitir comparar as versões e decidir explicitamente qual conteúdo manter, sem apagar a cópia preterida antes de confirmação e sem contornar as validações de Progressão, ativação e Inventário.

A interface exata e a granularidade da resolução (por seção/campo ou escolha integral de uma versão) permanecem pendentes de desenho. Esta aprovação define a política de integridade, não autoriza ainda um mecanismo de mesclagem automática.


## 9. Contrato técnico proposto — primeira operação Local > LAN

**Estado:** desenho técnico para implementação; não é código executável nem autorização para alterar o PUT genérico.

### 9.1 Escopo do patch

A operação dedicada aceitará somente:
- `name` (opcional no patch): string normalizada com `trim()`, entre 2 e 80 caracteres;
- `configuracaoFuncionamento` (opcional no patch): objeto validado no servidor por `configuracaoFuncionamentoValida()`.

O patch deve conter pelo menos um desses campos. Rejeitar propriedades desconhecidas, tipos inesperados, objetos adicionais no nível raiz e qualquer tentativa de enviar `data` completo, Identidade, Progressão, Recursos, Combate, Inventário ou estado de ativação. A validação de nome deve ser alinhada ao contrato local/UI; não relaxar a validação existente.

O servidor deve aplicar somente os campos presentes:
- para `name`, atualizar a coluna `nome`;
- para `configuracaoFuncionamento`, ler `dados_json`, substituir somente essa chave e preservar todas as demais chaves existentes.

Não interpretar campo ausente como exclusão ou reset. Não aplicar valores padrão silenciosamente a um patch inválido.

### 9.2 Rota e autorização

Criar rota específica sob `/api/personagens/:id/sincronizar`, aceitando somente POST. Reutilizar a autenticação atual por sessão/cookie HttpOnly e repetir, dentro da transação, as verificações de:
- personagem existente e pertencente à conta autenticada;
- vínculo atual da conta como Jogador na Mesa da personagem;
- ID de personagem no formato já usado pelas rotas LAN.

Mestre, conta externa, sessão ausente/expirada ou jogador removido não podem sincronizar. Responder sem revelar existência de personagem para conta não autorizada, seguindo o padrão 404 das rotas atuais.

A rota não altera proprietário, Mesa, status de ativação, inventário ou recibos de outros fluxos. O PUT genérico permanece intacto.

### 9.3 Revisão e conflito multi-dispositivo

O pedido deve conter `expectedRevision`, revisão LAN que serviu de base para a cópia local, além de `operationId` UUID.

Dentro de transação SQLite `BEGIN IMMEDIATE`:
1. revalidar personagem, conta e participação;
2. verificar se `operationId` já foi recebido;
3. se for repetição idêntica, devolver o recibo original sem reaplicar alteração;
4. se o mesmo ID vier com conta/personagem/payload diferentes, rejeitar com conflito;
5. comparar `expectedRevision` com a revisão atual;
6. se divergirem, não alterar nada e devolver conflito com a versão LAN atual autorizada, para preservação/comparação explícita das duas cópias;
7. validar estritamente o patch;
8. aplicar somente os campos permitidos, incrementar revisão e gravar recibo na mesma transação;
9. confirmar a transação e só então emitir evento de atualização.

A revisão não dá precedência automática à LAN. Ela detecta que a base mudou. Como a política multi-dispositivo aprovada proíbe escolher automaticamente uma das versões, divergência deve suspender a sincronização daquela personagem e preservar cópia local e cópia LAN.

### 9.4 Recibo idempotente

Criar tabela própria por migration versionada do servidor local (próxima versão após a 11), sem alterar migrations Supabase. O recibo deverá permitir recuperar:
- `operationId` único;
- conta, Mesa e personagem;
- revisão LAN de base;
- hash determinístico do payload permitido;
- revisão LAN resultante;
- instante de confirmação.

A chave de idempotência deve impedir reutilização do mesmo `operationId` em outra conta/personagem. Repetição com o mesmo conteúdo retorna o recibo já confirmado; repetição com conteúdo diferente é rejeitada. Recibo e alteração da personagem precisam ser gravados atomicamente.

A resposta de repetição não deve mandar o cliente substituir seu snapshot local por uma personagem atual possivelmente mais nova; deve identificar a operação/revisão que foi confirmada. O cliente consulta a versão atual separadamente quando necessário.

### 9.5 Respostas e estados de sincronização

Contrato de resultado:
- **confirmado:** recibo com `operationId`, `expectedRevision` e revisão resultante;
- **conflito de revisão:** status 409, sem escrita, incluindo versão LAN atual para comparação;
- **reutilização divergente de operationId:** status 409, sem escrita;
- **payload inválido:** status 422, sem escrita;
- **não autorizado/sem sessão:** 401 ou 404 conforme padrão existente.

O cliente só marca o patch como sincronizado quando reconhecer o recibo da operação exata. Falha de transporte mantém o mesmo `operationId` para repetição segura. Um novo patch recebe novo ID. Resposta antiga nunca pode marcar como sincronizada uma edição local posterior.

### 9.6 Testes obrigatórios antes de integrar a UI

1. nome válido, trim, 1 caractere, 81 caracteres e tipo inválido;
2. configuração válida e inválida (modo, modoDados, visibilidade, preferência ausente, tipo inválido e chave extra);
3. patch vazio, chave desconhecida, envio de `data` completo e tentativa de alterar Identidade/Progressão/Recursos/Inventário;
4. sessão ausente/expirada, conta diferente, Mestre e jogador removido;
5. revisão atualizada por outro dispositivo: 409, sem alteração, com cópia LAN recuperável;
6. repetição idêntica de operationId: mesmo recibo e nenhuma revisão adicional;
7. mesmo operationId com payload ou personagem diferente: rejeição;
8. falha entre gravação da personagem e recibo: rollback integral;
9. evento Realtime somente depois do commit;
10. regressão do PUT genérico, ativação, Progressão e inventário.

### 9.7 Pré-condições ainda pendentes para implementação

- Definir vínculo local↔LAN explícito e persistente, sem associação por nome.
- Definir onde ficam `expectedRevision`, `operationId` pendente e recibos no IndexedDB.
- Definir como a UI reabre e compara a versão LAN em conflito.
- Implementar e testar a migration SQLite e a rota dedicada.
- Integrar salvamento local-first antes de habilitar envio automático.

Nenhuma dessas pré-condições autoriza substituir a política Local > LAN ou escolher automaticamente entre cópias divergentes.


## 10. Modelo proposto de vínculo IndexedDB local↔LAN

**Estado:** proposta técnica para validação em implementação; ainda não implementada.

### 10.1 Store separado

A ficha local atual usa IndexedDB `ameaca-biologica-ficha`, versão 2, store `personagens`. Cada personagem possui UUID local, geração, nome, datas e `dados`; não possui identidade LAN.

Proposta: elevar o banco para versão 3 e criar store separado `vinculosLan`, mantendo os registros de `personagens` intactos. Não colocar IDs de conta/Mesa/personagem remota dentro do objeto de ficha nem misturar metadados de sincronização com os dados do RPG.

Registro mínimo proposto:
- `localId` (UUID, chave primária e vínculo com `personagens.id`);
- `accountId`, `mesaId`, `personagemId` LAN;
- `remoteKey` determinística composta por conta/Mesa/personagem, com índice único para impedir dois vínculos locais simultâneos para a mesma personagem remota no mesmo navegador;
- `baseRevision` (última revisão LAN conhecida e aceita);
- `syncState` (sincronizado, pendente, conflito ou bloqueado por autorização);
- operação pendente (`operationId`, hash/conteúdo permitido e revisão de base), quando houver;
- snapshot LAN preservado em conflito, sem substituir o snapshot local.

A estrutura não armazena senha, cookie, token ou credencial. O ID remoto não serve como prova de autorização.

### 10.2 Primeiro vínculo

- Vínculo é criado somente a partir de uma personagem consultada pela LAN após autenticação e confirmação de papel Jogador.
- Não associar por nome, conteúdo semelhante, posição na lista ou UUID gerado localmente.
- Uma ficha Offline preexistente não será vinculada automaticamente. O fluxo de escolha e confirmação explícita ainda precisa ser desenhado; até lá, ela permanece independente.
- Ao abrir uma personagem LAN já vinculada, carregar o registro local correspondente e comparar a revisão LAN com a base registrada antes de decidir se há conflito.

### 10.3 Backup e troca de conta

- O backup JSON atual representa fichas Offline. Exportar/importar uma ficha não deve copiar silenciosamente vínculo LAN nem estado de autenticação.
- Importação restaura ficha como independente; um novo vínculo exige fluxo explícito e autorização online.
- Ao trocar de conta, não apagar registros locais pendentes. A UI deverá separar contextos e não expor uma ficha vinculada a outra conta como se estivesse autorizada; essa experiência de seleção/privacidade continua pendente.
- Revogação ou remoção da Mesa bloqueia sincronização, preserva cópia local e snapshot de conflito.

### 10.4 Escrita atômica local

A atualização do snapshot da ficha e dos metadados de sincronização precisa ocorrer na mesma transação IndexedDB quando forem dependentes. O cliente só avança `baseRevision` depois de confirmar o recibo da operação correspondente. Uma edição local posterior ao início do envio permanece pendente e nunca é marcada como sincronizada pela resposta antiga.

### 10.5 Limites

Este modelo não autoriza sincronizar dados além da primeira allowlist, não implementa merge automático, não permite Baú/transferências offline e não altera a política de conflito entre dispositivos. A UI de comparação e resolução continua pendente.
