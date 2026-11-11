# Checkpoint — Implementação inicial de Finalizar e Finalização Dupla
**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD de código:** `35cc8e16aae8d2d2d26f900e3c1f1608199825e1` (antes dos commits de documentação deste checkpoint)

## Fonte canônica
Arquivo do Jogador v1.0, pp. 77–79:
- Finalizar: 3 SA como custo completo. A Manobra inclui Ataque contra Defesa e deslocamento até o valor de Movimento exclusivamente para alcançar o alvo; não consome Ação nem Movimento normais.
- Em acerto, Fortitude do alvo contra DT igual ao resultado do Ataque; em falha, Dano normal +3d6; alvo Vulnerável que possa sofrer Morte Instantânea é morto.
- Finalização Dupla: Reação +3 SA, após aliado Finalizar e alvo sobreviver, por personagem que ainda não agiu na rodada.
- Compromete Ação e Movimento do próximo turno; preserva Ação Bônus e Ação Livre.

## Implementação
- `src/manobrasOperacionais.ts`: `registrarFinalizar()` registra 3 SA e mantém Ação/Movimento normais disponíveis. Exige turno próprio ativo.
- `src/estadoTurnoCombate.ts`: novo campo estrito `proximoTurnoComprometido`, com migração dos formatos compostos históricos conhecidos.
- `registrarFinalizacaoDupla()` valida payload contextual com chaves exatas, exige as três confirmações verdadeiras, consome Reação normal +3 SA e marca o próximo turno.
- `iniciarTurnoCombate()` aplica o compromisso marcando Ação e Movimento usados, preserva Ação Bônus e Interação Gratuita e consome o marcador.
- `src/PainelAcoesLocal.tsx`: controles de registro para as duas Manobras. Finalização Dupla apresenta três confirmações manuais e informa a penalidade futura.
- Matriz de estado atualizada.

## Limites deliberados
- Nenhuma rolagem automática, verificação de Defesa, deslocamento, Fortitude, aplicação de Dano ou Morte Instantânea.
- A Mesa/jogador confirma manualmente que o aliado Finalizou, o alvo sobreviveu e a personagem ainda não agiu na rodada. A Ficha não controla Iniciativa.
- O painel exige Reação normal disponível. Não há fluxo de Encontro/Mestre coordenando os participantes.
- A janela de 3 SA foi relida na p. 77 e confirmada como já corretamente implementada em `economiaAcoes.ts`; nenhuma alteração foi mantida nessa parte.

## Testes e validação
- Testes adicionados em `tests/manobras-operacionais.test.mjs` e `tests/estado-turno-combate.test.mjs`.
- Cobertura adicionada: custo integral de Finalizar, Ação/Movimento não consumidos, contexto estrito da Finalização Dupla, custo de Reação +3 SA, persistência do compromisso após recarga e bloqueio de Ação/Movimento no próximo turno.
- Testes não executados localmente neste ambiente.
- CI observado para commits recentes: workflows Build e Verificação da ficha offline em estado `queued`; aprovação não confirmada.
- Sem merge, publicação ou alteração da `main`.

## Próximos passos
1. Aguardar CI do HEAD atual e corrigir eventuais falhas de compilação/testes.
2. Revisar a UI em execução e validar manualmente o ciclo de Finalização Dupla, inclusive recarga entre o registro e o próximo turno.
3. Avaliar, em etapa separada, se o fluxo de Encontro precisa oferecer confirmação compartilhada entre aliados. Não presumir essa integração antes do módulo de Encontros.
