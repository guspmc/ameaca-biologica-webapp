# Checkpoint — validação de integridade da Ficha no servidor LAN

**Data:** 13/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Status:** IMPLEMENTADO; execução de testes pendente.

## Problema encontrado

A persistência Offline já validava vários estados por meio de validadores de domínio e da validação do personagem/backup. O endpoint de salvamento LAN, porém, validava explicitamente Economia de Ações, Turno, Progressão e Registro de Decisões, mas aceitava sem validação equivalente alguns estados usados pela Ficha.

## Correção

Em `server/personagens-local.mjs`, o PUT agora rejeita com HTTP 422 antes da gravação:
- Reanimação inválida (`reanimacaoValida`);
- histórico de Condições inválido (`listaCondicoesValida`);
- usos de Descanso Completo inválidos (`usosDescansoCompletoValido`);
- estados inválidos dos benefícios Amnésico e Militar;
- configuração de funcionamento inválida;
- PV, PV Temporários, SA ou BI que não sejam inteiros não negativos.

A proteção existente de Progressão, Turno, Economia e Registro de Decisões foi preservada. Não foi liberada nenhuma alteração protegida por meio do PUT genérico.

## Cobertura adicionada

`tests/personagens-local.test.mjs` inclui um teste de integração com entradas inválidas de Reanimação, Condições, usos de Descanso, PV e BI. Para cada caso, verifica status 422, revisão inalterada e ausência de persistência do campo inválido.

## Validação e limites

- Testes/build não executados nesta etapa.
- Não houve repetição dos testes humanos LAN já aprovados.
- A alteração toca o endpoint LAN, portanto os novos testes automatizados precisam ser executados antes de considerar o incremento comprovado.
- Sem alterações em Inventário, Supabase, banco de produção, `main`, merge ou publicação.
