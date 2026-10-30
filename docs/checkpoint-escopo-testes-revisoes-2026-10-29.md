# Checkpoint — escopo de testes e revisões da proposta de ativação

**Data:** 29/10/2026  
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`  
**Base inspecionada:** `e5b0a6ad7c409009ecd7cd66c6574dd967aec1a0`  
**Escopo:** leitura estática de `src/App.tsx`, `docs/ambiente-de-teste.md`, `docs/ativacao-integrada-local-2026-10-27.md`, `docs/ciclo-e-interface-local.md` e cabeçalho/conteúdo de `supabase/proposals/ativacao-integrada-local.sql`. Nenhum teste foi executado nesta etapa.

## Hipótese do usuário

Gus observou que o acoplamento dos gatilhos de revisão pode ter surgido porque a implementação foi construída para dar suporte a uma interface/ambiente de testes, sendo funcional apenas para esse propósito.

A hipótese é plausível, mas precisa de uma distinção importante: há pelo menos dois artefatos diferentes.

## Evidências encontradas

### 1. Interface isolada de QA

- `tests/ui/ativacao.html` e os componentes associados pertencem a uma prévia local de interface.
- O contrato `docs/ciclo-e-interface-local.md` declara que a página usa apenas memória e dados fictícios, sem Supabase, Auth ou armazenamento.
- F5, troca de cenário ou reinício zeram a simulação.
- A interface isolada não executa as propostas SQL.

**Conclusão:** a interface de QA não depende dos gatilhos PostgreSQL para funcionar. Portanto, o acoplamento não foi necessário para renderizar ou testar visualmente essa interface.

### 2. Proposta SQL de composição para testes automatizados

O cabeçalho de `supabase/proposals/ativacao-integrada-local.sql` declara expressamente:
- “PACOTE DE COMPOSIÇÃO LOCAL PARA TESTES AUTOMATIZADOS”;
- “NÃO É MIGRAÇÃO E NÃO DEVE SER APLICADO A UM PROJETO SUPABASE”;
- reúne propostas existentes numa transação para verificar dependências e ordem;
- exige reconciliação de histórico, revisão de RLS e checkpoint explícito antes de qualquer migração.

A proposta contém os gatilhos `versionar_criacao()` e `versionar_inventario_local()`. O pacote também declara que é protótipo local, sem API pública ou ativação remota autorizada.

**Conclusão:** o acoplamento identificado pertence a uma proposta de banco local destinada a ensaios automatizados de integração, não à interface isolada e não a uma migration ativa.

### 3. Aplicação conectada e banco remoto

- `src/App.tsx` monta o componente administrativo de disponibilidade inicial apenas quando `import.meta.env.MODE === 'teste'`.
- A página isolada de ativação/ciclo não é a aplicação conectada.
- A migration `20261028122021_rls_convites_mesa.sql` registra aplicação apenas no projeto Supabase de TESTE em 28/10/2026; ela não é a proposta integrada de ativação.
- A documentação de 27/10 declara que a proposta integrada não foi aplicada remotamente e que a interface principal ainda não chama os serviços de ativação.

**Conclusão:** não há evidência nesta inspeção de que os gatilhos em questão estejam ativos no Supabase de produção ou no projeto remoto de teste.

## Estado do achado anterior

O acoplamento continua **confirmado por leitura estática dentro da proposta local**:
1. `versionar_criacao()` compara todas as colunas de `public.personagens`, exceto `revisao_criacao`.
2. `versionar_inventario_local()` incrementa `revisao_inventario` por meio de UPDATE em `public.personagens`.
3. Esse UPDATE também aciona `versionar_criacao()`, incrementando a revisão de criação.

O impacto transacional continua sem teste nesta etapa.

## Classificação correta

- **IMPLEMENTADO:** protótipo SQL local com gatilhos de revisão, materialização, ativação e ciclo.
- **IMPLEMENTADO:** interface isolada de QA, em memória, com dados fictícios.
- **NÃO INTEGRADO:** proposta SQL e serviços de ativação na aplicação conectada.
- **NÃO APLICADO:** pacote integrado de ativação em projeto Supabase remoto, conforme os registros consultados.
- **NÃO TESTADO NESTA ETAPA:** correção ou comportamento dos gatilhos em execução.
- **PENDENTE:** verificar se o modelo de revisão da proposta é adequado como arquitetura futura, independentemente de ter sido criado para testes.

## Próxima investigação

1. Mapear todas as colunas de `public.personagens` que a proposta lê, grava ou usa para conferir criação.
2. Mapear todas as operações SQL que atualizam a linha de personagem durante inventário, jogo, arquivamento e retomada.
3. Separar:
   - escolhas e dados de criação;
   - estado operacional da ficha (PV/SA/BI, estado, localização/portador);
   - revisão do inventário;
   - revisão/contexto da Mesa;
   - recibos de operações.
4. Comparar o mapa com os contratos de ativação, inventário e ciclo.
5. Só então propor uma classificação de revisão e testes locais.

Não alterar ainda os gatilhos. Não criar migration. Não executar SQL remoto. Não alterar dados. Não mesclar, abrir PR ou publicar sem autorização específica.
