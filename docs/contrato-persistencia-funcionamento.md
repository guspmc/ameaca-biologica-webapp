# Persistência do funcionamento — proposta local para checkpoint

## IMPLEMENTADO
Proposta em supabase/proposals/funcionamento-rascunho.sql, fora da cadeia de migrações. Adiciona configuracao_funcionamento JSONB e revisao_funcionamento inteira à ficha. Padrão: Misto; munição, Inventário e duração true; BI/Durabilidade null. Não troca modo existente, ativa ficha ou executa operação de jogo.
RPC proposta salvar_funcionamento_rascunho(uuid,jsonb,integer) exige autenticação, autor ainda admitido como jogador, estado rascunho e nível 1. Bloqueia a linha; valida exatamente dois campos principais e cinco preferências, modo canônico e tipos. Três controles exigem booleano; BI/Durabilidade permitem booleano ou null.
Escrita direta das duas colunas negada. SECURITY DEFINER com search_path vazio; EXECUTE somente authenticated, autorização explícita no corpo. Nenhuma mudança de RLS, Auth ou permissões de recursos existentes.

Versão esperada evita substituir silenciosamente uma configuração diferente. Repetir configuração já salva com revisão atual/anterior retorna a revisão sem duplicar; revisão antiga para configuração diferente e revisão futura são recusadas. Preserva escolhas específicas do Misto ao salvar Manual/Automático. Estado a definir não vira false silenciosamente.
Adaptador prepara cópia da configuração e confere retorno; componente preparado para estado carregado, salvamento explícito, erro sem apagar escolhas e restauração local que ainda exige salvar. O callback não está conectado à aplicação; a tela atual permanece prévia não salva. Nenhuma leitura das novas colunas foi adicionada antes de elas existirem.

## TESTADO
66 testes locais passaram. TypeScript e build de teste aprovados. Cinco testes de PostgreSQL local cobrem padrão/idempotência, alterações e preservação de recursos, payload estrito, versões, autorização/privacidade, negação de escrita direta e independência entre fichas.
Dois testes de transporte cobrem payload copiado e respostas ambíguas/erros. Renderização confere estado carregado e ausência de gravação durante montagem; não substitui clique no salvamento.
tests/staging-funcionamento.sql passou somente localmente. Roteiro cria identidades/Mesa/ficha novas sem email/senha, confere salvamento/repetição, revisão antiga, escrita direta e Mestre/anon negados e desfaz tudo por ROLLBACK. Não foi executado remotamente.
Gus confirmou F5 retornando a Misto na prévia anterior e mostrou os controles disponíveis no Misto e bloqueados nos outros modos. Não tratar isso como persistência real nem automações de jogo testadas.

## PENDENTE DE TESTE HUMANO
Após checkpoint, aplicação e integração:
1. Duas fichas com escolhas diferentes, salvar/F5/reabrir: preferências independentes.
2. Alternar Manual/Automático e voltar ao Misto: opções específicas preservadas, sem recursos/inventário mudarem.
3. BI/Durabilidade a definir continuam a definir se salvas assim; nenhuma escolha universal inventada.
4. Duas sessões da mesma ficha: plano diferente com versão antiga recusado, edição local preservada.
5. Restaurar padrões só muda o servidor após salvar; fechar sem salvar preserva versão anterior.
6. Mestre continua sem rascunho; conta alheia não grava. Celular físico na rodada agrupada.
Não solicitar novamente o teste de F5 da prévia que foi aprovado; depois de integrar, resultado esperado muda para carregar a configuração salva.

## BLOQUEADO
Nenhuma alteração remota autorizada para esta proposta ainda. Antes de executar: gerar migração pelo CLI a partir do SQL revisado, confirmar no TESTE a ausência das colunas/RPC e histórico de 14 migrações, aplicar somente esta estrutura, conferir permissões/histórico/advisors e executar smoke transacional aprovado. Produção excluída. Não consultar registros privados ou gravar preferências em fichas humanas pelo agente.
A RPC registra preferências apenas para rascunho nível 1. Suporte futuro de edição em ficha ativa terá contrato separado; salvar preferências não ativa automações nem finaliza ficha.

## PRÓXIMO PASSO E OPERAÇÃO PARA APROVAR
Adicionar somente as duas colunas e a RPC ao projeto gratuito de TESTE elctulggqcokixswusre, executar verificação com fixtures/rollback e conectar o botão Salvar Preferências no modo teste. Sem publicar, fazer merge, alterar produção, Auth ou RLS existentes.
Não criar/gravar escolhas em Mesas humanas automaticamente. Padrões em novas colunas fazem parte da estrutura proposta; demais dados preservados.

Fontes técnicas já consultadas: https://supabase.com/docs/guides/database/functions e https://supabase.com/docs/guides/database/postgres/row-level-security . Regras de produto: Planejamento v2.0 §§5.1/6.2 e contrato-ativacao-ficha.md.


## Atualização após checkpoint de Gus

Preparação acima preservada como histórico. Estrutura aplicada e verificada exclusivamente no TESTE, com smoke remoto e ROLLBACK; botão conectado no modo teste. Estado atual e roteiro: relatorio-funcionamento-integrado.md. Nenhuma automação de jogo ou finalização habilitada.
