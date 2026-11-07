# Conferência e confirmação de ativação — preparação local, 25/10/2026

## IMPLEMENTADO

`supabase/proposals/gateway-ativacao-local.sql`, fora das migrações, prepara duas funções públicas SECURITY INVOKER com serviços delimitados em schema privado, `search_path` vazio e EXECUTE restrito a authenticated. Os serviços também verificam autoria atual e vínculo no banco ao serem chamados diretamente; não confiam em papel enviado pelo cliente. As tabelas e os comandos internos continuam privados.

`conferir_ativacao_personagem` retorna somente seis campos do contrato: ID, nome, revisões da ficha/Mesa, contagem de ativas e pendências. É STABLE, não reserva vaga, não inicializa contexto, não materializa nem restaura recursos. Verifica escolhas com o validador existente e confere saldo/espaços sem escrita; informações internas dos validadores não são devolvidas. Pendências são genéricas nesta preparação, sem atalhos novos de interface. A conferência não autoriza uma ativação futura.

`ativar_personagem` verifica resultado anterior e revisões esperadas, recusa impedimentos e delega ao comando transacional privado que revalida sob bloqueio. A resposta inicial e a repetida são projetadas pela consulta de resultado existente, sem retornar JSON interno cru. Repetir a mesma operação e revisões retorna o recibo original sem restaurar PV ou duplicar itens. Outro pedido é recusado. Revisões ficam na faixa segura do cliente; um rascunho no limite máximo não avança para revisão impossível de representar.

O conflito de revisão dentro do comando privado ganhou código `PT409 / AB_REVISAO`, mantendo sua mensagem e validação. Outros erros inesperados do gateway de escrita são sanitizados como `PT500 / AB_INCERTO`, sem expor mensagens internas. `40001` conserva seu significado de serialização; não é usado como conflito de negócio. Não há reenvio automático.

## TESTADO

Oito novos testes executam SQL no PostgreSQL embutido local, com papéis e usuários fictícios: nove kits; conferência sem escrita/narrativa; acesso por autoria/vínculo, chamadas diretas e comandos privados; impedimentos/revisão; confirmação e repetição persistidas sem curar; contexto ausente/saldo; falha tardia com rollback integral; contrato TypeScript consumindo o SQL real local; erros inesperados e metadados de segurança.

Suíte completa **153 testes aprovados** (145 anteriores + oito novos). TypeScript e compilação são verificações separadas; a funcionalidade SQL foi exercitada por consultas reais locais, não inferida do build. A regressão completa inclui a alteração de código de revisão no comando privado.

Uma falha de sintaxe da expressão CASE e uma preparação de teste que acumulava rascunhos foram corrigidas durante o desenvolvimento; a rodada final passou. O limite de três rascunhos não foi alterado para acomodar o teste.

## PENDENTE DE TESTE HUMANO

**Zero casos novos executáveis nesta etapa.** A interface conectada não foi alterada. T13 permanece encerrado. A futura integração gerará seus casos próprios, com até dez por rodada conforme [protocolo vigente](protocolo-autonomia-supervisionada.md). Celular fica fora da contagem.

## BLOQUEADO / LIMITES

Não aplicado remotamente. Não é uma migração pronta para execução isolada. Requer inventário, ativação, privacidade/resumo, ciclo e consulta do conjunto proposto. Faltam gestão explícita de contexto da Mesa, integração de sessão/UI e política de retenção de pedidos, catálogo/inventário ativo completos e ensaio real de conexões simultâneas. A conferência de espaços repete parte do cálculo de materialização e exige manter os testes comparativos ao ampliar catálogo ou regras.

PGlite não certifica JWT/PostgREST real, latência ou disputa entre duas conexões PostgreSQL. Não foi executado advisor remoto nem houve mudança de Auth/RLS, dados humanos, produção, publicação ou merge. Novos grants estão somente no arquivo de proposta e no banco fictício descartável.

## PRÓXIMO PASSO

Preparar a gestão explícita do contexto de criação e o adaptador de integração local. Depois revisar o pacote e as permissões como conjunto antes de pedir autorização para aplicação no TESTE. Não habilitar chamadas novas na aplicação antes desse checkpoint e das verificações de integração.

Referências verificadas em 25/10: [funções e privilégios](https://supabase.com/docs/guides/database/functions) por MCP e [changelog](https://supabase.com/changelog). O índice Markdown retornou tipo não suportado, por isso foi consultado em HTML. As entradas recentes de TLS/.NET/documentação não mudam este contrato SQL local. Sem nova dependência.
