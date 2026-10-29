# Ativação e resumo operacional — protótipo SQL local

> Continuação em [ciclo-e-interface-local.md](ciclo-e-interface-local.md): ciclo e interface fictícia preparados localmente. Este relatório preserva a etapa anterior e seus limites históricos.

## IMPLEMENTADO
Propostas fora da cadeia de migrações: [ativacao-local.sql](../supabase/proposals/ativacao-local.sql) e [resumo-operacional-local.sql](../supabase/proposals/resumo-operacional-local.sql), usando a proposta anterior de instâncias de inventário. Nenhum SQL foi executado em projeto remoto.

O comando de ativação permanece interno, SECURITY INVOKER, sem EXECUTE para anon/authenticated e sem RPC pública de ativação. Os ensaios chamam esse comando em banco local descartável, com identidades fictícias; não há botão de finalizar na aplicação.

A operação:
1. Revalida autoria e vínculo de jogador; o Mestre oficial não pode assumir personagem de jogador na mesma Mesa.
2. Serializa a capacidade coletiva pela linha da Mesa, protege vínculo, ficha e contexto durante a transação.
3. Exige contexto explicitamente preparado. Ausência de contexto, criação fechada, Regra da Casa ou nível inicial diferente de 1 recusam o pedido.
4. Compara a revisão integral da ficha e a revisão do contexto da Mesa. A revisão da ficha cobre alterações em todos os campos, inclusive identidade e recursos; não depende apenas das versões de compras e preferências. Alteração de contexto e retorno ao valor anterior continuam detectáveis.
5. Reconfere nome, narrativa opcional, Atributos, Origem/Treinamento, pontos completos, Habilidade, máximos/recursos atuais, preferências, kit, compras, pilhas e capacidade. A origem das regras é o catálogo já auditado, com comparação automatizada do snapshot SQL.
6. Conta personagens completas legadas no teto de dez e não conta rascunhos. Não impõe teto de uma ativa por conta. Dez jogadores é uma condição distinta; a admissão de novos jogadores não foi implementada por este incremento.
7. Cria instâncias, troca estado e registra recibo na mesma transação. Falha em qualquer etapa desfaz tudo, inclusive o incremento de revisão.
8. Repetição da mesma operação e das mesmas revisões solicitadas retorna o recibo original. Não recria itens, restaura durabilidade, recarrega arma ou cura recursos. Outra operação sobre a mesma ficha é recusada.

Misto exige BI infectante e Durabilidade ao Aparar definidos apenas nesta proposta de ativação. O salvamento atual de rascunhos continua aceitando essas opções a definir. Manual e Automático preservam preferências inativas; nenhum modo executa automações neste protótipo.

O bloqueio de Mesa usa FOR NO KEY UPDATE, para serializar ativações sem bloquear KEY SHARE das referências usadas pela criação de rascunhos. Uma sequência interna no contexto também é incrementada dentro da transação, sem alterar a revisão das escolhas da Mesa. Essa escrita prepara a detecção de snapshots concorrentes em REPEATABLE READ/SERIALIZABLE; apenas adquirir um bloqueio sem mudar a linha não seria suficiente para esse caso. Repetição não incrementa a sequência e rollback a restaura. A estratégia foi revisada contra a ordem de bloqueios existente e a [documentação do PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS). Ainda é necessário comprovar sobreposição real entre conexões nos níveis de isolamento pertinentes.

## Privacidade proposta
A proposta local substitui a leitura integral do Mestre por uma projeção fechada: identificação, Classe/nível, PV, SA, BI, Defesa e doze passivos normais. Narrativa, Origem, Habilidade, preferências, plano de compras e instâncias não fazem parte da resposta.

Passivos seguem 10 + valor da Perícia, com Atributo contado uma vez e bônus de Treinamento +0/+2/+3. Vantagem/Desvantagem não são embutidas no número normal. Condições retornam null para indicar que a integração ainda não existe; não declarar lista vazia como prova de ausência de efeitos.

A leitura de resumo é limitada ao Mestre oficial da Mesa. O trabalho privilegiado fica no schema privado, com autenticação e autorização explícitas e search_path vazio; a função pública de leitura é SECURITY INVOKER. Essas permissões existem somente nas propostas e nos testes locais.

