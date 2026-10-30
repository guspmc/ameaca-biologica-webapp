# Proposta — allowlist da revisão de ficha

**Data:** 30/10/2026  
**Branch de referência:** `fix/lan-websocket-reconnect-2026-10-29`  
**Estado:** proposta de desenho; não aplicada ao SQL, não testada em PostgreSQL e não aplicada remotamente.

## Objetivo

Corrigir o acoplamento estático identificado em `supabase/proposals/ativacao-integrada-local.sql`: hoje `app_private.versionar_criacao()` compara a linha inteira de `public.personagens`, exceto `revisao_criacao`. Quando o trigger de inventário incrementa `revisao_inventario`, o UPDATE da personagem também incrementa `revisao_criacao`.

A direção aprovada é usar uma lista explícita de colunas relevantes, em vez de comparar a linha inteira. A mudança é apenas de proposta local: o arquivo integrado continua fora de `supabase/migrations`.

## Matriz preliminar de classificação

A classificação abaixo é baseada nos campos lidos/alterados pelas funções presentes na proposta. Antes de alterar o SQL, comparar esta matriz com o schema completo e com todas as escritas de `public.personagens`.

| Campo/grupo | Tratamento proposto | Motivo/ressalva |
|---|---|---|
| `nome`, `identidade` | Incrementa revisão da ficha | Conteúdo identificador/narrativo da criação. |
| `classe`, `nivel`, `forca`, `agilidade`, `vigor`, `astucia` | Incrementa | Escolhas e atributos que definem a criação. |
| `origem`, `pericia_origem_treinada`, `pericia_origem_extra`, `pontos_pericia_classe`, `habilidade_basica` | Incrementa | Escolhas de origem, perícias e habilidade. |
| `equipamento_inicial`, `compras_iniciais` | Incrementa | Fonte de materialização do inventário inicial. `revisao_compras` é uma revisão especializada e não deve, sozinha, acionar a revisão geral. |
| `configuracao_funcionamento` | Incrementa por ora | É validada na ativação e integra os dados salvos da ficha; confirmar se o contrato deseja uma revisão própria no futuro. |
| `pv_maximo`, `sa_maximo`, `bi_maximo`, `defesa` | Incrementa quando os derivados forem recalculados por criação/evolução | São resultados calculados, nunca campos de edição livre no Padrão. A evolução recalcula conforme Classe, Atributos, nível, Origem, Habilidades e demais modificadores aplicáveis. |
| `metodo_criacao` | Incrementa quando alterar a regra estrutural aplicada à ficha | Campo de método de criação; confirmar o ciclo de alteração permitido antes de fechar a lista. |
| `estado_ficha`, `jogador_id` | Não devem ser confundidos com edição estrutural | Mudanças de estado/posse precisam invalidar pedidos antigos por controle próprio do ciclo, sem fazer parecer que a criação foi refeita. A solução exata depende da revisão de ciclo/recibos já existente.
| `pv_atual`, `sa_atual`, `bi_atual` | **Não incrementam revisão estrutural** | Na criação e na evolução, são ajustados automaticamente pelas regras. Durante o jogo, são recursos operacionais modificáveis. No Descanso Completo com evolução, PV atuais terminam no novo máximo e SA são recuperados; BI atual não é zerada automaticamente. Validar a aplicação atômica dessas regras no fluxo de descanso/evolução. |
| `revisao_criacao` | Nunca comparar com si própria | É o contador mantido pelo trigger. |
| `revisao_inventario` | Não incrementa revisão geral | Deve ser coberta pela revisão específica do inventário. Alterar inventário precisa invalidar conferência de arquivamento, mas não fingir que as escolhas de criação mudaram. |
| `revisao_compras`, `revisao_funcionamento` | Não incrementam a revisão geral por si sós | São contadores especializados. As alterações subjacentes a compras/configuração continuam cobertas pela allowlist quando relevante; verificar as RPCs que as mantêm. |
| Colunas de recibos, sequência de contexto ou estado pertencentes a outras tabelas | Fora da função | São versionadas/validadas pelos contratos próprios da Mesa e das operações. |

## Bônus automáticos e efeitos derivados de Habilidades

