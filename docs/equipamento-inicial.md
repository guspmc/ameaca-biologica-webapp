# Equipamento inicial no rascunho — 23/10/2026

Incremento da etapa 5 de criação, conforme Arquivo do Jogador v1.0 J 26, 29–30, 33–34, 37–38, 48, 50, 53, 64–70 e 98, e Planejamento WebApp v2.0 §5.1–5.2 e §9.1–9.4. As tabelas das opções foram conferidas visualmente no PDF oficial; as imagens e o livro não foram publicados no repositório.

## Escopo

Salva uma escolha A/B/C ou nenhuma; representa o equipamento previsto da criação. Não é inventário ativo. Alterar a escolha substitui o conjunto inteiro; não cria duplicatas ou créditos acumuláveis. Finalização deverá converter a escolha em instâncias de itens com estado próprio, uma única vez e na mesma transação da ativação. Não usar esta projeção para reconstruir um inventário depois de consumo ou transferência.

Todas as opções incluem 1 Erva Verde e 1 Lanterna Simples. Armas de fogo começam carregadas, sem conceder munição de reserva não prevista. Característicos ocupam zero Espaços e aparecem em posição fixa acima da grade.

| Classe | A | B | C | Característicos |
|---|---|---|---|---|
| Agente | Sentinel Nine + Colete Acolchoado | JMB Hp3 + 1 Moeda | 3 Moedas | Gazua Profissional + Hatchet |
| Autodidata | Bastão de Beisebol + Colete Acolchoado + 1 Moeda | LEMI + 1 Moeda | 3 Moedas | Kit de Primeiros Socorros + Pente Estendido 9 mm |
| Operador | Bastão de Beisebol + Colete Acolchoado + 1 Moeda | LEMI + 1 Moeda | 3 Moedas | Colete de Placas Kendo + Kit de Ferramentas |

Capacidade = 4 + FOR +1 se Mochileiro. Ocupação A: quatro Espaços em Agente, cinco nas demais; B: quatro; C: três, com as três moedas em um bloco. FOR 0 sem Mochileiro não permite A de Autodidata/Operador. Interface desabilita e banco recusa a opção. Se trocar Origem reduzir capacidade abaixo da ocupação salva, preservar a escolha e sinalizar revisão, sem apagar itens ou criar capacidade fictícia.

Colete Acolchoado e Kendo ficam guardados; Kendo começa com zero placas. Pente Estendido fica guardado, não instalado. Portanto não aplicam Defesa, RD, mobilidade ou aumento de pente antecipadamente. Nenhuma arma está empunhada pela simples escolha do kit. Isso não é uma regra que proíba equipar posteriormente; o comando de equipar será integrado à ficha ativa.

Compras com as três moedas do Personalizado, catálogo universal, expansões, itens de dois Espaços, equipar/instalar, consumir, recarregar, descartar, Baú e transferências continuam pendentes. Não há botão fictício de ação no rascunho. Campos narrativos, revisão, automações e finalização também permanecem por implementar.

## Segurança e validação

- Migração `20261023045501_equipamento_inicial_rascunhos.sql` gerada pelo CLI, aplicada SOMENTE no projeto gratuito de teste `elctulggqcokixswusre`. Histórico conferido: onze migrações; timestamps remotos diferem dos arquivos locais. Sem produção ou reparação de histórico.
- Coluna nullable preserva registros existentes. RPC exige identidade, autoria, admissão como jogador, estado rascunho e nível 1; valida opção e capacidade no banco com bloqueio da linha. Não altera recursos, Origem, Perícias ou Habilidade.
- SECURITY DEFINER com search_path vazio e autorização explícita, necessário para escrever coluna que não é editável diretamente. Metadados: anon_execute=false, auth_execute=true, escrita_direta=false. Sem novas tabelas/políticas; RLS existente preservada.
- 24 testes locais passaram: 17 de banco, três de conexão, dois de Perícias e dois de composição dos kits/capacidade. Cobrem todas as Classes/opções, repetição, ausência, inválidos, preservação de outros campos, capacidade e redução por Origem, usuário alheio, Mestre, removido, anon, escrita direta, estado e nível.
- TypeScript e Vite passaram. Aviso de bundle de 506,93 kB minificado permanece como otimização futura, sem nova dependência.
- `tests/staging-equipamento.sql` passou em PostgreSQL 17 do teste: kit acima da capacidade recusado, Mochileiro permite A, repetição preserva recursos, escrita direta/Mestre/anon recusados e rascunho oculto do Mestre. Fixtures sem e-mail/senha, inteiramente desfeitas por ROLLBACK. Nenhum registro humano consultado ou alterado.
- QA em `tests/ui/equipamento.html`, com componente real e adaptador em memória: Operador B mostra LEMI 10/10, uma moeda e 4/6 Espaços; Kendo zero placas fora da grade. Troca para C remove a LEMI e mostra três moedas num bloco e 3/6 Espaços. Não substitui persistência real.
- Advisor agora lista oito RPCs SECURITY DEFINER autenticadas e proteção contra senhas vazadas desativada; sem alteração de Auth ou contratação. [RPCs expostas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) e [proteção de senha](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Gus aprovou o roteiro humano de Habilidades Básicas: relatou tudo funcionar e forneceu capturas de Chris com Parrudo 20/20 PV, BI máxima 9 e Armeiro 15/15 PV, BI máxima 6. Rascunhos seguem ausentes do painel do Mestre. A aprovação de persistência e repetição é pelo relato explícito do roteiro, não por inferência das imagens.

## Próximo teste humano

1. F5 na prévia local e abra Chris → Itens. Escolha B e salve: Erva Verde, Lanterna Simples, LEMI 10/10 e uma moeda; Kendo zero placas e Kit de Ferramentas fora da grade. Ocupação 4/(4+FOR+bônus).
2. F5 e reabra: opção e grade preservadas. Salvar de novo não duplica.
3. Troque para C e salve: LEMI sai; três moedas ficam num bloco, junto de Erva e Lanterna (3 Espaços). Recursos e Habilidade não mudam.
4. Se quiser, confira A na Autodidata (5 Espaços) e A/B no Agente (Sentinel Nine 19/19 ou JMB Hp3 13/13). Mestre continua sem rascunhos.

Sem merge ou publicação. Concorrência estrita, limites de dez jogadores/dez ativas, readmissão que restaura rascunhos e histórico de produção da 006 seguem pendências separadas. Nenhuma exclusão automática foi implementada.

## Confirmação humana recebida

Gus relatou teste funcional e persistência após F5 em 23/10/2026. Capturas mostram opção B de Operador, LEMI 10/10, uma moeda, Erva/Lanterna, Característicos separados e ocupação 4/7. Mestre permanece sem rascunhos. Troca para C não é comprovada especificamente pelas capturas; relato confirma o roteiro geral. Próximo incremento: identidade-rascunho.md.
