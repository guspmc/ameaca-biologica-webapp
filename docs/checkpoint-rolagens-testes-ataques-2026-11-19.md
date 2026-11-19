# Checkpoint — Rolagens de Testes, Rolador Livre e Ataques — 19/11/2026

## Identificação
- Projeto: Ameaça Biológica RPG — Ficha Offline PWA.
- Branch: `feat/offline-first-ficha`.
- HEAD do código/testes no registro: `fbbd6a2d6c91309beedea0e43cd3edbac4c108a6`.
- Fase: 1 — Ficha Offline. Validação humana da Fase 2 permanece pendente.

## Cânone e escopo
- Arquivo do Jogador v1.0, Capítulo 2 — Perícias, p. 41: Teste de Perícia = 1d20 + Perícia + modificadores circunstanciais; Teste puro de Atributo = 1d20 + Atributo + modificadores. O valor da Perícia já inclui o Atributo associado. A seção define faixas de DT e Impossível como ação que não pode funcionar nas circunstâncias atuais.
- Arquivo do Mestre v1.0, Apêndice — Referência rápida, p. 69: reforça as fórmulas de Perícia/Atributo e as regras gerais de 20 e 1 naturais.
- Decisão de interface solicitada por Gus: a Ficha calcula os números da rolagem, mas não avalia DT nem declara sucesso/falha comum; o Mestre julga o resultado. O seletor genérico “Impossível — sem Teste” também não pertence à interface da Ficha.
- Ataques corpo a corpo usam Luta; ataques à distância usam Pontaria. A Ficha deve mostrar a rolagem e o total, mas não comparar com a Defesa nem decidir acerto/erro.

## Auditoria — achados
1. **Rolador Livre:** permitia quantidade/tipo de dado e dados físicos/virtuais, mas não aceitava bônus/modificador de Atributo, Perícia ou outra fonte.
2. **Calculadora de Testes:** exibia campo genérico de DT, comparava total e declarava sucesso/falha comuns, além de apresentar “Impossível — sem Teste”. Esse comportamento conflita com a decisão de interface do usuário.
3. **Rolador de Ataque:** já existia com Luta/Pontaria, dados físicos/virtuais, Vantagem/Desvantagem e sem comparação à Defesa. Porém ficava recolhido sob o rótulo pouco explícito “Conferir Ataque”, o que explica a percepção de que estava ausente.
4. **Cobertura:** testes existentes cobriam várias regras de ataque e cálculo de dano, mas não protegiam a ausência de DT genérica na UI nem a visibilidade inicial do Rolador de Ataque.

## Implementações
- `src/rolagemDados.ts`:
  - Adicionada `somarModificadorRolagem`, que valida resultados e modificador inteiro e soma bônus positivos/negativos sem alterar os dados.
- `src/RoladoresBasicosLocal.tsx`:
  - Adicionado campo “Bônus / modificador (+ ou −) · Atributo, Perícia etc.” ao Rolador Livre.
  - O resultado exibe a expressão com o modificador e o total final; campo vazio equivale a zero.
- `src/testes.ts`:
  - Adicionada `calcularRolagemTesteManual`, que calcula total e aplica Vantagem/Desvantagem e CODE VERONICA, mas não compara DT nem declara sucesso/falha comum.
  - Preservados 20 natural (sucesso automático quando a tarefa é possível) e 1 natural (Falha Crítica), conforme regra geral.
  - Mantido `calcularTesteManual` como utilitário legado/testado; a UI da Ficha não o utiliza mais.
- `src/CalculadoraTesteLocal.tsx`:
  - Calculadora de Perícia/Atributo usa o cálculo sem DT e mostra total para avaliação do Mestre.
  - Removidos da UI o campo genérico de DT e o controle “Impossível — sem Teste”.
  - Mantidos os lembretes de DT que pertencem a Habilidades/procedimentos específicos do cânone (por exemplo Medicina DT 15); não são a DT genérica da rolagem.
  - Rolador de Ataque agora se identifica como “Rolador de Ataque · Corpo a Corpo / à Distância” e abre por padrão na seção de Combate.
  - Mantidos Luta/Pontaria, dados físicos/virtuais, Vantagem/Desvantagem, efeitos de Crítico, bloqueios por Condições e a regra de não comparar o total com Defesa.
  - A calculadora de Dano continua separada no mesmo painel e não altera PV.