A progressão não se limita às escolhas feitas pelo jogador. Habilidades selecionadas podem conceder bônus permanentes ou efeitos derivados que precisam ser recalculados automaticamente quando a ficha muda de nível ou quando uma escolha de Habilidade é concluída.

- Separar **escolhas** (ex.: selecionar Habilidade, aumentar Atributo, gastar Ponto de Perícia) de **efeitos derivados** (ex.: bônus em Defesa, PV Máximos, SA Máximo, BI Máxima, Movimento, testes, dano, capacidade de Inventário ou proficiências).
- O jogador escolhe apenas nos campos liberados para aquela etapa. O cliente não envia os valores finais dos bônus como autoridade; o servidor calcula os efeitos a partir das escolhas persistidas, da Classe, do nível, dos Atributos, dos equipamentos e das regras aplicáveis.
- Recalcular sem duplicar bônus: a mesma fonte não pode ser aplicada duas vezes, salvo regra explícita de acumulação. Distinguir bônus permanentes, temporários e circunstanciais.
- Ao perder nível (ex.: regra de Morte), reverter os benefícios daquele nível e recalcular os derivados, sem apagar escolhas e efeitos de outros níveis que continuem válidos.
- O método Regra da Casa possui exceções aprovadas para valores derivados personalizados; não sobrescrever valores manuais automaticamente. O método Padrão mantém fórmulas e limites oficiais.

A implementação deve mapear cada Habilidade do Arquivo do Jogador v1.0 e classificar seus efeitos. Não presumir que todo bônus de Habilidade altera uma coluna numérica: alguns efeitos são permissões, modificadores condicionais ou regras de disponibilidade.

## Regras funcionais de evolução confirmadas

A evolução durante o jogo é distinta da criação de personagem experiente. O Planejamento v2.0 estabelece que:

- O Mestre libera evolução coletivamente ou para personagens selecionadas, com autorização individual por ficha.
- O Nível da Mesa é o teto; a liberação não concede níveis automaticamente nem permite ultrapassar esse teto.
- O jogador recebe notificação e confirma se deseja iniciar a evolução.
- As escolhas são aplicadas em sequência, durante Descanso Completo elegível em Sala de Descanso. Recursos atuais, Inventário e campos permitidos continuam utilizáveis enquanto há progressão pendente.
- A tabela oficial de ganhos por nível é: 2 = Habilidade Básica/iniciar outro Ramo; 3 = +1 Atributo; 4 = Habilidade Avançada +1 Ponto de Perícia; 5 = +1 Atributo; 6 = Habilidade Avançada; 7 = +1 Atributo; 8 = Habilidade Superior +1 Ponto de Perícia; 9 = +1 Atributo; 10 = Habilidade Avassaladora.
- Habilidade Avançada exige Habilidade Básica do mesmo Ramo; Superior exige a progressão anterior do mesmo Ramo. Ramos não são multiclasse.
- Se a Mesa liberar vários níveis, cada nível deve ser aplicado em sequência, sem saltar escolhas ou validar apenas o nível final.
- O Descanso Completo recupera PV e SA. Ao evoluir nesse descanso, PV atuais terminam no novo máximo; SA são recuperados. BI atual e demais consequências não são removidas automaticamente.

A tabela é a matriz funcional inicial; antes de codificar validadores, cotejar cada opção com as listas, pré-requisitos e particularidades completas do Arquivo do Jogador v1.0. Não inventar escolhas ou efeitos ausentes do cânone.

## Proposta mínima de algoritmo

1. Na função `versionar_criacao()`, comparar somente uma tupla explícita de campos escolhidos na matriz, em vez de `to_jsonb(new)` contra `to_jsonb(old)`.
2. Incrementar `new.revisao_criacao := old.revisao_criacao + 1` quando essa tupla mudar; caso contrário, preservar `old.revisao_criacao`.
3. Não mexer no trigger de inventário nesta primeira alteração.
4. Não incluir colunas desconhecidas por suposição: a lista final deve ser cotejada com o schema e com todos os UPDATEs/rotinas de escrita antes de editar a proposta SQL.
5. O fluxo de evolução deve usar autorização individual do Mestre, nível máximo da Mesa, confirmação do jogador e conclusão de Descanso Completo em Sala de Descanso. O servidor revalida tudo na transação final.
6. A ficha só libera os campos previstos para o nível que está sendo aplicado; recursos atuais e inventário continuam operacionais enquanto a progressão está pendente.
7. Calcular máximos e derivados no servidor; no método Padrão, não aceitar valores máximos arbitrários do cliente.
8. Aplicar múltiplos níveis em sequência, com validação de cada etapa e seus pré-requisitos.
5. Manter a alteração dentro de `supabase/proposals/ativacao-integrada-local.sql`; não criar migration ativa nem executar SQL remoto.

