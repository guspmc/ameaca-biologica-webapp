# Complemento — revisões já existentes nas migrations da ficha

**Data:** 29/10/2026  
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`  
**Base:** `b8d449602f1282deb33c492b978c078d0f8cad08`  
**Escopo:** leitura estática das migrations de criação da Alfa 0.4. Sem execução SQL ou alterações de banco.

## Achado adicional

A proposta de ativação não parte de uma ficha sem revisões especializadas. As migrations anteriores já possuem:

- `revisao_compras`, incrementada por `salvar_compras_rascunho`;
- `revisao_funcionamento`, incrementada por `salvar_funcionamento_rascunho`.

Esses campos são protegidos contra UPDATE direto pelas roles comuns e alterados por RPCs próprias com validação de revisão.

A proposta genérica `versionar_criacao()`, por comparar a linha inteira, também considera essas revisões especializadas. Assim, salvar compras ou funcionamento altera a revisão geral de criação além de incrementar sua própria revisão.

## Operações de ficha observadas nas migrations

| Migration/operação | Campos alterados |
|---|---|
| Criação de rascunho | Mesa, jogador, nome, Classe, nível, Atributos, derivados, recursos iniciais, Defesa, estado |
| Definir Origem | Origem, perícia treinada/extra, Defesa, SA máximo/atual, BI máximo/atual |
| Definir Perícias | `pontos_pericia_classe` |
| Definir Habilidade | `habilidade_basica`, PV máximo/atual, BI máximo |
| Definir equipamento | `equipamento_inicial` |
| Definir identidade | nome e `identidade` |
| Salvar compras | `compras_iniciais` e `revisao_compras` |
| Salvar funcionamento | `configuracao_funcionamento` e `revisao_funcionamento` |

As migrations também restringem UPDATE direto em diversas colunas e concentram gravações em RPCs. Isso é relevante para o desenho futuro: o modelo de revisão deve respeitar os comandos autorizados existentes, em vez de adicionar um gatilho amplo sem considerar as revisões especializadas já estabelecidas.

## Consequência para a proposta

A comparação genérica de toda a linha cria uma hierarquia implícita:
- revisão geral de criação;
- revisões especializadas de compras e funcionamento;
- revisão de inventário proposta;
- revisão do contexto da Mesa.

Mas essa hierarquia não está formalizada. É preciso definir se a revisão geral:
1. é um contador independente incrementado explicitamente pelas operações que mudam dados de criação;
2. é derivada da composição das revisões especializadas e de uma revisão dos demais campos;
3. ou deixa de existir como contador amplo, sendo substituída por snapshot/versão de entrada para a conferência e ativação.

A escolha deve considerar também nome/identidade, Origem, Perícias, Habilidade, equipamento e recursos atuais.

## Próxima etapa

Conferir o contrato de concorrência e as funções TypeScript de revisão/conferência para saber se o cliente depende de uma revisão geral monotônica ou se a revisão geral existe apenas no SQL proposto. Depois comparar as alternativas sem alterar as migrations.

Nenhum banco remoto foi acessado ou alterado. Nenhum teste foi executado nesta etapa.
