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


## Incremento adicional — períodos sem benefício de Descanso Completo

A auditoria da reversão identificou outro risco: embora a Ficha não execute a reversão quando a BI chega a 0, o painel de Descanso permitia concluir um Descanso Completo durante os períodos de uma hora que o cânone expressamente exclui.

Correção localizada:
- Infectado Especial ativo a 0 PV: bloqueia Descanso Completo durante o período inerte de 1 hora.
- Cabeça Carmesim ativa com BI 0: exibe o gatilho de reversão e a hora Desacordada; bloqueia Descanso Completo enquanto a Condição permanecer ativa.
- A Condição da Cabeça Carmesim informa que só deve ser encerrada após a Mesa confirmar o fim da hora. Não há cronômetro, avanço automático ou registro de horário de início.
- Descanso Parcial não foi bloqueado por esta correção: a regra citada exclui expressamente os benefícios de Descanso Completo, mas não define aqui uma proibição adicional de Descanso Parcial. Não ampliar a restrição por inferência.

Testes estruturais adicionais foram incluídos em `tests/reanimacao-integracao-ficha.test.mjs` e `tests/condicoes-ficha.test.mjs`; não foram executados nesta sessão. A ausência de cronômetro significa que o encerramento prematuro da Condição ainda depende de decisão do usuário/Mesa; a interface apenas orienta e bloqueia o Descanso Completo enquanto a Condição continua ativa.


## Retificação de princípio funcional — a Ficha registra, a Mesa decide

Após revisão do requisito do produto, a correção inicial que bloqueava os controles de Reanimação durante Transformações foi considerada excessivamente restritiva e substituída.

**Comportamento atual no código:**
- Transformação ativa + PV 0 não inicia automaticamente uma Reanimação comum, pois existe um desfecho especial a ser considerado.
- A interface mostra o texto canônico como referência, sem declarar morte ou executar transformação.
- A Mesa pode escolher expressamente registrar Reanimação por 0 PV; a ação pede confirmação e grava o fluxo escolhido.
- Se PV 0 e BI Máxima ocorrerem simultaneamente durante Transformação, a Ficha não escolhe entre os fluxos: oferece registro manual de Reanimação por 0 PV ou por Colapso, conforme decisão da Mesa.
- Registros de Reanimação já existentes continuam acessíveis; Transformação não bloqueia seus controles nem apaga o histórico.
- Fora dessa situação conflitante, os fluxos mecânicos de Reanimação/Colapso seguem as regras já implementadas. Resultados que sinalizam morte ou transformação permanecem como estados a registrar, sem executar consequências narrativas.

**Limite de registro identificado:** ainda não há um registro estruturado próprio para a decisão da Mesa sobre morte da Cabeça Carmesim ou transformação após a hora inerte do Infectado Especial. As Condições podem ser encerradas/registradas e contêm observações na criação, mas isso não equivale a um histórico de desfechos com ator, horário e justificativa. Não criar esse modelo sem auditar primeiro os contratos de persistência, backup e recuperação.

**Princípio de produto confirmado:** a Ficha calcula, apresenta referências mecânicas e registra resultados/decisões; Jogador realiza os testes e Mestre decide os desfechos que lhe cabem. A interface não mata nem transforma personagens automaticamente.

O bloqueio de Descanso Completo durante períodos explicitamente sem seus benefícios permanece como proteção mecânica enquanto a Condição estiver ativa; o encerramento da Condição continua manual e sob responsabilidade da Mesa. Não existe cronômetro.


### Inspeção de persistência para o futuro Registro de Decisões da Mesa

- `PersonagemLocal.dados` é um objeto extensível; `validarPersonagemLocal` verifica segurança JSON e campos conhecidos, sem allowlist fechada de todas as chaves.
- `salvarPatchPersonagem` mescla patches por chave em transação IndexedDB e recusa sobrescrita concorrente na mesma chave.
- Exportação/importação de backup clona e valida os dados completos da personagem; campos JSON seguros desconhecidos são preservados.
- Portanto, um futuro campo estruturado (por exemplo, `registrosMesa`) aparentemente não exige aumento da versão do IndexedDB, mas ainda exige contrato próprio de validação, limites de tamanho, testes de concorrência, recarga e ida/volta do backup. Não foi implementado nesta etapa.
