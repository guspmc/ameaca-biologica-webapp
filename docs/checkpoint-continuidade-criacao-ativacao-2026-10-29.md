# Checkpoint de continuidade — auditoria de criação, ativação e inventário

**Data:** 29/10/2026  
**Branch de trabalho:** `fix/lan-websocket-reconnect-2026-10-29`  
**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Último commit anterior:** `a18827d536a517c6cf3c289e2dd2f1ee35b52a01` (auditoria de equipamento inicial)  
**Produção:** GitHub Pages em `https://guspmc.github.io/ameaca-biologica-webapp/`  
**Supabase de produção:** projeto `pftuhqioutvwnmvlbtrt`

## 1. Autorização e limites

O usuário autorizou avançar com inspeção e alterações necessárias no branch de trabalho. Isso não autoriza:
- aplicar migrations ou executar SQL no Supabase de produção;
- alterar dados reais da campanha;
- mesclar na branch principal ou publicar;
- fazer alterações irreversíveis fora do branch.

O usuário não é programador e prefere instruções passo a passo. Testes de terminal devem ser guardados até serem imprescindíveis e reunidos em uma sessão conjunta. Não pedir execução local agora.

O usuário está preocupado com o limite do chat. Este checkpoint deve permitir retomar sem pedir que repita decisões.

## 2. Correção de arquitetura — Compras personalizadas

O usuário esclareceu que **Compras personalizadas pertencem ao Painel do Mestre**, não à ficha do Jogador. Preservar essa separação.

A inspeção encontrou:
- `src/DisponibilidadeInicial.tsx`;
- `src/servicoDisponibilidade.ts`;
- montagem condicional em `src/Participantes.tsx`;
- chamada em `src/App.tsx` com `permitirDisponibilidade={import.meta.env.MODE==='teste'}`.

Isso é um componente administrativo/teste existente no fluxo de gestão de participantes, não prova de que o Painel do Mestre aprovado já esteja integrado. O protótipo de Painel Mestre enviado pelo usuário está congelado e não deve ser alterado nem confundido com a aplicação conectada.

Na integração futura, a gestão do catálogo/disponibilidade deve ficar no Painel do Mestre conforme o planejamento. O jogador apenas escolhe, durante a criação, entre itens liberados.

**Correção da avaliação anterior:** não classificar a ausência de controles de compra na ficha do jogador como defeito. A localização correta é o Painel do Mestre. Existe componente/RPC de disponibilidade em modo de teste; sua integração na navegação aprovada e ativação no fluxo de produção permanecem pendentes.

## 3. Estado real do trabalho

### Implementado no branch (inspecionado, mas sem validação local nesta rodada)
- Criação em rascunho por etapas: identidade, atributos, Origem, Perícias, Habilidade Básica, funcionamento, equipamento e compras iniciais.
- Dados de Classe em `src/classesFicha.ts` e apresentação informativa em `src/FichasJogador.tsx`.
- Conjuntos A/B/C em `src/equipamento.ts`.
- Compras iniciais em `src/comprasIniciais.ts`, com catálogo explicitamente parcial.
- RPCs de disponibilidade inicial por Mesa e UI administrativa de teste.
- Contratos/componentes preparados para ativação: `src/preAtivacao.ts`, `src/RevisaoAtivacao.tsx`, `src/servicoAtivacao.ts`, `src/pedidoAtivacao.ts`, `src/inventarioCriacao.ts`.
- Propostas SQL locais em `supabase/proposals/`, incluindo `ativacao-integrada-local.sql`.

### Conferido com o Arquivo do Jogador v1.0
- Toda personagem recebe 1 Erva Verde, 1 Lanterna Simples e Itens Característicos da Classe.
- Conjuntos A/B/C e Moedas Antigas conferidos.
- Armas de fogo iniciais começam carregadas.
- Itens característicos não ocupam Espaços; até 3 Moedas ocupam 1 Espaço.
- Mochileiro concede +1 Espaço.
- Colete de Placas Kendo começa com zero placas.

### Pendente / não considerar pronto
- Catálogo completo de compras iniciais e sua gestão no Painel do Mestre.
- Compra de placas adicionais Kendo: 1 Moeda Antiga por placa, máximo 3, conforme livro.
- Integração real da revisão/ativação à ficha; `RevisaoAtivacao` existe isolado e não é importado por `FichasJogador.tsx`.
- Aplicação remota das propostas SQL; propostas não são migrations e não devem ser aplicadas isoladamente.
- Testes automatizados, build e validação ponta a ponta.
- Verificação do estado real de migrations/RLS no Supabase remoto.

## 4. Achados técnicos na proposta de ativação

