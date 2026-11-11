# Checkpoint — Integridade das Reações

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`

## Problema identificado
`prepararContraAtaque()` aceitava a autorização de Contra-Ataque Instintivo mesmo sem Reação consumida/registrada. Isso permitia pular o custo da Reação sem reutilizar a Reação da defesa.

## Correção
- A reutilização agora exige `normaisUsados.reacao` ou `comprasEsforco.reacao > 0` já registrados na economia.
- O custo de 1 SA do Contra-Ataque permanece.
- Os cinco helpers recentes de Habilidades de Reação agora validam exatamente as chaves booleanas esperadas.
- Testes cobrem a regressão e entradas incompletas/extras.

## Limites
- O domínio ainda não integra uma interface de Reações na Ficha.
- A economia registra que uma Reação foi usada/comprada, mas não identifica o evento específico que a consumiu; a ligação entre a defesa e o Contra-Ataque ainda depende do fluxo de chamada.
- Testes adicionados, não executados localmente; CI pendente. Sem validação humana, merge ou publicação.
