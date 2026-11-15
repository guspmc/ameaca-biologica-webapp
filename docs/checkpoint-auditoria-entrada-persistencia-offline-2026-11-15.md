# Checkpoint — auditoria da entrada e persistência Offline

**Data:** 15/11/2026  
**Frente:** Ficha Offline PWA  
**Fase:** 0 — Preparação Offline  
**Branch:** `feat/offline-first-ficha`  
**HEAD auditado:** `d77ad7164c8f4b89ccdda5d24c87cbc568c8fae1`  
**Estado:** inspeção estática concluída neste incremento; CI e validação em navegador pendentes.

## Objetivo

Aprofundar a auditoria do caminho de entrada Offline, do Service Worker e da persistência IndexedDB sem alterar regras, interface, banco ou fluxo LAN.

## Evidências consultadas

- `src/main.tsx`
- `src/FichaOfflineApp.tsx`
- `src/persistenciaFicha.ts`
- `src/validacaoPersonagemLocal.ts`
- `public/sw.js`
- `tests/entradas-offline-sem-supabase.test.mjs`
- `tests/persistencia-migracao.test.mjs`
- `tests/persistencia-operacoes.test.mjs`
- `tests/persistencia-patch.test.mjs`
- `tests/service-worker-shell.test.mjs`
- `scripts/windows/Verificar_Ambiente.bat`
- `scripts/windows/Preparar_Dependencias.bat`
- `scripts/windows/Iniciar_Ficha_Offline.bat`
- `docs/roteiro-humano-ficha-offline-local.md`

## Achados

### Entrada da aplicação

- **IMPLEMENTADO:** `src/main.tsx` importa `FichaOfflineApp` e `ConexaoServidorLocal`.
- **IMPLEMENTADO:** a Ficha Offline é o caminho padrão; a entrada LAN depende explicitamente de `?servidor=local`.
- **INSPEÇÃO ESTÁTICA:** não foi identificada dependência do Supabase no caminho ativo verificado nesta entrada.
- **LIMITE:** a separação de imports não comprova, sozinha, instalação PWA nem operação em navegador/dispositivo real.

### Persistência IndexedDB

- **IMPLEMENTADO:** banco `ameaca-biologica-ficha`, versão 3, com stores `personagens` e `vinculosLan).
- **IMPLEMENTADO:** migração v1→v3 atribui geração a registros antigos; migração v2→v3 acrescenta o store de vínculos sem reescrever as fichas existentes.
- **IMPLEMENTADO:** operações de leitura aguardam a conclusão da transação e validam os registros recuperados.
- **IMPLEMENTADO:** gravações por patch leem a versão vigente dentro de transação `readwrite`, comparam a geração e as chaves alteradas e recusam conflitos na mesma chave.
- **IMPLEMENTADO:** alterações em chaves diferentes podem ser mescladas sem substituir o restante do registro.
- **IMPLEMENTADO:** restauração troca o conjunto de personagens numa transação e atribui novas gerações, impedindo que uma aba antiga grave sobre a versão restaurada.
- **TESTES EXISTENTES:** migração, CRUD, importação em lote, substituição/abortamento, preservação de patches independentes, rejeição de conflitos e rejeição de gravação por geração antiga.
- **PENDENTE:** esses testes ainda precisam de resultado confirmado pela CI; os testes de persistência consultados usam IndexedDB simulado e não substituem teste em navegador real.

### Backup e vínculos LAN — ponto de atenção

- O fluxo de restauração substitui os registros no store `personagens`; a função consultada não limpa nem reescreve o store `vinculosLan`.
- O backup JSON exportado pela Ficha contém personagens, não o store de vínculos LAN.
- **RISCO A AVALIAR, NÃO DEFEITO CONFIRMADO:** após restaurar um backup com IDs locais coincidentes, pode permanecer um vínculo LAN anterior associado ao mesmo `localId`. A semântica correta — preservar, invalidar ou marcar o vínculo para reconciliação — depende do contrato futuro de backup/restauração e integração LAN.
- Nenhuma alteração foi feita nesse comportamento. Não presumir sincronização automática nem apagar vínculos sem decisão aprovada.

### Service Worker

- **IMPLEMENTADO:** cache versionado limitado ao shell e recursos estáticos do mesmo domínio/escopo.
- **IMPLEMENTADO:** apenas requisições GET são consideradas; APIs, outros domínios e métodos de escrita não são interceptados.
- **IMPLEMENTADO:** navegação tenta a rede e usa o shell em cache quando a rede falha.
- **TESTE EXISTENTE:** `tests/service-worker-shell.test.mjs` cobre fallback offline, limpeza de cache antigo e não interceptação de APIs, WebSocket e POST.
- **PENDENTE:** execução automatizada pela CI e validação de instalação/abertura offline em navegador real.

## GitHub Actions

No momento da consulta, os dois workflows disparados pelo commit `d77ad7164c8f4b89ccdda5d24c87cbc568c8fae1` permaneciam em `queued`:

| Workflow | Run ID | Job ID | Estado |
|---|---:|---:|---|
| Verificação da Ficha Offline | 43675716417 | 132695292315 | QUEUED |
| Validar compilação do WebApp | 43675716423 | 132695292330 | QUEUED |

A consulta detalhada dos jobs retornou `runner_id=0`, sem runner atribuído e sem etapas iniciadas. Os runs foram criados em 15/11/2026 às 04:12:11 UTC. Portanto, **nenhum teste, instalação frozen-lockfile, TypeScript ou build foi confirmado por esses workflows**.

## Classificação do incremento

| Item | Estado |
|---|---|
| Entrada padrão Offline / LAN explícita | IMPLEMENTADO — inspeção estática |
| IndexedDB v3 e migrações | IMPLEMENTADO — testes existentes |
| Proteção contra conflitos por chave/geração | IMPLEMENTADO — testes existentes |
| Service Worker limitado ao shell | IMPLEMENTADO — teste existente |
| Execução dos testes automatizados | PENDENTE — CI em fila |
| Instalação e persistência em navegador real | PENDENTE |
| Validação humana da Ficha Offline | PENDENTE — roteiro ainda não executado |
| Fase 0 | PENDENTE |

## Arquivos alterados neste incremento

Nenhum arquivo de produção ou teste foi alterado. Este checkpoint registra somente a auditoria estática.

## Riscos e limites

- Inspeção de código não prova execução.
- Testes com IndexedDB simulado não substituem teste com IndexedDB real.
- O comportamento de vínculos LAN após restauração precisa de decisão de contrato antes de qualquer correção.
- Não houve alteração de regra, UI, schema, serviço LAN, branch principal, merge, deploy ou publicação.
- Não houve execução local nesta sessão.

## Próxima ação exata

1. Acompanhar os dois workflows; se continuarem sem runner, registrar a indisponibilidade da execução e não declarar aprovação.
2. Se a CI iniciar e falhar, inspecionar a etapa/log e corrigir somente a causa demonstrada.
3. Continuar a Fase 0 com a conferência dos scripts e do build de teste, preservando o roteiro humano já preparado.
4. Antes de solicitar validação humana, garantir que a instalação e o build tenham evidência técnica suficiente.
5. Não iniciar Inventário, Painel do Mestre ou Laboratório antes dos critérios das fases anteriores.
