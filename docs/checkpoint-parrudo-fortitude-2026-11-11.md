# Checkpoint — integração de PARRUDO em Testes de Fortitude

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Fonte canônica:** Arquivo do Jogador v1.0, p. 38.

## Objetivo
Aplicar a Vantagem de PARRUDO em Testes de Fortitude na Calculadora Automática.

## Auditoria anterior
- A regra canônica concede +5 PV Máximos, +3 BI Máxima e Vantagem em Testes de Fortitude.
- `src/derivadosCriacao.ts` já aplica os bônus numéricos +5 PV e +3 BI quando Parrudo é a Habilidade Básica escolhida na criação, por meio de `pvParrudo` e `biParrudo`.
- A lacuna restante era a Vantagem em Fortitude.

## Alterações
- `src/CalculadoraTesteLocal.tsx`: reconhece `parrudo` entre as Habilidades ativas, exclusivamente em Testes de Perícia quando a Perícia selecionada é Fortitude.
- A Vantagem entra na combinação comum com outras fontes; se existir Desvantagem, ambas se cancelam. Não há empilhamento de dados.
- Aviso contextual “PARRUDO: Vantagem automática em Testes de Fortitude”.
- `tests/ataques-calculadora.test.mjs`: teste estático de escopo e apresentação.

## Limites
- Não altera Testes de outros tipos ou Perícias.
- Não duplica bônus de PV/BI nem altera valores atuais.
- Não automatiza duração de efeitos, rolagens ou consequências narrativas.

## Validação
- **IMPLEMENTADO:** regra e aviso gravados na branch.
- **TESTES ADICIONADOS:** teste estático.
- **TESTES EXECUTADOS:** não localmente neste ambiente.
- **CI:** aguardando resultado do novo HEAD.
- **VALIDAÇÃO HUMANA:** pendente.
- **MERGE/PUBLICAÇÃO:** não realizados.

## Próxima frente
Auditar outras Habilidades passivas e contextuais, especialmente efeitos que podem ser apresentados como lembretes sem assumir estado de equipamento, alvo ou turno.
