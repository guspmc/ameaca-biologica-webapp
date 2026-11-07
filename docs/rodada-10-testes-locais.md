# Rodada de dez testes humanos locais

**Rodada encerrada: os dez casos foram aprovados por Gus em 25/10/2026**, com 30 capturas. [Resultado e limites](resultado-testes-humanos-t14-t15-2026-10-25.md). Fila executável atual 0/10. Os passos abaixo ficam preservados para regressão; não repetir sem mudança relevante. T13 continua encerrado. Celular, T10–T12 e integrações remotas ficam separados.

Somente simulações fictícias no PC da prévia, sem login, banco remoto ou alteração em campanha. Pode executar e confirmar em partes. Tempo aproximado total: 20–25 minutos. Os roteiros vinculados abaixo detalham os botões, a sequência e os resultados esperados.

## Contexto de criação — quatro casos

Abrir http://127.0.0.1:4174/ameaca-biologica-webapp/tests/ui/contexto.html . [Passos detalhados dos quatro casos](teste-humano-contexto.md).

1. **T14.1 — preparar, pausar e permitir:** preparação explícita em Mesa vazia; revisões 0 → 1 → 2, sem alterar recursos.
2. **T14.2 — Mesa legada:** recusar preparação quando há personagens e falta contexto, sem inventar o método anterior.
3. **T14.3 — conflito ao salvar:** preservar a escolha local, exigir nova consulta e aceitar só a alteração deliberada posterior.
4. **T14.4 — resposta perdida ao salvar contexto:** recuperar por consulta, sem repetir o envio.

## Fluxo combinado — seis casos

Abrir http://127.0.0.1:4174/ameaca-biologica-webapp/tests/ui/fluxo.html . [Passos detalhados dos seis casos](teste-humano-fluxo.md). Em cada caso, escolher o cenário correspondente. **Não usar F5 no meio de um caso:** esta página usa memória e F5 zera tudo. Reabrir pelo botão da página conserva a referência da simulação atual.

5. **T15.1 — confirmação explícita e reabertura:** consentimento obrigatório, um envio/conjunto e mesmo identificador após reabrir/consultar.
6. **T15.2 — finalizações pausadas:** ativação impedida, zero envios/conjuntos e referência ausente.
7. **T15.3 — resposta perdida após gravar:** consulta recupera confirmação; permanece um envio/conjunto.
8. **T15.4 — falha antes de gravar:** consulta habilita somente repetição explícita; duas tentativas produzem um conjunto.
9. **T15.5 — revisão mudou com pedido pendente:** comparação Mesa 3 → 4, envio bloqueado e referência preservada mesmo ao reabrir.
10. **T15.6 — falha ao preservar pedido:** zero envios/conjuntos; nova consulta não envia e exige novo consentimento.

Nos casos de fluxo, PV 7, SA 1 e BI 3 devem permanecer. Resultado possível: **aprovado**, **falhou** ou **não executado**. Informar o identificador T14/T15, passo e mensagem em caso de falha; capturas são úteis. Não é necessário refazer testes já aprovados ou abrir permissões de rede para esta rodada.
