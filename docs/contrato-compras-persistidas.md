# Contrato local de compras persistidas — 23/10/2026

## IMPLEMENTADO

Proposta local na migração 20261023134639_compras_iniciais_rascunhos.sql. Não aplicada ao Supabase de teste nem à produção. Interface permanece simulação não salva.

- Colunas compras_iniciais (JSONB vazio) e revisao_compras (inteiro 0), sem UPDATE direto por usuários.
- RPC salvar_compras_rascunho(uuid,jsonb,integer): exige autor autenticado, participação como jogador, rascunho de nível 1 e opção C. Usa bloqueio de linha, valida plano e versão esperada, normaliza zeros e retorna a versão.
- Orçamento de três moedas, catálogo parcial de seis itens e ocupação calculados no servidor. 9 mm: lotes de 15, até 30 por Espaço. Saldo remanescente ocupa um bloco; saldo zero não ocupa. Inclui dois itens comuns e Mochileiro na capacidade, sem duplicar Característicos.
- Disponibilidade por Mesa em app_private.disponibilidade_compra_inicial. Tabela privada com RLS habilitada, sem permissões/políticas de acesso para jogadores. Nenhuma disponibilidade é criada automaticamente. Somente configuração administrativa especificamente aprovada pode habilitar itens; interface/gestão dessa configuração ainda pendente.
- SECURITY DEFINER com search_path vazio e autorização explícita; EXECUTE somente authenticated. Não muda políticas das tabelas existentes ou Auth.
- Repetição do mesmo pedido com versão atual/anterior retorna a versão sem duplicar. Plano diferente com versão antiga é recusado. Isso não é histórico de desfazer.
- Trigger SECURITY INVOKER impede trocar o kit enquanto houver compras salvas. Limpar e salvar explicitamente antes da troca evita perda silenciosa.

O plano ainda é escolha de criação. Não cria instâncias de equipamentos ativos, não consome moedas de uma ficha em jogo e não implementa finalização, equipar, recarregar ou inventário mutável. Sem alegar catálogo universal completo.

## TESTADO

42 testes da suíte local passaram, incluindo cinco novos de PostgreSQL em memória: normalização/repetição, versão antiga, saldo/capacidade, pilhas, tipos/itens inválidos, autor/admissão/estado, escrita direta negada, troca de kit protegida e disponibilidade negada no servidor. Fixtures de disponibilidade existem apenas nas Mesas fictícias criadas pelo setup local.

O roteiro tests/staging-compras.sql também passou localmente em teste adicional com ROLLBACK (43 testes na suíte integrada). Nenhuma execução remota.

Recursos, Origem e demais escolhas são preservados. TypeScript e Vite passaram. Sem nova dependência; código da interface e arquivos compilados continuam iguais à rodada anterior.

Não foi executado SQL remoto, consultada narrativa privada ou alterado dado humano. Testes de versão foram sequenciais; não certificam contenção simultânea entre conexões independentes. PostgREST/RPC real, cache de esquema e advisors da nova estrutura permanecem não testados, pois a proposta não foi aplicada.

Gus confirmou flexões femininas, compras simuladas e busca funcional. Capturas complementam o relato com Investigadora/Armeira, saldo 0/3, ocupação 5/5 e busca por colete. Não comprovam gravação persistida; a UI exibe que compra/gravação não estão habilitadas.

## PENDENTE DE TESTE HUMANO

Nenhum novo teste manual necessário para esta preparação local. Após aprovação/aplicação e integração de gravação, reunir numa única sessão: salvar/F5, repetir salvamento sem duplicar, conflito de duas sessões, item indisponível, limpar antes de trocar kit e manter rascunho privado. Não solicitar testes de uma função ainda indisponível.

Celular físico e concorrência estrita continuam pendências anteriores. Confirmações já recebidas não devem ser pedidas novamente sem motivo.

## BLOQUEADO

Aplicação remota depende de checkpoint específico. Operação proposta: aplicar somente esta migração no projeto gratuito de teste elctulggqcokixswusre; adicionar tabela privada, duas colunas, RPC autenticada e trigger. Sem mudar RLS existente, Auth ou produção e sem cadastrar disponibilidade em Mesas humanas.

A tabela de disponibilidade começará vazia: aplicar a estrutura não autoriza compras. Habilitar itens numa Mesa e gravar planos em registros existentes serão decisões específicas posteriores. Não criar liberação global ou confiar em disponibilidade enviada pelo cliente.

## PRÓXIMO PASSO

Obter autorização para aplicar a estrutura somente no teste e executar verificação transacional com fixtures novas/ROLLBACK. Depois integrar o salvamento de forma explícita, respeitando disponibilidade administrativa aprovada por Mesa. Manter simulação atual enquanto não houver backend conferido. Sem merge/publicação, custo ou produção.

Referências técnicas consultadas: https://supabase.com/docs/guides/database/functions e https://supabase.com/docs/guides/database/postgres/row-level-security .


## Atualização após autorização específica

O conteúdo acima registra a preparação anterior. A estrutura foi aplicada somente ao TESTE e a interface foi integrada; veja [relatório e testes atuais](relatorio-compras-integradas.md). Produção intacta e disponibilidade de itens continua vazia. Não há liberação global.
