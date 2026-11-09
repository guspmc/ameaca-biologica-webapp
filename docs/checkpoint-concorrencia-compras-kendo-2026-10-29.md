# Continuidade — concorrência de compras e disponibilidade

**Data:** 29/10/2026
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`
**Repositório:** `guspmc/ameaca-biologica-webapp`
**Commit-base deste registro:** `a89f2c292a6d4e3a8eee99d2786da9205ce2abfd`

Este documento complementa `docs/checkpoint-continuidade-criacao-ativacao-2026-10-29.md` e `docs/auditoria-disponibilidade-compras-ativacao-2026-10-29.md`.

## Decisão funcional já esclarecida

A UI do Mestre declara: “Planos já salvos são preservados ao bloquear.” Portanto:
- disponibilidade controla novas escolhas/salvamentos;
- uma compra já salva continua válida mesmo se o Mestre bloquear o item depois;
- ativação não deve apagar nem invalidar silenciosamente o plano já salvo.

A proposta de ativação não reconsulta disponibilidade na materialização. Isso é compatível com a semântica acima e não deve ser alterado sem nova decisão do usuário.

## Achado de concorrência

**Implementado atual (inspecionado):**
- `definir_disponibilidade_inicial` bloqueia a linha da Mesa com `FOR UPDATE`, depois consulta/insere/remove disponibilidade.
- `salvar_compras_rascunho` bloqueava a ficha com `FOR UPDATE`, depois consultava disponibilidade sem lock na Mesa.
- Assim, alteração de disponibilidade e salvamento podiam se sobrepor sem ordem serial comum.

**Auditoria de outras RPCs:** as funções de equipamento, perícias, habilidade, identidade e funcionamento examinadas bloqueiam a ficha e não tentam depois adquirir lock na Mesa. A proposta de ativação já segue Mesa → participante → ficha.

## Proposta local criada

Arquivo: `supabase/proposals/serializar-compras-disponibilidade-local.sql`

A proposta substitui `salvar_compras_rascunho` com a ordem:
1. leitura inicial da Mesa da ficha, sem lock;
2. lock da Mesa com `FOR NO KEY UPDATE`;
3. releitura/revalidação de autoria, estado, kit e participação;
4. lock da ficha com `FOR UPDATE`;
5. validação de disponibilidade e demais regras;
6. gravação com revisão otimista já existente.

O lock `FOR NO KEY UPDATE` conflita com o lock `FOR UPDATE` usado pelo Mestre para alterar disponibilidade, e também é compatível com a ordem Mesa → ficha da ativação. Isso deve ordenar a corrida:
- se o Mestre bloquear primeiro, o salvamento espera e depois falha por item indisponível;
- se o Jogador salvar primeiro, o Mestre espera e o plano fica salvo, preservado após o bloqueio.

A proposta mantém as mesmas permissões da função substituída. É um arquivo em `supabase/proposals/`, **não uma migration ativa**. Não foi aplicado nem testado.

## Testes necessários antes de integrar

1. Mestre bloqueia primeiro; compra concorrente deve falhar por indisponibilidade.
2. Jogador salva primeiro; Mestre espera; plano salvo permanece.
3. Duas compras simultâneas na mesma ficha; revisão evita sobrescrita silenciosa.
4. Participante removido enquanto a operação espera; revalidação deve negar.
5. Ficha troca de kit/estado durante a espera; revalidação deve negar.
6. Operações em Mesas diferentes não devem bloquear uma à outra.
7. Conferir locks com ativação concorrente e edição de ficha.

## Kendo e ativação

- Kendo começa com 0 placas, item característico do Operador.
- Livro: cada placa adicional custa 1 Moeda Antiga, até 3.
- Não foi encontrada operação de compra/adição de placas na cadeia atual; precisa ser ação própria e transacional, ligada ao estado do inventário e saldo, nunca item genérico de compra inicial.
- Ativação/materialização continua como proposta local não integrada; `RevisaoAtivacao` não está montada em `FichasJogador.tsx`.
- Nenhum teste automatizado, build ou teste concorrente executado nesta etapa.
- Nenhuma migration/SQL executada no Supabase remoto; sem alteração de dados, merge ou publicação.

## Próximas ações

1. Inspecionar fluxo de inventário já existente e confirmar onde Moedas Antigas são representadas depois da ativação.
2. Especificar operação de compra de placas Kendo (pré-condições, saldo, lock, idempotência, revisão, resposta).
3. Continuar auditoria da proposta de ativação: RLS, grants, security definer/invoker, recibo, concorrência, timeout e contexto da Mesa.
4. Depois de revisão, converter a proposta de lock em teste local executável. Guardar testes de terminal para sessão conjunta com o usuário.

## Instrução para retomada

Continue a partir deste arquivo e dos checkpoints anteriores na branch `fix/lan-websocket-reconnect-2026-10-29`. Não reabra a decisão sobre planos de compra salvos: eles são preservados quando o Mestre bloqueia um item. A proposta `serializar-compras-disponibilidade-local.sql` é apenas local, ainda sem teste. Próximo foco: mapear saldo de Moedas Antigas e inventário para compra de placas Kendo, e revisar a proposta de ativação. Não aplicar SQL no Supabase, não mesclar nem publicar.