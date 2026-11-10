# Checkpoint — contrato Local > LAN da Ficha

**Data:** 10/11/2026  
**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Branch:** `feat/offline-first-ficha`  
**HEAD de código inspecionado antes deste checkpoint:** `c10e9f8e3e6c4a2ff8c185ad59fdd4824ba64ef0`  
**Commit documental anterior neste ciclo:** `d34eb3bcedb6e26bcfcd37b1470073d1e9e3a74e`  
**Escopo:** registrar a decisão de autoridade da Ficha e iniciar a auditoria técnica do caminho atual de persistência. Nenhuma implementação de sincronização foi feita neste ciclo.

## Decisão confirmada

Gus confirmou que a Ficha é a fonte de verdade dos dados do próprio personagem:
- Com LAN disponível, salvar no dispositivo e no servidor.
- Sem LAN, salvar no dispositivo; exportação é opcional.
- Ao reconectar, sincronizar automaticamente a última versão válida da Ficha para o servidor.
- Divergência/revisão da cópia LAN não pode fazer o servidor vencer a Ficha.
- Baú e transferências compartilhadas permanecem operações LAN-only.

Contrato detalhado: [Persistência e sincronização da Ficha — Local > LAN](decisao-sincronizacao-ficha-local-lan.md).

## Inspeção realizada

Arquivos da branch consultados:
- `src/FichaOfflineApp.tsx`
- `src/FichaLocal.tsx`
- `src/inventarioAtivo.ts`
- `src/PainelInventarioLocal.tsx`
- `server/index.mjs`
- Documentação existente de auditoria do Inventário e README.

## Evidências observadas no código

- `FichaOfflineApp.tsx` carrega fichas por `listarPersonagens()` e grava criação/alterações por `salvarPersonagem()` / `salvarPatchPersonagem()`.
- O status de salvamento é local: a interface informa “Salvo neste dispositivo”.
- O app offline tem exportação e importação de backup JSON.
- O caminho inspecionado não verifica disponibilidade do servidor LAN ao abrir a Ficha.
- Não foi observada nesse fluxo persistência dupla nem rotina de sincronização automática na reconexão.
- `PainelInventarioLocal.tsx` continua identificado como somente leitura; consulta não executa uso, equipamento, recarga ou transferência.
- O servidor possui infraestrutura de autenticação local, rotas de Mesa/personagem e WebSocket de sinais, mas a inspeção parcial de `server/index.mjs` não comprova um contrato de persistência/sincronização da Ficha compatível com a decisão recém-confirmada.

## Classificação do ciclo

- **DECIDIDO:** contrato Local > LAN.
- **IMPLEMENTADO:** persistência local da Ficha e backup JSON, no escopo já existente.
- **NÃO IMPLEMENTADO:** detecção LAN na abertura; salvamento duplo; sincronização automática; autoridade de snapshot local no servidor; estados visuais LAN.
- **NÃO TESTADO:** integração da Ficha com o servidor LAN.
- **PENDENTE:** inspeção completa dos módulos de persistência da Ficha e das rotas de personagem do servidor, seguida de proposta técnica mínima para implementar o contrato sem sobrescrita ou duplicação.

## Próximo ciclo

1. Inspecionar integralmente `src/persistenciaFicha.ts`, `server/*personagens*` e os contratos de API/autenticação relacionados.
2. Mapear identidade da personagem, revisão, transação, autorização e respostas de gravação atualmente existentes.
3. Definir o menor incremento para detectar LAN e manter a gravação local como base, sem iniciar ainda operações compartilhadas do Inventário/Baú.
4. Acrescentar testes automatizados para salvamento local e preparação de sincronização; não declarar sincronização concluída antes dos testes integrados e humanos.
5. Atualizar este checkpoint e o documento de decisão ao fim de cada ciclo, registrando evidências, commit/HEAD e pendências reais.

## Segurança de escopo

Nenhuma migration, alteração Supabase, merge, mudança em `main` ou publicação foi realizada/autorizada neste ciclo.


## Complemento da auditoria — persistência e API LAN

A inspeção foi aprofundada em `src/persistenciaFicha.ts`, `src/servidorLocal.ts`, `server/personagens-local.mjs` e `server/auth-local.mjs`.

### Persistência no dispositivo

- `src/persistenciaFicha.ts` declara expressamente o IndexedDB como banco local primário e fonte de verdade no dispositivo.
- O módulo não importa autenticação, `fetch`, servidor ou transporte de rede.
- `salvarPatchPersonagem()` atualiza as chaves indicadas dentro de uma transação `readwrite`, verifica a geração da ficha e recusa alterações concorrentes na mesma chave; alterações em chaves distintas podem ser mescladas.
- A versão local usa IDs de personagem gerados como UUID (com hífens) e um identificador `geracao` para detectar substituição/restauração em outra aba.
- A aplicação offline chama esse módulo diretamente; não usa o cliente de API LAN.

### Persistência no servidor LAN

- O servidor **já possui** persistência SQLite de rascunhos de personagens, além de rotas de consulta, atualização, exclusão de rascunhos, conferência e ativação.
- `src/servidorLocal.ts` expõe cliente autenticado para essas rotas.
- Os IDs de personagem do servidor são 32 caracteres hexadecimais, sem hífens, distintos do UUID local da Ficha Offline.
- A atualização LAN usa `PUT /api/personagens/:id`, envia `expectedRevision` e o servidor compara com a revisão atual. Se divergir, responde HTTP 409 e não grava.
- A API exige sessão local válida, autoria do personagem e vínculo atual do jogador à Mesa. A ativação possui operação identificada e transação própria.
- O servidor impõe proteções adicionais a personagens completas/ativas: campos de criação não podem ser alterados pelo salvamento genérico; progressão e outros estados protegidos têm fluxos próprios.

### Consequências para a implementação Local > LAN

1. Não basta adicionar uma chamada `fetch` ao salvamento atual: os modelos e identificadores local/servidor ainda não são intercambiáveis.
2. Será necessário definir um vínculo persistente entre personagem local e personagem da Mesa no servidor, sem presumir que o UUID local possa substituir o ID hexadecimal já usado nas rotas.
3. O contrato atual de `expectedRevision` é adequado para o fluxo de rascunho LAN existente, mas não atende sozinho à decisão Local > LAN quando a revisão divergir. A adaptação deve ser específica ao fluxo de sincronização autoritativa, mantendo autorização, transação e idempotência.
4. É preciso decidir/definir como o snapshot local se relaciona com a ficha ativa no servidor, pois o PUT genérico atual protege dados de criação após ativação. Não contornar essa proteção com atualização genérica ou permissões mais amplas.
5. A sincronização precisa preservar os mecanismos locais de geração, fila serializada e proteção contra gravações concorrentes; a versão local confirmada não pode ser substituída por resposta LAN antiga.

