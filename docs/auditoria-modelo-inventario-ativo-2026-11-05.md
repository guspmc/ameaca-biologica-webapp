# Auditoria do modelo de Inventário ativo — 05/11/2026

**Branch:** `feat/offline-first-ficha`  
**Fontes canônicas:** Arquivo do Jogador v1.0 e Documento Mestre de Planejamento v2.1 fornecidos nesta conversa.  
**Escopo:** modelo, validação e sequência técnica do Inventário individual/offline. O Baú compartilhado permanece deliberadamente fora deste ciclo.

## 1. Estado confirmado

### Implementado

- `src/inventarioCriacao.ts`: planejamento determinístico do kit e das compras iniciais, com estado inicial dos exemplares.
- `src/inventarioAtivo.ts`: materialização pura do plano em exemplares com UUIDs individuais e revisão inicial 1; validação por `lerInventarioConsulta()`.
- `src/inventarioConsulta.ts`: contrato de leitura de snapshot, validação de IDs, quantidades, estados conhecidos, posição e não sobreposição; filtros e detalhes.
- `src/organizacaoInventario.ts`: planejamento puro de movimentação/troca de exemplares, inclusive itens que ocupam mais de um Espaço, com pedido/recibo e coordenador de prévia/consentimento.
- `src/inventarioExpansao.ts`: cálculo isolado de capacidade com Pochete/Bolsa, upgrade Pochete → Bolsa, retorno da Pochete como item comum e validação de bloco de Moedas.
- `src/PainelInventarioLocal.tsx`: consulta somente leitura, filtros e detalhes.
- `src/PainelOrganizacaoLocal.tsx`: prévia de organização; não está integrada ao ciclo persistente da ficha.
- `src/EditorInventarioLocal.tsx` e `src/PreviaCompras.tsx`: planejamento do kit e compras do rascunho, não Inventário ativo.

### Ainda não implementado/integrado

- Snapshot ativo persistido e recuperado junto à ficha.
- Ciclo de ativação local/offline que materialize o inventário exatamente uma vez e preserve recibo/estado.
- Grade operacional dentro de `FichaLocal.tsx`.
- Catálogo completo do Jogador e catálogo de itens personalizados da Mesa.
- Operações contextuais com validação de requisitos e efeitos.
- Integração dos estados de Inventário com Combate, recursos e progressão.
- Persistência durável de pedidos/recibos de organização integrada à ficha.
- Tratamento de Itens Chave, documentos/Mapa em Arquivos e Itens Característicos na interface final.

## 2. Diferenças entre o contrato atual e o escopo aprovado

### 2.1 Catálogo fechado insuficiente

`src/inventarioConsulta.ts` mantém um mapa fechado de `catalogoId → tipo de estado`. Atualmente ele reconhece apenas um conjunto inicial reduzido (armas, munição 9 mm, moedas, coletes, Peça, consumível, lanterna e ferramentas selecionadas). O Planejamento v2.1 exige catálogo universal do Jogador e itens personalizados da campanha; portanto, a lista atual não pode ser tratada como catálogo completo.

**Consequência:** novos exemplares não podem ser adicionados com segurança até o catálogo/registro de tipos ser ampliado e validado contra as fichas oficiais. Não afrouxar a validação para aceitar qualquer `catalogoId` ou estado arbitrário.

### 2.2 Metadados de regra ainda ausentes

O tipo `ExemplarConsulta` atual contém ID, catálogo, nome, quantidade, Espaços, local, posição e estado. Não representa explicitamente todos os metadados necessários para comandos contextuais, por exemplo:
- categoria funcional e regras de descarte (Item Chave, Característico, comum);
- vínculo permanente à Classe ou à expansão;
- origem/proveniência e eventual modelo personalizado;
- compatibilidade de Peças e requisitos de bancada;
- estado de disponibilidade da Hatchet (em posse, no cenário/recuperável, perdida);
- documento/Mapa destinado a Arquivos, fora da grade.

A forma final desses campos deve derivar do catálogo canônico e do Planejamento v2.1; não adicionar flags genéricas que permitam combinações contraditórias.

### 2.3 Expansão não faz parte do snapshot

`inventarioExpansao.ts` calcula capacidade e upgrade, mas `InventarioConsulta` não contém o campo de expansão equipada nem um registro persistente próprio. A expansão aprovada fica em espaço dedicado, fora da grade, é vinculada permanentemente e sobrevive a Morte, arquivamento, recuperação e Reset. Pochete substituída retorna como item comum de 1 Espaço.

