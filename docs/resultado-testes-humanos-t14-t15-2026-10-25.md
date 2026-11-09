# Resultado humano — T14 e T15, 25/10/2026

Gus confirmou explicitamente **T14.1–T14.4 e T15.1–T15.6 aprovados**, com 30 capturas. Rodada de dez casos encerrada. Base testada: checkpoint `0977819d33daa115d05349b401f912e89a963faf`. Não repetir sem alteração relevante.

As 30 capturas originais foram copiadas, na ordem enviada, para `../output/testes-humanos-t14-t15-2026-10-25/`, fora do Git. O arquivo `indice.json` registra ordem, nome, tamanho e SHA-256; cópias conferidas contra os originais. Capturas anteriores de T13 e relatórios de 23/24/25 de outubro foram preservados.

| Caso | Resultado aprovado por Gus | Capturas relacionadas |
| --- | --- | --- |
| T14.1 | Preparação explícita, pausa e permissão com revisões 0 → 1 → 2; recursos preservados | 1–7 |
| T14.2 | Mesa existente sem contexto recusa preparação presumida; personagem preservada | 8 |
| T14.3 | Conflito preserva escolha, exige consulta e decisão posterior | 9–10 |
| T14.4 | Resposta perdida recuperada por consulta, Envios permanece 1 | 11–13 |
| T15.1 | Consentimento obrigatório, ativação única, encerramento e recuperação do mesmo identificador | 14–18 |
| T15.2 | Contexto pausado bloqueia com zero envios/conjuntos | 19 |
| T15.3 | Resposta perdida após gravar recupera sem segundo envio; um conjunto | 20–21 |
| T15.4 | Falha anterior à gravação exige consulta e repetição explícita; Envios 2/conjuntos 1, mesmo identificador recuperado | 22–25 |
| T15.5 | Revisão da Mesa preservada 3/atual 4 mantém bloqueio e referência ao reabrir | 26–28 |
| T15.6 | Falha ao preservar pedido não envia; consulta posterior exige novo consentimento | 29–30 |

A confirmação explícita de Gus abrange os passos dos roteiros; as capturas registram os estados exibidos. PV 7, SA 1 e BI 3 permanecem nas simulações. Contadores de envios representam tentativas fictícias; conjuntos representam materializações fictícias. A aprovação do bloqueio de T15.5 não significa que a reconciliação definitiva tenha sido implementada.

Escopo: interfaces fictícias `tests/ui/contexto.html` e `tests/ui/fluxo.html`, em memória, no PC. Não certifica Auth/JWT, RLS/PostgREST remoto, concorrência entre conexões, inventário em uso, integração de campanha ou celular físico. Não autoriza aplicar propostas SQL remotamente, publicar ou fazer merge na principal.

Fila executável após o encerramento: **0/10**. T10–T12 continuam futuros, condicionados à integração/acesso; celular permanece separado e pendente de acesso apropriado. Próxima preparação prevista: protocolo de reconciliação com evidência autorizada do servidor, preservando pedidos ambíguos, antes de futura integração.

Neste checkpoint foram alterados somente registros/documentação. Não houve execução nova da suíte: permanecem válidos os 176 testes automatizados e a validação no GitHub do checkpoint de código `0977819`. A aprovação humana agora registrada é uma evidência distinta.
