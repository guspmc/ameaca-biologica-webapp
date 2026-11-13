# Checkpoint — auditoria do Inventário: criação, ativação e consulta

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Base:** HEAD após auditoria de armas (documentação apenas).  
**Fonte canônica:** Arquivo do Jogador v1.0, Capítulo 3 — Arsenal e Equipamentos, pp. 48, 50–52, 65–70.

## Escopo desta etapa

Auditoria estática do planejamento de equipamento inicial, materialização dos exemplares, validação do snapshot, consulta e organização local. Não inclui implementação de consumo, equipamento, transferência, Baú, recarga ou mutações persistentes do Inventário ativo.

## 1. Criação e compras iniciais

**Implementado no código:**
- `equipamento.ts` define capacidade 4 + FOR, bônus de Mochileiro, kits A/B/C e Itens Característicos por Classe.
- `comprasIniciais.ts` simula saldo de 3 Moedas Antigas, custo e ocupação sem persistir compras. O catálogo é explicitamente parcial e atualmente inclui Bastão, Faca, coletes, Lanterna Simples e Munição 9 mm.
- `inventarioCriacao.ts` gera um plano determinístico de exemplares; rejeita kit/classe/Origem/FOR/nível incompatíveis, compras fora do kit C, itens desconhecidos, saldo negativo e excesso de capacidade.
- Pilhas de Munição 9 mm e Moedas são divididas respeitando os limites de 30 e 3 unidades. Itens Característicos ficam fora dos Espaços e não recebem posição normal.

**Conferência canônica:**
- Capacidade base, Mochileiro, itens característicos, Bolsa/Pochete e limites de pilhas consultados nas pp. 48, 65 e 69–70.
- Equipamentos iniciais, Lanternas, coletes e itens de Classe consultados nas pp. 50–52 e 67–70.
- A regra de compra de Munição 9 mm (15 por Moeda) coincide com o catálogo inicial parcial.
- Não foi identificada divergência mecânica nos kits e itens efetivamente incluídos no catálogo parcial. Isso não certifica itens ainda ausentes do catálogo de compras.

## 2. Materialização e ativação

- `materializarInventarioInicial()` transforma o plano em exemplares com UUIDs únicos, estado copiado e revisão inicial.
- `validarCriacaoNoServidor.ts` reconstitui a conferência no servidor a partir dos dados persistidos do rascunho; não aceita o resultado de conferência calculado pelo navegador como autoridade.
- `server/personagens-local.mjs` ativa em transação SQLite, revalida vínculo de Jogador, revisão esperada, estado de rascunho, teto de personagens e recibo idempotente; grava o snapshot de Inventário na mesma transação da ativação.
- A serialização atual da personagem não expõe o snapshot de Inventário como campo de resposta. Não foi localizada rota LAN dedicada de leitura/operação do Inventário ativo. Isso é coerente com a pendência de integração, não prova de que o estado esteja disponível ao painel da Ficha.

## 3. Consulta e organização

- `inventarioConsulta.ts` valida estritamente personagem, revisão, UUIDs de exemplares, catálogo permitido, estado tipado, quantidade, pilhas, espaços e posições sem sobreposição. Devolve cópia isolada, sem referências mutáveis.
- O parser preserva munição, durabilidade, placas, estado de equipamento e vínculo de Peças a partir do snapshot; não reconstrói ou corrige estados com base no catálogo.
- `PainelInventarioLocal.tsx` é somente leitura: consulta, busca, filtros e detalhes. Não equipa, consome, recarrega ou transfere.
- `organizacaoInventario.ts` planeja mudança de posição em cópia, impede mover Característicos, valida colisões e capacidade, e exige confirmação/recibo no fluxo de organização. A implementação identificada está associada a portas/fixtures de QA, não à Ficha ativa ou a uma rota LAN de produção.
- Excesso de capacidade é exibido como divergência; os itens não são descartados automaticamente.

## 4. Ponto que exige decisão antes de integrar

`inventarioExpansao.ts` permite evoluir Pochete para Bolsa e representa a Pochete anterior como item comum de 1 Espaço. O Arquivo do Jogador determina que Bolsa e Pochete não acumulam e que vale apenas o maior benefício; também afirma que a expansão aumenta a capacidade permanentemente. O trecho consultado não determina expressamente se, ao substituir Pochete por Bolsa, a Pochete antiga retorna ao Inventário como item comum ou deixa de existir. Portanto, a representação atual é uma hipótese de implementação, não uma regra canônica confirmada. Não alterar sem decisão do Gus.

## 5. Lacunas operacionais confirmadas

- O Inventário ativo da Ficha ainda não oferece operações persistentes de mover/organizar, equipar/sacar/guardar, usar/consumir, recarregar, instalar/remover Peças, transferir ou usar Baú.
- A organização tem domínio e testes com fixture/porta de QA, mas não está conectada ao estado ativo nem a rota LAN dedicada.
- O catálogo de compras iniciais é parcial; não se deve sugerir que todas as munições e itens compráveis do livro estejam disponíveis na criação.
- Munição abstrata, retorno de cartuchos ao recarregar, reservas por calibre/tipo, capacidades alteradas por Peças, baterias, combustível, foguetes e virotes exigem modelagem própria antes de mutação.
- O Colete Kendo começa com 0 placas e tem ajuste em Sala de Descanso ou com ferramentas adequadas, custo de 1 Moeda por placa, até 3. O estado inicial está representado, mas a operação de ajuste não está conectada.
- Itens Característicos não ocupam Espaços e não podem ser descartados voluntariamente; o app ainda não possui fluxo de descarte ativo a auditar.

## 6. Testes e validação

Testes identificados:
- `inventario-criacao.test.mjs`
- `inventario-ativo.test.mjs`
- `inventario-consulta-local.test.mjs`
- `organizacao-inventario.test.mjs`
- `inventario-expansao.test.mjs`
- `inventario-persistencia.test.mjs`

Os testes existentes cobrem planejamento, kits, pilhas, IDs, validação de snapshot, consulta somente leitura, organização por prévia/recibo, expansão e uma proposta SQL isolada. A suíte SQL de proposta Supabase/PGlite não equivale a implementação do servidor SQLite ativo.

**Testes/build/CI:** não executados nesta sessão.  
**Validação humana:** pendente em navegador e em fluxo real Offline/LAN.  
**Alterações de código:** nenhuma.  
**Sem alterações:** cânone, schema, IndexedDB, SQLite, servidor, UI visual, LAN, branch padrão, merge, publicação ou deploy.

## Conclusão

A base de domínio de criação, materialização e consulta está bem estruturada e protegida contra reconstrução silenciosa ou mutação pela consulta. A lacuna principal continua sendo a integração do snapshot com operações ativas transacionais, autorização, concorrência, recibos e sincronização. Não há justificativa nesta etapa para refazer a criação ou o parser. A ambiguidade sobre a Pochete ao evoluir para Bolsa deve ser resolvida antes de integrar a expansão ao fluxo ativo.
