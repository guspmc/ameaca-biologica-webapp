# Checkpoint — Registro de Reações e Durabilidade

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`

## Fonte canônica
- Arquivo do Jogador v1.0, p. 80–81: Reações, Aparar, Esquivar, Contra-Ataque e Ataque de Oportunidade.
- Seção Durabilidade do capítulo Arsenal e Equipamentos: perde 1 apenas ao Aparar, normalmente; em 0 não pode Aparar; outras funções permanecem normais; Indestrutível é exceção.

## Alterações
- `registrarAtaqueOportunidade()` valida payload externo e gatilho com estrutura exata, motivo não vazio e interrupção de movimento explicitamente falsa.
- `registrarUsoAparar()` valida estrutura exata do payload externo.
- Testes de regressão adicionados.

## Limites conhecidos
- Durabilidade ainda não está ligada a equipamento ativo/ficha/inventário.
- Os gatilhos espaciais e narrativos de AoO continuam sendo fornecidos/confirmados fora do helper.
- A interpretação de VOCÊ APAROU UM MÍSSIL!? em relação a 20 natural não foi alterada: a redação da Habilidade amplia o tipo de Ataque aparável quando a narrativa permite, mas não declara expressamente uma exceção à regra de fechamento da janela por 20 natural. Ponto permanece conservador, sem decisão de cânone.
- Testes adicionados, não executados localmente. CI pendente. Sem validação humana, merge ou publicação.
