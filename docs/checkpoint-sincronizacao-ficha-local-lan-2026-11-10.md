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
