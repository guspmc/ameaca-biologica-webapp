# Matriz de auditoria funcional da Ficha

**Data:** 10/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Status:** auditoria documental parcial; não é certificação de completude.

## Como ler esta matriz

- **Implementado no código:** há módulo/fluxo identificado na versão consultada.
- **Cobertura automatizada existente:** há testes dedicados no repositório. Isso não significa que a CI deste HEAD já passou.
- **Integração pendente:** o próprio código ou a arquitetura atual identifica dependência ainda não ligada.
- **Validação manual:** não presumir sem evidência explícita de teste humano registrado.
- Esta matriz separa Offline e LAN. Um fluxo existente Offline não prova que esteja disponível na LAN.

## Matriz por área

| Área | Evidência de implementação | Testes existentes identificados | Limites / pendências |
|---|---|---|---|
| Entrada e navegação | `main.tsx` seleciona Ficha Offline por padrão e modo LAN sob parâmetro explícito; `FichaOfflineApp.tsx` e `ConexaoServidorLocal.tsx` são fluxos separados. | `entrada-aplicacao.test.mjs`, `arquivos-jogador-navegacao.test.mjs`, `recuperacao-contexto.test.mjs` | Não existe ainda fluxo unificado Offline-first com salvamento local + LAN. |
| Identidade | `IdentidadeLocal.tsx` edita nome e dados narrativos na Ficha. | `identidade-local.test.mjs`, verificações em `pendencias-edicao.test.mjs` | Identidade foi excluída da primeira allowlist de sincronização genérica; integração LAN dedicada continua pendente. |
| Características, Classe e Origem | `EditorCaracteristicasLocal.tsx`, catálogo de Classes/Origens e efeitos de Origem participam da Ficha. | `classes-ficha.test.mjs`, `efeitos-origens.test.mjs`, `integridade-criacao.test.mjs`, `conferencia-criacao-local.test.mjs` | A conclusão de criação depende de validação e ativação próprias; não inferir que todo o fluxo esteja coberto por testes de navegador. |
| Atributos e Perícias | `EditorAtributosPericiasLocal.tsx`, `atributosCriacao.ts`, `periciasCriacao.ts` e `derivadosCriacao.ts`. | `atributos/perícias`: `pericias-criacao.test.mjs`, `pericias.test.mjs`, `derivados-criacao.test.mjs`, `revisao.test.mjs` | A auditoria atual não certifica todos os casos de distribuição, progressão e atualização de derivados na interface. |
| Habilidades | `PlanejadorHabilidadesCriacaoLocal.tsx`, `habilidades.ts`, `efeitosHabilidades.ts`. | `catalogo-habilidades.test.mjs`, `progressao-habilidades.test.mjs`, `progressao-criacao.test.mjs` | A aplicação dos ganhos deve continuar separada do planejamento; confirmar por caso de uso e contexto LAN antes de declarar conclusão. |
| Recursos (PV, SA, BI) | `RecursosFichaLocal.tsx` e `recursosFicha.ts`. | `recursos-ficha.test.mjs` | Há cobertura de limites, dano, cura, temporários e BI; a CI do HEAD atual ainda precisa concluir. |
| Condições | `CondicoesFichaLocal.tsx` e `condicoesFicha.ts`. | `condicoes-ficha.test.mjs`, `lembretes-condicoes-turno.test.mjs` | A Ficha informa que Condições são informativas e dependem da aplicação das regras pela Mesa; progressões temporais não são atualizadas automaticamente no Descanso Completo. |
| Reanimação | `ReanimacaoFichaLocal.tsx` e `reanimacaoFicha.ts`. | `reanimacao-ficha.test.mjs`, `reanimacao-integracao-ficha.test.mjs` | Há integração explícita com recursos e salvamento; a auditoria não substitui validação manual de todos os cenários narrativos e de Mesa. |
| Descanso | `DescansoFichaLocal.tsx`, `descansoFicha.ts`, `usosDescansoCompleto.ts`. | `descanso-ficha.test.mjs`, `usos-descanso-completo.test.mjs` | Atualização automática de Condições e progressões temporais permanece fora do comportamento descrito no painel. |
| Combate — economia e manobras | `PainelAcoesLocal.tsx`, `estadoTurnoCombate.ts`, `manobrasOperacionais.ts`, `reacoesCombate.ts`. | `estado-turno-combate.test.mjs`, `economia-acoes.test.mjs`, `manobras-operacionais.test.mjs`, `manobras-universais.test.mjs`, `reacoes-combate.test.mjs` | A Ficha registra escolhas/ações sem presumir gatilhos nem resolver efeitos por conta própria. Iniciativa da Mesa e gestão de Encontros não fazem parte do painel atual. |
| Testes e roladores | `RoladoresBasicosLocal.tsx`, `CalculadoraTesteLocal.tsx`, `rolagemDados.ts`, `testes.ts`. | `roladores-ficha.test.mjs`, `testes.test.mjs`, `ataques-calculadora.test.mjs` | Os testes existentes verificam restrição de roladores ao modo Automático; Misto/Manual não devem ganhar calculadoras por acidente. |
| Iniciativa | A Ficha exibe modificador derivado de AGI e permite rolagem pontual no modo Automático. | `iniciativa-ficha.test.mjs` | A própria suíte confirma que a Ficha não administra ordem de turnos nem Encontros. |
| Progressão e Morte | `ProgressaoFichaLocal.tsx`, `progressaoPersistente.ts`, `progressaoMorte.ts`. | `progressao-persistente.test.mjs`, `progressao-morte.test.mjs`, `progressao-campanha.test.mjs` | Edição/registro disponíveis Offline; integração LAN requer fluxo próprio de autorização e gravação. Registro de Morte na LAN aguarda confirmação do Mestre. |
| Inventário | `EditorInventarioLocal.tsx`, `PainelInventarioLocal.tsx` e diversos módulos de catálogo, consulta, criação, expansão e organização. | `inventario-*.test.mjs`, `catalogo-*.test.mjs`, `organizacao-*.test.mjs`, testes de UI de inventário | Existe uma base de código e testes substancial; isso não significa que todas as operações estejam concluídas ou integradas à Ficha ativa. A auditoria específica do módulo continua necessária. |
| Persistência Offline | `persistenciaFicha.ts`, `FichaOfflineApp.tsx`; IndexedDB v3 com store separado para vínculos LAN. | `persistencia-migracao.test.mjs`, `persistencia-operacoes.test.mjs`, `persistencia-patch.test.mjs`, `persistencia-gravacao.test.mjs`, `vinculos-lan*.test.mjs` | O novo teste CRUD do vínculo usa IndexedDB simulado. Integração em navegador com IndexedDB real permanece pendente. |
| Persistência LAN | `ConexaoServidorLocal.tsx`, `servidorLocal.ts`, servidor local SQLite. | `personagens-local.test.mjs`, `cliente-servidor-local.test.mjs`, `auth-local.test.mjs`, `rascunhos-concorrencia.test.mjs`, entre outros. | LAN e Offline ainda são fluxos separados. Não existe ainda sincronização local-first, endpoint dedicado para allowlist ou UI de conflito multi-dispositivo. |