**Conclusão deste complemento:** há dois caminhos de persistência separados — Ficha Offline em IndexedDB e personagem de Mesa no SQLite LAN. A integração entre eles ainda não existe. A arquitetura deve criar uma ponte explícita, autenticada e transacional; não fundir os dois módulos nem enfraquecer o contrato de ativação por conveniência.


### Testes existentes relevantes

- `tests/cliente-servidor-local.test.mjs` exercita cadastro/login, criação/consulta/atualização de rascunho, revisão crescente, persistência, rejeição HTTP 409 para revisão antiga e exclusão.
- O teste confirma que o contrato LAN atual preserva a cópia do servidor diante de uma tentativa de gravação com revisão antiga — comportamento correto para o fluxo atual de rascunho, mas diferente da nova regra Local > LAN.
- `tests/origem-salvamento-ficha.test.mjs` verifica mensagens que distinguem confirmação local de confirmação do servidor em componentes específicos. Não comprova salvamento duplo nem sincronização de reconexão.
- Esses testes existentes são evidência de cobertura dos fluxos separados. Não foram executados manualmente nesta auditoria; a CI disparada pelos commits documentais ainda estava em andamento no momento deste registro.

### Próxima decisão técnica recomendada (sem alterar o contrato funcional)

Antes de codificar a ponte, especificar:
- como uma ficha local é vinculada a uma personagem/mesa autenticada no servidor;
- como a versão local inicializa ou substitui o rascunho correspondente sem confundir IDs UUID locais e IDs hexadecimais LAN;
- como tratar personagem já ativa, respeitando os fluxos próprios de Progressão e Inventário e sem enfraquecer as proteções existentes;
- como o servidor registra uma operação de sincronização idempotente e aceita a versão local autoritativa sem usar a revisão LAN como critério de precedência;
- como a interface apresenta confirmação local e sincronização LAN separadamente.

**Não iniciar endpoint de sobrescrita irrestrita.** A solução deve limitar a sincronização à personagem do jogador autenticado, ao vínculo atual com a Mesa e ao conjunto de dados que a Ficha pode legitimamente editar.


---

## Segundo ciclo — arquitetura real das duas entradas e do salvamento LAN

**Data:** 10/11/2026  
**HEAD de código consultado:** `c10e9f8e3e6c4a2ff8c185ad59fdd4824ba64ef0`  
**HEAD documental antes deste complemento:** `41fc16e6cce202bc3e40ee0bc17a881167580464`

### Descoberta: existem duas aplicações/entradas distintas

- `src/main.tsx` seleciona `ConexaoServidorLocal` somente quando a URL contém `?servidor=local`.
- Sem esse parâmetro, a aplicação inicial é `FichaOfflineApp`.
- `FichaOfflineApp` é autônoma: não exige conta, não conhece Mesa/servidor e usa IndexedDB diretamente.
- `ConexaoServidorLocal` tem autenticação local, lista Mesas/personagens e abre a mesma apresentação `FichaLocal`, mas lê e grava diretamente no SQLite por HTTP.
- Portanto, hoje não existe um fluxo único que abra a Ficha e escolha entre salvar localmente ou na LAN. São dois caminhos separados.

### Evidências no fluxo LAN

- `ConexaoServidorLocal.tsx` restaura a sessão por cookie HttpOnly consultando `/api/health` e `/api/auth/me` no servidor.
- Ao abrir uma personagem, consulta `GET /api/personagens/:id`, valida que o `mesaId` corresponde à Mesa selecionada e guarda em localStorage apenas o contexto de navegação `accountId`, `mesaId` e `personagemId`.
- O salvamento atual monta um snapshot a partir dos dados LAN vigentes e envia `PUT /api/personagens/:id` com `expectedRevision`.
- A fila serializada, a geração de sessão e a verificação de personagem/Mesa impedem que operações atrasadas migrem para outra ficha ou sessão.
- A Ficha LAN não chama atualmente `salvarPersonagem` nem `salvarPatchPersonagem` do IndexedDB.

### Evidências no servidor

- `server/auth-local.mjs` mantém sessão em cookie HttpOnly e autentica cada chamada; o cliente não precisa persistir o token no localStorage no modo LAN.
- `server/personagens-local.mjs` verifica autoria e participação atual como Jogador para consultar ou alterar personagem.
- A rota PUT atual exige `expectedRevision`; revisão divergente retorna 409.
- Para personagens ativas, o PUT genérico bloqueia alterações em campos de criação/equipamento inicial. Estado de Progressão e campos de Economia/Turno também têm validações específicas.
- O SQLite tem migrações versionadas. A tabela `personagens_locais` já possui revisão, estado de ficha e inventário; a ativação tem recibo próprio. Não foi criada migration neste ciclo.

### Implicação para Local > LAN

A regra confirmada não pode ser implementada apenas dentro de `FichaOfflineApp` nem apenas adicionando IndexedDB ao botão de salvar sem resolver a entrada e a identidade.

A ponte precisa relacionar, de forma persistente e inequívoca:
- conta autenticada;
- Mesa;
- ID da personagem no servidor;
- registro/cache local correspondente;
- estado da personagem (rascunho ou ativa);
- última versão local válida e situação de sincronização.

Os IDs locais UUID e os IDs LAN hexadecimais devem continuar distintos, com um vínculo explícito. Não usar nome de personagem como chave de associação.

### Proposta técnica para o próximo incremento — AINDA NÃO APROVADA/IMPLEMENTADA

Manter `FichaLocal` como componente de interface comum e criar uma camada de persistência/coordenação no fluxo LAN:
1. Ao abrir uma personagem online, validar sessão, autoria e Mesa no servidor.
2. Persistir localmente um snapshot íntegro associado à conta/Mesa/ID LAN, mantendo o ID local próprio e um vínculo explícito.
3. Em cada salvamento, confirmar primeiro a transação local; depois tentar gravar na LAN. Mostrar separadamente “Salvo neste dispositivo” e “Sincronizado com a LAN”.
4. Se a LAN cair, continuar a partir do snapshot local previamente confirmado. Ao reconectar, autenticar novamente se necessário e enviar a última versão local válida automaticamente.
5. Criar um contrato de sincronização dedicado no servidor, sem relaxar o PUT genérico nem remover proteções de Progressão/ativação/Inventário. A rota deve autorizar conta, Mesa e personagem, validar o conjunto de campos e ser idempotente.
6. Definir como o usuário reabre a ficha cacheada quando o servidor está indisponível e como a identidade da conta é confirmada sem a sessão online. O cookie HttpOnly não pode ser lido pelo JavaScript; não armazenar senha/token como atalho.

