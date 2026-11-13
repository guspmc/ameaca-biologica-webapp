# Checkpoint — lacuna LAN da Progressão da Ficha

**Data:** 13/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Status:** PENDENTE — integração online da Progressão impede fechar a diretriz Ficha Offline/Online.

## Evidências verificadas

1. `src/ProgressaoFichaLocal.tsx` contém retorno antecipado de somente leitura para `origemDados === 'servidor'`. Nenhuma ação de Progressão é oferecida na Ficha LAN.
2. `server/personagens-local.mjs` valida a Progressão no salvamento genérico, mas protege as transições. Só permite alterar diretamente o contador de Missões. Criação/remoção, Nível, método, Marcos e histórico de Morte exigem fluxo próprio.
3. `tests/personagens-local.test.mjs` tem teste de integração que comprova a proteção do PUT genérico contra criação direta, alteração de Marco e alteração de método.
4. `src/progressaoPersistente.ts` já possui regras de domínio para estado inicial, autorização de avanço do grupo, Missões, Marco, solicitação, confirmação de Descanso e Morte.
5. `src/progressaoCampanha.ts` concentra aplicação de benefícios de Nível e perda de Nível/Morte.

## Operações que precisam funcionar Online

- Inicializar Progressão no Nível 1.
- Registrar autorização neutra do grupo, Marco Narrativo ou contador de Missões conforme o estado escolhido.
- Solicitar e cancelar subida de Nível quando permitido.
- Confirmar Descanso Completo na Sala de Descanso sem antecipar Nível/benefícios.
- Escolher e aplicar Habilidade, Atributo e Perícia do Nível com atualização coerente de `nivel`, `progressao` e dados derivados.
- Registrar Morte como autodeclaração pendente de confirmação do Mestre, preservando o histórico e revertendo somente os benefícios registrados.

## Critérios técnicos para a correção

- Não remover a tela somente leitura sem substituir por persistência real.
- Não liberar as transições pelo PUT genérico.
- Criar fluxo LAN dedicado com autenticação e autorização atuais da conta/personagem/Mesa, revisão esperada, validação da transição contra o estado anterior e gravação atômica.
- Definir proteção contra repetição/duplicidade e conflito de revisão, preservando dados concorrentes.
- Manter o comportamento Offline atual sem regressão.
- Cobrir servidor e integração com testes para cada transição, estado inválido, revisão conflitante, repetição e isolamento de conta.

## Limites

Esta etapa foi auditoria estática; não houve alteração de código. Testes/build não executados. Nenhum teste LAN humano foi solicitado ou repetido. A aprovação dos demais fluxos LAN permanece preservada.
