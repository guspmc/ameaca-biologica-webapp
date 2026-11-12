# Checkpoint — Auditoria de transformações e Condições sensoriais — 12/11/2026

**Branch:** `feat/offline-first-ficha`  
**Implementação funcional observada antes deste checkpoint:** `657ccefd4428e0bdcdb50f5003b767466881ac29`  
**Fontes canônicas:** Arquivo do Jogador v1.0, pp. 81–83 e 90–91.

## Achados

1. **Transformações apareciam como Condições comuns sem deixar claro que seus efeitos não são aplicados.** O seletor de Condições permitia registrar Infectado Especial e Cabeça Carmesim, mas a Ficha não possui fluxo de transformação nem aplica os efeitos mecânicos dessas entradas. O catálogo também resumia demais o texto oficial.
2. **Cego e Surdo não tinham lembrete na calculadora sobre Testes exclusivamente sensoriais.** As condições já tinham descrição no catálogo e Cego já impunha Desvantagem em Ataques, mas o contexto da rolagem não lembrava a falha automática quando um Teste depende exclusivamente de visão/audição.

## Correções realizadas

- `src/condicoesFicha.ts`: completadas as descrições de Infectado Especial e Cabeça Carmesim conforme pp. 90–91, incluindo compulsão de atacar a criatura consciente mais próxima/ameaçadora; possibilidade de reversão antes da progressão seguinte; período inerte de 1 hora antes de Cabeça Carmesim; efeitos da transformação Cabeça Carmesim; +2 BI em Ataques Corpo a Corpo que causem Dano; inconsciência por 1 hora após reversão; e morte se PV chegar a 0 antes da reversão.
- `src/CondicoesFichaLocal.tsx`: ao exibir uma dessas transformações, a Ficha agora informa claramente que o registro é informativo e que a seção não aplica recuperação de Dados de Vida, perda de Habilidades, restrições de comportamento/armas, ganho de BI, períodos de inconsciência ou morte.
- `src/CalculadoraTesteLocal.tsx`: lembretes contextuais para Cego e Surdo pedem confirmação de que o Teste depende exclusivamente do sentido afetado. Nenhuma falha automática é imposta sem essa confirmação contextual.
- Testes estruturais ampliados em `tests/condicoes-ficha.test.mjs` e `tests/condicoes-calculadora.test.mjs`.

## Lacuna de implementação — transformação

**PENDENTE / NÃO IMPLEMENTADO:** o WebApp ainda não aplica integralmente a transformação de Infectado Especial ou Cabeça Carmesim. O aviso evita sugerir o contrário. A implementação completa requer fluxo próprio integrado à progressão, Dados de Vida, Habilidades, armas, ataques, BI, PV, períodos de inconsciência e condições de morte. Não foi improvisada nesta etapa.

## Limites e validação

- A Ficha continua sem presumir dependência sensorial de um Teste; o jogador/Mestre decide se visão/audição são exclusivas.
- Não houve alteração de regras, rolagens automáticas, resolução de Dano ou controle de comportamento.
- Testes/build não executados nesta sessão; testes estruturais foram escritos, não aprovados.
- Validação humana pendente.
- Sem redesign, LAN, banco, Supabase, main, merge, deploy ou publicação.
