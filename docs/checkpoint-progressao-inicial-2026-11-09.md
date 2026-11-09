# Checkpoint — Progressão Offline: fundação do estado e Marco Narrativo
**Data:** 09/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD de código:** `51f5d56837d0f7804414e5c970853f0ace0ea29c`

## Escopo deste ciclo
Primeira implementação de domínio do Lote A, sem ainda integrar interface ou aplicação de benefícios.

## Implementado
- `src/progressaoPersistente.ts`:
  - `criarEstadoProgressaoInicial()` cria o contrato v1 de uma personagem no nível 1.
  - O padrão é `marco_narrativo`, conforme o método preferencial do Arquivo do Mestre v1.0; `missoes` pode ser informado como alternativa.
  - Estado pertence à Ficha. Não lê nem grava configuração na Mesa.
  - `registrarMarcoNarrativo()` registra a concessão expressa do Narrador, preserva o nível e o histórico e marca que houve Marco posterior à última Morte quando aplicável.
  - O registro do Marco não concede nível, não escolhe benefícios e não altera atributos/perícias/habilidades.
- `tests/progressao-persistente.test.mjs`:
  - Testa inicialização padrão e alternativa.
  - Testa recusa de método inválido.
  - Testa que Marco não altera nível nem benefícios.
  - Testa registro de Marco posterior à Morte no nível 1.
  - Testa que não se registra Marco em ficha configurada para Missões.

## Arquivos e SHAs
- `src/progressaoPersistente.ts`: `1fe8a255e6a541ca33c20768085484abb9938f8b`
- `tests/progressao-persistente.test.mjs`: `c476484c8cf3ed9e9986aafae58d6a9091f34aa7`

## Regras e limites preservados
- Arquivo do Mestre v1.0: Marco Narrativo é método preferencial; contagem de Missões é opcional.
- Arquivo do Jogador v1.0, p. 27: benefícios por nível; p. 101: requisitos cumulativos de Missões e regra de progressão.
- Aplicação de nível permanece vinculada a Descanso Completo em Sala de Descanso.
- Não há configuração de Progressão na Mesa.
- Nenhum benefício é aplicado por registrar Marco.
- Nenhuma UI foi conectada ainda; nenhum personagem existente foi migrado ou inicializado automaticamente.
- Personagens acima do nível 1 sem histórico de benefícios não devem receber estado inicial inventado; a futura integração precisa bloquear e apresentar tratamento explícito para esse caso.

## Testes e CI
- Testes adicionados ao repositório, mas não executados nesta sessão.
- Status do commit: nenhum status/check reportado.
- Workflows associados: lista vazia no momento da consulta.
- **Resultado: PENDENTE / não comprovado.** Não declarar suíte aprovada.

## Alterações externas
- Nenhum merge para `main`.
- Nenhum deploy.
- Nenhuma alteração em produção ou Supabase.
- Nenhum teste humano solicitado.

## Próximo passo
Continuar o Lote A:
1. Criar UI da Progressão na Ficha ativa.
2. Inicializar automaticamente apenas fichas novas/nível 1 em fluxo explícito e seguro; não inventar histórico de personagens de nível superior.
3. Registrar contador de Missões e Marco conforme método da própria Ficha.
4. Criar fluxo de escolhas de benefícios por nível, com histórico exato.
5. Integrar atomicamente ao Descanso Completo em Sala de Descanso, somente após confirmação do salvamento.
6. Cobrir IndexedDB, backup/importação, conflitos e regressões.
