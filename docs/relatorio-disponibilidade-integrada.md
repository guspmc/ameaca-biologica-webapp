# Disponibilidade integrada ao TESTE — 23/10/2026

## IMPLEMENTADO
Checkpoint explícito de Gus recebido após teste humano do painel fictício (liberar/bloquear Faca e falha simulada confirmados com capturas).
Arquivo gerado pelo CLI v2.121.0: supabase/migrations/20261023160814_disponibilidade_mestre.sql. Duas funções aplicadas exclusivamente ao projeto gratuito de TESTE elctulggqcokixswusre. Histórico remoto: 20261023160853_disponibilidade_mestre; 14 migrações.

Painel conectado em Participantes da Mesa, somente quando o usuário é Mestre da Mesa selecionada e a aplicação roda no modo teste. key=mesa.id separa o estado entre Mesas. A checagem visual não substitui autorização nas funções: auth.uid(), mesas.mestre_id e validação de item/booleanos são conferidos no servidor.
A instalação não libera itens. Depois da verificação remota, disponibilidade continua com zero registros. Nenhuma ficha humana lida/editada pelo agente. Produção, Auth e políticas RLS existentes intactos.

## TESTADO
52 testes locais aprovados. TypeScript, compilação padrão e compilação do modo teste aprovados. Cobertura nova: montagem somente para Mestre com recurso ativo, ausência de chamadas na renderização e roteiro transacional remoto exercitado localmente.
Smoke remoto tests/staging-disponibilidade.sql passou com disponibilidade_smoke_aprovado_com_rollback. Cria identidades sem email/senha e Mesa novas, libera Faca, salva plano de personagem fictício, bloqueia item preservando plano, testa jogador/escrita direta/anon negados e desfaz tudo com ROLLBACK.

Metadados: ambas funções SECURITY DEFINER, search_path vazio, EXECUTE negado a anon e permitido a authenticated. Autorização do Mestre testada no corpo. Tabela privada sem SELECT/INSERT direto por authenticated. Nenhuma mudança em Auth ou políticas existentes.

Advisors conferidos: 12 avisos de funções autenticadas SECURITY DEFINER (duas novas intencionais com autorização explícita), informação de RLS sem política na tabela privada (negação padrão), proteção contra senhas vazadas desabilitada e índice de FK jogador_id pendente anteriores. Nenhum ajuste adicional fora do checkpoint.
Referências dos alertas:
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

## PENDENTE DE TESTE HUMANO
Fila consolidada em fila-testes-humanos.md. O painel fictício foi confirmado; não repetir esse teste. Agora conferir painel conectado do Mestre, persistência após F5, compra permitida, bloqueio e privacidade entre contas. Celular e sobreposição real de conexões continuam pendentes. SQL e renderização estática não comprovam interação via navegador/PostgREST.

## BLOQUEADO
Nenhum bloqueio técnico para a rodada humana no TESTE. O agente não habilitou itens nas Mesas existentes; escolhas serão feitas explicitamente pelo Mestre no painel. Produção, merge/publicação e alterações adicionais de estrutura exigem checkpoint.
Comparação de disponibilidade usa estado booleano esperado, sem revisão numérica/histórico ou detecção ABA. Planos de compra mantêm sua revisão numérica separada.

## PRÓXIMO PASSO
Na prévia local principal, selecionar a Mesa fictícia em Participantes, usar Atualizar disponibilidade e liberar Faca manualmente. Com a conta de jogador, salvar plano de uma Faca no kit C, reabrir/F5 e conferir saldo/grade. Bloquear Faca no Mestre e verificar preservação do plano e recusa de nova gravação com item bloqueado. Não finalizar personagem.
