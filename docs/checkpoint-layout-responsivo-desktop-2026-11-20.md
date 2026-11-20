# Checkpoint — Missão 07: altura desktop e remoção da moldura — 20/11/2026

## Identificação e estado Git
- Frente: Ficha Offline PWA.
- Fase: 1 — Ficha Offline; a bateria humana integrada da Fase 2 continua em andamento.
- Branch: `feat/offline-first-ficha`.
- HEAD anterior verificado: `22e1525a79082bf91608c47429e249ac9cdc4f87`.
- HEAD após a alteração CSS: `235e7a0738285ba25efd3b1f790e0ba887f8dd7d`.
- Repositório remoto consultado. O ambiente não permite inspecionar a árvore de trabalho local de Gus; portanto, o estado local não foi confirmado.
- Nenhuma troca de branch, alteração de `main`, merge, publicação ou deploy.

## Objetivo e aprovação
Gus aprovou a correção de responsividade desktop com largura estreita preservada e altura útil integral, além da remoção do notch e da bezel em todas as versões (desktop e mobile).

## Diagnóstico
- O CSS mantinha a Ficha em largura máxima de 425 px no desktop, decisão preservada.
- A regra desktop limitava a altura a `min(840px, calc(100dvh - 46px))`, impunha altura mínima de 600 px e aplicava borda grossa, raio e sombras externas.
- A regra base aplicava borda, cantos arredondados e sombra à superfície.
- O notch era desenhado por `.ficha-local:before`.
- O conteúdo rolável está em `.ficha-local-corpo`; a rolagem interna foi preservada.

## Arquivos alterados
- `src/styles.css`: adicionadas regras finais de correção para remover padding externo, borda, raio e sombra; ocultar o pseudo-elemento do notch; ocupar `100dvh`; manter no desktop a largura máxima de 425 px e retirar a altura mínima que poderia exceder janelas baixas. O recuo superior desktop foi ajustado de 21 px para 18 px após remover o notch.
- Nenhuma alteração em `src/FichaLocal.tsx`.

## Resultado e classificação
- Ajuste CSS: IMPLEMENTADO.
- Inspeção estática da regra e do seletor: REALIZADA.
- Testes automatizados: PENDENTES nesta missão; não foi possível executar build/testes no ambiente remoto usado para a edição.
- Build: NÃO EXECUTADO.
- Validação humana: **VALIDADO HUMANAMENTE — 4/4 verificações aprovadas por Gus em 20/11/2026**:
  - Desktop maximizado: altura preenchida e largura estreita — APROVADO.
  - Desktop com janela baixa: conteúdo acessível — APROVADO.
  - Mobile retrato: sem notch ou bezel — APROVADO.
  - Mobile paisagem: sem cortes ou problemas de rolagem — APROVADO.
- A validação humana da Missão 07 está concluída. Isso não substitui build/testes automatizados, nem homologa as Fases 0/1 ou a Ficha como um todo.

## Riscos e verificações
- As quatro verificações visuais e responsivas solicitadas foram aprovadas.
- A largura desktop continua limitada a 425 px; a Ficha não se expande para ocupar toda a tela.
- O fundo escuro externo deixa de formar uma moldura visível porque o contêiner ocupa toda a viewport.
- Build e testes automatizados ainda não foram executados especificamente após esta alteração CSS.

## Próxima ação exata
Retomar a bateria humana integrada da Ficha Offline no passo **Identidade — salvar**. Em ciclo separado, executar build/testes pertinentes quando o ambiente local estiver disponível e registrar a evidência. Não iniciar a Fase 3/Inventário ativo; a validação humana da Ficha ainda está em andamento.