## Pontos de segurança e ciclo que a lista precisa preservar

- A ativação compara `revisao_criacao` com a revisão conferida, valida as escolhas e depois altera `estado_ficha` e `metodo_criacao`. O recibo exige que a revisão retornada avance.
- Arquivar/assumir usa a revisão esperada e altera `estado_ficha`/`jogador_id`; essas mudanças precisam invalidar pedidos antigos sem depender semanticamente da revisão estrutural.
- A evolução ainda não existe nas migrations/funções inspecionadas: não foi encontrado fluxo implementado de autorização do Mestre, confirmação do jogador, descanso completo ou progressão por nível.
- O arquivamento move instâncias comuns para o Baú; esse fluxo deve incrementar `revisao_inventario`, mas não deve provocar incremento adicional de revisão da ficha apenas pelo movimento dos itens.
- A saída/remoção apaga rascunhos e pode disparar exclusões em cascata. O trigger de inventário não pode tentar atualizar uma personagem já em processo de exclusão. Este ponto exige teste PostgreSQL e não é resolvido pela allowlist.
- O transporte de ativação ainda não está integrado à aplicação conectada; esta proposta não autoriza integração, publicação ou execução remota.

## Testes obrigatórios antes de considerar a correção validada

1. UPDATE de um campo de criação listado incrementa `revisao_criacao` exatamente uma vez.
2. UPDATE exclusivo de `revisao_inventario` não incrementa `revisao_criacao`.
3. INSERT/UPDATE/DELETE de instância altera a revisão de inventário dos personagens afetados, mas não a revisão de criação somente por esse motivo.
4. Alterar PV/SA/BI atuais segue a política de revisão escolhida explicitamente e não invalida silenciosamente uma ativação em andamento.
5. Ativar ficha incrementa a revisão de ciclo esperada e retorna recibo válido; repetir a mesma operação não rematerializa itens.
6. Arquivar e assumir invalidam revisão antiga, preservam idempotência e movimentam os mesmos IDs de itens.
7. Excluir rascunho, remover participante e excluir Mesa com cascatas não tentam atualizar uma linha-pai inexistente nem deixam revisão parcial.
8. Alterar nome/atributos/kit/compras entre conferência e ativação faz a ativação recusar a revisão obsoleta.
9. Teste concorrente com duas conexões para ativação versus mudança de inventário/ciclo; os testes sequenciais existentes não certificam concorrência real.

## Estado desta etapa

- **IMPLEMENTADO:** leitura estática dos triggers de revisão, materialização, ativação, arquivamento/retomada e exclusão de rascunho/saída.
- **CONFIRMADO ESTATICAMENTE:** a comparação da linha inteira acopla `revisao_inventario` a `revisao_criacao`.
- **HIPÓTESE A TESTAR:** as cascatas podem alcançar o trigger de inventário durante exclusões; o efeito depende da ordem e do contexto real do PostgreSQL.
- **CONFIRMADO PELO PLANEJAMENTO v2.0:** autorização individual do Mestre, Nível da Mesa como teto, confirmação do jogador, evolução em sequência durante Descanso Completo em Sala de Descanso; PV atuais no novo máximo, SA recuperado e BI não restaurada automaticamente.
- **PENDENTE:** fechar allowlist após auditoria integral de escrita; desenhar revisão/controle próprio do ciclo; mapear validadores completos por nível/Ramo; implementar autorização, notificação, confirmação e aplicação atômica; testes SQL locais; revisão do diff.
- **NÃO REALIZADO:** execução SQL, alteração de banco remoto, merge, PR ou publicação.