### Questões que precisam ser resolvidas no desenho antes de codificar

- **Acesso offline e identidade:** qual UX autoriza abrir a cópia local quando não há servidor para validar a sessão? O contexto local existente ajuda a localizar a ficha, mas não prova autenticação atual.
- **Ficha ativa:** quais campos de uma ficha ativa podem ser sobrescritos pelo snapshot Local > LAN e quais continuam obrigatoriamente sujeitos aos fluxos específicos já existentes? Não contornar bloqueios de Progressão, ativação ou Inventário.
- **Entrada única:** o fluxo de jogador deve convergir para a entrada LAN com cache local, enquanto a entrada Offline independente permanece para fichas sem Mesa/conta? Esta é a proposta mais simples para evitar duplicar interfaces, mas precisa ser validada no planejamento.
- **Primeiro vínculo:** quando já existe uma ficha Offline e uma personagem LAN, a associação deve ser explícita pelo jogador; nunca inferida por nome.

### CI do ciclo documental anterior

No commit `41fc16e6cce202bc3e40ee0bc17a881167580464`:
- `TypeScript e Vite`: sucesso.
- `validar`: sucesso.
- `Supabase Preview`: ignorado (esperado para esta branch).

O presente complemento altera apenas documentação. A CI deste novo commit será conferida separadamente.

### Classificação atualizada

- **DECIDIDO:** Ficha local é a autoridade; sincronização Local > LAN automática; Baú/transferências compartilhadas permanecem LAN-only.
- **IMPLEMENTADO:** duas entradas separadas; IndexedDB no modo Offline; SQLite/API autenticada no modo LAN; revisão otimista no PUT atual; salvamento serializado e proteções de contexto.
- **NÃO IMPLEMENTADO:** cache local da Ficha LAN; vínculo entre IDs local e LAN; salvamento duplo; abertura offline da ficha de Mesa; sincronização automática; contrato LAN autoritativo.
- **NÃO TESTADO:** fluxo integrado Local > LAN.
- **PENDENTE:** fechar decisões de UX/identidade offline e delimitação de campos sincronizáveis de fichas ativas; depois implementar em incrementos pequenos.


---

## Terceiro ciclo — acesso offline da Ficha LAN aprovado

**Data:** 10/11/2026  
**Branch:** `feat/offline-first-ficha`  
**CI do HEAD documental anterior `6b4e07c9158f9191fbbcbcfe1d21f1b1b73e8005`:** `validar` sucesso; `TypeScript e Vite` sucesso; `Supabase Preview` ignorado (esperado).

### Decisão funcional confirmada por Gus

Quando o servidor LAN cair, o jogador poderá continuar usando a última cópia local válida da Ficha no mesmo dispositivo/navegador e contexto de conta/Mesa anteriormente utilizados. Os salvamentos continuam no dispositivo, sem exigir exportação ou intervenção manual.

Não será armazenada senha nem token de sessão para permitir esse acesso offline. A cópia local serve para continuidade da Ficha, mas não representa autenticação válida no servidor. Ao voltar a conexão, o aplicativo deve revalidar a sessão e a autorização no servidor antes de sincronizar.

### Fluxo de reconexão esclarecido

A expressão “o servidor pega a versão mais recente” significa, tecnicamente, que o cliente envia ao servidor a última versão local válida após restabelecer a conexão e revalidar a autenticação. O servidor não tem acesso direto ao IndexedDB do navegador. Após receber o snapshot, o servidor valida conta, Mesa, personagem, integridade e escopo dos campos e então persiste a versão local, respeitando a regra de autoridade Local > LAN.

Se autenticação ou autorização não puderem ser confirmadas, a cópia local continua preservada e a sincronização fica pendente. Não liberar Baú, transferências ou outras mutações compartilhadas offline.

### Classificação atualizada

- **DECIDIDO:** continuidade offline da Ficha no mesmo dispositivo/navegador e contexto previamente utilizado; sem armazenar credenciais/tokens; reautenticação e autorização obrigatórias antes da sincronização; cliente envia a versão local mais recente ao servidor.
- **IMPLEMENTADO:** ainda não há integração entre cache IndexedDB e fluxo LAN.
- **PENDENTE:** especificar a proteção/identificação local da cópia e a UX de reautenticação; definir campos sincronizáveis para ficha ativa; implementar vínculo explícito entre IDs local e LAN; criar contrato de sincronização autenticado e idempotente.
- **NÃO TESTADO:** abertura offline da Ficha LAN e reconexão/sincronização integrada.

Nenhum código, migration ou endpoint foi alterado neste ciclo; somente decisões e documentação foram atualizadas.


---

## Quarto ciclo — desenho técnico do cache local LAN

**Data:** 10/11/2026  
**HEAD de código consultado:** `c10e9f8e3e6c4a2ff8c185ad59fdd4824ba64ef0`  
**CI do checkpoint anterior `1678a96e99e9aa295add4dcddc2357f2084563e7`:** `TypeScript e Vite` sucesso; `validar` sucesso; `Supabase Preview` ignorado (esperado).

### Auditoria adicional

- `src/main.tsx` confirma duas entradas: `FichaOfflineApp` por padrão e `ConexaoServidorLocal` quando `?servidor=local`.
- `src/persistenciaFicha.ts` usa IndexedDB versão 2/store `personagens`; `PersonagemLocal` contém UUID local, geração, nome, datas e dados, mas não possui vínculo de conta/Mesa/personagem LAN.
- `salvarPatchPersonagem` confirma gravação transacional local, compara geração e valores-base das chaves alteradas e recusa conflito na mesma chave.
- `ConexaoServidorLocal.abrirFicha` valida a personagem consultada e persiste em localStorage somente o contexto de navegação (conta, Mesa, personagem LAN).
- `ConexaoServidorLocal.salvarDadosFicha` serializa salvamentos, monta snapshot completo sobre os dados LAN em memória e envia PUT com `expectedRevision`.
- `src/servidorLocal.ts` envia `{ name, data, expectedRevision }`; a rota atual não usa IndexedDB.
- `server/personagens-local.mjs` revalida sessão, autoria e vínculo atual como Jogador. O PUT exige revisão e mantém proteções próprias para Progressão, economia/turno e campos de criação/equipamento de personagens ativas.
- A rota atual não contém allowlist geral de campos para sincronização autoritativa; não se deve presumir que o snapshot inteiro seja seguro para sobrescrever.

### Documento criado

Foi criado `docs/desenho-tecnico-cache-ficha-lan.md`, com proposta de arquitetura e plano incremental. O documento distingue evidências do código, decisões já aprovadas, proposta ainda não aprovada e questões abertas. Não houve alteração de código, banco ou migration.

