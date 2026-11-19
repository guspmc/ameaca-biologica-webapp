# Checkpoint — auditoria de PV, SA, BI e Descanso — 19/11/2026

## Identificação
- Projeto: Ameaça Biológica RPG — Ficha Offline PWA.
- Repositório: `guspmc/ameaca-biologica-webapp`.
- Branch: `feat/offline-first-ficha`.
- HEAD de código/teste: `dfaf6f5a4eaf25d6905e99913011375db67d5952`.
- Fase: 1 — Ficha Offline; Fase 2 (testes humanos) continua pendente.

## Escopo e fontes
- Arquivo do Jogador v1.0, p. 26: PV por Nível, BI Base e SA Máxima por Classe.
- Arquivo do Jogador v1.0, p. 90: BI começa em 0; BI Máxima deriva da Classe + AST e bônus aplicáveis.
- Arquivo do Jogador v1.0, p. 97: Sala de Descanso permite Descanso Parcial e Completo; Sala Segura permite somente Parcial. Completo dura 1 hora e restaura PV/SA; Parcial dura 30 minutos, usa um Dado de Vida por Nível e não recupera SA.
- Código conferido no HEAD: `src/recursosFicha.ts`, `src/RecursosFichaLocal.tsx`, `src/descansoFicha.ts`, `src/DescansoFichaLocal.tsx`, `src/FichaLocal.tsx`, `src/FichaOfflineApp.tsx`, `src/ReanimacaoFichaLocal.tsx`.
- Testes existentes: `tests/recursos-ficha.test.mjs`, `tests/descanso-ficha.test.mjs`, `tests/reanimacao-integracao-ficha.test.mjs`.

## Achados
1. **Recursos iniciais:** `recursosIniciais` já usa PV Máximos e SA Máxima quando os campos atuais estão ausentes; PV Temporários e BI começam em 0. Testes existentes cobrem esse contrato. Não foi necessário alterar esse módulo.
2. **Causa raiz confirmada:** um novo rascunho é criado sem Classe em `FichaOfflineApp`. Até a Classe ser escolhida, PV Máximos derivados são 0. `ReanimacaoFichaLocal` interpretava PV Atual 0 como evento real e iniciava automaticamente Reanimação por 0 PV, mesmo com PV Máximos 0. A persistência dessa Reanimação gravava PV/SA/BI zerados. Após escolher Classe, os zeros persistidos deixavam de usar os padrões derivados e a Reanimação em andamento bloqueava o Descanso.
3. **Correção implementada:** `podeIniciarPV` agora exige `pvMaximo > 0` antes de iniciar Reanimação automaticamente. Assim, rascunhos incompletos não criam um estado crítico nem persistem recursos zerados; personagens com PV Máximos válidos e PV Atual realmente igual a 0 continuam elegíveis.
4. **Descanso:** a regra de locais está correta. `localPermiteDescanso` aceita Parcial e Completo na Sala de Descanso e somente Parcial na Sala Segura. O botão de Descanso Parcial permanece desabilitado até que todos os resultados dos Dados de Vida tenham sido informados (ou a rolagem virtual esteja disponível), o que é requisito de entrada, não bloqueio do local. Não houve alteração nesta interface.
5. **Limites preservados:** Descanso Parcial não restaura SA nem pausa Condições; Descanso Completo restaura PV/SA, encerra PV Temporários e preserva BI. Não foram alteradas regras de Reanimação legítima, transformação, progressão ou inventário.

## Arquivos alterados
- `src/ReanimacaoFichaLocal.tsx`: guarda `pvMaximo > 0` na condição de início automático por 0 PV.
- `tests/reanimacao-integracao-ficha.test.mjs`: regressão estrutural exige o guarda antes da Reanimação automática.

## Testes e build
- CI de testes: run `44450648921`, commit `dfaf6f5a4eaf25d6905e99913011375db67d5952` — **IN_PROGRESS** no momento deste checkpoint.
- CI de build/TypeScript: run `44450648983`, mesmo commit — **IN_PROGRESS** no momento deste checkpoint.
- Nenhum teste local foi executado por esta sessão (trabalho realizado pelo conector GitHub, sem clone/runtime local).
- Não declarar validação humana.

## Estado da funcionalidade
- Recursos iniciais: **IMPLEMENTADO / TESTADO AUTOMATICAMENTE** no contrato puro já existente; regressão de inicialização por Reanimação: **IMPLEMENTADA / CI PENDENTE**.
- Descanso Parcial/Completo: **IMPLEMENTADO / TESTADO AUTOMATICAMENTE** no contrato e nos testes existentes; teste humano pendente.
- PV/SA/BI e Descanso no navegador real: **PENDENTE DE VALIDAÇÃO HUMANA**.

## Riscos e recuperação
- A correção evita criar novos registros de Reanimação falsos. Ela não apaga nem reescreve automaticamente dados antigos já persistidos com `reanimacao` em andamento ou recursos 0; esses registros devem ser examinados individualmente para não apagar uma Reanimação legítima.
- O usuário relatou que a ficha testada anteriormente estava na interface LAN. Isso não valida a Ficha Offline nem substitui a nova rodada humana Offline.

## Próxima ação exata
1. Aguardar os dois workflows do commit `dfaf6f5`; se falharem, corrigir apenas a causa demonstrada.
2. Após CI verde, atualizar este checkpoint com os resultados e disponibilizar nova rodada de teste humano para criar um personagem novo: conferir PV/SA no máximo, BI 0, nenhum fluxo de Reanimação iniciado durante o rascunho, e os dois tipos de Descanso disponíveis na Sala de Descanso (Parcial após informar os Dados de Vida).
3. Não avançar para Inventário ativo, Painel, Laboratório ou LAN integrada antes dos critérios anteriores e da validação humana.
