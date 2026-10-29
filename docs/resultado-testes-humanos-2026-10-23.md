# Resultado da rodada humana — 23/10/2026

Fonte: confirmação explícita de Gus e 24 capturas anexadas nesta conversa. Este registro não altera a aplicação, dados ou permissões e não substitui os relatórios automatizados anteriores.

## Resultado por caso

| Caso | Resultado humano | Evidência e limite |
| --- | --- | --- |
| T1 — preferências em duas abas | Aprovado | Capturas mostram salvamento de Manual na versão 3, tentativa de Automático na versão 2 recusada com “Revisão desatualizada” e retorno ao Manual após recarregar. Escolhas locais foram preservadas durante a recusa. |
| T2 — compras em duas abas | Aprovado por Gus para o fluxo observado | Gus relata que B atualiza imediatamente após a compra em A, sem erros. Capturas mostram a grade de B refletindo a Faca salva e, depois, a limpeza do plano. Isso confirma sincronização observada; não comprova, nesta rodada, uma tentativa recusada de compra com revisão antiga. |
| T3 — troca de kit | Aprovado | Captura mostra recusa da troca com a mensagem “Salve compras vazias antes de trocar o conjunto inicial”. Após limpar e salvar o plano, a troca para B é aceita, sem acumular a compra anterior. |
| T4 — alterações não salvas | Aprovado | Gus confirma o descarte das escolhas locais após F5, preservando o estado salvo. Capturas acompanham mudanças nos controles e planos. |
| Celular físico | Não executado — acesso indisponível | A prévia está restrita ao PC. Captura do celular mostra falha ao abrir o link local, com a mensagem “Localhost snapshots are not supported on Windows hosts”. Nenhum teste de layout ou interação em aparelho físico foi realizado. |

## Interpretação do T2

Não classificar a atualização de B como falha: ela foi aprovada pelo usuário. Também não registrar esse comportamento como prova de rejeição de uma escrita desatualizada. A grade salva é alimentada pelos dados carregados da ficha; o formulário de compras mantém plano e revisão locais em seu próprio estado. Ver a grade atualizar não demonstra, por si só, qual revisão foi enviada numa tentativa posterior.

A proteção de versão das compras já possui validação automatizada local anterior. Uma prova de conflito efetivamente produzido no ambiente conectado continua distinta da sincronização visual. Não solicitar repetição manual imediata: quando necessário, preparar um ensaio técnico controlado com duas revisões capturadas, sem ler ou alterar registros humanos.

## Fila humana após esta rodada

T1, T3 e T4 encerrados. T2 encerrado para o fluxo observado e aprovado por Gus, com a ressalva de cobertura acima. Nenhuma repetição desses cliques é solicitada agora.

Resta o teste em celular físico quando houver acesso adequado. A falha de abertura não é resultado de teste funcional da ficha. Não foi configurado acesso de rede, túnel, publicação ou regra de firewall.

Ativação, inventário ativo, concorrência real de requisições e resumo operacional permanecem etapas técnicas futuras, ainda sem nova rodada humana disponível. Alterações remotas de banco/permissões, publicação e merge continuam dependendo dos checkpoints específicos.

## Preservação

Os roteiros anteriores continuam disponíveis em testes-humanos-pendentes.md e fila-testes-humanos.md. As capturas permanecem na conversa; não foram copiadas para o repositório. Nenhum documento oficial ou registro de personagem foi editado nesta etapa.
