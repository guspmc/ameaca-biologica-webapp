# Auditoria de equipamento, capacidade e compras na criação — 30/10/2026

**Status:** auditoria estática parcial; não é implementação nem aprovação de SQL.
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`.
**HEAD de referência após registro da decisão P-01:** `2788608eaf6836725dec11e68b764e014b251adc`.
**Fontes canônicas:** Arquivo do Jogador v1.0 (J 25, 48, 50, 53, 65–67, 98); Planejamento do WebApp v2.0, seção 9.
**Arquivos examinados:** `src/equipamento.ts`, `src/comprasIniciais.ts`, `src/inventarioCriacao.ts`, migrations `20261023045501_equipamento_inicial_rascunhos.sql` e `20261023134639_compras_iniciais_rascunhos.sql`.

## 1. Decisão confirmada: arma da Origem Operário

Em 30/10/2026, Gus confirmou que a arma corpo a corpo semelhante a ferramenta deve ser escolhida **obrigatoriamente durante a criação**.

O livro (J 25) determina +1 no Teste de Ataque e que o Dano da arma escolhida adiciona 2 × FOR em vez de FOR; o FOR adicional não é multiplicado em Acerto Crítico.

Consequências:
- escolha obrigatória e persistida como dado estrutural;
- validação específica de Operário impede concluir a criação sem arma válida;
- benefício fica vinculado à arma escolhida, não a qualquer arma corpo a corpo;
- ativação precisa preservar a associação.

**Pendente:** catálogo de armas elegíveis e tipo/coluna/RPC de persistência. Não presumir que qualquer item descrito como ferramenta seja elegível.

## 2. O que o código local já representa

### `src/equipamento.ts`
- Capacidade base: `4 + FOR`, com +1 para Mochileiro.
- Define kits A/B/C e itens comuns (Erva Verde e Lanterna Simples).
- Kits incluem armas, coletes e moedas conforme Classe/opção.
- Itens característicos têm custo zero de Espaços.
- Colete Acolchoado é descrito como guardado e concede +1 Defesa somente quando equipado.

### `src/comprasIniciais.ts`
- Catálogo parcial: Bastão, Faca, Colete Acolchoado, Colete Balístico Leve, Lanterna e Munição 9 mm.
- Simulação considera orçamento de 3 moedas.
- Munição 9 mm: 15 unidades por moeda; pilha de 30 por Espaço.
- Moedas restantes ocupam um único Espaço na simulação.
- Não há persistência nesse módulo: é simulação de criação.

### `src/inventarioCriacao.ts`
- Gera plano local determinístico de itens; comentário afirma que não grava, ativa nem reconstrói inventário existente.
- Armas de fogo iniciais começam carregadas (Sentinel Nine 19, JMB Hp3 13, LEMI 10).
- Armas corpo a corpo têm estado de Durabilidade; Hatchet é Indestrutível e Arremessável.
- Itens característicos são colocados em local separado e ocupam 0 Espaços.
- Armas e coletes comuns começam não equipados; colete Kendo começa com 0 placas.
- Exige rascunho de nível 1 e kit A/B/C válido.
- Não recebe nem valida a arma da Origem Operário: lacuna confirmada em relação à decisão P-01.
- A expansão ativa de Inventário (Bolsa/Pochete) não aparece como entidade própria nesse plano.

## 3. Contratos SQL examinados

### Migration `20261023045501_equipamento_inicial_rascunhos.sql`
- Cria `equipamento_inicial` com A/B/C.
- RPC `definir_equipamento_rascunho` valida jogador, rascunho, nível 1, Classe e capacidade.
- A escolha é armazenada no personagem, sem materializar itens.
- A RPC aceita `p_opcao IS NULL`; portanto, essa migration isolada não torna o kit obrigatório.
- A contagem de espaços é codificada por opção/classe, em vez de derivada do mesmo catálogo TypeScript.
- Não contém campo nem parâmetro para arma da Origem Operário.

### Migration `20261023134639_compras_iniciais_rascunhos.sql`
- Está identificada no próprio arquivo como proposta local; não aplicar em remoto sem autorização.
- Disponibilidade de compra é controlada por Mesa em `app_private.disponibilidade_compra_inicial`; nenhum item é habilitado automaticamente.
- RPC exige kit C, nível 1, rascunho, jogador autorizado e revisão esperada.
- Valida itens, quantidades (0–3), disponibilidade por Mesa, orçamento de 3 moedas e capacidade.
- Munição ocupa `ceil(quantidade/30)` Espaços; saldo de moedas ocupa um Espaço se positivo.
- Trigger impede trocar o kit enquanto houver compras salvas.
- A migration usa validação SQL própria; a equivalência com `simularCompras` precisa ser coberta por testes de paridade.

## 4. Regras aprovadas do Planejamento v2.0 que a implementação deve respeitar

1. Capacidade = 4 + FOR + bônus, incluindo Mochileiro e expansão ativa.
2. Equipar arma ou colete não remove o item do Inventário nem libera Espaços.
3. Itens característicos ocupam 0 Espaços e permanecem vinculados à ficha.
4. Expansão ativa tem espaço próprio, fora da grade e dos itens característicos.
5. Bolsa concede +3; Pochete +2; somente o maior benefício é usado.
6. A expansão ativa não é normalmente removida/transferida. Upgrade Pochete → Bolsa transforma a antiga Pochete em item comum de 1 Espaço.
7. Coletes atualizam Defesa, RD e limites de AGI nos modos autorizados; outro colete substitui o ativo, mas o anterior continua no Inventário.
8. Munição de reserva é abstrata; pilhas e capacidades seguem o livro. Para 9 mm, 30 por Espaço.
9. Moedas são blocos individuais de até 3 moedas por Espaço; não transbordam nem se reorganizam automaticamente.
10. Item sem Espaços próprios normalmente ocupa 1 Espaço, salvo regra específica.

## 5. Divergências e riscos identificados

| Tema | Evidência atual | Avaliação |
|---|---|---|
| Arma do Operário | Ausente dos tipos, plano de inventário e RPCs examinados | **Lacuna confirmada** após decisão P-01 |
| Expansão ativa | Capacidade inclui Mochileiro; plano não modela expansão em espaço próprio | **Lacuna neste escopo local** |
| Equipar sem liberar Espaço | Plano registra `equipada:false`, mas não existe aqui fluxo de equipar/atualizar Inventário | **Não verificado** |
| Coletes e Defesa | Acolchoado tem nota +1 quando equipado; demais efeitos não estruturados neste módulo | **Cobertura parcial** |
| Kendo | Item característico com 0 Espaços e 0 placas no plano | Estado inicial representado; efeitos completos não auditados |
| Compras | Catálogo TS e validação SQL duplicam regras | Exige testes de paridade |
| Kit obrigatório | RPC aceita opção nula | Não afirmar que a criação completa hoje bloqueia ausência sem auditar o fluxo integrador |
| Moedas | Simulação trata saldo em bloco único; SQL também acrescenta um Espaço para saldo positivo | Conferir limites/blocos em operações posteriores |
| Itens de Origem | Nenhum campo da arma do Operário no plano | Não pode ser materializado corretamente ainda |

## 6. Limites desta auditoria

- Não foi auditado o catálogo completo de armaduras, armas, modificadores de Defesa/RD ou todas as regras de Espaços do livro.
- Não foi verificada a função integradora completa nem a ativação no banco remoto.
- Não foram executados testes automatizados, migrations ou operações no Supabase.
- A existência de lacuna nos arquivos examinados não prova ausência em todo o repositório ou banco remoto.

## 7. Próxima etapa recomendada

1. Auditar o catálogo canônico de armas corpo a corpo elegíveis para Operário e registrar opções válidas sem inventar critérios.
2. Conferir os coletes (Acolchoado, Balístico Leve e Placas Kendo): Defesa, RD, limite de AGI, placas, estados equipado/guardado.
3. Comparar, com casos concretos, o cálculo TypeScript e SQL de capacidade, orçamento, pilhas, moedas e Espaços.
4. Só então propor o tipo/campo e o contrato de persistência da arma Operário, integrado à revisão estrutural e à ativação.

**Nenhum código de aplicação, migration ou banco remoto foi alterado. Nenhum teste automatizado foi executado.**


## 8. Conferência canônica adicional — armas elegíveis para Operário

O livro J 50–51 lista estas Armas Corpo a Corpo e descreve explicitamente algumas como ferramentas:
- **Cutelo:** “Ferramenta de cozinha”; 1 Espaço, 1 mão, Dano 1d8, crítico x3, Durabilidade 2, Arremessável.
- **Martelo:** “Ferramenta simples de impacto”; 1 Espaço, 1 mão, Dano 1d6, crítico x2, Durabilidade 2.
- **Machadinha:** descrita como “machado leve de uma mão”; 1 Espaço, 1 mão, Dano 1d6, crítico x3, Durabilidade 2, Arremessável.
- **Machado:** “Ferramenta pesada de duas mãos”; 2 Espaços, 2 mãos, Dano 1d8, crítico x3, Durabilidade 3.
- **Marreta:** “massa de duas mãos feita para quebrar materiais”; 2 Espaços, 2 mãos, Dano 3d4, crítico x2, Durabilidade 3.
- **Motosserra:** descrita expressamente como “ferramenta motorizada”; 2 mãos? A tabela informa 2 mãos, 2 Espaços, Dano 3d6, crítico x2, Durabilidade 4; possui regra própria de ligar e ataques com Desvantagem.

A tabela também lista armas que não são descritas como ferramentas (Bastão, Faca, Punhal, Réplicas, Cassetete, Faca de Combate, Hatchet e Machete). Não é seguro concluir apenas pelo nome que sejam elegíveis. O livro não traz uma lista fechada nem critério formal além de “semelhante a uma ferramenta”.

**Ponto para decisão do responsável pelo cânone:** confirmar se a elegibilidade do Operário deve ser limitada às opções explicitamente descritas como ferramenta no livro (Cutelo, Martelo, Machadinha, Machado, Marreta e Motosserra), ou se alguma outra arma da tabela também deve ser aceita. Até essa decisão, a lista é candidata, não uma regra fechada.

## 9. Conferência canônica adicional — coletes

J 66–67 define:

| Colete | Defesa | RD | Regra de AGI na Defesa | Aquisição |
|---|---:|---:|---|---|
| Acolchoado | +1 | 0 | contribuição total | 1 Moeda |
| Balístico Leve | +1 | 1 | contribuição total | 2 Moedas |
| Balístico Médio | +2 | 2 | AGI limitada a +2 | 3 Moedas |
| Balístico Pesado | +3 | 3 | AGI não é somada | 4 Moedas |
| Kendo — 0 placas | +1 | 0 | contribuição total | Característico |
| Kendo — 1 placa | +1 | 1 | contribuição total | +1 Moeda por placa |
| Kendo — 2 placas | +2 | 2 | AGI limitada a +2 | +1 Moeda por placa |
| Kendo — 3 placas | +3 | 3 | AGI não é somada | +1 Moeda por placa |

O livro diz que coletes não usam Durabilidade. Kendo começa com 0 placas, é característico do Operador, não pode ser comprado como colete normal e pode receber até 3 placas em Sala de Descanso ou com ferramentas adequadas.

**Lacunas observadas no código local:**
- O catálogo de compras iniciais oferece apenas Colete Acolchoado e Colete Balístico Leve; não oferece Médio ou Pesado.
- O tipo de estado do Colete no plano registra apenas `equipado:false` e placas opcionais; não registra Defesa/RD/limite de AGI como dados estruturados.
- O Kendo é materializado com 0 placas, mas não foi encontrado neste plano o fluxo de compra/aplicação de placas.
- O cálculo de Defesa da conferência de criação é explicitamente Defesa básica sem colete; não há neste módulo cálculo de Defesa final com colete equipado.
- A compra inicial não deve ser confundida com aquisição durante a campanha. O Planejamento v2.0 não autoriza compra/carrinho automático e prevê gestão de itens por operações explícitas.

## 10. Correção importante na interpretação da capacidade

A simulação TypeScript de compras começa com 2 Espaços (Erva Verde + Lanterna Simples), soma os itens comprados e acrescenta um Espaço para o saldo de moedas quando positivo. A função de planejamento depois materializa as moedas restantes em blocos de até 3. Isso parece coerente para o orçamento inicial de 3 moedas e o catálogo atual, mas precisa de teste de paridade para todos os casos.

Há uma diferença que merece teste específico: a RPC SQL aceita quantidades de 0 a 3 para cada item e calcula Espaços de munição com `ceil(15 × quantidade / 30)`; a simulação TypeScript usa a mesma regra para 9 mm. Para demais itens, ambas contam um Espaço por unidade. O catálogo e a disponibilidade SQL, contudo, são mantidos separadamente do catálogo TypeScript, o que permite divergência futura.

A capacidade aprovada no Planejamento v2.0 inclui a expansão ativa. O código atual calcula apenas `4 + FOR + Mochileiro` e a simulação não recebe um benefício de Bolsa/Pochete. Isso não afeta a criação inicial se nenhuma expansão ativa puder ser selecionada nesse momento, mas precisa ser resolvido antes de usar a mesma função para Inventário ativo.

