# Checkpoint — Defesa alternativa e lembrete de Parede Humana

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`

## Objetivo
Integrar à apresentação da Ficha dois efeitos defensivos de Habilidades de Progressão sem automatizar decisões que dependem do combate.

## Alterações
- `src/condicoesCalculadora.ts`: nova função pura `calcularDefesaComReflexosSobrevivente()`. Com a Habilidade ativa, retorna o maior valor entre Defesa atual e 10 + Acrobacia; sem a Habilidade, preserva a Defesa atual.
- `src/FichaLocal.tsx`: calcula Acrobacia usando `valorBasePericia()`, sem somar Atributo novamente, e apresenta a Defesa alternativa somente quando Reflexos de Sobrevivente está ativa.
- `src/FichaLocal.tsx`: adiciona lembrete contextual de Parede Humana com gatilho de Movimento não gasto, +VIG Defesa, RD e duração até o início do próximo turno.
- `tests/condicoes-calculadora.test.mjs`: testes da função e da integração visual.
- `docs/matriz-estado-e-pendencias-2026-11-09.md`: atualização do estado.

## Cânone preservado
- Reflexos de Sobrevivente permite usar Defesa ou 10 + Acrobacia, o que for maior, contra Ataques.
- Parede Humana só se ativa ao fim do turno se o recurso Movimento não tiver sido gasto; concede VIG à Defesa e RD igual a 1 + metade do Nível de Operador, arredondada para baixo, máximo 6, até o início do próximo turno.

## Limites
- A escolha da Defesa usada contra cada Ataque continua com a Mesa.
- Parede Humana é lembrete, não estado temporário; não acompanha gasto de Movimento, duração nem aplicação de RD.
- Equipamentos/armaduras continuam fora da Defesa atual.
- Testes não executados localmente; CI pendente; validação humana pendente.
- Sem merge para `main`, deploy ou publicação.