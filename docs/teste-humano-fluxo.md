# T15 — fluxo combinado, somente simulação local

**Três casos enfileirados para a próxima rodada. Não é necessário testar agora.** Somados aos quatro T14, a fila tem 7/10. Não repetir T13. Celular não entra na contagem.

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

Pode responder: “T15.1 aprovado; T15.2 aprovado; T15.3 aprovado”. Se falhar, informar caso, passo e mensagem; uma captura ajuda. Estes casos não certificam Auth, banco remoto, concorrência real ou celular.
