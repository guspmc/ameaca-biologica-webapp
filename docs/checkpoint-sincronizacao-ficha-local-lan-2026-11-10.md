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
