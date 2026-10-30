# Auditoria — Equipamento Inicial e preparação da ativação

**Data:** 29/10/2026  
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`  
**Escopo:** comparação do Arquivo do Jogador v1.0 com a implementação de criação, compras, disponibilidade por Mesa e propostas locais de ativação.  
**Resultado:** inspeção documental/código; nenhum teste executado, migration aplicada ou publicação realizada.

## 1. Conjuntos iniciais — CONFERIDOS

Fonte: Arquivo do Jogador v1.0, capítulo 1, páginas impressas 26, 30, 34 e 38.

- Toda personagem recebe 1 Erva Verde, 1 Lanterna Simples e os Itens Característicos da Classe.
- Agente: A = Sentinel Nine + Colete Acolchoado; B = JMB Hp3 + 1 Moeda Antiga; C = 3 Moedas Antigas.
- Autodidata e Operador: A = Bastão de Beisebol + Colete Acolchoado + 1 Moeda Antiga; B = LEMI + 1 Moeda Antiga; C = 3 Moedas Antigas.
- Armas de fogo do conjunto inicial começam carregadas.
- Itens Característicos não ocupam Espaços.
- Até 3 Moedas Antigas ocupam 1 Espaço.

A projeção de `src/equipamento.ts` corresponde a esses conjuntos. A validação de Espaços da migration `20261023045501_equipamento_inicial_rascunhos.sql` também corresponde: conjunto A ocupa 4 Espaços para Agente e 5 para Autodidata/Operador; conjunto B ocupa 4; conjunto C reserva 1 Espaço para o bloco das moedas, além dos 2 itens comuns.

Os carregadores/capacidades apresentados na proposta local de materialização conferem com a projeção: Sentinel Nine 19/19, JMB Hp3 13/13 e LEMI 10/10.

## 2. Compras personalizadas — PARCIAL / TESTE

- `src/comprasIniciais.ts` declara explicitamente catálogo parcial.
- Itens atualmente presentes: Bastão de Beisebol, Faca, Colete Acolchoado, Colete Balístico Leve, Lanterna Simples e Munição 9 mm.
- Preços/quantidades foram comparados com a tabela de Preços e Moedas Antigas do livro (página impressa 73) para os itens presentes.
- A função SQL `salvar_compras_rascunho` valida a disponibilidade do item na Mesa e a interface de Mestre existe em `src/DisponibilidadeInicial.tsx`.
- A tela é montada em `src/Participantes.tsx` apenas quando `permitirDisponibilidade` é verdadeiro; a chamada atual em `src/App.tsx` restringe isso a `import.meta.env.MODE === 'teste'`. Portanto, a disponibilidade não está exposta no fluxo publicado de produção, mas existe para teste.
- Bloquear um item não apaga planos já salvos; isso está documentado na interface e preservado pela validação de gravação.

**PENDENTE:** completar e revisar o catálogo com a tabela oficial. Não liberar itens automaticamente nem ampliar compras por inferência.

## 3. Colete de Placas Kendo — LACUNA IDENTIFICADA

Fonte: Arquivo do Jogador v1.0, página impressa 67 e página da Classe Operador (38).

- O Kendo começa com 0 placas e é Item Característico do Operador.
- Cada placa adicional custa 1 Moeda Antiga, até o máximo de 3.
- `src/equipamento.ts` apresenta corretamente o Kendo com 0 placas e 0 Espaços, como Item Característico.
- O catálogo de `src/comprasIniciais.ts`, o RPC de compras e as propostas de materialização não implementam aquisição de placas adicionais.
- O fluxo atual de compras personalizadas não deve tratar o colete Kendo como equipamento ordinário nem permitir ultrapassar 3 placas.

**PENDENTE:** definir e implementar o ajuste de placas como operação própria, vinculada ao Operador e ao limite oficial, com validação transacional de saldo e estado. Não foi feita alteração de código nesta rodada.

## 4. Ativação e inventário — PROPOSTA LOCAL, NÃO IMPLEMENTADO NO BACKEND ATIVO

- `src/RevisaoAtivacao.tsx`, `src/preAtivacao.ts` e `src/servicoAtivacao.ts` contêm contratos/componentes preparados para conferência e ativação.
- A interface principal atual não importa/monta `RevisaoAtivacao`; `src/FichasJogador.tsx` não o integra.
- O SQL abrangente está em `supabase/proposals/ativacao-integrada-local.sql`, explicitamente identificado como pacote local para testes, não migration. Não deve ser aplicado ao projeto Supabase.
- A proposta inclui materialização idempotente do inventário, conferência de criação, teto de 10 personagens ativas e ativação transacional com recibo. Isso não comprova que tais funções existam no banco remoto ou estejam disponíveis no frontend.
- A proposta materializa o Kendo com 0 placas, mas ainda não trata a compra das placas adicionais.

**PENDENTE:** testes locais do pacote, revisão das dependências/RLS e integração gradual só depois de checkpoint próprio. Nenhuma ativação foi habilitada.

## 5. Estado desta rodada

- **IMPLEMENTADO NO BRANCH:** componentes e RPCs de disponibilidade por Mesa em modo de teste; catálogo parcial; projeção dos conjuntos iniciais.
- **CONFERIDO POR INSPEÇÃO:** opções A/B/C e contagem de Espaços; carregadores iniciais; itens característicos e regra das moedas.
- **PENDENTE:** catálogo completo; compra de placas Kendo; testes locais; integração de ativação.
- **NÃO REALIZADO:** testes/build, aplicação de migrations, alterações no Supabase remoto, merge ou publicação.
