# Checkpoint — Origem Mercenário na Ficha Offline

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Cânone:** Arquivo do Jogador v1.0, seção Origens, p. 24.

## Regra integrada

Uma vez por Descanso Completo, quando um hostil oculto fosse Surpreender a personagem Mercenária, ela pode usar uma Reação para sacar uma arma de fogo carregada e realizar um Ataque contra o hostil. Ao fazer isso, percebe a ameaça a tempo e não fica Surpreendida.

## Implementação

- `avaliarRespostaMercenario()` exige confirmações explícitas de Origem Mercenário, uso disponível, hostil oculto, gatilho que a surpreenderia e arma de fogo carregada.
- `registrarRespostaMercenario()` consome a Reação normal ou compra uma Reação adicional por 1 SA, respeitando o limite de 3 SA na janela.
- `PainelAcoesLocal.tsx` apresenta o fluxo somente para Origem Mercenário e registra a Reação junto com `usosDescansoCompleto['origem:mercenario']` na mesma gravação.
- Se o salvamento falhar, nem a Economia nem o uso por Descanso Completo são considerados confirmados.
- O componente geral de usos não permite consumir Mercenário separadamente, evitando marcar o benefício sem registrar a Reação.
- A Ficha informa que a personagem não fica Surpreendida, mas não saca arma, não realiza Ataque, não rola dados nem aplica efeitos.

## Testes

- `tests/reacoes-combate.test.mjs`: gatilhos, Reação normal, compra de Reação adicional e limite de SA.
- `tests/mercenario-ficha.test.mjs`: integração do uso com a Reação na mesma gravação e bloqueio do registro separado.
- Testes adicionados; não executados localmente nesta sessão.

## Limites

- O jogador confirma com a Mesa que o hostil estava oculto e que o surpreenderia.
- A Ficha não possui estado autoritativo de arma empunhada/carregada; a confirmação de arma carregada permanece manual.
- Ataque, alvo, acerto, dano e efeitos continuam manuais.
- O uso renova somente após salvamento confirmado de Descanso Completo.

## Commits

- `2c52a18` — helpers de avaliação e registro da Reação.
- `7972601` — painel e gravação combinada de Reação/uso.
- `467e983` — impede consumo separado no componente geral.
- `edea31f` — testes de domínio.
- `a12a69e` — testes estruturais de integração.
- `1c623e7` — matriz atualizada.

## Validação

- **Implementado:** na branch Offline.
- **Testes:** adicionados; aguardam CI.
- **Validação humana:** adiada até a Ficha estar completa.
- **LAN/main/merge/deploy:** não alterados.