Arquivo central: `supabase/proposals/ativacao-integrada-local.sql` (829 linhas). É um pacote local que combina propostas; o cabeçalho diz que não é migration e não deve ser aplicado a projeto Supabase.

### Aspectos positivos observados
- `validar_criacao_nivel_um` revalida Classe, Origem, atributos, perícias, habilidade básica, derivados, recursos atuais, funcionamento e revisão de compras.
- `persistir_inventario_criacao` gera itens de fonte determinística, separa itens característicos, limita pilhas de munição a 30 e blocos de moedas a 3, verifica capacidade e registra uma materialização por personagem.
- `ativar_ficha_local` faz materialização, mudança de estado para completa e recibo dentro de uma transação; usa bloqueios e revisões para reduzir corrida e duplicação.
- Há teto de 10 personagens ativas por Mesa e validação de até 10 jogadores.
- `conferir_ativacao_autorizada` prepara uma prévia de pendências sem ativar.

### Pontos que exigem revisão antes de integrar
1. **Disponibilidade do catálogo no momento da ativação:** a validação SQL confere estrutura/revisão de `compras_iniciais`, e a materialização confere itens/preços/capacidade, mas na leitura feita não ficou demonstrada revalidação da disponibilidade atual do item na Mesa. A gravação inicial valida disponibilidade, porém o Mestre pode alterar a lista depois. Decidir se a lista liberada fica congelada na revisão da compra ou se a ativação revalida a lista atual; preservar o plano do jogador e mostrar pendência clara se houver mudança.
2. **Kendo:** estado inicial `placas:0` está correto, mas não há operação de compra/adição de placas. Deve ser ação própria, vinculada ao Operador, com validação de saldo, máximo 3 e concorrência. Não converter o colete em compra comum.
3. **Catálogo e estados:** catálogo SQL local contém apenas itens usados no conjunto inicial e na lista parcial de compras. Não é inventário completo do RPG.
4. **RLS e escopo:** tabelas `app_private` têm RLS e revogação de acesso direto no pacote, mas isso não substitui revisão completa de SECURITY DEFINER/INVOKER, grants, triggers, policies e caminhos de leitura antes de qualquer aplicação.
5. **Idempotência:** materialização e recibo parecem projetados para evitar repetição; precisam de testes de concorrência, timeout/resposta incerta, repetição e mudança concorrente de ficha/Mesa.
6. **Contexto da Mesa:** a proposta exige `contextos_criacao_mesa` e configuração que permita criação Padrão nível 1. A tela/fluxo para configurar esse contexto precisa ser conferida com o planejamento; não presumir integração.

## 5. Testes e publicação

- `pnpm test` não foi executado nesta rodada.
- `pnpm run build` não foi executado nesta rodada.
- O status de CI anteriormente consultado era `pending` sem status concluído; não interpretar como sucesso.
- Nenhuma migration foi aplicada.
- Nenhum dado de produção foi alterado.
- Nenhum merge, PR ou deploy foi realizado.
- Branch permanece `fix/lan-websocket-reconnect-2026-10-29`.

## 6. Próximos passos

1. Conferir o Planejamento v2.0 e o protótipo congelado do Painel Mestre para localizar a gestão de compras/disponibilidade, sem redesenhar arquitetura.
2. Revisar `src/comprasIniciais.ts`, tabela oficial de preços e RPCs/migrations de disponibilidade; montar matriz item/preço/liberação/limite/estado.
3. Auditar o pacote de ativação por função, especialmente revisões e disponibilidade no momento de ativar.
4. Desenhar e implementar compra de placas Kendo como operação própria após localizar fluxo de saldo Moedas Antigas e inventário.
5. Comparar `preAtivacao.ts` e `inventarioCriacao.ts` com validação SQL; não tratá-los como autoridade de segurança.
6. Fazer alterações mínimas e atualizar este checkpoint.
7. Quando for indispensável validar, reunir os comandos em um roteiro único Windows/PowerShell, com passos e resultados esperados.

## 7. Retomada em outro chat

Mensagem sugerida:

“Vamos continuar Ameaça Biológica RPG a partir de `docs/checkpoint-continuidade-criacao-ativacao-2026-10-29.md` na branch `fix/lan-websocket-reconnect-2026-10-29`. Leia as diretrizes do projeto e os documentos oficiais anexados. Compras personalizadas pertencem ao Painel do Mestre, não à ficha do Jogador. Continue a auditoria de criação/ativação em pequenos passos. Não peça testes de terminal ainda; guarde-os para uma sessão conjunta. Não aplique migrations, não altere produção, não faça merge nem publique sem autorização específica.”
