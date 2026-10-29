# Disponibilidade por Mesa — preparação local

## IMPLEMENTADO
Proposta isolada em supabase/proposals/disponibilidade-mestre.sql, fora da pasta de migrações. Duas funções propostas: listar disponibilidade e definir um item por vez. Somente o Mestre identificado por mesas.mestre_id pode usá-las; tabela privada permanece sem acesso direto, sem nova política RLS ou mudança em Auth. Nenhum item é liberado por instalação.

Painel e serviço preparados, sem montagem na aplicação conectada. O painel exige carregar a lista, muda um item explicitamente e exige recarregar após erro. Fixture separada permite conferir interação sem banco ou usuários reais. Montagem futura deve usar key=mesa.id para isolar estado por Mesa.

A função de alteração bloqueia a linha da Mesa e compara o estado booleano esperado. Repetição com resultado já alcançado é idempotente. Não implementa histórico, revisão numérica ou detecção de um ciclo liberar/bloquear/liberar entre leituras (ABA). Não alegar proteção completa contra toda edição concorrente. Isso é distinto da revisão numérica do plano de compras.

Bloquear não apaga compras existentes. A RPC de compras já aplicada valida disponibilidade a cada gravação não vazia: plano contendo item bloqueado não pode ser salvo novamente até remover esse item; limpar tudo continua permitido.

## TESTADO
50 testes da suíte local passaram; TypeScript e Vite aprovados. Cinco testes novos cobrem autorização do Mestre, isolamento de Mesa, anon, acesso direto negado, entradas inválidas, estado divergente, preservação de plano e bloqueio de novo plano; transporte e renderização inicial também verificados.
Nenhum SQL remoto executado nesta etapa. Não houve auditoria remota de funções ainda inexistentes. Sem nova dependência ou custo contratado. Documentos oficiais e fontes sincronizadas não foram modificados.

## PENDENTE DE TESTE HUMANO
Fila consolidada em fila-testes-humanos.md. Painel fictício pode ser conferido agora; compras persistidas e gestão real dependem da etapa abaixo. Cliques, aparência no navegador e celular não foram declarados testados por build.

## BLOQUEADO
Aplicar as duas funções exige autorização específica para o TESTE; produção excluída. Proposta não é migração implantável automaticamente. Após checkpoint, gerar migração pelo CLI, aplicar somente ao TESTE, verificar metadados/advisors e smoke reversível antes de montar o painel na aplicação. Disponibilidades humanas continuam vazias e dados existentes intactos.

## PRÓXIMO PASSO
Revisar proposta e conferir fixture. Depois decidir checkpoint para adicionar as funções exclusivamente ao TESTE; a instalação não habilita nenhum item, e o Mestre fará escolhas por Mesa explicitamente. PR permanece em rascunho; sem merge ou publicação.

Referência de permissões e search_path consultada: https://supabase.com/docs/guides/database/functions . Índice de changelog consultado; preparação usa PL/pgSQL e RPC já adotados, sem novo recurso de plataforma.


## Atualização após checkpoint

Preparação acima preservada como histórico. Gus confirmou o painel fictício e autorizou as duas funções exclusivamente no TESTE. Aplicação, permissões e smoke com ROLLBACK verificados; painel conectado no modo teste. Estado atual: relatorio-disponibilidade-integrada.md.
