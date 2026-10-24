# Persistência transacional de inventário — protótipo local

## IMPLEMENTADO
Proposta isolada em supabase/proposals/inventario-instancias.sql, fora das migrações aplicáveis. Duas tabelas no schema privado: registro de materialização por personagem e instâncias com IDs próprios e chave de criação única por personagem.
Função interna SECURITY INVOKER deriva sementes de itens exclusivamente das escolhas da ficha no banco; não aceita lista de itens do cliente. Catálogo inicial de 17 itens é um snapshot conferido do planejador TypeScript e comparado em testes. Nenhuma API pública criada.
RLS habilitada nas duas tabelas, sem políticas de cliente, e todos os acessos/EXECUTE revogados de PUBLIC, anon e authenticated. Apenas contexto administrativo local pode chamar a função; identidade, autoria e admissão ainda são verificadas. Esta restrição é intencional, não erro a resolver com grant amplo.

A função bloqueia a ficha, verifica rascunho nível 1, Classe/kit/FOR/Origem, compras, saldo e capacidade. Usa escolhas salvas e preserva compras bloqueadas posteriormente no catálogo. Não troca o estado da personagem nem restaura recursos.
Registro de fonte captura as escolhas de equipamento. Repetir com mesma fonte retorna o resultado inicial, preservando IDs e estados já alterados. Fonte diferente após materialização causa recusa, sem reconstituir equipamento. A gravação do registro e de todos os itens faz parte da mesma transação.
As relações usam ON DELETE CASCADE para integridade das fixtures. Qualquer aplicação remota futura precisa revisar explicitamente esse efeito e o ciclo de vida de exclusão; nenhuma exclusão remota foi feita ou autorizada por este documento.

## TESTADO
77 testes locais aprovados, TypeScript e build de teste aprovados. Cinco testes novos de PostgreSQL local:
- Nove kits SQL comparados ao planejador TypeScript, com preservação integral da linha de personagem.
- Repetição conserva IDs e Durabilidade já alterada; mudança da fonte é recusada.
- Falha injetada ao inserir Faca desfaz registro e itens anteriores; nova tentativa após remover a falha funciona.
- 45 cartuchos em 30+15, ausência de moeda de saldo zero e excesso de capacidade sem gravação parcial.
- Clientes anon/authenticated sem acesso à função/tabela; Mestre e autor removido recusados mesmo no contexto administrativo de fixture.

Testes são sequenciais em PostgreSQL em memória. Bloqueio e unicidade foram implementados, mas sobreposição real de conexões e falha de rede permanecem não certificadas. Não houve SQL remoto, consulta de registros humanos, mudança em Auth/RLS remotos ou custo contratado.

## PENDENTE DE TESTE HUMANO
Nenhuma ação humana agora: protótipo sem interface nem aplicação remota. Manter rodada única para integração futura de inventário ativo, resposta interrompida, duas contas e celular. Preferências persistidas já aprovadas por Gus permanecem encerradas.

## BLOQUEADO
Este protótipo não está pronto para exposição ao cliente ou aplicação remota isolada. Não fornece leitura autorizada de inventário ativo, comandos de uso/equipar, estado ativo/arquivado, resumo operacional do Mestre ou ativação com teto de dez. Não chamá-lo diretamente de um cliente nem conceder EXECUTE a authenticated.
A futura RPC de ativação deverá derivar/validar a ficha inteira, método/nível vigentes, preferências, capacidade ativa e privacidade; chamar a materialização na mesma transação da ativação. Repetição após ativação será tratada pelo registro da operação pública, pois esta função interna continua restrita a rascunhos. Não criar equipamento novo em Reset ou depois de uso/transferência.
Propostas de permissões e mudança de banco precisarão de checkpoint específico. Sem merge, publicação ou produção.

## PRÓXIMO PASSO
Consolidar a validação de ativação e o modelo ativo/arquivado em banco local, revisar o resumo operacional do Mestre e preparar testes de capacidade coletiva e concorrência. Só depois propor pacote remoto concreto ao Gus, preservando os documentos oficiais e histórico.
