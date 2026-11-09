# Checkpoint técnico — procedimentos dos itens e contrato de Progressão — 08/11/2026

**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Branch:** `feat/offline-first-ficha`  
**HEAD de referência:** `1574f1ae1e684219331a8ebba7e756eaa421150e`  
**Escopo:** consolidar procedimentos de uso dos itens de exploração e regras gerais de fabricação; iniciar o contrato versionado de Progressão persistente.

## 1. Separação obrigatória: catálogo ≠ Inventário de Personagem

- Catálogos são referência de regras, perfis, compatibilidades, propriedades, aquisição, uso e fabricação.
- Não controlam posse, quantidade carregada, espaços ocupados, equipamento, consumo, recarga, transferência ou organização.
- Inventário ativo só será trabalhado depois da implementação/auditoria da Ficha e dos testes humanos integrados.
- Nenhum módulo de gestão ativa do Inventário foi alterado neste ciclo.

A inspeção da branch encontrou código anterior de planejamento de equipamento inicial, materialização de exemplares e consulta/organização. O editor atual da Ficha deixa explícito que o rascunho de criação não equipa, consome, transfere nem modifica inventário ativo. O painel de consulta existente é somente leitura. Esse código foi apenas inspecionado; não foi ampliado nem ativado.

## 2. Procedimentos de uso — 28 itens de exploração

Arquivos novos:
- `src/catalogoUsoItensExploracao.ts`
- `tests/catalogo-uso-itens-exploracao.test.mjs`

O novo catálogo complementar reúne, para os 28 IDs de `catalogoItensExploracao.ts`:
- procedimento em combate;
- procedimento fora de combate;
- referência ao Arquivo do Jogador.

A consolidação registra custos expressos (Interação Gratuita com Objeto, Ação, Ação Bônus e Ação Completa), efeitos, alcance/área, requisitos e consumos quando a fonte os especifica. Quando o livro não define custo ou duração fora de combate, o catálogo registra essa ausência explicitamente; não inventa cronômetros, Testes ou ações. O módulo apenas consulta regras e não executa efeitos.

O teste estrutural exige correspondência exata entre todos os IDs do catálogo principal e os procedimentos complementares, além de campos preenchidos e referências.

**Estado:** implementação criada; CI do HEAD de referência ainda em execução. Não declarar aprovada antes do resultado.

## 3. Regras gerais de fabricação

Arquivos novos:
- `src/catalogoRegrasFabricacao.ts`
- `tests/catalogo-regras-fabricacao.test.mjs`

Consolida:
- fabricação medicinal: 30 minutos, Medicina DT 12, dispensa de Teste quando Treinada salvo regra específica, ingredientes preservados na falha e tempo consumido;
- fabricação de armamento: 30 minutos, Teste de AST, requisito de Sala de Descanso ou Kit de Ferramentas salvo exceção;
- DT final como maior valor entre raridade e DT mínima de calibre: 9 mm (12), Calibre 12 (15), calibre especial/munição especial (18); raridades Comum (12), Incomum (15), Raro (18), Muito Raro (21), Lendário (24).

O módulo calcula DT e expõe regras; não rola dados, consome ingredientes nem fabrica itens.

**Estado:** implementação criada; CI do HEAD de referência ainda em execução.

## 4. Progressão persistente — primeira fundação

Arquivos novos:
- `src/progressaoPersistente.ts`
- `tests/progressao-persistente.test.mjs`

O contrato v1 contempla método, nível, contador de Missões, Marco Narrativo, snapshot da contagem e nível na última Morte, penalidade especial do nível 1 e histórico de benefícios dos níveis 2..N.

O validador:
- exige histórico completo e ordenado dos níveis adquiridos;
- exige os tipos de benefício esperados em cada nível;
- confere Classe e grau das Habilidades;
- confere restrições de Classe e grau anterior dos Pontos de Perícia;
- distingue morte no nível 1 de morte no nível 2 com perda para nível 1;
- permite registrar recuperação posterior sem apagar o histórico da Morte;
- permite alterar o contador de Missões sem conceder nível ou alterar benefícios.

**Limite importante:** este contrato ainda não está integrado a `validacaoPersonagemLocal.ts`, backup JSON, IndexedDB, Descanso Completo ou servidor LAN. Também não executa aplicação/reversão de benefícios. É uma primeira etapa, não um módulo concluído.

**Estado:** implementação e testes criados; CI do HEAD de referência ainda em execução.

## 5. CI

Workflows disparados para o HEAD `1574f1ae1e684219331a8ebba7e756eaa421150e`:
- Compilação do WebApp — run [42552703389](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42552703389).
- Verificação da ficha offline — run [42552703269](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42552703269).

No momento do checkpoint, ambos estavam em execução. Os testes e builds não foram declarados aprovados.

## 6. Próximas etapas

1. Aguardar e corrigir resultados reais do CI.
2. Integrar validação do estado de Progressão ao modelo persistido e ao backup, com compatibilidade explícita para fichas antigas.
3. Implementar aplicação atômica de um nível no Descanso Completo válido em Sala de Descanso.
4. Integrar escolhas de Habilidade, Atributo e Perícia e histórico exato de benefícios.
5. Integrar Morte/reversão e regra de novo progresso após Morte.
6. Continuar auditoria e consolidação de procedimentos para armas, munições, peças, coletes e receitas.
7. Executar bateria automatizada e auditoria final de todos os catálogos.
8. Somente depois, realizar testes humanos integrados da Ficha e dos catálogos.
9. Só após aprovação humana iniciar o Inventário de Personagem ativo.

## 7. Limites

- Nenhuma alteração em `main`, merge ou publicação.
- Nenhuma mudança de cânone.
- Nenhum teste humano declarado.
- Inventário ativo continua fora do escopo até os testes humanos integrados.
