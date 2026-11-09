# T15 — fluxo combinado, somente simulação local

**T15.1–T15.6 aprovados por Gus em 25/10/2026**, junto aos quatro T14. [Resultado e limites](resultado-testes-humanos-t14-t15-2026-10-25.md). Roteiro preservado para regressão; não repetir sem mudança relevante. Celular continua separado. [Índice da rodada encerrada](rodada-10-testes-locais.md).

No PC da prévia, abrir http://127.0.0.1:4174/ameaca-biologica-webapp/tests/ui/fluxo.html . Confirmar o aviso **SIMULAÇÃO ISOLADA · FLUXO DE ATIVAÇÃO**. Não há login nem acesso a campanha. F5, Reiniciar ou trocar cenário zera a simulação; durante cada caso, reabrir pelo botão indicado, sem F5.

## T15.1 — confirmação explícita e reabertura (3 minutos)

1. Escolher **Fluxo normal** e clicar **Reiniciar simulação**. Esperado: etapa `sem_contexto`, referência ausente, Envios 0/conjuntos 0; Consultar, confirmar e repetir desabilitados.
2. Clicar **Abrir ou reabrir ficha fictícia**. Esperado: `selecionada`, ainda sem envio.
3. Clicar **Consultar e conferir**. Esperado: `pronta`, contexto Padrão nível 1 permitido/revisão 3, ficha revisão 2 e 0/10 vagas. Caixa de confirmação desmarcada; confirmar desabilitado.
4. Marcar **Conferi as escolhas...** e clicar **Confirmar ativação fictícia** uma vez. Esperado: `confirmada`, referência preservada, Envios 1/conjuntos 1, identificador e cinco itens iniciais. Anotar o identificador. PV 7, SA 1 e BI 3 permanecem.
5. Clicar **Encerrar seleção fictícia**. Esperado: `sem_contexto`, controles de operação bloqueados. Isso encerra somente a seleção desta simulação, não uma sessão real.
6. Clicar **Abrir ou reabrir ficha fictícia**, depois **Consultar e conferir**. Esperado: confirmação recuperada por consulta, mesmo identificador, Envios 1/conjuntos 1, recursos iguais. Não oferece nova confirmação.

## T15.2 — contexto pausado impede ativação (1 minuto)

1. Escolher **Finalizações pausadas**. A troca reinicia a simulação.
2. Clicar **Abrir ou reabrir ficha fictícia**, depois **Consultar e conferir**.
3. Esperado: `impedida`, contexto pausado e aviso de impedimento. Caixa de confirmação, confirmar e repetir desabilitados. Referência ausente, Envios 0/conjuntos 0, PV 7/SA 1/BI 3.

## T15.3 — resposta perdida recuperada sem outro envio (2 minutos)

1. Escolher **Resposta perdida após ativar**.
2. Abrir a ficha fictícia, consultar/conferir, marcar a caixa e confirmar uma vez.
3. Esperado: `incerta`, aviso de operação não confirmada, referência preservada e Envios 1/conjuntos 1. Não aparece confirmação de sucesso; confirmar e repetir ficam desabilitados até consulta. Recursos iguais.
4. **Sem F5**, clicar **Abrir ou reabrir ficha fictícia**, depois **Consultar e conferir**.
5. Esperado: `confirmada`, “Resultado recuperado por consulta, sem envio”, identificador e cinco itens; Envios 1/conjuntos 1, PV 7/SA 1/BI 3. Nenhuma segunda ativação para recuperar a resposta.

## T15.4 — falha antes de gravar e repetição explícita (2 minutos)

1. Escolher **Falha antes de gravar**. Abrir a ficha fictícia, consultar/conferir, marcar a caixa e confirmar uma vez.
2. Esperado: `incerta`, referência preservada, Envios 1/conjuntos 0. Confirmar e repetir desabilitados. Nenhum reenvio por conta própria.
3. Clicar **Consultar e conferir**. Esperado: `pendente`, revisões preservadas e consultadas iguais: ficha 2/Mesa 3. Envios continua 1/conjuntos 0; nova confirmação bloqueada e **Repetir pedido preservado** disponível.
4. Clicar **Repetir pedido preservado** uma vez. Esperado: `confirmada`, Envios 2/conjuntos 1, cinco itens iniciais e PV 7/SA 1/BI 3. São duas tentativas e um único conjunto, não duas compras ou duas fichas.
5. Reabrir pelo botão e consultar novamente. Esperado: mesmo identificador confirmado, Envios 2/conjuntos 1.

## T15.5 — revisão mudou e pedido precisa de reconciliação (2 minutos)

1. Escolher **Revisão mudou com pedido pendente**. Abrir, consultar/conferir, marcar a caixa e confirmar uma vez.
2. Esperado: `incerta`, referência preservada, Envios 1/conjuntos 0. A simulação mudou a revisão da Mesa depois da tentativa sem gravação.
3. Clicar **Consultar e conferir**. Esperado: `impedida`; pedido preservado com ficha 2/Mesa 3 e consulta atual com ficha 2/Mesa 4. Aviso de reconciliação necessária; confirmar, caixa e repetir desabilitados.
4. Clicar **Abrir ou reabrir ficha fictícia**, depois **Consultar e conferir**. Esperado: permanece impedida, mesmas revisões e referência preservada; Envios 1/conjuntos 0, PV 7/SA 1/BI 3.
5. Não tentar apagar armazenamento ou desbloquear: este caso valida a conservação do pedido ambíguo. A solução definitiva de reconciliação ainda não está implementada. Trocar cenário encerra apenas estes dados fictícios.

## T15.6 — não foi possível preservar o pedido (2 minutos)

1. Escolher **Falha ao preservar pedido**. Abrir, consultar/conferir, marcar a caixa e confirmar uma vez.
2. Esperado: `incerta`, referência ausente, **Envios 0/conjuntos 0**, sem confirmação de sucesso. Caixa, confirmar e repetir desabilitados; PV 7/SA 1/BI 3.
3. Clicar **Consultar e conferir**. Esperado: `pronta`, mas caixa desmarcada e confirmar desabilitado até novo consentimento. Envios 0/conjuntos 0; consulta não envia nada.
4. Não precisa alterar permissões do navegador, desligar internet ou testar nova confirmação: a falha de armazenamento é fictícia e continua ativa neste cenário.

Pode responder em partes: “T15.1 aprovado; …; T15.6 aprovado”. Se falhar, informar caso, passo e mensagem; uma captura ajuda. Estes casos não certificam Auth, banco remoto, concorrência real ou celular.
