# Checkpoint — benefício da Origem Desgarrado e integração de BI

**Data:** 09/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD do código/testes:** `3a81c7bb223db4f183aea13fa55d1301cf0f3691`

## Implementado

- O painel de Recursos recebe a Origem da personagem.
- Ao aumentar BI com Origem Desgarrado, calcula PV Temporários como `floor(BI atual / 2)` após o aumento.
- A aplicação usa a regra geral de PV Temporários: não soma; mantém o maior valor entre os existentes e o novo valor.
- Reduzir BI não concede PV Temporários.
- Outras Origens não recebem esse benefício.
- A regra foi implementada no domínio `src/recursosFicha.ts` e conectada ao botão de aumento de BI em `src/RecursosFichaLocal.tsx`.

## Testes e CI

- Testes adicionados em `tests/recursos-ficha.test.mjs` para Desgarrado, substituição sem acúmulo, ausência de efeito em outras Origens e redução de BI.
- CI do commit anterior `66b33b065e513a5f3e3819c4134882de4b055784`: ambos os workflows concluídos com sucesso.
- CI do HEAD atual:
  - `42732336629` — Verificação da ficha offline: em execução na última consulta.
  - `42732336648` — Validar compilação do WebApp: em execução na última consulta.
- Nenhum teste humano executado.

## Próximo

Continuar a auditoria dos benefícios de Origem e da Criação, sem antecipar o módulo Inventário ativo. Depois fechar Combate e a auditoria geral da Ficha. Nenhum merge, deploy ou alteração de produção/Supabase.