### CI documental

No commit `1678a96e99e9aa295add4dcddc2357f2084563e7`, os checks `TypeScript e Vite` e `validar` concluíram com sucesso; `Supabase Preview` foi ignorado conforme esperado.

### Classificação após o quarto ciclo

- **DECIDIDO:** Local > LAN; Ficha continua offline no mesmo dispositivo/navegador; sem credenciais persistidas; reautenticação e autorização antes de sincronizar; Baú/transferências LAN-only.
- **IMPLEMENTADO:** fluxos separados Offline/LAN, IndexedDB local, SQLite LAN, autenticação por cookie HttpOnly, revisão otimista no PUT, proteções de autoria/Mesa e salvamento local transacional por patch.
- **PROPOSTO, NÃO IMPLEMENTADO:** vínculo local-LAN, cache, local-first no fluxo LAN, endpoint de sync dedicado/idempotente, reconexão automática e estados separados na UI.
- **PENDENTE:** matriz de campos sincronizáveis, tratamento de duas cópias locais em dispositivos diferentes, modelo de vínculo/backup, UX de primeiro vínculo e troca de conta.
- **NÃO TESTADO:** qualquer fluxo integrado de cache, desconexão, reautenticação e sincronização.

**Próximo passo recomendado:** resolver as duas questões de autoridade que afetam a integridade antes de programar: (a) como tratar duas cópias locais válidas em dispositivos diferentes; (b) quais campos operacionais podem ser sincronizados em ficha ativa, sem contornar Progressão, ativação e Inventário.


---

## Quinto ciclo — política de divergência entre dispositivos aprovada

**Data:** 10/11/2026  
**HEAD documental anterior:** `361953181f0c15fc9f29013d8561f414dabc4a21`  
**CI desse HEAD no momento do registro:** `validar` e `TypeScript e Vite` ainda em andamento; `Supabase Preview` ignorado (esperado).

### Decisão aprovada por Gus

Se a mesma personagem tiver duas cópias locais válidas em dispositivos diferentes e elas divergirem, o sistema não escolherá automaticamente uma delas por timestamp, revisão do servidor ou ordem de reconexão.

O conflito deverá ser detectado e apresentado. As duas versões serão preservadas até resolução explícita; a sincronização daquela personagem ficará suspensa enquanto o conflito estiver aberto. Personagens sem conflito poderão continuar sincronizando normalmente.

A resolução deverá permitir comparar as versões e escolher explicitamente o conteúdo a manter. A cópia preterida não poderá ser descartada antes da confirmação. A aprovação não autoriza mesclagem automática nem alteração das proteções de Progressão, ativação ou Inventário.

### Classificação atualizada

- **DECIDIDO:** política de conflito multi-dispositivo sem vencedor automático; preservar as duas cópias e exigir resolução explícita antes de sincronizar a personagem divergente.
- **PENDENTE:** UX e granularidade da resolução (por seção/campo ou escolha integral); representação de snapshots e histórico de versões; tratamento de resolução em caso de campos protegidos.
- **IMPLEMENTADO:** nada referente à detecção/resolução multi-dispositivo; somente documentação.
- **NÃO TESTADO:** detecção, preservação e resolução de conflito multi-dispositivo.

Nenhum código, banco ou migration foi alterado neste ciclo.


---

## Sexto ciclo — matriz preliminar de campos de sincronização

**Data:** 10/11/2026  
**HEAD documental anterior:** `91170fc2cd8f2629c1bc01ba9cedf20a746544cc`  
**CI desse HEAD:** `validar` sucesso; `TypeScript e Vite` sucesso; `Supabase Preview` ignorado (esperado).

### Auditoria de campos

Inspecionados `FichaLocal.tsx`, `ConexaoServidorLocal.tsx`, `validacaoPersonagemLocal.ts`, `server/personagens-local.mjs` e `inventarioAtivo.ts`.

A UI separa salvamento de Identidade, Características, Atributos/Perícias, Inventário, Configuração de Funcionamento e Recursos. O servidor atual protege campos de criação/equipamento inicial em ficha ativa e impede alterações genéricas nas propriedades protegidas da Progressão. Somente `progressao.missoesCompletadas` é explicitamente editável pelo PUT atual; benefícios, Nível, método, Marcos e registros de Morte permanecem protegidos. Economia de Ações e estado do turno têm validações cruzadas com SA. Inventário materializado fica separado do JSON geral e é gravado no fluxo de ativação.

A validação local existente não equivale automaticamente a validação server-side. Em especial, identidade e vários recursos operacionais precisam de schema/validação explícita no servidor antes de serem incluídos em allowlist.

### Documento criado

Criado `docs/matriz-campos-sincronizacao-ficha.md`, com matriz preliminar por campo/grupo e distinção entre rascunho e ficha ativa. A proposta inicial é conservadora: nome e configuração de funcionamento como candidatos à primeira etapa, identidade somente após schema server-side; recursos, combate e demais domínios ficam pendentes de operações tipadas. Criação em rascunho deve continuar respeitando conferência/ativação; ficha ativa não pode alterar campos protegidos por sincronização genérica.

### Classificação

- **EVIDÊNCIA:** separação de callbacks na UI; proteções atuais de campos de criação e Progressão; agregado SA/economia/turno; inventário materializado separado.
- **PROPOSTA, NÃO APROVADA:** matriz e primeira allowlist estreita descritas no novo documento.
- **IMPLEMENTADO:** nenhuma alteração de código, banco ou rota.
- **PENDENTE:** aprovação da primeira allowlist; validação server-side dos campos candidatos; detalhamento de recursos operacionais, combate, identidade e sincronização de criação.
- **NÃO TESTADO:** nenhum teste de sync Local > LAN, pois a integração ainda não existe.

**Próximo passo:** submeter a proposta inicial de allowlist para decisão antes de implementar qualquer endpoint ou alterar o fluxo de salvamento.


---

## Ciclo — aprovação da primeira allowlist e validação técnica

**Data:** 10/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD documental consultado:** `17316d21c47400a02f8d2273e40bcfd7f5750ec7`

### Decisão do responsável

Gus aprovou a primeira allowlist restrita:
- **Nome da personagem** — incluído na primeira etapa.
- **Configuração de Funcionamento (`configuracaoFuncionamento`)** — incluída após validação server-side correspondente.
- **Identidade** — excluída da primeira etapa; só poderá entrar depois de schema/validação específica no servidor.
- Todos os demais campos continuam fora da sincronização genérica inicial e preservam seus fluxos protegidos.

### Evidências adicionais verificadas

