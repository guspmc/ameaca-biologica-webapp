# Decisão de ordem dos módulos posteriores — 13/11/2026

**Branch:** `feat/offline-first-ficha`  
**Repositório:** `guspmc/ameaca-biologica-webapp`

## Decisão aprovada

Por decisão expressa do Gus em 13/11/2026, fica substituída a ordem anterior da seção 6, Etapa C, da `docs/linha-de-trabalho-e-continuidade-2026-11-12.md`.

A nova sequência é:

1. **Inventário Offline completo** — operações do inventário ativo integradas à Ficha Offline, com validações, persistência e fluxos necessários funcionando de ponta a ponta.
2. **Painel do Mestre completo** — Mesa, Encontros, Arquivos e resumo operacional entregues como módulo funcional integrado, não apenas telas, contratos ou estruturas parciais.
3. **Inventário LAN completo** — leitura e operações do inventário ativo no servidor LAN, com autorização, persistência transacional, controle de concorrência e recibos idempotentes conforme os contratos aprovados.

## Pré-requisito preservado

Esta decisão altera somente a ordem dos módulos posteriores. **Não elimina a etapa de validação humana da Ficha Offline**, que continua sendo pré-requisito para iniciar o Inventário Offline, salvo nova autorização expressa do Gus.

A bateria humana pendente deve ser concluída e seus resultados registrados antes da implementação do Inventário Offline. A aprovação desta ordem não equivale à homologação da Ficha.

## Critério de entrega

Cada módulo deve ser concluído funcionalmente de ponta a ponta antes do início do seguinte. Não considerar como entrega completa uma documentação de contratos, uma estrutura de dados, uma tela isolada ou uma implementação parcial sem integração e persistência.

## Restrições preservadas

- Trabalhar somente na branch `feat/offline-first-ficha`.
- Não criar branch, alterar `main`, fazer merge, deploy ou publicação.
- Preservar a arquitetura Offline First e o servidor LAN separado.
- Não alterar Supabase, banco remoto, migrations ou segredos.
- Não alterar cânone, permissões ou navegação aprovada sem decisão expressa.
- Não declarar testes, build ou validação humana como executados sem evidência real.

## Próximo passo

Retomar a bateria humana da Ficha Offline pelo ponto pendente, registrar resultados reais e, após validação e aprovação, iniciar o módulo Inventário Offline como primeira entrega funcional completa.
