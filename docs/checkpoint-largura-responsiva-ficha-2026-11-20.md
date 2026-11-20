# Checkpoint — Missão 08: largura responsiva da Ficha no desktop — 20/11/2026

## Identificação e estado Git
- Frente: Ficha Offline PWA.
- Fase: 1 — Ficha Offline; bateria humana integrada da Fase 2 em andamento.
- Branch: `feat/offline-first-ficha`.
- HEAD após ajuste CSS: `2635135c72329a2fd36e879e331e7fb256ee1896`.
- Blob atual de `src/styles.css`: `3be3744d8141282f6faa5b08f3eabfb9cbd71a03`.
- Repositório remoto consultado. A árvore de trabalho local de Gus não pôde ser inspecionada.
- Nenhuma troca de branch, alteração de `main`, merge, publicação ou deploy.

## Objetivo e aprovação
Gus aprovou tornar a largura da Ficha fluida no desktop, mantendo a experiência mobile já aprovada e sem redesign.

## Implementação
- Arquivo alterado: `src/styles.css`.
- Substituída somente a regra final de largura desktop: acima de 760 px e com altura acima de 560 px, a Ficha passa a usar `min(calc(100vw - 48px), 1180px)`, centralizada pelo contêiner flexível.
- Mobile até 760 px permanece sob a regra existente de largura integral.
- Janelas com altura até 560 px preservam o comportamento de paisagem/tela integral já existente.
- Altura `100dvh`, remoção de notch/bezel, cores, tipografia, componentes, hierarquia, navegação e rolagem interna foram preservados.
- Nenhuma alteração em React, persistência ou regras de jogo.

## Classificação e verificações
- Ajuste CSS: IMPLEMENTADO.
- Inspeção estática do bloco final: realizada; o novo bloco substitui exatamente a regra desktop anterior.
- Testes automatizados: PENDENTES.
- Build: PENDENTE.
- Validação humana da nova largura: **VALIDADO HUMANAMENTE** — Gus confirmou que a adaptação funcionou e que o mobile permaneceu correto.
- Observação não bloqueadora: ao pressionar F5, a aplicação retornou à seleção de personagem. Gus aceitou o comportamento por ora; registrar como melhoria futura, sem abrir correção nesta etapa.
- A validação humana 4/4 da Missão 07 continua válida para o comportamento anterior (altura, ausência de moldura e mobile), mas não valida a nova largura desktop.

## Riscos e teste esperado
- Em desktop, a Ficha deve crescer progressivamente com a viewport até o limite de 1180 px, mantendo 24 px de margem lateral mínima.
- Em mobile retrato e paisagem, a largura e o comportamento aprovados devem permanecer inalterados.
- Risco residual: alguns conteúdos internos podem ficar visualmente dispersos em larguras maiores; verificar legibilidade e proporção antes de qualquer ajuste adicional.
- Testar desktop em larguras intermediárias e maximizada, janela baixa, mobile retrato e paisagem. Se houver regressão, corrigir somente o CSS necessário, mediante nova análise.

## Próxima ação exata
Missão 08 validada humanamente por Gus. Próxima ação: retomar a bateria humana integrada no passo **Identidade — salvar**. Não iniciar Inventário ativo; Fase 2 permanece em andamento.


## Registro de continuidade — retomada da bateria integrada

- Missão 08: **VALIDADO HUMANAMENTE** por Gus; largura desktop adaptável aprovada e mobile preservado.
- Observação não bloqueadora: F5 retorna à seleção de personagem; comportamento aceito por Gus, sem correção nesta rodada.
- Missão 06 — bateria humana integrada: passos anteriores aprovados por Gus: abertura Offline, criação de personagem/ficha contínua, Características e Atributos/Perícias. Próximo passo pendente: **Identidade — preencher dados fictícios e salvar**.
- Próxima ação exata: executar somente o teste de Identidade e aguardar o resultado de Gus antes de avançar.
- Build e testes automatizados após os ajustes CSS seguem PENDENTES; validação humana visual não substitui essas verificações.


## Bateria humana integrada — resultado do passo Identidade

- Gus reportou **APROVADO** para o passo 5 do ciclo básico: preencher Identidade com dados fictícios e salvar.
- Etapas humanas aprovadas até aqui: abertura Offline; criação de personagem/ficha contínua; Características; Atributos/Perícias; Identidade.
- Próximo passo exato do roteiro `docs/roteiro-humano-ficha-offline-local.md`, seção 2, item 6: fechar a ficha pelo controle da própria ficha e abri-la novamente pela lista.
- Após esse passo, verificar se os dados salvos continuam presentes (seção 2, item 7). Não avançar para recarga F5 ainda.
- Build e testes automatizados após os ajustes CSS continuam PENDENTES. Fase 2 segue em andamento; Inventário ativo/Fase 3 continua bloqueado.