- `src/FuncionamentoFichaLocal.tsx` persiste preferências pelo callback próprio `aoSalvar`; o objeto contém modo, preferências do modo Misto, modo de dados e visibilidade padrão das rolagens.
- `src/funcionamentoFicha.ts` exporta `configuracaoFuncionamentoValida()`, que verifica objeto estrito, chaves obrigatórias/opcionais, enums e conjunto exato de automações. Esse validador ainda não é chamado por `server/personagens-local.mjs`.
- O servidor já importa validadores TypeScript do domínio (`validarCriacaoServidor.ts`, `economiaAcoes.ts`, `estadoTurnoCombate.ts`, `progressaoPersistente.ts`), portanto a reutilização do validador compartilhado de Funcionamento é compatível com o padrão de imports existente; isso ainda precisa ser confirmado por teste de execução/build após a alteração.
- O editor/UI e a persistência local exigem nome entre **2 e 80 caracteres**; `nomeValido()` no servidor atualmente aceita entre **1 e 80**. A nova operação restrita deve alinhar o mínimo a 2, sem necessariamente alterar outros fluxos sem avaliar regressões.
- O fluxo LAN atual envia snapshot amplo pelo PUT com `expectedRevision`; ele não é adequado para ser reaproveitado como endpoint de sincronização autoritativa Local > LAN.

### Estado

- **DECIDIDO/APROVADO:** allowlist inicial descrita acima.
- **IMPLEMENTADO:** documentação da decisão e matriz atualizada neste ciclo.
- **NÃO IMPLEMENTADO:** endpoint restrito, persistência dupla, integração IndexedDB↔LAN, idempotência e sincronização de reconexão.
- **TESTADO:** CI do commit `17316d2` concluiu com sucesso em `validar` e `TypeScript e Vite`; `Supabase Preview` foi ignorado (branch não associado a preview). Isso valida o estado documental/código já existente, não uma implementação nova.
- **PENDENTE:** definir e implementar operação restrita para nome/configuração; adicionar testes de validação positiva/negativa e autorização; manter identidade fora da allowlist.

### Próximo ciclo

1. Especificar a rota/operação mínima com patch explícito apenas para `name` e `configuracaoFuncionamento`, incluindo idempotência, autorização, vínculo conta/Mesa/personagem e transação.
2. Reutilizar `configuracaoFuncionamentoValida()` no servidor, sem duplicar regras de domínio.
3. Testar nome inválido (1 caractere, >80, espaços), configuração inválida (chaves extras, enum inválido, automação ausente/tipo errado), sessão inválida, conta não autora e jogador removido da Mesa.
4. Não sincronizar Identidade, recursos, criação, Progressão, combate ou inventário por essa operação.
5. Atualizar este checkpoint e a matriz após o próximo incremento; não iniciar sincronização real antes de existir vínculo local↔LAN inequívoco.


### Registro complementar do desenho técnico

Após a aprovação da primeira allowlist, `docs/desenho-tecnico-cache-ficha-lan.md` foi atualizado para distinguir:
- allowlist funcional aprovada;
- arquitetura geral ainda em proposta;
- endpoint, payload, recibo e persistência idempotente ainda pendentes de especificação;
- identidade fora da primeira etapa.

**Commit documental:** `feea982faee0a246223a77a6c84f81c21885df5c`.

Nenhum arquivo de implementação foi alterado. O próximo ciclo deverá especificar a operação restrita e o vínculo local↔LAN antes de criar rota ou migration.


---

## Ciclo — contrato idempotente da primeira operação Local > LAN

**Data:** 10/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Commit de desenho:** `681a04e638b3050e1b66aa1fa419ed48a87fdb1c`

### Trabalho realizado

Foi especificado em `docs/desenho-tecnico-cache-ficha-lan.md` o contrato proposto para a operação dedicada de sincronização:
- patch estrito limitado a `name` e `configuracaoFuncionamento`;
- validação server-side e preservação de todos os demais campos;
- autenticação, autoria e participação atual como Jogador revalidadas dentro da transação;
- `expectedRevision` para detectar divergência multi-dispositivo;
- `operationId` idempotente e recibo persistido atomicamente;
- conflito 409 sem escrita e com cópia LAN recuperável;
- testes de autorização, payload, idempotência, rollback e regressão.

### Evidência técnica usada

- O servidor local usa SQLite e migrations versionadas 1–11 em `server/auth-local.mjs`.
- A rota de personagens já usa sessão autenticada, valida autoria e papel atual de Jogador.
- O PUT genérico usa `expectedRevision` e protege campos de criação, Progressão e estado de Combate; ele não será alterado para suportar o sync.
- `src/funcionamentoFicha.ts` exporta `configuracaoFuncionamentoValida()`, que valida modo, modoDados, visibilidade e conjunto exato das preferências de automação.
- O cliente LAN atual envia snapshot completo pelo PUT; a rota nova não deve reutilizar esse payload amplo.

### Estado

- **DECIDIDO/APROVADO:** primeira allowlist (Nome e Configuração de Funcionamento após validação server-side; Identidade excluída); Local > LAN; política de conflito entre dispositivos.
- **IMPLEMENTADO:** documentação do contrato técnico.
- **NÃO IMPLEMENTADO:** migration SQLite, tabela de recibos, endpoint POST de sync, cliente dedicado, vínculo local↔LAN, salvamento local-first e UI de conflito.
- **TESTADO:** ainda não há teste de implementação do contrato. CI do HEAD documental anterior foi consultada separadamente; não representa teste desse contrato.
- **PENDENTE:** fechar o modelo do vínculo e a persistência local de revisão/operationId; depois implementar migration e rota em ciclo isolado.

### Próxima etapa

Definir e implementar o vínculo local↔LAN e o modelo IndexedDB sem inferência por nome, incluindo compatibilidade com fichas Offline independentes, importação/exportação e troca de conta. Só então ligar a operação de sync à UI.


## Ciclo — proposta do vínculo local↔LAN no IndexedDB

**Commit de desenho:** `51952dca5a0b8dabbc3bf9ec8cfb0cdc7ef042b0`.

A auditoria confirmou que o IndexedDB atual está na versão 2 e contém somente o store `personagens`, com UUID local, geração, nome, datas e dados da Ficha. O backup JSON atual exporta/importa fichas independentes. O fluxo de entrada ainda separa `FichaOfflineApp` e `ConexaoServidorLocal`; não existe ainda uma aplicação única que faça seleção automática Local/LAN.

Foi proposta a versão 3 do IndexedDB com store separado `vinculosLan`, sem alterar os registros das fichas. O desenho inclui vínculo explícito por IDs de conta/Mesa/personagem, índice único remoto, revisão-base, estado de sync, operação pendente e snapshot LAN preservado em conflito. Fichas Offline preexistentes continuam independentes até vínculo explícito; backup/importação não copia vínculo nem credenciais.

