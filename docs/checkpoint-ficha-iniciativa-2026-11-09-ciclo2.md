# Checkpoint — Ficha do Jogador: escopo da Iniciativa
**Data:** 09/11/2026  
**Ciclo:** 2  
**Branch:** `feat/offline-first-ficha`  
**Commit de código:** `b67548df116db614a047587de46a075c5ecafe67`

## Objetivo
Alinhar a seção de Iniciativa da Ficha do Jogador ao limite funcional aprovado: a Ficha apresenta valores derivados e auxiliares, mas não realiza a rolagem nem administra a ordem do Encontro.

## Alterações implementadas
- `src/FichaLocal.tsx`: removida a integração com a calculadora local de Iniciativa.
- A Ficha agora exibe somente o **modificador de Iniciativa derivado de AGI**, com indicação de que a rolagem e a ordem do Encontro pertencem ao Painel do Mestre.
- `src/IniciativaFichaLocal.tsx`: removido; o componente solicitava ao Jogador um resultado natural de d20 e calculava um total local.
- `tests/iniciativa-ficha.test.mjs`: substituídos os testes da calculadora por verificações de que a Ficha exibe apenas o modificador e não solicita rolagem.

## Regra preservada
O Arquivo do Jogador v1.0, p. 76, determina **Iniciativa = 1d20 + AGI**. A alteração não modifica a regra: apenas retira da Ficha a entrada do resultado natural e o cálculo do total. A rolagem e a ordem são responsabilidade do fluxo do Painel do Mestre.

## Limpeza e dependências
A busca de referências no código da Ficha e no teste confirmou que o componente antigo era usado apenas por `FichaLocal.tsx` e pelo teste específico. A integração foi removida e o arquivo do componente excluído. Nenhum módulo de combate mais amplo foi apagado nesta rodada; esses módulos exigem auditoria individual de dependências antes de qualquer remoção.

## Validação
- CI para o commit de código `b67548d`:
  - Build: [42655459041](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42655459041)
  - Verificação offline: [42655459252](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42655459252)
- Situação no momento da criação deste checkpoint: workflows em execução. Não declarar o ciclo validado até ambos concluírem com sucesso.
- Nenhum teste humano solicitado ou executado.
- Nenhuma alteração em `main`, merge, deploy ou produção.

## Pendências mantidas
- Integrar o modificador de Iniciativa ao Painel do Mestre quando o fluxo de Encontros for implementado.
- Auditar e simplificar os módulos de combate/turno que não pertencem à Ficha-notebook, sem apagar código ainda utilizado por outros fluxos.
- Continuar a implementação da Ficha em ciclos pequenos, com testes automatizados e rastreabilidade.

## Instrução permanente para os próximos ciclos
**Ao final de cada ciclo de implementação:**
1. atualizar a matriz de estado e pendências;
2. criar ou atualizar um checkpoint com data, branch, HEAD, objetivo, arquivos alterados, decisões preservadas, testes executados, resultados observados, pendências e próximo passo;
3. registrar explicitamente se CI está pendente, em execução, aprovado ou reprovado, sempre vinculado ao SHA exato;
4. incluir neste checkpoint a instrução de continuidade, para que o próximo ciclo comece lendo o checkpoint e a matriz antes de alterar código;
5. distinguir IMPLEMENTADO, TESTADO AUTOMATICAMENTE, TESTADO HUMANAMENTE e PENDENTE;
6. não avançar para o próximo ciclo antes de apresentar o checkpoint ao Gus e obter sua validação.

A próxima sessão deve começar consultando este checkpoint e a matriz atualizada, confirmar o HEAD da branch e inspecionar os arquivos envolvidos antes de qualquer alteração. Não reabrir decisões já aprovadas nem repetir auditorias concluídas sem evidência de regressão.
