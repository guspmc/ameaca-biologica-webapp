# Auditoria — saldo de Moedas Antigas e placas do Kendo

**Data:** 29/10/2026
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`
**Escopo:** localizar a representação de Moedas Antigas e o ponto seguro para implementar compra de placas adicionais do Colete de Placas Kendo.

## Resultado principal

Existe um desenho de inventário por instâncias, mas ele está em `supabase/proposals/inventario-instancias.sql`, identificado como protótipo local, sem API pública e sem ativação autorizada. Portanto, não há ainda uma base ativa confirmada para implementar uma compra persistente de placas Kendo.

## Evidências encontradas

### 1. Preparação local da criação — `src/inventarioCriacao.ts`

- `planejarInventarioCriacao` gera itens de criação, não grava nem ativa inventário.
- O item `kendo` recebe estado `{tipo:'colete', equipado:false, placas:0}`.
- Moedas são divididas em blocos de até 3.
- O módulo calcula capacidade e posições; não tem função para gastar moeda depois da criação.

### 2. Materialização proposta — `supabase/proposals/inventario-instancias.sql`

- `app_private.materializacoes_inventario` registra fonte e quantidade materializada por personagem.
- `app_private.inventario_instancias` registra cada exemplar com `chave_criacao` única por personagem e dados JSON.
- A função `persistir_inventario_criacao` cria itens característicos, comuns, kit e compras, com estados iniciais determinísticos.
- Kendo é criado como item característico com `placas:0`.
- Moedas são materializadas em blocos com limite 3.
- A função é apenas parte de uma proposta local. Não é migration ativa nem prova de que as tabelas existem no Supabase remoto.

### 3. Consulta e organização — `src/inventarioConsulta.ts` e `src/organizacaoInventario.ts`

- `inventarioConsulta.ts` valida snapshots de inventário, IDs, quantidades, posições e estados, inclusive `moedas` e `colete.placas`.
- `organizacaoInventario.ts` prepara movimentação de exemplares entre espaços e usa revisão otimista; o módulo declara que a integração real deve autorizar no servidor.
- Não foi encontrada nesses módulos uma operação para transferir Moedas Antigas, reduzir saldo, ou alterar `placas` do Kendo.

### 4. Integração/serviços

- `src/servicoAtivacao.ts` é contrato futuro, deliberadamente fora da aplicação conectada.
- `src/recuperacaoAtivacao.ts` preserva/recupera pedidos de ativação, não compras de itens.
- A revisão de ativação continua não montada na ficha principal, conforme checkpoints anteriores.

## Regra oficial aplicável

Conforme o Arquivo do Jogador v1.0, Operador recebe o Colete de Placas Kendo como item característico, inicialmente com zero placas. Cada placa adicional custa 1 Moeda Antiga, até o máximo de 3 placas. O Kendo não deve ser tratado como item genérico da lista de compras iniciais.

## Conclusão técnica

**Não implementar ainda a compra persistente de placas.** Falta uma camada de inventário ativa, com autorização no servidor e operação transacional. Criar uma RPC agora exigiria inventar ou antecipar a integração de tabelas que só existem em proposta local.

## Contrato técnico necessário quando o inventário for integrado

1. Identificar o exemplar Kendo pertencente à ficha ativa e confirmar que a personagem é Operador.
2. Confirmar que o inventário consultado corresponde à ficha/Mesa autorizadas e à revisão atual.
3. Confirmar `placas` atual entre 0 e 2; impedir valor acima de 3.
4. Localizar e bloquear a instância/bloco de Moedas Antigas e o exemplar Kendo em uma transação, com ordem de locks consistente com as demais operações do inventário.
5. Debitar exatamente 1 moeda e incrementar exatamente 1 placa na mesma transação.
6. Impedir gasto duplicado em pedidos repetidos, respostas incertas e chamadas concorrentes; usar operação idempotente/recibo e revisão.
7. Retornar snapshot/recibo confirmado pelo servidor; a interface não deve mostrar sucesso antes da confirmação.
8. Testar saldo zero, uma moeda, limite 3, concorrência entre duas compras, duas sessões, timeout e repetição, além de personagem não Operador e item Kendo ausente.

## Pendências

- Definir e integrar inventário por instâncias à aplicação conectada.
- Auditar RLS, grants, SECURITY DEFINER/INVOKER e escopo de Mesa das futuras operações.
- Integrar ativação e materialização de modo transacional e idempotente.
- Só então criar a operação de compra de placas Kendo e sua UI.
- Não aplicar SQL local ao Supabase remoto. Nenhum teste/build foi executado nesta auditoria.

## Retomada

Continue a partir deste documento e dos checkpoints anteriores. O Kendo e as Moedas têm modelos iniciais preparados, mas não existe operação ativa e segura de compra de placas. Não criar uma RPC dependente das tabelas propostas antes de integrar e validar o inventário. Próximo foco: revisão de segurança/idempotência da proposta de materialização e ativação, e identificar dependências para sua integração.