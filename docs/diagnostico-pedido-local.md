# Diagnóstico de pedido preservado e fechamento da fila

Checkpoint de 25/10/2026, posterior a `1b18611`. O checkpoint anterior e seus 173 testes foram conferidos; árvore limpa no início. Sem repetição de operações remotas ou de testes humanos aprovados.

## IMPLEMENTADO

O controlador local agora expõe, em cópia isolada de seu estado, as revisões da ficha/Mesa preservadas no pedido e as revisões da conferência atual. O painel fictício apresenta essa comparação quando há pedido pendente. Isso torna o impedimento compreensível sem remover ou substituir a referência.

Três cenários adicionados ao fluxo combinado: falha anterior à gravação, revisão alterada após tentativa sem gravação e armazenamento incapaz de preservar o pedido. O primeiro permite somente repetição explícita após consulta; o segundo mantém o bloqueio; o terceiro não envia ativação. Todos são dependências fictícias em memória, sem Auth, Supabase ou banco remoto.

Este diagnóstico é somente leitura. Não conclui a reconciliação definitiva nem autoriza limpar pedidos ambíguos. Ausência de recibo numa consulta isolada não é prova suficiente para iniciar outra operação quando a anterior tem revisões diferentes. Não há nova função SQL ou alteração de permissões nesta etapa.

## TESTADO

- **176 testes automatizados aprovados**, incluindo três novos testes que usam juntos o controlador e a mesma dependência fictícia utilizada pela interface. Verificam contagens, referência intacta, mesmo identificador na repetição, bloqueio após reabrir, cópia das revisões e recursos preservados. Os testes anteriores continuam cobrindo SQL local e recuperação.
- TypeScript da aplicação e da QA, compilação no modo teste e verificação do diff aprovados.
- No navegador: falha anterior → consulta pendente → repetição com Envios 2/conjuntos 1; revisão divergente → bloqueio com Mesa preservada 3/atual 4, inclusive após reabrir; falha de armazenamento → Envios 0/conjuntos 0 e consulta posterior sem consentimento automático. Console sem erros nesses fluxos.
- Evidência fora do Git: `../output/qa_fluxo_2026-10-25/revisoes-preservadas.png`. Testes pelo agente não substituem confirmação humana, Auth real ou concorrência entre conexões reais.

## PENDENTE DE TESTE HUMANO

Fila fechada em **10/10**: T14.1–T14.4 e T15.1–T15.6. [Índice único enumerado](rodada-10-testes-locais.md). Não ampliar até a rodada ser respondida. Celular continua pendente de acesso e fora da contagem; T13 não foi reaberto.

## BLOQUEADO

Reconciliação definitiva/retirada de pedidos, integração de sessão/UI, banco e permissões remotos continuam fora deste checkpoint. Nenhuma publicação, merge na principal ou alteração em dados humanos. Documentos oficiais e decisões preservados.

## PRÓXIMO PASSO

Receber a rodada humana consolidada e corrigir eventuais falhas antes de ampliar a fila. Depois, preparar o protocolo de reconciliação com evidência autorizada do servidor e pacote específico para futura integração, mantendo operações incertas preservadas.
