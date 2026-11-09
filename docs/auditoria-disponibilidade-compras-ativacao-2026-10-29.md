# Auditoria — disponibilidade e compras iniciais

**Data:** 29/10/2026  
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`  
**Escopo:** relação entre catálogo/controles do Mestre, plano de compra do Jogador e ativação da ficha.

## Fontes conferidas

- Documento Mestre de Planejamento v2.0, especialmente criação (seção 5) e Inventário/catálogo (seção 9.1).
- Protótipo congelado `Ameaca_Biologica_Painel_Mestre_Prototipo_v02_CONGELADO.html`.
- `src/comprasIniciais.ts`
- `src/DisponibilidadeInicial.tsx`
- `src/servicoDisponibilidade.ts`
- `src/servicoCompras.ts`
- `supabase/migrations/20261023134639_compras_iniciais_rascunhos.sql`
- `supabase/migrations/20261023160814_disponibilidade_mestre.sql`
- `supabase/proposals/ativacao-integrada-local.sql`

## Arquitetura confirmada

1. O usuário esclareceu que **Compras personalizadas ficam no Painel do Mestre**, não na ficha do Jogador.
2. O Planejamento v2.0, seção 9.1, prevê catálogo universal do Jogador e itens personalizados da campanha; o Mestre cria itens personalizados da Mesa. Remover o modelo do catálogo impede novas adições, mas preserva cópias existentes no Inventário/Baú.
3. O protótipo congelado apresenta os destinos Mesa, Encontros e Arquivos. Seu conteúdo não comprova a existência de controles de disponibilidade para compras iniciais.
4. O componente `DisponibilidadeInicial` e seus serviços RPC existem, mas a montagem já auditada em `Participantes.tsx` é condicional e o App só habilita a prop em modo `teste`. Isso não equivale à integração no Painel do Mestre aprovado.
5. Não confundir o catálogo de itens personalizados da campanha com o catálogo parcial e limitado de compras da criação inicial.

## Fluxo implementado no branch (inspecionado; não testado)

- `definir_disponibilidade_inicial`: somente Mestre da Mesa; bloqueia a linha da Mesa para serializar alterações; compara estado esperado; habilita/desabilita item.
- `listar_disponibilidade_inicial`: somente Mestre da Mesa.
- `salvar_compras_rascunho`: exige personagem do próprio Jogador, rascunho nível 1, kit C, valida ID/quantidade, disponibilidade atual, orçamento de 3 Moedas Antigas e capacidade; usa revisão e bloqueio da ficha.
- A UI do Mestre informa explicitamente: “Planos já salvos são preservados ao bloquear.”
- O plano salvo contém apenas IDs/quantidades; a materialização de inventário lê esse plano e não consulta a disponibilidade atual.
- `validar_criacao_nivel_um` valida a estrutura e revisão do plano, não a disponibilidade atual.
- `persistir_inventario_criacao` valida IDs, custo, saldo, pilhas e capacidade, mas não consulta `disponibilidade_compra_inicial`.

## Interpretação funcional e ponto de atenção

A ausência de nova consulta à disponibilidade na ativação **não deve ser classificada automaticamente como defeito**. A interface promete preservar planos já salvos ao bloquear um item, o que é compatível com a interpretação de que a disponibilidade controla novas escolhas/salvamentos, enquanto uma escolha já salva permanece válida para a finalização.

Essa interpretação deve ser preservada no trabalho técnico, salvo decisão posterior do autor. Não apagar, reescrever ou invalidar silenciosamente compras salvas quando o Mestre bloqueia um item.

O que ainda precisa de confirmação por teste é a consistência concorrente: se o bloqueio do item e o salvamento de uma compra ocorrerem ao mesmo tempo, o bloqueio/ordem transacional deve produzir um resultado íntegro e observável. A RPC de compra bloqueia a ficha, enquanto a RPC de disponibilidade bloqueia a Mesa; não foi demonstrada nesta auditoria uma serialização comum entre essas duas operações. Revisar o modelo de locks e testar a corrida antes de integrar ao Painel.

## Catálogo inicial atual

`src/comprasIniciais.ts` declara catálogo parcial com:
- Bastão de Beisebol — 1 Moeda Antiga, 1 unidade;
- Faca — 1 Moeda Antiga, 1 unidade;
- Colete Acolchoado — 1 Moeda Antiga, 1 unidade;
- Colete Balístico Leve — 2 Moedas Antigas, 1 unidade;
- Lanterna Simples — 1 Moeda Antiga, 1 unidade;
- Munição 9 mm — 1 Moeda Antiga, 15 unidades; pilha máxima 30.

A auditoria anterior comparou os preços dos itens presentes com a tabela oficial do Arquivo do Jogador. O catálogo permanece parcial e não representa o catálogo completo do Inventário.

## Pendências objetivas

1. Revisar a concorrência entre `salvar_compras_rascunho` e `definir_disponibilidade_inicial`, incluindo a ordem dos locks e o resultado quando as duas operações se sobrepõem.
2. Conferir a montagem completa do Painel do Mestre e seu ponto de extensão apropriado, sem alterar o protótipo congelado.
3. Continuar a auditoria da proposta de ativação, comparando o contrato TypeScript com as funções SQL e os estados reais de persistência.
4. Projetar compra de placas do Colete de Placas Kendo como operação própria, após mapear saldo e inventário; não tratá-la como item genérico do catálogo.
5. Não aplicar propostas SQL nem migrations no Supabase remoto. Nenhum teste/build foi executado nesta etapa.

## Evidência e limites

Esta auditoria é baseada nos arquivos do branch e nos documentos oficiais fornecidos. Não houve consulta ao banco remoto para confirmar quais migrations estão aplicadas. Nenhum teste automatizado, build, teste concorrente ou fluxo ponta a ponta foi executado.
