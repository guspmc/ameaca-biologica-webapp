# Auditoria — classificação das revisões na proposta de ativação

**Data:** 29/10/2026  
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`  
**Base:** `e5b0a6ad7c409009ecd7cd66c6574dd967aec1a0`  
**Escopo:** leitura estática das migrations ativas versionadas e das propostas `ativacao-integrada-local.sql` e `ciclo-ficha-local.sql`. Sem execução SQL, build ou testes nesta etapa.

## 1. Distinção de escopo

As migrations versionadas da ficha incluem `revisao_compras`, mas não incluem `revisao_criacao` nem `revisao_inventario`. As duas últimas são introduzidas pelo pacote local de ativação/ciclo, que explicitamente não é migration.

Portanto, o desenho abaixo descreve a proposta futura, não o banco atualmente publicado.

## 2. O que a validação de criação realmente lê

A função `app_private.validar_criacao_nivel_um(f public.personagens)` usa os seguintes campos da ficha:

| Grupo | Campos lidos pela validação |
|---|---|
| Identidade/escopo | `nome`, `nivel`, `classe`, `identidade` |
| Atributos | `forca`, `agilidade`, `vigor`, `astucia` |
| Origem e perícias | `origem`, `pericia_origem_treinada`, `pericia_origem_extra`, `pontos_pericia_classe` |
| Habilidade | `habilidade_basica` |
| Derivados | `pv_maximo`, `sa_maximo`, `bi_maximo`, `defesa` |
| Recursos atuais | `pv_atual`, `sa_atual`, `bi_atual` |
| Funcionamento | `configuracao_funcionamento` |
| Compras | `compras_iniciais`, `revisao_compras` |

A materialização também deriva inventário de `classe`, `equipamento_inicial`, `forca`, `origem`, `nivel` e `compras_iniciais`. O contexto da Mesa tem revisão própria (`contextos_criacao_mesa.revisao`) e sequência serializadora separada (`sequencia_ativacao`).

Autoria, Mesa, participação e estado da ficha são usados nas pré-condições/locks da operação, mas não devem ser confundidos automaticamente com escolhas de criação.

## 3. Por que o gatilho genérico é amplo demais

A função `versionar_criacao()` compara o registro inteiro, exceto `revisao_criacao`. Isso inclui campos que pertencem a responsabilidades diferentes:

- `revisao_inventario`: contador técnico de inventário;
- `pv_atual`, `sa_atual`, `bi_atual`: recursos mutáveis durante o jogo;
- `estado_ficha`: ciclo rascunho/completa/arquivada;
- `jogador_id`: vínculo/portador responsável no ciclo;
- `metodo_criacao`: metadado atribuído na ativação;
- outros campos de manutenção/controle que venham a ser adicionados futuramente.

Consequências observáveis na lógica proposta:
- Mudança de inventário incrementa a revisão de criação por meio de `revisao_inventario`.
- Arquivar/retomar altera estado e/ou jogador e também incrementa revisão de criação.
- A própria ativação muda `estado_ficha` e `metodo_criacao`, fazendo o gatilho incrementar a revisão retornada no recibo.
- Alterações de recursos atuais também entram na comparação genérica.

Algumas dessas mudanças podem legitimamente exigir invalidação de uma conferência ou recibo; outras não deveriam ser classificadas como alteração das escolhas de criação. O gatilho atual não expressa essa distinção.

## 4. Classificação preliminar — ainda não é decisão

| Responsabilidade | Campos/elementos | Revisão candidata |
|---|---|---|
| Escolhas da criação | identidade, nome, Classe, nível inicial, Atributos, Origem/Treinamento, Perícias, Habilidade, funcionamento, kit e plano de compras | revisão de criação/entrada de ativação |
| Compras | `compras_iniciais` e `revisao_compras` | revisão própria já existente; deve participar da validação de criação |
| Contexto da Mesa | método, nível inicial, permissão de criação | revisão própria do contexto |
| Inventário materializado | instâncias, destino, portador, posição, estado e conteúdo dos itens | revisão de inventário |
| Recursos durante o jogo | PV/SA/BI atuais | revisão operacional própria, ou mecanismo de concorrência específico |
| Ciclo da ficha | rascunho/completa/arquivada e vínculo de jogador | estado/vínculo com validação transacional própria |
| Serialização de limite | `sequencia_ativacao` | contador de concorrência; não é revisão de escolhas |

Pontos a decidir após cruzar todos os fluxos:
- Se recursos atuais precisam fazer parte da versão esperada na confirmação de ativação ou se devem ser apenas validados sob lock.
- Se alterações de nome/identidade após ativação usam a mesma revisão de criação ou uma revisão geral de ficha.
- Se estado/vínculo do ciclo deve alterar uma revisão geral, um token de estado ou apenas ser protegido pela transação e recibo.
- Como uma movimentação de item invalida uma prévia de arquivamento sem invalidar escolhas originais da criação.

## 5. Sugestão técnica para avaliação futura

Evitar uma comparação genérica de toda a linha. Duas alternativas merecem comparação:

1. **Allowlist explícita de campos de criação:** a função incrementa a revisão somente quando um conjunto declarado de campos de criação muda. É simples de auditar, mas cada novo campo exige atualização consciente do gatilho e dos testes.
2. **Revisão de entrada derivada de snapshot/hash canônico:** a conferência registra uma versão dos campos exatos que usa; a ativação compara o snapshot sob lock. Reduz dependência de um gatilho genérico, mas exige canonicalização, tratamento de JSON e compatibilidade cuidadosa.

Em ambos os desenhos, inventário, recursos operacionais e ciclo precisam de concorrência/versões próprias. A revisão de compras pode continuar como sub-revisão especializada, desde que a conferência valide o plano e sua revisão.

**Não escolher uma alternativa ainda.** Primeiro revisar os comandos que editam cada grupo e o contrato de resposta/repetição. O snapshot/hash também não deve ser adotado sem medir complexidade e garantir que os campos usados pelo servidor e pelo cliente coincidam.

## 6. Próximas verificações

1. Mapear as RPCs/migrations ativas que alteram cada campo de criação e recurso.
2. Mapear os comandos propostos de ativação, arquivamento, retomada e inventário.
3. Conferir se todas as operações usam lock e ordem consistentes.
4. Definir casos de teste para: alteração de escolha durante conferência, recurso alterado, compra alterada, inventário movido, arquivamento/retomada e repetição idempotente.
5. Só depois redigir uma proposta mínima para substituir o gatilho genérico.

Nenhuma alteração em SQL, migration, banco remoto, dados ou interface foi feita. Sem merge, PR ou publicação.
