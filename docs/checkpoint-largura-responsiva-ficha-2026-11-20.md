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
- Validação humana da nova largura: PENDENTE.
- A validação humana 4/4 da Missão 07 continua válida para o comportamento anterior (altura, ausência de moldura e mobile), mas não valida a nova largura desktop.

## Riscos e teste esperado
- Em desktop, a Ficha deve crescer progressivamente com a viewport até o limite de 1180 px, mantendo 24 px de margem lateral mínima.
- Em mobile retrato e paisagem, a largura e o comportamento aprovados devem permanecer inalterados.
- Risco residual: alguns conteúdos internos podem ficar visualmente dispersos em larguras maiores; verificar legibilidade e proporção antes de qualquer ajuste adicional.
- Testar desktop em larguras intermediárias e maximizada, janela baixa, mobile retrato e paisagem. Se houver regressão, corrigir somente o CSS necessário, mediante nova análise.

## Próxima ação exata
Gus atualizar a branch local e validar a nova largura nos tamanhos de tela indicados. Depois, retomar a bateria humana integrada no passo **Identidade — salvar**. Não iniciar Inventário ativo; Fase 2 permanece em andamento.
