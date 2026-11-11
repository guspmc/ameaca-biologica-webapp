# Checkpoint — integração de CODE VERONICA nos Testes de Perícia

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Fonte canônica:** Arquivo do Jogador v1.0, p. 34.

## Objetivo
Aplicar na Calculadora Automática os efeitos explícitos de CODE VERONICA sobre Testes de Perícia, sem ampliar o efeito para Testes de Atributo ou Ataques.

## Alterações
- `FichaLocal.tsx` passa `habilidadesAtivasIds` para a Calculadora de Testes.
- `CalculadoraTesteLocal.tsx` reconhece CODE VERONICA somente no escopo de Testes e tipo Perícia.
- Vantagem é automática em Testes de Perícia.
- `testes.ts` aceita o sinalizador `naturalDe2a9Como10`: resultados naturais escolhidos entre 2 e 9 contam como 10 no total; 1 natural continua Falha Crítica e 20 natural continua sucesso automático.
- Vantagem e Desvantagem de fontes diferentes cancelam-se sem empilhar dados; o ajuste natural 2–9 para 10 permanece ativo.
- Aviso explícito na interface descreve o efeito e os limites.
- Testes acrescentados em `tests/testes.test.mjs` e `tests/ataques-calculadora.test.mjs`; a asserção antiga de combinação de Desvantagem foi ajustada em `tests/condicoes-calculadora.test.mjs`.

## Limites
- Integração disponível apenas no modo Automático, que é o único que exibe a calculadora.
- Não aplica CODE VERONICA a Testes de Atributo ou Ataques.
- Conhecimento de senhas/códigos, duplicação de Ervas e uso de Submetralhadoras sem coronha com Ambidestria não foram automatizados.
- A calculadora continua sem salvar efeitos narrativos ou alterar recursos.

## Validação
- **IMPLEMENTADO:** regra de Testes de Perícia e propagação da Habilidade gravadas na branch.
- **TESTES ADICIONADOS:** unitários e estáticos.
- **TESTES EXECUTADOS:** não localmente neste ambiente.
- **CI:** aguardando resultado do novo HEAD.
- **VALIDAÇÃO HUMANA:** pendente.
- **MERGE/PUBLICAÇÃO:** não realizados.

## Próximo passo
Continuar a auditoria de Habilidades com efeitos de combate e de Peças, separando efeitos que podem ser aplicados sem estado de Inventário daqueles que dependem de equipamento, alvos, turnos ou contexto narrativo.
