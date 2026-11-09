# Habilidade Básica no rascunho — 23/10/2026

Referências: Arquivo do Jogador v1.0, J 27, 29–30, 33–34 e 37–38; Planejamento WebApp v2.0, §5.1–5.2. Uma Básica no nível 1, entre três da Classe. A escolha pode ser refeita ou desfeita explicitamente enquanto rascunho. Habilidades avançadas e evolução não fazem parte deste incremento.

O catálogo contém nove resumos com referência de página. Custos, manobras, Vantagens e curas condicionais são referências; selecionar uma Habilidade não dispara ataques, rolagens ou consumo. Equipamento, identidade narrativa e finalização continuam pendentes.

## Banco e recursos

As migrações `20261023042414_habilidade_basica_rascunhos.sql` e `20261023043912_habilidade_origem_compatibilidade.sql` foram aplicadas somente ao Supabase gratuito de teste. Total: dez migrações. Produção não foi alterada e requer checkpoint específico.

A primeira adiciona a coluna e a RPC, ainda sem execução pública. A segunda mantém o bônus de Parrudo ao trocar Origem e só então libera a RPC para authenticated. Escrita direta é negada; SECURITY DEFINER usa search_path vazio e exige proprietário admitido como jogador, rascunho de nível 1 e escolha válida para a Classe. A linha é travada antes da alteração.

Parrudo acrescenta +5 PV máximos e +3 BI máxima. PV atual recebe a diferença entre máximo novo e antigo, limitado entre zero e o novo máximo: dano sofrido é preservado, sem cura por salvar repetidamente. BI atual não é descartada; a troca é recusada quando excederia o novo máximo. Cobaia soma seu bônus separadamente. Vantagem em Fortitude não altera o bônus permanente da Perícia.

## Evidências

- Suíte local: 19 testes, incluindo nove escolhas, Classe incompatível, autorização, estado/nível, escrita direta negada, repetição sem acumular, dano preservado e combinação Parrudo/Cobaia/troca de Origem.
- `tests/staging-habilidade.sql` passou no PostgreSQL 17 do ambiente de teste, com fixtures isoladas e ROLLBACK. Não altera os registros humanos. Confere também Mestre/anon recusados, troca bloqueada por BI alta e remoção segura dos bônus.
- Metadados: anon_execute=false, auth_execute=true, direct_update=false.
- QA em `tests/ui/habilidades.html`: componente real com dados fictícios em memória, três opções de Operador, seleção e salvamento de Armeiro e mensagem de sucesso. Esse adaptador não calcula recursos; derivados foram verificados no SQL, e persistência real ainda requer teste humano.
- Advisor: sete RPCs SECURITY DEFINER autenticadas e proteção contra senhas vazadas desativada. A RPC é intencional e tem autorização testada; o alerta não certifica segurança. Nenhum recurso pago contratado. Referências: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .
- Build TypeScript/Vite; aviso de bundle acima de 500 kB é uma oportunidade de otimização, não falha de compilação.

Gus confirmou os testes humanos de Perícias em 23/10 e enviou capturas: Operador 3/3, Atletismo Treinada +5 e Luta Mestre +6 com FOR 3. Essa aprovação não substitui a conferência humana da nova Habilidade.

## Checkpoint humano

1. F5 na prévia local de teste; abra um Operador e anote PV/BI máximos.
2. Características → Habilidade Básica: escolha Parrudo e salve. Máximos aumentam em 5 PV e 3 BI; salvar novamente não acumula.
3. F5 e reabra. Escolha e recursos devem persistir. Troque para Armeiro: os bônus saem preservando dano. Se BI atual impedir a troca, deve aparecer erro sem perder valores.
4. Na janela de Mestre, o rascunho continua invisível. Em Agente/Autodidata, confira as três opções da respectiva Classe.

Concorrência estrita segue pendente. Readmissão ainda restaura rascunhos; exclusão exige decisão separada. Limites futuros de dez jogadores/dez ativas e reconciliação da migração 006 em produção permanecem pendentes. PR continua em rascunho, sem merge ou publicação.

## Confirmação humana recebida

Gus confirmou todo o roteiro em 23/10/2026. Capturas mostram Chris com Parrudo (20/20 PV, BI máxima 9) e Armeiro (15/15 PV, BI máxima 6), e painel do Mestre sem rascunhos. Repetição e persistência foram confirmadas pelo relato explícito do roteiro; as imagens complementam essa evidência. Próximo incremento: equipamento-inicial.md.
