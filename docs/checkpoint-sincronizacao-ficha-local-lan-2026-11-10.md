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