Jogador admitido consulta seus próprios rascunhos. Ter uma ativa permite consultar as fichas completas de outros jogadores admitidos na mesma Mesa, conforme o Planejamento v2.0; nunca seus rascunhos ou edição alheia. Usuário removido perde consulta e escrita; não foi implementada aqui a exclusão/arquivamento de seus registros.

## TESTADO
Suíte completa local: 93 testes aprovados, incluindo os dez novos; TypeScript e compilação no modo teste aprovados. Após o ajuste final de bloqueio/projeção, os dez testes afetados foram reexecutados. Não há certificação de concorrência real ou de interface nova por esses resultados.

Dez novos testes em PostgreSQL local descartável:
- Nove kits e várias ativas da mesma autoria, preservando todos os recursos e demais campos.
- Repetição após resposta supostamente perdida, mantendo IDs e estado de item já modificado; outra operação/reutilização de identificador recusadas.
- Revisão antiga após alteração de identidade, recurso ou contexto; atualização sem mudança real não inventa nova revisão.
- Escolhas incompletas, payloads narrativos/configurações inválidos, máximos divergentes, excesso de compras e capacidade sem materialização parcial.
- Dez jogadores/ativas como contagens distintas, completas legadas, contexto ausente/fechado, nível fora do escopo e acesso sem vínculo.
- Falha injetada durante item e após troca de estado, com rollback de ficha, revisão, registro e instâncias; nova tentativa válida funciona.
- Bônus de cinco Origens combinados com Parrudo, incluindo Amnésico e opções do Misto resolvidas.
- Mestre com resposta estritamente operacional e sem acesso direto à ficha ou alteração de recursos.
- Jogador sem ativa, com ativa, rascunho alheio e remoção de vínculo.
- Tabelas/comando privados, revisão protegida, ajuste permitido de recurso próprio e snapshot SQL igual ao catálogo auditado.

Os testes são sequenciais. A repetição da chamada simula a necessidade de repetir um pedido; não houve interrupção real de rede. Não foi certificado acesso por navegador, celular, API remota ou conexões PostgreSQL simultâneas. Não foram localizados executáveis de PostgreSQL/psql/Docker no ambiente disponível; nenhuma instalação foi feita.

## PENDENTE DE TESTE HUMANO
Nenhum teste novo disponível agora, pois o protótipo não foi integrado à interface. Manter T1/T3/T4 aprovados e T2 aprovado no fluxo de sincronização observado, com a ressalva de cobertura já registrada. Celular segue pendente de acesso adequado. A próxima rodada humana será agrupada após integração autorizada.

## BLOQUEADO PARA APLICAÇÃO REMOTA
Este conjunto ainda não é um pacote de migração para aplicar:
- Falta acesso público autorizado ao comando de ativação e integração de revisão/confirmar na interface.
- O catálogo de compras continua parcial; inventário em uso, Condições e automações de jogo não estão disponíveis.
- Falta consolidar ciclo ativo/arquivado, saída/readmissão e exclusão. As novas referências de ativação usam restrição de exclusão, enquanto a proposta anterior de inventário tem cascatas; essa diferença precisa de revisão antes de qualquer aplicação, para respeitar o ciclo oficial.
- O contexto de criação é privado e preparado apenas nas fixtures. Não há configuração real do Mestre nem inicialização silenciosa das Mesas existentes.
- A entrega do resumo em tempo real e a passagem segura das permissões antigas para as novas ainda precisam ser integradas. Não aplicar só a ativação deixando a política antiga.
- Faltam ensaio com conexões simultâneas e resposta interrompida e checkpoint específico para banco/permissões do TESTE.

Produção, Auth, permissões remotas, registros existentes e documentos oficiais permanecem preservados. Sem custo contratado, merge ou publicação.

## PRÓXIMO PASSO
Consolidar o ciclo de vida e preparar a interface isolada de revisão/ativação e resumo. Só apresentar checkpoint de banco/permissões quando o pacote de integração estiver concreto e revisável. Não há autorização adicional solicitada nesta etapa.

Referências: Planejamento v2.0 §§3–6, Arquivo do Jogador J 21–27, 42–43; contrato-ativacao-ficha.md; inventario-persistencia-local.md; [funções no Supabase](https://supabase.com/docs/guides/database/functions) e [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Changelog consultado em 23/10/2026; alterações recentes examinadas não exigem modificação remota para este ensaio local.

