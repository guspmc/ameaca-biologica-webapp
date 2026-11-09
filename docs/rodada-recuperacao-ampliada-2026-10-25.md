# Rodada ampliada de recuperação — 25/10/2026

## IMPLEMENTADO

Partida conferida: checkpoint `7fbfc8c`, árvore de trabalho limpa. Nenhuma operação anterior foi reaplicada. Gus autorizou acrescentar quatro interações humanas às seis pendentes.

Adicionados quatro cenários à página isolada `tests/ui/recuperacao.html`: consulta recusada uma vez, recibo inválido depois de gravar, ficha completa sem recibo e consulta retornando outro pedido uma vez. O transporte existente valida as respostas; não houve mudança nos módulos da aplicação conectada. Os seis casos anteriores permanecem disponíveis.

## TESTADO

- Suíte completa: **141/141 testes**, incluindo quatro novos testes dos cenários com o transporte real injetado no servidor fictício. Sem acesso a banco remoto.
- TypeScript da aplicação e da interface de testes: aprovados.
- Compilação Vite em modo teste: aprovada.
- Navegador: consulta recusada bloqueia confirmação e nova consulta explícita libera; recibo inválido não mostra sucesso e F5/consulta recupera; completa sem recibo mantém confirmação e repetição bloqueadas; consulta divergente não apresenta recibo e nova consulta recupera o original. Nos cenários gravados, um envio e um conjunto permanecem. Console sem erros durante estes fluxos.
- Evidência fora do repositório: `../output/qa_recuperacao_2026-10-25/consulta-recuperada.png`.

Não se trata de validação humana, conta real, integração remota, concorrência real ou celular físico. Nenhuma nova execução do GitHub CI foi realizada nesta etapa local.

## PENDENTE DE TESTE HUMANO

**Dez casos: T13.1–T13.10**, detalhados em [teste-humano-recuperacao.md](teste-humano-recuperacao.md). A ampliação é independente da aprovação dos seis primeiros. T5–T9 continuam encerrados. T10–T12 futuros ficam fora desta contagem.

## BLOQUEADO

Integração remota requer checkpoint específico. Acesso em celular ainda precisa ser preparado. Nenhuma alteração em banco remoto, RLS, autenticação, dados existentes, publicação ou merge foi feita. A prévia foi reiniciada somente em `127.0.0.1:4174`.

## PRÓXIMO PASSO

Consolidar os resultados humanos quando Gus puder executar a rodada. Não aumentar a fila além de dez sem nova orientação. Alterações desta etapa salvas localmente sobre `7fbfc8c`, ainda sem novo commit ou sincronização remota.
