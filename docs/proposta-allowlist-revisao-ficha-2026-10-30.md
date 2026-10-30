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
| `pv_maximo`, `sa_maximo`, `bi_maximo`, `defesa` | Incrementa | Derivados validados contra as escolhas de criação; divergência deve invalidar conferência. |
| `metodo_criacao`, `estado_ficha`, `jogador_id` | Incrementa | Não são escolhas da criação em sentido estrito, mas mudanças de ciclo/posse precisam invalidar pedidos antigos. Se mantidos na mesma revisão, o nome `revisao_criacao` é semanticamente estreito; documentar isso ou separar revisões no desenho futuro. |
| `pv_atual`, `sa_atual`, `bi_atual` | **Não decidido para implementação** | Recursos operacionais mudam durante o jogo. Incluí-los pode gerar conflitos de edição sem relação com criação; excluí-los exige garantir que nenhuma conferência/ativação dependa da revisão geral para detectar mudanças de recursos. A função de validação verifica limites, mas não define por si só a política de concorrência. |
| `revisao_criacao` | Nunca comparar com si própria | É o contador mantido pelo trigger. |
| `revisao_inventario` | Não incrementa revisão geral | Deve ser coberta pela revisão específica do inventário. Alterar inventário precisa invalidar conferência de arquivamento, mas não fingir que as escolhas de criação mudaram. |
| `revisao_compras`, `revisao_funcionamento` | Não incrementam a revisão geral por si sós | São contadores especializados. As alterações subjacentes a compras/configuração continuam cobertas pela allowlist quando relevante; verificar as RPCs que as mantêm. |
| Colunas de recibos, sequência de contexto ou estado pertencentes a outras tabelas | Fora da função | São versionadas/validadas pelos contratos próprios da Mesa e das operações. |

## Proposta mínima de algoritmo

1. Na função `versionar_criacao()`, comparar somente uma tupla explícita de campos escolhidos na matriz, em vez de `to_jsonb(new)` contra `to_jsonb(old)`.
2. Incrementar `new.revisao_criacao := old.revisao_criacao + 1` quando essa tupla mudar; caso contrário, preservar `old.revisao_criacao`.
3. Não mexer no trigger de inventário nesta primeira alteração.
4. Não incluir colunas desconhecidas por suposição: a lista final deve ser cotejada com o schema e com todos os UPDATEs/rotinas de escrita antes de editar a proposta SQL.
5. Manter a alteração dentro de `supabase/proposals/ativacao-integrada-local.sql`; não criar migration ativa nem executar SQL remoto.

## Pontos de segurança e ciclo que a lista precisa preservar

- A ativação compara `revisao_criacao` com a revisão conferida, valida as escolhas e depois altera `estado_ficha` e `metodo_criacao`. O recibo exige que a revisão retornada avance.
- Arquivar/assumir usa a revisão esperada e altera `estado_ficha`/`jogador_id`; essas mudanças precisam invalidar pedidos antigos.
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
- **PENDENTE:** inspeção integral do schema e de todos os caminhos de escrita; decidir a política para PV/SA/BI atuais; editar a função; testes SQL locais; revisão do diff.
- **NÃO REALIZADO:** execução SQL, alteração de banco remoto, merge, PR ou publicação.