- **DECIDIDO:** associação explícita; nunca inferir por nome; não armazenar credenciais; preservar local em revogação/conflito.
- **PROPOSTO:** store separado `vinculosLan`, migration IndexedDB v3.
- **NÃO IMPLEMENTADO:** migration v3, store, vínculo, snapshot remoto, sincronização.
- **PENDENTE:** UX para escolher/vincular ficha Offline existente, separação de contextos ao trocar conta e resolução visual de conflito.

## Auditoria de conclusão funcional — evidência adicional

A entrada atual ainda escolhe uma de duas aplicações por query string (`?servidor=local`): Offline independente ou LAN. A Ficha visual comum é reutilizada, mas a persistência e os adaptadores são separados. Isso confirma que a meta Local > LAN exige integração arquitetural, não apenas acrescentar uma chamada de rede ao salvamento atual.

A Ficha LAN atual enfileira patches e envia snapshot amplo por PUT com revisão. A nova rota restrita não deve ser ligada diretamente ao fluxo amplo atual. A implementação precisa primeiro introduzir cache local e vínculo inequívoco.

Os módulos oficiais do Jogador e Mestre foram consultados como base de verificação futura; não foram alteradas nem reinterpretadas regras do RPG neste ciclo.

## CI

No HEAD documental `35d32dd1197ec333fd41ad909469325cd457063f`, a última consulta indicou:
- `TypeScript e Vite`: sucesso;
- `validar`: em execução;
- `Supabase Preview`: ignorado.

O commit posterior `51952dc` e o checkpoint deste ciclo ainda precisam de CI própria.


---

## Ciclo — IndexedDB v3: store de vínculos LAN

**Data:** 10/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD consultado antes do registro:** `f7bc6791e72b98413240ff5eb8743b4a1f9bf14f`

### Objetivo

Implementar o primeiro incremento isolado do modelo de vínculo local↔LAN aprovado como próximo passo: adicionar metadados de vínculo em store separado, sem modificar o conteúdo das fichas existentes nem integrar ainda o envio à LAN.

### Alterações implementadas

- `src/persistenciaFicha.ts` agora declara a versão 3 do IndexedDB.
- Criado o store `vinculosLan`, com `localId` como chave primária.
- Criado índice único `remoteKey`, derivado de conta, Mesa e ID LAN da personagem.
- O store `personagens` permanece separado e os registros não recebem campos de conta, Mesa ou sincronização.
- Criados tipos para vínculo, estado de sincronização, operação pendente e snapshot LAN preservado em conflito.
- Criada validação estrita da estrutura do vínculo e dos estados permitidos. IDs LAN precisam ter 32 caracteres hexadecimais; revisão e versão local precisam ser inteiros não negativos.
- Criadas operações básicas de consulta, listagem, gravação e exclusão de vínculos.
- A estrutura não define nem persiste senha, cookie ou token de autenticação.
- O ID LAN armazenado é apenas referência; não representa autorização.

### Testes adicionados/ajustados

- `tests/persistencia-migracao.test.mjs`: cobertura da migração v1→v3 (incluindo geração histórica) e v2→v3 (preservação do registro existente e criação do novo store/índice único).
- `tests/vinculos-lan.test.mjs`: validação de vínculo, chave remota, ID LAN, estado, revisão, operação pendente, snapshot de conflito e rejeição de propriedades extras como credenciais.

### Classificação

- **IMPLEMENTADO:** estrutura IndexedDB v3, store separado, índice único, tipos, validação e operações básicas.
- **TESTES ESCRITOS:** migrações e validação de metadados.
- **TESTADO:** aguardando conclusão dos workflows GitHub Actions correspondentes ao HEAD deste ciclo. Não houve execução local do conjunto de testes.
- **NÃO IMPLEMENTADO:** criação de vínculo a partir de consulta autenticada; atualização atômica do snapshot da Ficha junto aos metadados; integração Local-first; endpoint servidor; recibos idempotentes; reconexão e UI de conflito.
- **PENDENTE:** testar CRUD real do store em IndexedDB; validar comportamento de índice único e colisão de vínculo; confirmar preservação de fichas em migração no navegador; revisar concorrência/imutabilidade do vínculo antes de ligar a UI.

### Riscos e limites

- Este incremento não altera a Ficha Offline nem a Ficha LAN e não deve ser interpretado como sincronização funcional.
- A API básica de gravação ainda precisa de endurecimento para impedir que uma atualização futura altere silenciosamente a identidade remota de um vínculo existente.
- O snapshot LAN de conflito é apenas estrutura de preservação; não há fluxo que o receba ou resolva.
- Nenhuma migration SQLite, rota de servidor, alteração Supabase, merge, mudança em `main` ou publicação foi realizada.

### Próximo ciclo

1. Fechar testes de CRUD do store e de colisão do índice único.
2. Tornar a identidade do vínculo imutável após criação, com operação de atualização restrita a metadados.
3. Testar atomicidade de atualização do vínculo e do snapshot local antes de começar o fluxo de cache LAN.
4. Em paralelo, continuar a auditoria funcional dos módulos da Ficha, priorizando lacunas que impedem considerá-la concluída antes do Inventário.


---

## Continuação — identidade imutável dos vínculos LAN

**Data:** 10/11/2026  
**HEAD do código consultado:** `f0ce3a8e47ff3571f9b315c0b5204f0ffdcd9969`

### Ajuste implementado

A primeira API de gravação do vínculo usava `put()` diretamente e, portanto, permitia substituir a identidade remota de um registro existente. Isso foi identificado na revisão e corrigido antes de qualquer integração com a UI.

- A criação agora usa operação add-only (`criarVinculoLan`), que não substitui um vínculo existente.
- A atualização passa por `salvarMetadadosVinculoLan`, que lê o registro dentro da transação `readwrite`, exige a `remoteKey` esperada e atualiza somente revisão-base, estado, operação pendente e snapshot de conflito.
- A função pura `atualizarMetadadosVinculoLan` preserva localId, conta, Mesa, personagem remoto e remoteKey.
- Revisão-base não pode retroceder.
- Propriedades adicionais fornecidas ao objeto de metadados são ignoradas; não entram no registro.
- A exclusão do vínculo continua separada da exclusão da Ficha local.

### Testes escritos

Foram adicionados testes para:
- preservação da identidade local/remota;
- rejeição de remoteKey divergente;
- rejeição efetiva de tentativa de reatribuir conta/personagem e de inserir credencial;
- rejeição de regressão da revisão-base.

### Estado