**Consequência:** o cálculo isolado não basta para salvar/restaurar a expansão ou garantir que ela não seja duplicada/removida. A integração deve tratar expansão e grade na mesma operação atômica.

### 2.4 Capacidade e posições

O parser atual preserva exemplares cuja posição excede a capacidade após redução, desde que não haja sobreposição. Isso evita perda de dados e está alinhado à exigência de sinalizar reorganização sem descartar itens. O planejador de organização bloqueia movimentações enquanto existir exemplar fora da capacidade.

O Planejamento v2.1 também determina que:
- não se pode adicionar carga acima da capacidade;
- não há rotação/encaixe espacial;
- itens de múltiplos Espaços ocupam blocos contíguos;
- equipar arma/Colete não libera Espaços;
- inventário cheio não admite nova carga;
- item excedente em mãos tem restrições de Ações descritas no livro.

A regra de excedente em mãos não deve ser confundida com a preservação técnica de um snapshot antigo após redução de capacidade.

### 2.5 Moedas e pilhas

`inventarioExpansao.ts` já valida bloco de 1 a 3 Moedas, e o planejador inicial separa pilhas de munição de até 30 para 9 mm. O contrato atual, porém, não define operação ativa de adicionar/remover moedas nem remoção de bloco zerado. O Planejamento v2.1 proíbe transbordamento, fusão e reorganização automática de moedas; cada bloco ocupa um Espaço e contém até três.

Outras categorias de munição não devem herdar o limite de 30 por analogia. Cada pilha precisa vir da ficha oficial correspondente.

## 3. Regras funcionais a preservar

1. Grade com células equivalentes à capacidade; itens de vários Espaços ocupam blocos contíguos.
2. Equipar não retira item da grade nem libera Espaços.
3. Itens Característicos ficam em área própria, fora da grade, ocupam zero e não podem ser descartados voluntariamente.
4. Itens Chave ficam na grade, normalmente ocupam um Espaço e não podem ser abandonados deliberadamente.
5. Documentos e Mapa não ocupam Espaços e pertencem a Arquivos, não a uma categoria fictícia de Itens de Missão.
6. Bolsa (+3) e Pochete (+2) não acumulam; expansão ativa fica em espaço dedicado e vinculada. Upgrade Pochete → Bolsa devolve a Pochete antiga como item comum de 1 Espaço.
7. Hatchet é Indestrutível e Arremessável, mas sua disponibilidade pode mudar; Indestrutível não significa sempre em posse.
8. Moedas: blocos individuais de até três, sem transbordamento/fusão/reorganização automática.
9. Munição de reserva serve à recarga e não recebe comando isolado de Usar.
10. Comandos só aparecem quando válidos. Usar, Combinar, instalar/remover Peças e demais ações exigem seus custos, requisitos e resultados oficiais.
11. O Baú não participa deste incremento. Não criar Guardar/Pegar ou transferência simulada no modo offline individual.

## 4. Arquitetura recomendada antes da grade operacional

### 4.1 Fonte de verdade e limite offline

O Planejamento v2.1 §14.2 é explícito: offline permite leitura de dados previamente autorizados, identificados como possivelmente desatualizados, e escrita de anotações pessoais. **Não permite alterar offline PV, Inventário, Baú, Iniciativa ou outros dados compartilhados.** Essa regra também consta das diretrizes de segurança do projeto.

Portanto, a direção offline-first não autoriza transformar o Inventário ativo em um estado mutável local. O aplicativo poderá preparar cache/consulta e interface de leitura offline, sempre com indicação de possível desatualização; adição, movimentação, equipar, uso, moedas, expansão e demais alterações só poderão ser executadas após reconexão e revalidação do acesso/estado atual.

A materialização inicial do inventário altera estado compartilhado e deve ocorrer como parte de uma finalização/ativação autorizada online, não durante a abertura de ficha offline. O estado atual da ficha continua `rascunho`, e o servidor LAN atual também só cria/lê/atualiza rascunhos. Não chamar `materializarInventarioInicial()` ao abrir a ficha nem tratar o snapshot puro como ativação.

### 4.2 Persistência e concorrência