## Conclusões sustentadas nesta etapa

1. A Ficha tem cobertura automatizada relevante em regras de recursos, Condições, Reanimação, Descanso, economia de Combate, Manobras, Reações, roladores e Progressão.
2. Parte dos testes valida funções de domínio; parte inspeciona integração/estrutura da interface. Os testes de fonte não equivalem a testes E2E em navegador.
3. A arquitetura atual mantém Offline e LAN em entradas e persistências distintas. A meta de sincronização Local-first ainda depende de integração arquitetural.
4. Há pendências explícitas em Combate/Inventário e em integração LAN; não é correto reduzir todas as lacunas a “só falta Inventário”.
5. Esta matriz não declara nenhum módulo como HUMAN-VALIDATED. Testes manuais anteriores da Alfa não cobrem automaticamente os novos fluxos Offline > LAN.

## Próximos passos da auditoria paralela

- Inspecionar a composição da Ficha e os testes de interface para Características, Identidade, Atributos/Perícias e Habilidades.
- Auditar o módulo Inventário por fluxo: criação, ativação, consulta, movimentação, organização, consumo, munição/recarga e salvamento.
- Auditar LAN separadamente: sessão, salvamento, permissões e estado de sincronização.
- Depois, cruzar cada caso com o Arquivo do Jogador e o Planejamento aprovado, sem alterar o cânone.
