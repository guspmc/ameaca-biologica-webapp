# Checkpoint — interação entre Transformações e Reanimação

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** auditoria normativa e funcional da Ficha Offline; sem publicação ou merge.

## Achado confirmado

O fluxo de `ReanimacaoFichaLocal` iniciava a Reanimação comum sempre que PV chegava a 0 (exceto quando a BI já estava no máximo), sem consultar as Transformações registradas em Condições. Isso permitia aplicar um desfecho incompatível com o Arquivo do Jogador v1.0, p. 91:

- Infectado Especial a 0 PV: permanece inerte por 1 hora antes de se transformar em Cabeça Carmesim, salvo impedimento específico.
- Cabeça Carmesim a 0 PV antes da reversão: a personagem morre.
- Cabeça Carmesim com BI reduzida a 0: reverte à forma anterior e fica Desacordada por 1 hora; esse período não concede benefícios de Descanso Completo.

O Colapso Viral tem fluxo próprio de Reanimação, descrito na p. 90. A regra consultada não define expressamente a prioridade quando uma Transformação ativa chega simultaneamente a 0 PV e a BI Máxima.

## Correção localizada

- `FichaLocal.tsx` identifica as Transformações ativas registradas e as informa ao painel de Reanimação.
- `ReanimacaoFichaLocal.tsx` não inicia Reanimação por 0 PV nem Reanimação por Colapso enquanto houver Transformação ativa e PV igual a 0.
- A interface exibe o lembrete canônico específico de Infectado Especial ou Cabeça Carmesim.
- Se já existir uma Reanimação não concluída incompatível com a Transformação a 0 PV, seus controles ficam bloqueados e o registro é preservado para revisão com a Mesa. Nenhum registro é apagado ou reescrito automaticamente.
- Se duas Transformações estiverem ativas ao mesmo tempo, a interface sinaliza o conflito e não escolhe um desfecho.
- Quando 0 PV e BI Máxima coincidirem, a interface informa que a prioridade não é automatizada e deixa a resolução para a Mesa.

## Limites mantidos / pendências

Esta correção é apenas uma proteção contra o fluxo errado de Reanimação. Não implementa:
- cronômetro ou persistência do período inerte de 1 hora do Infectado Especial;
- transição automática para Cabeça Carmesim;
- recuperação automática de Dados de Vida na transformação;
- restrições de Habilidades, armas e comportamento;
- +2 BI nos Ataques Corpo a Corpo da Cabeça Carmesim;
- reversão automática quando BI chega a 0;
- período de 1 hora Desacordada após a reversão;
- registro automático da morte da Cabeça Carmesim.

Esses efeitos continuam informativos/manuais, conforme a etapa anterior da auditoria. A regra não foi alterada.

## Testes e evidência

- Adicionado teste estrutural em `tests/reanimacao-integracao-ficha.test.mjs` para a passagem da Transformação, bloqueio do fluxo conflitante e mensagens específicas.
- **Teste não executado nesta sessão.** A existência do teste não é evidência de aprovação.
- Não houve teste humano de navegador nesta etapa.
- Nenhuma alteração visual deliberada, de LAN, Inventário, banco ou publicação.

## Próxima etapa

Auditar a reversão da Cabeça Carmesim quando BI chega a 0 e o período subsequente de 1 hora Desacordada, incluindo a possibilidade de a interface permitir Descanso Completo ou encerrar a Condição antes do fim do período. Não implementar cronômetro ou novo estado persistente sem delimitar primeiro o modelo e suas implicações para Descanso, Condições e recuperação após recarga.