## Bateria humana integrada — reabertura da ficha

- Gus reportou **APROVADO** para fechar a ficha pelo controle próprio e reabri-la pela lista de personagens.
- Próximo passo exato: conferir se os dados salvos nas seções já preenchidas continuam presentes após a reabertura (seção 2, item 7 do roteiro).
- Não executar F5 ainda; a recarga será testada na seção 3.
- Fase 2 permanece em andamento; Inventário ativo/Fase 3 continua bloqueado.


## Bateria humana integrada — persistência após reabertura — 20/11/2026

- Gus reportou **APROVADO** para a conferência dos dados após fechar e reabrir a mesma ficha pela lista.
- Características, Atributos/Perícias e Identidade permaneceram preenchidos após a reabertura normal.
- Próximo passo exato do roteiro `docs/roteiro-humano-ficha-offline-local.md`, seção 2, item 8: em uma seção, fazer uma alteração sem salvar e tentar fechar; confirmar o aviso de descarte. Cancelar e verificar que a ficha permanece aberta; depois descartar intencionalmente, reabrir e confirmar que a alteração não persistiu.
- Não executar F5 ainda; a recarga é testada separadamente na seção 3.
- Fase 2 continua em andamento; Inventário ativo/Fase 3 permanece bloqueado.


## Bateria humana — proteção contra descarte acidental — 20/11/2026

- Gus confirmou **APROVADO** para a primeira parte do teste de alteração não salva: ao tentar fechar a ficha, o aviso de descarte foi apresentado e, ao cancelar, a ficha permaneceu aberta.
- Próxima ação exata: com a alteração ainda não salva, tentar fechar novamente e confirmar o descarte intencional. Reabrir a ficha e verificar que a alteração não persistiu.
- Não executar F5 ainda; a recarga será testada separadamente na seção 3 do roteiro.
- Fase 2 permanece em andamento; Inventário ativo/Fase 3 continua bloqueado.


## Bateria humana — descarte intencional de alteração não salva — 20/11/2026

- Gus reportou **APROVADO**: após cancelar a primeira tentativa de fechamento, tentou fechar novamente, escolheu descartar as alterações, reabriu a mesma personagem e confirmou que o valor não salvo não persistiu.
- Resultado: proteção contra descarte acidental e descarte intencional **VALIDADOS HUMANAMENTE**; dados previamente salvos permaneceram preservados.
- Próxima ação exata: seção 3, item 1 do roteiro humano — com a ficha salva, pressionar F5, reabrir a personagem e conferir os dados salvos.
- Fase 2 permanece em andamento; Inventário ativo/Fase 3 continua bloqueado. Testes automatizados/build após os ajustes CSS continuam PENDENTES.


## Bateria humana — recarga F5 — 20/11/2026

- Gus reportou **APROVADO** para a seção 3, item 1 do roteiro humano: após pressionar F5, reabrir a mesma personagem e conferir os dados, a persistência dos dados salvos foi confirmada.
- Resultado: recarga da aplicação e reabertura da personagem sem perda dos dados previamente salvos **VALIDADAS HUMANAMENTE**.
- Próxima ação exata: seção 3, item 2 — abrir duas abas do mesmo navegador/perfil, ambas com a mesma personagem, sem ainda editar.
- Fase 2 permanece em andamento; Inventário ativo/Fase 3 continua bloqueado. Testes automatizados/build após os ajustes CSS continuam PENDENTES.

## Bateria humana — duas abas com a mesma personagem — 20/11/2026

- Gus reportou **APROVADO** para a seção 3, item 2 do roteiro humano: abriu uma segunda aba no mesmo navegador/perfil e conseguiu abrir a mesma personagem nas duas abas, sem editar.
- Resultado: abertura simultânea da mesma personagem em duas instâncias do navegador **VALIDADA HUMANAMENTE**. Este passo não testa ainda a resolução de alterações concorrentes.
- Próxima ação exata: seção 3, item 3 — na aba A, alterar uma seção da personagem e salvar; depois, sem recarregar a aba B, alterar a mesma seção na aba B e tentar salvar. Aguardar o resultado antes de avançar.
- Fase 2 permanece em andamento; Inventário ativo/Fase 3 continua bloqueado. Testes automatizados/build após os ajustes CSS continuam PENDENTES.
