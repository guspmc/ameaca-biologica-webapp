# Checkpoint — procedimentos de armas especiais

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** RPG-7 e Spark Shot; sem integração com Inventário ou motor de combate.

## Objetivo
Tornar visíveis na calculadora as regras especiais do RPG-7 e os efeitos da Spark Shot, sem automatizar decisões ou consequências que dependem da mesa.

## Alterações
- Criado `src/procedimentosArmasEspeciais.ts` com consultas textuais para RPG-7 e Spark Shot.
- `src/CalculadoraTesteLocal.tsx` passou a exibir:
  - RPG-7: Morte Instantânea e exceções para Perseguidores, Chefes e criaturas com regra própria; lembrete de arma vazia após disparo e recarga por Movimento.
  - Spark Shot: Fortitude DT 15 para alvo atingido e criaturas a até 1,5 m; falha causa Atordoado até o fim do próximo turno e Imobilizado por 1d4 rodadas.
- Acrescentado teste estático em `tests/ataques-calculadora.test.mjs`.
- Atualizada a matriz de implementação e pendências.

## Limites
- Não determina se o alvo pode sofrer Morte Instantânea nem resolve exceções de ficha.
- Não rola Fortitude, não aplica Condições, não consome munição/Cargas e não altera PV.
- Besta/Engate Triplo permanece sem alteração: p. 60 descreve o procedimento na arma, enquanto p. 64 lista Engate Triplo como Peça Específica. A ambiguidade foi registrada para decisão, sem presumir uma interpretação.
- Redemption permanece apenas com os dados de catálogo já existentes: tiro único, munição de Rifle, 1 mão e recarga por Ação Bônus; Coice é narrativo.

## Validação
- **IMPLEMENTADO:** arquivos e documentação gravados na branch.
- **TESTES ADICIONADOS:** teste estático para os lembretes.
- **TESTES EXECUTADOS:** não executados localmente neste ambiente.
- **CI:** aguarda resultado do novo HEAD.
- **VALIDAÇÃO HUMANA:** pendente.
- **MERGE/PUBLICAÇÃO:** não realizados.

## Próximo passo
Verificar CI do HEAD e continuar a auditoria das armas especiais e de suas interações com Peças/Habilidades, sem iniciar Inventário ativo.