- **IMPLEMENTADO:** API add-only de criação e atualização restrita de metadados.
- **TESTES ESCRITOS:** validação e imutabilidade da identidade.
- **TESTADO:** workflows GitHub Actions ainda em execução na última consulta; não declarar aprovação até conclusão no HEAD correspondente.
- **PENDENTE:** teste de integração real de CRUD/índice único em IndexedDB, atomicidade entre registro de Ficha e vínculo, e fluxo de criação autenticada.
- **NÃO IMPLEMENTADO:** integração Local-first ou sincronização LAN.

### Observação de qualidade

O teste atual da migração usa IndexedDB simulado e comprova a lógica de upgrade/store declarada, mas não substitui teste em navegador com IndexedDB real. A colisão do índice único e as transações reais ainda precisam de cobertura de integração.



---

## Ciclo — cobertura de CRUD do vínculo LAN

**Data:** 10/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD de código/documentação antes deste registro:** `90183747afd157b88160c8b08280bd070a80c33a`

### Objetivo

Fechar parte da lacuna de testes identificada no ciclo anterior: além de validar o formato e a imutabilidade por funções puras, exercitar a API pública de criação, consulta, listagem e atualização do vínculo LAN.

### Alterações

- Criado `tests/vinculos-lan-persistencia.test.mjs`.
- O teste percorre `criarVinculoLan`, `obterVinculoLan`, `listarVinculosLan` e `salvarMetadadosVinculoLan`.
- Verifica rejeição de duplicidade de `remoteKey`, preservação da identidade local/remota após atualização e rejeição de chave remota divergente.
- O teste usa IndexedDB simulado com fila de operações e confirmação/abortamento transacional. Não adiciona dependências ao projeto.

### Classificação

- **IMPLEMENTADO:** teste automatizado de fluxo CRUD da API de vínculos usando ambiente simulado.
- **TESTES ESCRITOS:** cobertura adicional do ciclo de vida do vínculo.
- **TESTADO:** aguardando os workflows GitHub Actions iniciados para o commit `bf0a76d` e para a correção subsequente do teste. Não houve execução local.
- **PENDENTE:** integração em navegador com IndexedDB real; validação real do índice único e abortamento transacional; teste de atomicidade entre Ficha e vínculo.
- **NÃO IMPLEMENTADO:** integração Local-first, sincronização LAN, endpoint e interface de conflito.

### CI e segurança

Na consulta após o novo teste, os workflows de ficha offline e compilação foram iniciados para o commit `bf0a76d`; os workflows anteriores também permaneciam em execução. A aprovação depende de resultado concluído no HEAD mais recente, não apenas de execução iniciada.

Nenhuma alteração em `main`, migration SQLite/Supabase, merge ou publicação foi realizada.

### Próximo passo

1. Aguardar e verificar os resultados da CI no HEAD atual.
2. Se os testes passarem, prosseguir com auditoria funcional dos módulos da Ficha e priorizar lacunas pré-Inventário.
3. Manter o teste real de navegador como pendência explícita antes de confiar no comportamento do IndexedDB em produção.


---

## Auditoria paralela — pendências funcionais visíveis na Ficha

**Data:** 10/11/2026  
**HEAD consultado:** `096e5b0bb18cec3123582d3470669a5c2d72e01e`

### Evidências observadas

Inspeção parcial de `src/FichaLocal.tsx`, `src/ProgressaoFichaLocal.tsx`, `src/DescansoFichaLocal.tsx`, `src/ReanimacaoFichaLocal.tsx`, `src/RecursosFichaLocal.tsx`, `src/CondicoesFichaLocal.tsx` e `src/FuncionamentoFichaLocal.tsx`.

- **Proficiência e Inventário:** a própria Ficha informa que a validação automática de proficiência pela arma equipada depende da integração com Inventário (`FichaLocal.tsx`, observação da seção de proficiências).
- **Combate:** a Ficha informa que Iniciativa da Mesa, propriedades operacionais das armas e consumo de munição permanecem pendentes de integração. O painel atual registra economia de ações, mas não presume gatilhos ou aplica efeitos.
- **Condições:** a interface as descreve como informativas; a aplicação das regras depende da Mesa. Descanso Completo também informa que condições e progressões temporais não são atualizadas automaticamente.
- **Progressão:** há fluxo local de Progressão e registro local de Morte, mas a interface explicita que a edição LAN requer fluxo próprio de autorização e gravação; o registro de Morte fica pendente de confirmação do Mestre na LAN.
- **Recursos/Reanimação/Descanso:** existem painéis e regras de fluxo no código inspecionado. Esta inspeção textual não substitui testes completos de comportamento nem validação humana de todos os casos.

### Interpretação e limite

A afirmação “falta apenas Inventário” não pode ser generalizada para toda a arquitetura. O código contém funcionalidades offline implementadas e, ao mesmo tempo, pendências de integração LAN e de módulos dependentes (por exemplo, proficiência por arma, munição e Iniciativa da Mesa). Não classificar esses pontos como defeitos do modo Offline sem testes específicos.

Esta é uma auditoria parcial por evidências explícitas no código; ainda não constitui certificação de completude funcional da Ficha.

### Próximo passo

Continuar a matriz por módulo e por contexto (**Offline**, **LAN**, **Automático/Misto/Manual**), separando: implementado no código, coberto por teste automatizado, validado manualmente e pendente de integração. Não alterar regras ou comportamento durante a auditoria.


---

## Continuação — matriz de auditoria funcional e Inventário

**Data:** 10/11/2026  
**HEAD antes deste registro:** `8c36ca1ef50c82213bef81ef95e49156b19f2c24`

### Trabalho paralelo realizado

1. Auditoria de cobertura por módulos da Ficha, cruzando componentes, módulos de domínio e testes existentes.
2. Auditoria específica do Inventário, separando planejamento de criação, consulta somente leitura e gerenciamento ativo.
3. Consulta dos workflows GitHub Actions associados à branch.

### Artefatos

- Criado `docs/matriz-auditoria-funcional-ficha.md`.
- A matriz classifica áreas por evidência de código, testes existentes e pendências, separando Offline e LAN.
- A seção específica do Inventário registra as evidências abaixo.

### Evidências do Inventário

- **Implementado:** planejamento do equipamento inicial/compras; materialização de exemplares; catálogos; consulta e validação; expansão de capacidade; lógica de organização com prévia, confirmação explícita, recibos e recuperação de pedidos.
- **Testes existentes:** inventário ativo, consulta local, criação, expansão, persistência SQL, organização, múltiplos espaços e recuperação de sessão/pedido; também há uma fixture visual de QA.
- **Limite da fixture:** `tests/ui/inventario.tsx` usa dados fictícios em memória e declara que não há login, banco ou campanha, nem ações de uso, equipamento, transferência ou Baú.
- **Painel consultivo:** `src/PainelInventarioLocal.tsx` se identifica como somente leitura e oferece consulta, busca e filtros.
- **Ficha ativa:** `src/FichaLocal.tsx` mostra resumo dos itens materializados e informa que movimentação e gerenciamento contínuo ainda serão liberados.
- **Servidor:** `server/personagens-local.mjs` materializa `inventario_json` na ativação, dentro de transação e com recibo. As rotas identificadas nesse arquivo cobrem lista, ficha, conferência e ativação; não foi identificada rota para operações do Inventário ativo.
- **Integrações pendentes explícitas:** munição/recarga e propriedades operacionais das armas permanecem pendentes na própria Ficha.

