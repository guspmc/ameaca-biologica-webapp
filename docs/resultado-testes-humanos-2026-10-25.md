# Resultado humano — recuperação T13, 25/10/2026

Gus confirmou explicitamente **T13.1–T13.10 aprovados** e autorizou prosseguir. Rodada encerrada; não repetir sem alteração relevante. Foram preservadas 33 capturas originais, na ordem enviada, em `../output/testes-humanos-2026-10-25/`, fora do Git, com tamanho e SHA-256 em `indice.json`.

| Caso | Resultado confirmado | Limite da evidência |
| --- | --- | --- |
| T13.1 | Resposta perdida recuperada após F5, repetição sem outro envio/conjunto | Servidor fictício na mesma aba |
| T13.2 | Recuperação sem referência local, sem aumentar envios/conjuntos | Consulta fictícia por ficha |
| T13.3 | Falha anterior à gravação permite repetir o pedido, um conjunto final | Falha programada |
| T13.4 | Falha ao preservar pedido bloqueia envio, retomada funciona | Falha de armazenamento simulada |
| T13.5 | Respostas antigas descartadas em A/B, A/B/A e encerramento | Sessão e Mesas fictícias |
| T13.6 | Interface e controles legíveis na janela estreita | PC, não celular físico |
| T13.7 | Consulta recusada mantém bloqueio até nova consulta explícita | Sem JWT ou permissão real |
| T13.8 | Recibo inválido não anuncia sucesso; consulta recupera | Recibo inválido programado |
| T13.9 | Completa sem recibo impede nova ativação | Estado legado fictício |
| T13.10 | Resultado de outro pedido recusado; original recuperável | Divergência programada |

As capturas mostram os avisos, contadores, descarte de respostas e recuperação; a confirmação de Gus abrange todos os passos do roteiro. O contador de consultas aumentar é esperado. F5 preserva o estado desta página, mas só clicar em Consultar executa nova consulta. A distinção relevante continua sendo consultas versus envios/conjuntos.

Esta aprovação não certifica integração remota, RLS real, concorrência entre conexões, recuperação em outra aba/dispositivo ou interface em aparelho físico. T10–T12 permanecem condicionados à integração e ao acesso. T5–T9 continuam encerrados.
