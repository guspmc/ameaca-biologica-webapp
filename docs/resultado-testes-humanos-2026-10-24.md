# Resultado humano T5–T9 — 24/10/2026

Gus confirmou explicitamente: “T5 confirmado; T6 confirmado; T7 confirmado; T8 confirmado; T9 confirmado”, com treze capturas da página `tests/ui/ativacao.html`.

Checkpoint testado: `af09f581e390f888e6b4745ff4717494d370b813`, PR #1 em rascunho. Trata-se da simulação isolada em memória, sem Supabase, Auth, armazenamento ou dados de campanha. Não houve ativação real.

As treze imagens originais foram copiadas, sem edição, para `output/testes-humanos-2026-10-24/` no diretório pai deste repositório. O índice local registra ordem, nomes, tamanho e SHA-256. Evidências preservadas localmente, sem envio das imagens à PR.

| Caso | Resultado humano | Evidência e alcance |
| --- | --- | --- |
| T5 — confirmação normal e resumo | Aprovado | Capturas 1–2: uma tentativa, um conjunto, PV 7 / SA 1 / BI 3 preservados; resumo Operadora, nível 1, PV 7/15, SA 1/3, BI 3/7, Defesa 12 e doze Passivas. Fluxo completo confirmado por Gus. |
| T6 — pendências e lotação | Aprovado | Capturas 3–4: pendências de Perícias/Misto e 10/10 vagas impedem ativação; zero tentativas e conjuntos. |
| T7 — revisão antiga | Aprovado | Capturas 5–7: primeira tentativa recusada sem criar conjunto; nova conferência desmarca confirmação; segunda tentativa conclui com um conjunto e recursos preservados. |
| T8 — falhas e nova tentativa | Aprovado | Capturas 8–11: falha antes de gravar mantém zero conjuntos; nova tentativa conclui com um. Resposta perdida após gravar mostra um conjunto sem anunciar sucesso; nova tentativa confirma e permanece com um conjunto. Recursos preservados. |
| T9 — resumo recusado, janela estreita e F5 | Aprovado | Captura 12 mostra recusa sem cartão antigo; captura 13 mostra resumo recuperado em janela estreita no PC. Gus confirma o caso completo, incluindo reinício por F5. O F5 não está documentado por captura própria nesta mensagem. |

As capturas são evidência visual dos estados indicados; a confirmação textual do usuário cobre a execução dos casos. Não transformar uma imagem estática em prova de clique, pedido, rede ou persistência não observados.

## Situação após esta rodada

- T5–T9 encerrados, sem repetição solicitada. Roteiro preservado para regressões futuras.
- T1/T3/T4 permanecem aprovados e T2 mantém a ressalva de sincronização já registrada em [resultado-testes-humanos-2026-10-23.md](resultado-testes-humanos-2026-10-23.md).
- Celular físico continua não executado, aguardando preparação posterior de acesso. Janela estreita no PC não substitui toque, teclado ou navegador no aparelho.
- Integração remota, ciclo real de arquivamento/retomada, Baú e concorrência real continuam sem validação humana nesta rodada. Falhas de T8 são simuladas, sem interrupção real de rede.
- Nenhuma autorização de banco, permissões, autenticação, exposição de rede, merge ou publicação é inferida desta aprovação.

Este incremento registra apenas documentação. Os 106 testes automatizados, TypeScript, compilação e CI aprovados no checkpoint anterior continuam como resultados daquele código; não foram reexecutados só para registrar a aprovação humana.
