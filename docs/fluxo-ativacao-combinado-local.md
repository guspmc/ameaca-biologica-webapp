# Fluxo combinado de ativação — preparação local

Checkpoint de 25/10/2026, posterior à preparação do contexto de criação. T14.1–T14.4 continuam enfileirados; esta preparação não depende da aprovação deles e não os encerra.

## IMPLEMENTADO

`src/fluxoAtivacaoLocal.ts` reúne os serviços já preparados de contexto, conferência, confirmação e recuperação. As dependências são injetadas; selecionar uma ficha não consulta Auth, armazenamento ou banco automaticamente. O módulo não foi ligado à aplicação conectada.

A consulta procura primeiro um resultado existente. Só oferece nova confirmação para rascunho sem recibo, contexto preparado e liberado em Padrão nível 1, revisões compatíveis, escolhas completas e menos de dez ativas. Exige confirmação explícita, preserva o pedido antes do envio e compartilha chamadas simultâneas no mesmo controlador. Reabrir consulta o resultado antes de oferecer qualquer envio. Repetição permitida conserva o identificador e consulta novamente antes de reenviar.

Encerrar ou selecionar outro contexto invalida respostas antigas, inclusive ao voltar aos mesmos IDs. Não cancela uma transação já enviada. Referência pendente com revisões diferentes permanece preservada e bloqueia outro envio: sua reconciliação ainda precisa ser preparada, sem limpeza automática ou nova operação silenciosa. Ficha completa sem recibo recuperável também não recebe nova ativação.

`tests/ui/fluxo.html` exercita essa composição com dependências fictícias, somente em memória: fluxo normal, finalizações pausadas e resposta perdida após gravar. F5, Reiniciar ou troca de cenário reiniciam tudo; reabrir dentro do cenário conserva o pedido. Não usa Supabase, login ou dados de campanha. A pequena anotação do gerador de identificador em `pedidoAtivacao.ts` permite injeção de `() => string`, mantendo a geração padrão por UUID.

## TESTADO

- 173 testes automatizados aprovados, incluindo nove novos testes do controlador. Cobrem inércia, confirmação explícita, impedimentos, recuperação, repetição, revisões divergentes, respostas antigas, chamadas duplicadas e armazenamento ilegível.
- Um dos nove integra o controlador aos comandos SQL propostos executados no PostgreSQL embutido local: confirmação autorizada, recursos atuais preservados, um recibo e recuperação sem outro envio. Não usa banco remoto nem comprova concorrência entre conexões reais.
- TypeScript da aplicação, TypeScript das interfaces de QA, compilação Vite e verificação de espaços/diff aprovados. A tentativa inicial de verificar tipos por um caminho inexistente foi corrigida para `tsconfig.ui.json`; a verificação correta passou.
- No navegador: controles inicialmente bloqueados; conferência sem consentimento não envia; confirmação normal gera um envio/conjunto; encerramento/reabertura recupera o mesmo identificador; pausa bloqueia sem envio; resposta perdida mantém referência e consulta posterior recupera com um envio/conjunto. PV 7, SA 1 e BI 3 preservados. Console sem erros nesses fluxos.
- Evidência fora do Git: `../output/qa_fluxo_2026-10-25/fluxo-recuperado.png`. Verificação pelo agente no navegador não substitui teste humano ou celular físico.

## PENDENTE DE TESTE HUMANO

Fila executável **7/10**: quatro casos T14 do contexto e três novos [T15.1–T15.3](teste-humano-fluxo.md). Podem aguardar a rodada consolidada. T13 permanece aprovado; T10–T12 e celular continuam separados.

## BLOQUEADO

Aplicação conectada, Auth/RLS e banco remoto permanecem fora desta etapa. Faltam integração validada de sessão/UI, retenção e reconciliação de pedidos, catálogo/inventário ativo e concorrência real. Nenhuma mudança remota, publicação ou merge. Documentos oficiais e decisões anteriores preservados.

## PRÓXIMO PASSO

Preparar o tratamento local de pedidos preservados quando uma recusa definitiva ou mudança de revisão impedir a repetição, sem descartar referências ambíguas. Integração remota continua dependendo de pacote revisável e checkpoint específico.