## Testes atualizados
- `tests/roladores-ficha.test.mjs`: modificadores positivos, negativos, zero e validação; presença do campo na UI.
- `tests/testes.test.mjs`: rolagem sem DT, Vantagem/Desvantagem, CODE VERONICA, 20/1 naturais e validação de faces.
- `tests/ataques-calculadora.test.mjs`: Rolador de Ataque aberto/identificado, ausência de comparação com Defesa, remoção da DT genérica e do controle Impossível; atualizados asserts de Rajada/GM 79.
- `tests/pendencias-edicao.test.mjs`: atualizado para a nova função de rolagem usada pela UI.
- `tests/validacao-personagem-local.test.mjs`: corrigido cenário de compatibilidade legado de Reanimação, testando o estado aguardando turno antes de registrar qualquer tentativa.

## Testes e build
- Build TypeScript/Vite no HEAD `fbbd6a2d6c91309beedea0e43cd3edbac4c108a6`: run `44452755198` — **SUCCESS**.
- Testes offline no mesmo HEAD: run `44452755076` — **IN_PROGRESS** no momento deste checkpoint.
- Runs anteriores com falhas foram diagnósticos de asserts desatualizados após mudanças intencionais:
  - `44452577489`: falhou somente no cenário de validação de Reanimação legado, corrigido no commit `fbbd6a2`.
  - `44452565808`: falhas no teste de integração da calculadora ainda esperando o nome antigo `calcularTesteManual` e no cenário legado, ambos corrigidos em commits subsequentes.
  - `44452276278`: asserts de interface do Rolador de Ataque e GM 79 desatualizados, corrigidos em `616f081`.
- Não declarar testes automatizados aprovados até conclusão do run `44452755076` ou novo run equivalente no HEAD posterior.
- Validação humana: **PENDENTE**.

## Riscos e limites
- O Mestre continua responsável por escolher DT e avaliar o resultado dos Testes comuns.
- A Ficha não cria rolagens sem ação explícita do usuário e não grava resultados em dados persistentes da personagem.
- O Rolador Livre aceita modificador numérico manual; não tenta inferir automaticamente o contexto ou a Perícia usada.
- A seleção de perfil de arma continua sendo consulta de catálogo, não confirma posse/equipamento. Integração com Inventário permanece fora desta tarefa e depende da Fase 3.
- Nenhuma regra canônica de rolagem foi alterada.

## Próxima ação exata
1. Aguardar conclusão do run de testes offline `44452755076`; corrigir somente falhas demonstradas.
2. Após CI verde, solicitar teste humano do Rolador Livre (bônus positivo/negativo), Teste de Perícia/Atributo (físico, virtual, Vantagem/Desvantagem, CODE VERONICA), Rolador de Ataque corpo a corpo/à distância e confirmação de que a Ficha não compara com Defesa.
3. Continuar com a auditoria D — estrutura da interface de Combate — sem iniciar integração ativa com Inventário.

## Estado
- Rolador Livre com modificador: **IMPLEMENTADO / BUILD APROVADO / TESTES AUTOMATIZADOS PENDENTES / VALIDAÇÃO HUMANA PENDENTE**.
- Rolagem de Perícia/Atributo sem DT genérica: **IMPLEMENTADA / BUILD APROVADO / TESTES AUTOMATIZADOS PENDENTES / VALIDAÇÃO HUMANA PENDENTE**.
- Rolador de Ataque visível e aberto por padrão: **IMPLEMENTADO / BUILD APROVADO / TESTES AUTOMATIZADOS PENDENTES / VALIDAÇÃO HUMANA PENDENTE**.
- Compatibilidade do fluxo de Reanimação da tarefa B: **TESTE DE VALIDAÇÃO AJUSTADO / CI PENDENTE**.