- Snapshot, expansão e revisão devem ser validados antes da gravação no servidor autoritativo.
- Alterações que afetem mais de um exemplar (upgrade de expansão, troca de Peça, combinação) precisam de uma única transação e uma única revisão no servidor.
- O IndexedDB pode guardar somente a cópia previamente autorizada para leitura offline, marcada como possivelmente desatualizada; não pode confirmar mutações de Inventário como se fossem estado oficial.
- Operações online devem revalidar sessão, vínculo, permissões e revisão atual antes de gravar; conflitos devem preservar a versão recebida e impedir sobrescrita silenciosa.
- Backup/exportação/importação não podem reintroduzir mutações compartilhadas offline nem recriar IDs/instâncias apagadas ou revogadas. A política de backup local deve respeitar a proteção de dados da Mesa.
- Pedido/recibo e idempotência são necessários nas operações remotas com resposta incerta; não simular confirmação local de operação compartilhada.
- O servidor LAN atual não oferece endpoint de inventário ativo. Sua API de personagens armazena JSON de rascunho com revisão; não declarar que isso já garante a semântica de ativação.

### 4.3 Separação de operações

Não implementar todos os comandos de uma vez. Cada comando precisa de regra canônica, pré-condições, efeito no snapshot e teste próprio. A grade/consulta pode vir antes de Usar/Combinar/Combate, desde que deixe claro que é leitura e organização, não execução de efeitos.

## 5. Sequência técnica proposta

1. **Contrato de leitura/cache:** ampliar o snapshot de modo versionado, incluindo expansão e metadados estritamente necessários; validar e armazenar somente cópia autorizada para leitura offline, com marcação de possível desatualização.
2. **Ciclo de vida online:** definir a transição de rascunho para ativa, com autorização do servidor, materialização exatamente uma vez, estado e recibo recuperáveis; preservar a separação rascunho/ativa.
3. **Grade de leitura:** integrar snapshot à ficha contínua, com Característicos e expansão em áreas próprias, grade multi-Espaço e avisos de excesso de capacidade. Offline, somente leitura.
4. **API LAN autoritativa:** preparar consulta e mutações online com revalidação de sessão/permissões/revisão, transações atômicas, idempotência e recuperação de resposta incerta.
5. **Organização e catálogo:** integrar mover/trocar, catálogo canônico, pilhas por categoria e Itens Chave; impedir adição que não caiba.
6. **Operações individuais:** implementar online e separadamente equipar/remover, estados de armas/lanternas/coletes, moedas e Hatchet.
7. **Peças, consumíveis, combinação/fabricação:** somente após catálogo, receitas, custos e efeitos conferidos contra o Arquivo do Jogador.
8. **Backup/ciclo:** testar exportar/importar e leitura offline sem permitir reintrodução de mutações compartilhadas; fechar/reabrir, exclusão, arquivamento/recuperação e Morte conforme regras.
9. **Baú:** somente ao final, junto à integração LAN completa, conforme decisão do usuário.

## 6. Pontos que exigem decisão ou confirmação posterior

- Qual é o evento/critério oficial de transição de rascunho para personagem ativa no fluxo offline-first, considerando que a Mesa pode não estar acessível naquele momento?
- Quais dados mínimos de uma personagem ativa precisam estar disponíveis offline após revogação/perda de acesso à Mesa? Aplicar a política de acesso offline do Planejamento v2.1 sem inventar permissões.
- Quais estados exatos de Hatchet e itens personalizados serão representados no catálogo/instâncias.
- Como a ficha registra itens excedentes em mãos durante uma redução excepcional de capacidade, sem permitir nova carga ou criar Espaço fictício.
- O design para bloco de Moedas que chega a zero: o item zerado não pode continuar ocupando Espaço; a regra de remoção visual deve ser fechada sem transbordamento automático.

Nenhum desses pontos deve ser resolvido por suposição silenciosa. O restante da implementação pode avançar por contratos e testes puros que não dependam dessas decisões.

## 7. Classificação

- **IMPLEMENTADO:** planejamento inicial, materialização pura, parser de consulta, lógica isolada de expansão/moedas e planejamento puro de organização.
- **TESTADO AUTOMATICAMENTE:** evidência histórica no commit `608abacc` para materialização/validação; a CI posterior `e252755` também passou para a suíte e build existentes.
- **NÃO INTEGRADO:** persistência de snapshot ativo, ativação offline, grade operacional, catálogo completo e comandos.
- **PENDENTE:** contrato de leitura/cache versionado, ciclo de vida online, grade, API LAN autoritativa, organização integrada e operações online.
- **ADIADO POR DECISÃO DO USUÁRIO:** Baú e transferências compartilhadas, até a integração LAN final.

Este documento é uma auditoria/proposta técnica. Não altera regras do RPG, não executa migrações, não toca no Supabase remoto, não publica nem ativa personagens.
