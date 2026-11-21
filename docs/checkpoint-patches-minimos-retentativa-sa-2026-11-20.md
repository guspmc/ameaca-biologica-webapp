# Checkpoint — patches mínimos e retentativa de SA — 20/11/2026

## Identificação
- Projeto: Ameaça Biológica RPG — Ficha Offline PWA.
- Repositório: `guspmc/ameaca-biologica-webapp`.
- Branch: `feat/offline-first-ficha`.
- HEAD remoto: `689376e9540d01ca9476bd235a22432a85aed361`.
- Fase: 1 — Ficha Offline; bateria humana/Missão 06 em andamento (Fase 2).
- Escopo: persistência de PV, SA e BI e preservação de ajustes rápidos após falha. Nenhuma mudança de fase.

## Objetivo e resultado
Concluir a verificação automatizada da correção de patches mínimos e proteger o ajuste rápido de SA contra perda silenciosa quando a gravação falhar.

## Implementações
- `src/recursosFicha.ts`: `RecursosPatch` parcial, permitindo enviar somente chaves efetivamente alteradas.
- `src/RecursosFichaLocal.tsx`: operações de recursos enviam patches mínimos; PV direto só persiste após **Aplicar**; operações aplicadas de cura, dano, PV Temporários e BI persistem imediatamente; efeitos que alteram mais de uma chave mantêm patch atômico; falha mantém pendência e permite retentativa.
- `src/FichaOfflineApp.tsx`: ajuste da base esperada de SA rápido, preservando as verificações de Economia de Ações e estado do turno.
- `src/FichaLocal.tsx`: se o salvamento rápido de SA falhar, conserva o valor pretendido como pendente, bloqueia novos cliques até resolver e oferece **Tentar salvar novamente**. Só apresenta sucesso após confirmação.
- `tests/recursos-ficha.test.mjs`: inclui teste estrutural para a pendência/retentativa de SA.
- `tests/reanimacao-integracao-ficha.test.mjs`: corrigido anteriormente para remover literal de quebra de linha que causava SyntaxError no próprio teste.

## Commits relevantes
- `a9c02c95f54cafed36f8bec642b46a3d485dbafe`: preservação/retentativa do ajuste rápido de SA em `src/FichaLocal.tsx`.
- `689376e9540d01ca9476bd235a22432a85aed361`: teste automatizado da retentativa de SA em `tests/recursos-ficha.test.mjs`.
- O commit `ccc9a00027b40b0ec59cf52268930b989d63334f` e seus workflows anteriores também passaram; a evidência mais recente abaixo corresponde ao HEAD atual.

## Testes e build
- Workflow **Verificação da ficha offline**: run `44849055888`, SHA `689376e9540d01ca9476bd235a22432a85aed361`, conclusão **success**. Todos os grupos de testes registrados no log terminaram com pass e fail 0; a etapa de build executada dentro do workflow também passou.
- Workflow **Validar compilação do WebApp**: run `44849055890`, mesmo SHA, conclusão **success**. `tsc --noEmit`, `vite build` e verificação de tipos dos cenários isolados passaram.
- Build gera aviso não bloqueante de chunk JavaScript com 639,79 kB (limite de aviso 500 kB). Também aparecem avisos de depreciação do Node.js 20 nas actions e do módulo `punycode`. Registrar para avaliação futura; não ampliar o escopo deste ciclo sem necessidade.
- Teste automatizado e build: **TESTADOS AUTOMATICAMENTE** no HEAD acima.
- Validação humana da nova implementação de recursos: **PENDENTE**.

## Estado da bateria humana — Missão 06
- Seção 3, itens 1 a 4: aprovados anteriormente por Gus (F5, duas abas abertas, bloqueio de conflito na mesma chave e recuperação após recarga).
- Seção 3, item 5: **PENDENTE**. O teste anterior em seções diferentes (SA/PV) foi bloqueado indevidamente pela implementação antiga; precisa ser repetido com o HEAD atual.
- Não considerar patches mínimos validados humanamente até Gus repetir o cenário SA/PV em abas independentes.
- Fase 2 permanece em andamento. Fase 3/Inventário ativo permanece bloqueada.

## Pendências e riscos
1. Teste humano: Aba A altera SA e Aba B altera PV (ou vice-versa); ambas devem salvar sem conflito e preservar os dois valores após releitura.
2. Revalidar que alteração concorrente da mesma chave continua bloqueada.
3. Testar controles rápidos SA +1/-1 e BI +1/-1, PV com botão Aplicar, dano/PV Temporários e efeito de BI Desgarrado.
4. Simular falha de salvamento de SA, confirmar mensagem/valor pendente e retentativa. Não marcar como salvo antes da confirmação do IndexedDB.
5. Build mantém aviso de chunk grande; não bloqueia a execução atual.

## Limites e governança
- GitHub connector confirma apenas o estado remoto; não inspeciona a working tree local de Gus.
- Nenhuma alteração em `main`; nenhum merge, troca/criação de branch, publicação ou deploy.
- Nenhum trabalho em Inventário ativo, Painel do Mestre ou Laboratório foi iniciado.

## Próxima ação exata
1. Gus atualizar a cópia de teste para o HEAD `689376e9540d01ca9476bd235a22432a85aed361` na branch `feat/offline-first-ficha`.
2. Repetir Missão 06, seção 3, item 5: uma aba altera SA e a outra PV; salvar ambas e confirmar mesclagem independente.
3. Se aprovado, revalidar conflito na mesma chave e continuar os testes humanos de recursos acima, um passo por vez.
4. Registrar cada resultado informado por Gus; não avançar para Fase 3 antes de concluir os critérios e obter autorização.
