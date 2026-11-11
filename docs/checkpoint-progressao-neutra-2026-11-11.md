# Checkpoint — Progressão Offline neutra

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** remover a escolha obrigatória de método de Progressão da Ficha Offline, mantendo compatibilidade com registros antigos.

## Decisão funcional aplicada

O grupo decide fora do WebApp se usará Marco Narrativo ou Missões. A Ficha não deve configurar esse método por Mesa, apresentar uma seleção obrigatória nem exigir que o método fique gravado no estado novo da personagem.

## Implementação

- Novos estados criados por `criarEstadoProgressaoInicial()` não incluem o campo `metodo`; incluem apenas `avancoAutorizado: false`.
- A interface não apresenta seletor de método. Exibe que o critério é decidido pelo grupo e permite registrar a autorização comunicada pelo grupo/Narrador.
- A autorização externa não concede Nível imediatamente: a Ficha ainda exige solicitação, Descanso Completo na Sala de Descanso e escolhas canônicas dos benefícios do Nível.
- Ao aplicar o Nível, a autorização é consumida e volta a `false`.
- Ao registrar Morte, a autorização anterior é removida; um novo avanço exige nova autorização.
- Contratos legados que já contêm `metodo: marco_narrativo` ou `metodo: missoes` continuam válidos e seguem seus fluxos anteriores. Não há migração destrutiva ou reescrita automática desses históricos.
- A matriz funcional foi atualizada.

## Testes adicionados/atualizados

- `tests/progressao-persistente.test.mjs`: novo estado sem método, autorização externa, pedido de avanço e nova autorização após Morte; mantém cobertura dos contratos legados.
- `tests/progressao-habilidades.test.mjs`: disponibilidade neutra, requisito de nova autorização após Morte e exigência de Descanso Completo.
- `tests/progressao-campanha.test.mjs`: aplicação do Nível consome autorização neutra; interface não oferece seletor de método.
- Os testes legados de Marco Narrativo e Missões continuam cobrindo compatibilidade.

## Limites

- O WebApp não determina se o grupo está usando Marco Narrativo ou Missões, nem valida a decisão narrativa.
- O registro de autorização é uma confirmação explícita do jogador de que o grupo/Narrador concedeu o avanço.
- Integração LAN da Progressão permanece fora do escopo deste ciclo, conforme foco Offline solicitado.
- Não houve alteração em Inventário, LAN, banco de dados, `main`, merge ou publicação.

## Commits

- `726acda` — contrato neutro e autorização externa na persistência.
- `182b9b2` — avaliador de Progressão aceita contrato neutro.
- `293219b` — consome autorização ao aplicar Nível.
- `57ff2e8` — interface sem escolha de método.
- `8ef090e` — corrige avaliação secundária da autorização.
- `11f3677` — ajusta mensagem após Morte.
- `adc2abf` — testa nova autorização após Morte.
- `c046afb` — testa requisito neutro.
- `de615bf`, `f34ff16`, `cc07410` — testes de aplicação e interface.
- `96a9be2` — atualiza comentários do contrato.
- `2970521` — atualiza matriz.

## Validação

- **Implementado:** alterações registradas na branch.
- **Testes:** adicionados/atualizados; não executados localmente.
- **CI:** consultar os workflows acionados pelo HEAD atual; nenhuma aprovação presumida.
- **Validação humana:** continua adiada até a Ficha Offline estar completa, exceto Inventário.
