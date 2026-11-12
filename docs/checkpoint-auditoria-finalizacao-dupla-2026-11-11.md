# Checkpoint — Auditoria de Finalizar e Finalização Dupla
**Data:** 11/11/2026  
**Branch:** feat/offline-first-ficha  
**HEAD de código auditado:** b233b3fc68adf997b57349b5aa8e091a4b4eab7d

## Objetivo
Confrontar as regras de Finalizar e Finalização Dupla do Arquivo do Jogador v1.0 com o estado real do domínio de combate, economia de ações e transições de turno.

## Fonte canônica
Arquivo do Jogador v1.0, pp. 77–79:
- Finalizar: 3 SA, custo completo; Manobra que inclui o Ataque e o deslocamento necessário para alcançar o alvo; não consome Ação nem Movimento normais.
- Finalização Dupla: Reação +3 SA, após aliado Finalizar e alvo sobreviver; personagem ainda não agiu na rodada; compromete Ação e Movimento do próximo turno e preserva Ação Bônus e Ação Livre.
- SA e Esforço: teto de 3 SA por janela, contando Esforço e Manobras; renovação ao fim do próximo turno próprio. Custos de Habilidades ficam fora do limite salvo texto expresso.

## Inspeção realizada
- src/economiaAcoes.ts: gasto genérico de Manobra suporta 3 SA e valida o teto de 3 SA. Não implementa Finalizar.
- src/manobrasOperacionais.ts: não há registro de Finalizar nem Finalização Dupla.
- src/estadoTurnoCombate.ts: o estado não persiste comprometimento de Ação e Movimento para o próximo turno; iniciarTurnoCombate() renova os recursos normalmente.
- src/reacoesCombate.ts: não há operação integrada de Finalização Dupla. Contra-Ataque Instintivo e VOCÊ APAROU UM MÍSSIL!? são regras distintas.
- src/CalculadoraTesteLocal.tsx: não há fluxo de Finalizar/Finalização Dupla nem resolução da Fortitude do alvo.
- Testes existentes de economia, turno e Reações não cobrem essas Manobras.

## Conclusão
**PENDENTE / NÃO IMPLEMENTADO.** A infraestrutura genérica permite gastar 3 SA, mas não controla a Manobra completa. Finalização Dupla exige novo marcador persistente no estado de turno, aplicado quando o próximo turno começar; marcar Ação/Movimento do turno atual seria incorreto e perderia efeito ao renovar recursos.

Não houve correção de código neste ciclo porque o recurso não existe ainda e requer evolução explícita do estado composto, migração compatível, testes de transição de turno e integração posterior. Não é necessário pedir decisão canônica: os custos e compromissos estão explícitos no livro. Condições de sobrevivência do alvo e elegibilidade por ordem de turno devem ser fornecidas pelo fluxo/Mesa, não inferidas.

## Validação e segurança
- Auditoria estática apenas; testes não executados localmente.
- Sem validação humana, merge, publicação ou alteração da main.
- CI consultado para HEAD b233b3f: build e verificação offline permaneciam queued no momento da consulta.

## Próximo passo técnico
Projetar a evolução do estado de turno para registrar compromissos futuros de recursos, com migração estrita e testes que demonstrem:
1. Finalizar consome 3 SA e não consome Ação/Movimento normais.
2. O ataque e deslocamento são componentes da Manobra, sem custo adicional de ação.
3. Finalização Dupla exige Reação +3 SA e autorização contextual explícita.
4. Ação e Movimento do próximo turno ficam indisponíveis, mas Ação Bônus e Interação Gratuita permanecem.
5. O teto de 3 SA é aplicado considerando o restante da janela, inclusive gastos anteriores fora do turno.
6. O compromisso não é perdido ao encerrar/iniciar turnos nem duplicado por recarga do estado.

> **Atualização de continuidade — 12/11/2026:** a conclusão “PENDENTE / NÃO IMPLEMENTADO” e os próximos passos deste documento são históricos e foram superados por `docs/checkpoint-implementacao-finalizacao-2026-11-11.md`. Na branch atual foram localizados `registrarFinalizar()`, `registrarFinalizacaoDupla()`, o marcador persistente `proximoTurnoComprometido`, a aplicação no próximo turno, os controles em `PainelAcoesLocal.tsx` e testes em `tests/manobras-operacionais.test.mjs` e `tests/estado-turno-combate.test.mjs`. A implementação está **presente no código**; execução de testes e validação humana não foram realizadas nesta auditoria. Consulte o checkpoint de implementação para os detalhes e limites.
