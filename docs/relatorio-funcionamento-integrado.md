# Preferências de funcionamento integradas — 23/10/2026

## IMPLEMENTADO
Após checkpoint explícito de Gus, aplicada somente ao Supabase gratuito de TESTE elctulggqcokixswusre a migração gerada pelo CLI 20261023173853_funcionamento_rascunho.sql. Histórico remoto registra 20261023173950_funcionamento_rascunho; 15 migrações.
Duas colunas: configuracao_funcionamento JSONB não nulo, com padrões aprovados; revisao_funcionamento inteira não nula, padrão zero. RPC protegida salva exclusivamente preferências de rascunho nível 1 do autor ainda admitido como jogador. Sem alterar recursos, inventário, estado da ficha ou demais escolhas.
No modo teste, ficha carrega as colunas e a revisão oferece Salvar Preferências. Ambiente padrão continua com prévia sem salvamento e não consulta essas novas colunas. Estado por ficha isolado por key; atualização de dados não substitui silenciosamente edição local em andamento. Erros preservam escolhas; restauração é local até salvar.
Misto mantém suas cinco opções ao trocar modo; null de BI/Durabilidade é preservado. Nenhuma automação de jogo é executada e finalização continua indisponível.

## TESTADO
67 testes locais, TypeScript e build de teste aprovados. Cadeia oficial de migrações exercitada sem reaplicar a proposta duplicada. Renderização da revisão com configuração carregada oferece salvamento sem executar chamadas durante montagem.
Smoke remoto tests/staging-funcionamento.sql aprovado: funcionamento_smoke_aprovado_com_rollback. Identidades sem email/senha, Mesa e ficha novas; salvamento/repetição, versão antiga, escrita direta, Mestre e anon verificados. Transação integralmente desfeita. Nenhuma ficha humana lida/editada pelo agente.
Metadados confirmam SECURITY DEFINER, search_path vazio, EXECUTE anon=false/authenticated=true e UPDATE direto das duas colunas=false. Tipos, nulabilidade e padrões conferidos por catálogo.
Advisors: 13 RPCs SECURITY DEFINER autenticadas (uma nova intencional com autorização explícita); RLS sem política na tabela privada de disponibilidade (negação padrão); proteção contra senhas vazadas e índice de FK jogador_id pendentes anteriores. Sem alteração extra de Auth, RLS ou índices.
Links: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable ; https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy ; https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection ; https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys .
Testes de versão são sequenciais; não comprovam sobreposição real de conexões. SQL remoto e renderização estática não certificam cliques/PostgREST pelo navegador ou celular.

## PENDENTE DE TESTE HUMANO
Rodada agrupada:
1. F5 na prévia principal; na ficha, Revisão > Funcionamento deve oferecer Salvar Preferências.
2. Em Misto, desabilitar Munição e escolher BI/Durabilidade; mudar para Manual e salvar. F5/reabrir deve carregar Manual.
3. Voltar a Misto: escolhas anteriores preservadas. Salvar e F5: Misto com as mesmas escolhas.
4. Outra ficha conserva configuração própria. Não deve copiar as escolhas da primeira.
5. Mudar uma opção sem salvar e F5: retornar à última configuração salva; recursos e inventário permanecem iguais.
6. Versão antiga em segunda sessão: recusa preservando edição local. Mestre continua sem rascunho.
Não repetir F5 da antiga prévia: agora existe salvamento e o resultado esperado é diferente. Celular físico segue enfileirado.

## BLOQUEADO
Nenhum bloqueio técnico para a rodada humana no TESTE. Preferências salvas não tornam automações executáveis. Edição em ficha ativa, inventário ativo e finalização ainda dependem de incrementos próprios. Produção, merge/publicação e novas mudanças de banco seguem checkpoints separados.

## PRÓXIMO PASSO
Conferir persistência real e independência das fichas. Continuar materialização local do inventário e requisitos de ativação, mantendo o contrato-ativacao-ficha.md. Nenhum dado humano ou documento oficial modificado.
