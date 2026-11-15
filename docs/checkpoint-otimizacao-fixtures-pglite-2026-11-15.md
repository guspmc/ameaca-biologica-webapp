# Checkpoint — otimização das fixtures PostgreSQL/PGlite

**Data:** 15/11/2026  
**Frente:** Ficha Offline PWA — infraestrutura de testes  
**Fase:** 0 — Preparação Offline (sem alteração do produto)  
**Branch:** `feat/offline-first-ficha`  
**HEAD de origem:** `958efd18f53e56ddde949a7db5e1a5f1b27dd6ca`  
**Estado:** implementação registrada; CI pendente.

## Objetivo

Reduzir o custo das suítes de integração PostgreSQL executadas com PGlite, sem remover casos, reduzir cobertura ou compartilhar estado mutável entre testes.

## Diagnóstico confirmado por inspeção

Nas quatro suítes analisadas havia 52 casos de teste e 50 chamadas que preparavam bancos independentes, repetindo a criação do PGlite, as 16 migrações SQL e os dados-base:

| Arquivo | Casos existentes | Preparações independentes antes |
|---|---:|---:|
| `tests/database.test.mjs` | 26 | 26 |
| `tests/funcionamento-database.test.mjs` | 5 | 5 |
| `tests/ativacao-local.test.mjs` | 12 | 10 |
| `tests/ativacao-integrada-local.test.mjs` + fixture compartilhada | 9 | 9 |
| **Total** | **52** | **50** |

A suíte de banco principal também utiliza duas variantes de migração (com e sem a migração de privacidade). As suítes de ativação local e integrada aplicam propostas SQL diferentes e precisam permanecer isoladas.

## Implementação deste ciclo

Foi adotado o método `.clone()` documentado pelo PGlite para criar bancos independentes a partir de uma base já preparada.

- `tests/database.test.mjs`: mantém duas bases-modelo separadas para as variantes de migração; cada chamada a `setup()` recebe um clone próprio.
- `tests/funcionamento-database.test.mjs`: prepara uma base-modelo e fornece clones independentes.
- `tests/ativacao-local.test.mjs`: prepara uma base-modelo com as propostas locais e fornece clones independentes.
- `tests/helpers/ciclo-fixture.mjs`: mantém duas bases-modelo distintas, uma para ativação local e outra para ativação integrada; ambas fornecem clones independentes.
- As bases-modelo são fechadas nos hooks `after` das suítes.
- Foi acrescentado um teste de regressão em `database.test.mjs`: cria uma tabela em um clone e confirma que ela não aparece em outro clone derivado da mesma base.

Com isso, as 50 preparações completas passam a ser 6 preparações de base-modelo (duas variantes em database, uma em funcionamento, uma em ativação local e duas no helper de ciclo). Os 50 testes continuam recebendo bancos próprios. A quantidade de aplicações completas das migrações nessas suítes cai de 50 para 6; a redução estimada é de 88% nessa etapa específica.

## Arquivos alterados

- `tests/database.test.mjs`
- `tests/funcionamento-database.test.mjs`
- `tests/ativacao-local.test.mjs`
- `tests/helpers/ciclo-fixture.mjs`
- Este checkpoint e a linha de continuidade.

Nenhum arquivo de produção, regra do RPG, schema/migration, dependência, interface, service worker ou serviço LAN foi alterado.

## Evidências e classificação

| Item | Estado |
|---|---|
| Diagnóstico das 50 preparações repetidas | INSPECIONADO |
| Reuso de base-modelo por configuração | IMPLEMENTADO |
| Clone independente por teste | IMPLEMENTADO |
| Teste de isolamento entre clones | IMPLEMENTADO — execução pendente |
| Fechamento das bases-modelo | IMPLEMENTADO |
| Testes automatizados | PENDENTE — aguardando GitHub Actions |
| Build e TypeScript | PENDENTE — aguardando GitHub Actions |
| Comparação real de duração | PENDENTE — medir após CI |
| Validação humana | NÃO APLICÁVEL a esta otimização de infraestrutura; não substitui testes humanos da Ficha |

## Riscos e limites

- A correção depende do comportamento de `.clone()` na versão instalada `@electric-sql/pglite 0.5.11`; o CI precisa confirmar compatibilidade prática.
- O isolamento foi protegido por teste dedicado, mas ainda não está comprovado até a execução.
- A estimativa de 88% refere-se somente à repetição da preparação/migração nas quatro suítes. Não é uma promessa de redução equivalente no tempo total do workflow.
- Outras suítes não foram alteradas nem presumidas como parte deste diagnóstico.
- Não houve execução local; esta sessão opera pelo GitHub e não possui clone/runtime local.

## Próxima ação exata

Aguardar os workflows acionados pelo commit. Conferir a execução do teste de isolamento, as quatro suítes, `pnpm test`, build e TypeScript. Comparar a duração da etapa PostgreSQL com a execução anterior. Se houver falha, corrigir somente a causa demonstrada. Não cancelar workflows antigos, não trocar de branch, não fazer merge ou deploy.
