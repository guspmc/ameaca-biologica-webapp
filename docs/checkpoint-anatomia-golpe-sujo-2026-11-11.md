# Checkpoint — lembretes de Anatomia de Combate e GOLPE SUJO

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`

## Fonte canônica
Arquivo do Jogador v1.0:
- p. 29 — Anatomia de Combate: Ação Bônus, Medicina DT 15; em sucesso, identifica Vulnerabilidade e concede Vantagem no próximo Ataque até o fim do próximo turno do Agente.
- p. 37 — GOLPE SUJO: Derrubar após causar Dano Corpo a Corpo, gastando Movimento; Pisão contra Caído, com exceção para alvo Menor; Morte Instantânea sem SA quando Vulnerável e elegível a Finalização; Cabeçada como Ataque Desarmado com Fortitude DT 10 + FOR e Atordoado em falha.

## Implementado
- `src/CalculadoraTesteLocal.tsx` apresenta lembrete contextual de Anatomia de Combate no escopo de Ataques quando a Habilidade está ativa.
- No Ataque Corpo a Corpo, apresenta as opções e requisitos de GOLPE SUJO quando a Habilidade está ativa.
- Os lembretes explicitam que a pessoa deve confirmar os gatilhos na Mesa; não controlam alvo, duração, Movimento, uso por turno, rolagem de Fortitude ou aplicação de Condições.

## Testes
- Acrescentadas verificações estáticas em `tests/ataques-calculadora.test.mjs` para presença dos lembretes e limites de automação.
- Não executados localmente neste ambiente; CI do novo HEAD pendente.

## Limites e próximos passos
- Anatomia de Combate ainda não registra o alvo Vulnerável nem a janela de Vantagem.
- GOLPE SUJO não executa Derrubar, Pisão, Cabeçada, Finalização ou Morte Instantânea.
- A integração operacional depende do fluxo futuro de Encontros/Combate; não presumir estado de alvo ou posição.
- Sem validação humana isolada, merge, publicação ou alteração da `main`.
