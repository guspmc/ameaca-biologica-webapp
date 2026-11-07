# Compras persistidas no ambiente de teste — 23/10/2026

## IMPLEMENTADO
Após autorização específica de Gus, aplicada somente no Supabase gratuito de TESTE a estrutura de compras. Histórico remoto: versão 20261023140317, nome compras_iniciais_rascunhos; arquivo revisado: 20261023134639_compras_iniciais_rascunhos.sql. Treze migrações registradas no teste. Produção intacta.

Interface integrada à RPC: gravação explícita, versão esperada, erros preservando a prévia, limpeza explícita antes de trocar kit e grade calculada a partir do plano salvo. A opção C continua sendo preparação da criação, sem finalizar personagem ou equipar/consumir itens. Nenhum item liberado automaticamente; disponibilidade vazia nas Mesas existentes.

## TESTADO
45 testes automatizados locais passaram. TypeScript e compilação Vite passaram. Testes incluem autorização, disponibilidade, orçamento, capacidade, normalização, repetição sem duplicação, versões inválidas, troca de kit e escrita direta negada. Transporte simulado testa payload e respostas de erro; renderização estática confere saldo, munição em dois espaços e ausência de chamada de gravação durante montagem.

Smoke remoto transacional passou: compras_smoke_aprovado_com_rollback. Identidades e Mesa novas, sem email/senha, revertidas com ROLLBACK. Não foram lidas fichas privadas nem alterados registros humanos.

Metadados confirmados: EXECUTE negado a anon e permitido a authenticated; UPDATE direto das duas colunas negado; tabela privada sem leitura/escrita por authenticated; RLS habilitada; zero disponibilidades cadastradas.

Advisors: dez avisos de RPC SECURITY DEFINER autenticada (autorização explícita revisada), aviso anterior de proteção contra senhas vazadas desabilitada, informação de tabela privada sem política (negação padrão intencional) e índice de FK pendente anterior. Não alterados Auth, políticas existentes ou índices sem necessidade aprovada.

Compilação e renderização estática não comprovam cliques, PostgREST pelo navegador, persistência visual ou funcionamento no celular. O smoke usa SQL transacional; não certifica sobreposição real de duas conexões.

## PENDENTE DE TESTE HUMANO
Após disponibilidade especificamente aprovada numa Mesa fictícia, reunir uma única sessão:
1. Salvar plano permitido, fechar/reabrir e F5: escolhas, saldo e grade permanecem.
2. Repetir salvamento: não duplicar itens nem gastos.
3. Duas sessões da mesma personagem: salvar planos diferentes; sessão antiga deve receber conflito e preservar sua prévia.
4. Item não liberado: recusa sem mudar plano salvo.
5. Plano não vazio: trocar kit deve ser recusado; limpar e salvar permite troca.
6. Outra conta/Mestre: manter rascunho privado. Conferir celular físico quando houver acesso local autorizado.
Testes humanos anteriores de flexões, busca e simulação permanecem válidos; esta integração nova ainda não foi confirmada por Gus.

## BLOQUEADO
Compras não vazias em Mesas existentes continuam dependentes de disponibilidade aprovada. Não foi criada liberação global ou gestão administrativa. Navegador automatizado indisponível nesta sessão; inspeção visual interativa permanece pendente. Produção, merge e publicação exigem checkpoint.

## PRÓXIMO PASSO
Revisar o incremento no PR em rascunho. Preparar o fluxo de disponibilidade por Mesa antes de solicitar testes humanos de compra persistida. Preservar documentos oficiais e decisões anteriores.
