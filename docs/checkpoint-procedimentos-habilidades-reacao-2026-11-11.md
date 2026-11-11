# Checkpoint — Procedimentos de Habilidades de Reação

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`

## Fonte canônica
Arquivo do Jogador v1.0, pp. 29–30, consultado diretamente.

## Alterações
- `src/reacoesCombate.ts`: helpers puros para Contra-Ataque Instintivo, Retaliação, Não Vai Escapar, Na Minha Mira e VOCÊ APAROU UM MÍSSIL!?.
- `tests/reacoes-combate.test.mjs`: cobertura dos gatilhos, custos e bônus.
- Matriz de estado atualizada.

## Limites
- Não há interface de Reações integrada na Ficha.
- Contexto de posição, percepção, condição nova, arma e uso por rodada deve ser confirmado pela Mesa.
- Helpers não executam Ataques, Finalizações, dano, Atordoamento nem alteração de PV.
- Testes adicionados, não executados localmente; CI pendente. Sem validação humana, merge ou publicação.
