# Perícias da criação — incremento de 23/10/2026

Implementado na branch do PR #1 e aplicado somente ao projeto gratuito de teste `elctulggqcokixswusre`. Produção não recebeu esta migração. Sem merge ou publicação.

## Regras e escopo

Referências: Arquivo do Jogador v1.0, p. 26 (pontos e listas), p. 42 (bônus) e Planejamento WebApp v2.0, seção 5.2. Agente tem 4 pontos, Autodidata 5 e Operador 3. A Origem concede um grau gratuito em sua Perícia escolhida; somente a outra opção amplia a lista da Classe. No Amnésico, essa opção é a segunda Perícia escolhida.

Um ponto sobe Não Treinada para Treinada; dois levam Não Treinada a Mestre. Se o treinamento gratuito estiver numa opção permitida para gastar pontos, um ponto adicional basta para Mestre. Os bônus são +0, +2 e +3, respectivamente, somados ao Atributo. Não somar +2 e +3. O treinamento gratuito não consome o orçamento e não torna automaticamente sua Perícia uma opção para gastar pontos fora da lista da Classe.

Este incremento cobre apenas rascunhos de nível 1. Salvar distribuição parcial é permitido; não finaliza ficha, não concede Habilidades/equipamentos e não automatiza rolagens. Evolução nos níveis 4/8 fica fora deste incremento.

## Implementação

- Migração `20261023035943_pericias_criacao_rascunhos.sql`, criada pela CLI oficial, aplicada somente no ambiente de teste.
- Coluna `pontos_pericia_classe`, objeto JSONB com padrão vazio, separada do treinamento gratuito. Adicionar a coluna não altera recursos ou escolhas de Origem existentes.
- RPC `definir_pericias_rascunho(uuid,jsonb)` exige identidade, propriedade, participação como jogador, estado rascunho e nível 1. Valida Classe/Origem, lista ampliada, inteiros de 0 a 2, teto Mestre e orçamento; remove entradas zero. O registro é travado e atualizado atomicamente.
- SECURITY DEFINER com search_path vazio; EXECUTE negado a PUBLIC/anon e concedido a authenticated. Escrita direta na coluna é negada. RLS existente preservada.
- Trigger SECURITY INVOKER impede trocar Origem, treinamento gratuito ou segunda escolha de Amnésico enquanto existirem pontos distribuídos. Não apaga escolhas silenciosamente: o autor pode zerar o formulário e salvar conscientemente antes de trocar Origem.
- A tabela de Perícias mostra valores salvos. O formulário informa pontos usados/restantes, permite redistribuir e salvar parcialmente, e desabilita opções acima do orçamento.

## Validação

- 16 testes automatizados locais passaram: 11 de banco, três de isolamento da conexão e dois dos cálculos de treinamento.
- Novos testes de banco conferem 4/5/3, custo para Mestre, lista da Classe ampliada pela Origem/Amnésico, rejeição de payloads inválidos e de gasto excedente sem alteração parcial, preservação de recursos, bloqueio de troca da Origem e autorização da RPC/escrita direta.
- TypeScript e Vite passaram.
- `tests/staging-pericias.sql` passou no Supabase de teste, PostgreSQL 17.11: fixture isolada de Operador/Acadêmico, Medicina permitida pela outra opção de Origem, orçamento recusado, troca de Origem protegida, reset explícito e Amnésico; Mestre/anon e escrita direta negados. Todas as fixtures estavam dentro da transação desfeita por ROLLBACK; registros humanos não foram modificados.
- Metadados conferidos no ambiente de teste: anon_execute=false, auth_execute=true, direct_update=false e padrão JSONB vazio.
- QA visual/funcional em `tests/ui/pericias.html`, usando o componente real com adaptador de dados fictícios em memória, sem contas/banco: Agente 4/4; Pontaria gratuita + um ponto da Classe chegou a Mestre; Luta recebeu dois pontos e chegou a Mestre; Reflexos recebeu um e ficou Treinada. Com Atributo 2, valores salvos exibiram +5/+5/+4. Opções excedentes ficaram desabilitadas. Essa fixture verifica a interface; não substitui persistência real ou autorização SQL.
- Advisor passou a listar seis RPCs SECURITY DEFINER autenticadas, incluindo a nova. O alerta é esperado para este padrão de RPC; autorização foi testada. Proteção contra senhas vazadas continua desativada; não foi contratada funcionalidade paga nem modificada configuração de autenticação. Referências: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .

## Roteiro humano curto

1. No endereço local de teste, F5 e abra um rascunho Agente com Origem Policial e Pontaria gratuita. Vá à seção Perícias.
2. Distribua 1 ponto em Pontaria, 2 em Luta e 1 em Reflexos. Deve marcar 4/4 e bloquear gastos adicionais. Pontaria/Luta ficam Mestre; Reflexos Treinada.
3. Salve. Pontaria deve mostrar AGI + 3, Luta FOR + 3 e Reflexos AGI + 2. F5 e reabra: distribuição preservada. Mestre continua sem acesso ao rascunho.
4. Tentar trocar Origem deve ser recusado enquanto houver pontos salvos. Se quiser refazer, use Zerar escolhas de pontos e depois Salvar Perícias; só então troque a Origem e redistribua. Não é necessário excluir nenhuma ficha.

Se usar outra Classe/Origem, orçamento e opções mudam conforme o livro. Não tratar a confirmação anterior de Origens como validação humana automática desta nova etapa.

## Pendências preservadas

Confirmação humana do novo formulário e da persistência. Concorrência estrita continua pendente. As confirmações anteriores do Gus cobrem atualização imediata do nome da Mesa e isolamento visual de Mesa reservada, sem certificar todos os eventos de ficha.

Exclusão de rascunhos na saída/remoção, finalização e limites de dez jogadores/dez ativas continuam fora deste incremento. Produção ainda exige reconciliação do histórico da 006 e aprovação específica das novas migrações antes de uma eventual publicação.