### Conclusão provisória

A lacuna principal do Inventário não é falta de catálogos ou de lógica de domínio: é a ligação das operações contínuas à Ficha ativa e a um transporte/servidor com autorização, persistência e concorrência apropriadas. Não implementar operações em modo Offline compartilhado nem reutilizar a fixture de QA como se fosse interface de produção.

### CI

Na última consulta, os workflows disparados para o commit `576fae4` ainda estavam em fila; os anteriores também não tinham concluído. Aguardando conclusão no HEAD mais recente. Nenhum resultado de teste ou build foi declarado como aprovado.

### Próxima etapa paralela

- Auditar o contrato completo do domínio de organização e as rotas/serviços do servidor, identificando quais operações estão prontas para integração e quais ainda são apenas lógica isolada.
- Continuar a matriz de Características, Identidade, Atributos/Perícias e Habilidades.
- Retomar CI no HEAD atual antes de qualquer nova alteração de código.


---

## Continuação — auditoria de criação da Ficha

**Data:** 10/11/2026  
**HEAD de auditoria:** `03bb173a4cacfb04ea665d45777223c946dd0eb1`

### Evidências adicionais

- **Identidade:** editor narrativo e salvamento local estão cobertos; a sincronização LAN genérica permanece bloqueada por decisão de allowlist.
- **Atributos e Perícias:** editor e regras de distribuição têm testes de domínio e de integridade da criação, incluindo treinamento de Origem e casos especiais.
- **Habilidades:** catálogo, pré-requisitos, ramos, graus e progressão têm cobertura ampla. Planejamento não deve ser confundido com aplicação de ganhos.
- **Revisão/Ativação:** existem testes para pendências, conferência no servidor, ativação explícita, teto da Mesa, recibo e recuperação de resposta perdida.

### Classificação

- **IMPLEMENTADO:** base dos editores de criação, revisão e ativação, conforme módulos e testes consultados.
- **COBERTURA AUTOMATIZADA EXISTENTE:** os arquivos de teste citados na matriz cobrem domínio e parte dos contratos de interface/servidor.
- **PENDENTE:** validação manual E2E em navegador e duas contas reais; integração LAN de Identidade e Progressão; fluxo local-first ainda não implementado.
- **NÃO JUSTIFICADO:** reescrever os editores de criação sem evidência de defeito. Priorizar integração e testes de ponta a ponta.

### CI

Os workflows da branch continuam sem conclusão observada na última consulta. O commit mais recente da matriz dispara nova verificação; não declarar build/teste aprovado até receber conclusão no HEAD correspondente.


---

## Incremento 2 — fronteira real de persistência LAN do Inventário

**Data:** 10/11/2026  
**HEAD de código consultado:** `1c849b75e0e95c16eeaf0dba362836c607b9da00`  
**Commit da matriz atualizada:** `6d865fef45ceaad88ed0d3818bb3a23a165f8de1`

### Inspeção realizada

- `server/index.mjs`: SQLite em WAL, chaves estrangeiras habilitadas e roteamento para autenticação, Mesas e personagens.
- `server/personagens-local.mjs`: leitura de `inventario_json`, ativação transacional do rascunho e PUT genérico protegido.
- `src/servidorLocal.ts`: cliente LAN possui consulta, criação, ativação, exclusão e atualização genérica de personagem; não possui métodos para operações do Inventário ativo.
- `src/organizacaoInventario.ts` e `src/PainelOrganizacaoLocal.tsx`: lógica de prévia/consentimento/recibo e UI existem, mas a porta é injetada e os testes usam fixture de QA.
- `supabase/proposals/inventario-instancias.sql`: proposta separada com tabelas/RPC privadas e testes PostgreSQL; não é parte do backend SQLite/LAN.

### Estado correto

- **IMPLEMENTADO:** materialização inicial e persistência de `inventario_json` durante ativação LAN, com revisão, autorização, transação e recibo.
- **IMPLEMENTADO:** regras puras de organização e protocolo de recuperação/idempotência no cliente/QA.
- **PENDENTE:** leitura operacional e comandos do Inventário ativo no servidor LAN; adapter real para a porta de organização; UI integrada à Ficha ativa; testes de autorização, concorrência, repetição e falha de rede no SQLite.
- **NÃO AUTORIZADO:** reaproveitar PUT genérico para substituir o snapshot completo; aplicar proposta Supabase; expor Baú/transferência no modo Offline.

### Direção técnica recomendada (ainda não implementada)

Criar serviço/rota dedicada para operações do Inventário ativo, usando revisão esperada e ID idempotente de operação. A transação deve revalidar sessão, papel de Jogador, vínculo atual à Mesa, personagem ativa, snapshot válido, exemplar e pré-condições do comando; aplicar somente a operação autorizada; persistir snapshot/revisão/recibo atomicamente; emitir sinal Realtime após commit. O cliente deve consultar novamente o snapshot autorizado após confirmação ou resposta ambígua. O endpoint não deve aceitar snapshot arbitrário do cliente nem permitir comandos fora da matriz canônica.

A matriz de comandos e seus efeitos exatos ainda depende de cruzamento com o Arquivo do Jogador v1.0. Não codificar operações de uso/equipamento, munição, durabilidade ou descarte por inferência.

### CI

Na consulta atual, os workflows dos commits `1c849b7`, `03bb173`, `bb48c48`, `8c36ca1` e `62e3fc2` permanecem em fila. Não há conclusão aprovada ou falha confirmada para o HEAD mais recente. A fila crescente impede atribuir aprovação aos testes escritos.

### Próxima etapa

1. Conferir o Arquivo do Jogador v1.0 e a minuta de Planejamento v2.6 apenas como material de referência; respeitar v2.5 até validação explícita de nova versão.
2. Extrair uma matriz de operações do Inventário (pré-condições, campos alterados, modo permitido, efeitos e confirmação) sem inventar regra.
3. Inspecionar o esquema real SQLite de personagens/ativação e testes de servidor para desenhar a menor extensão transacional.
4. Em paralelo, preparar testes de rota/serviço LAN com duas contas e cenários de revisão/duplicidade, antes de implementar.
