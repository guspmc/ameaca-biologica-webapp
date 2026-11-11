# Checkpoint — CURIOSA e auditoria de Tentativa e Erro

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Fonte canônica:** Arquivo do Jogador v1.0, p. 33.

## CURIOSA
- A regra concede Vantagem em Percepção e Investigação quando há tempo para observar/investigar sem Pressão Imediata.
- Não se aplica em combate, perseguições, fugas ou quando o Narrador determina que não há tempo para análise cuidadosa.
- Uma vez por Descanso Completo, permite Teste de AST DT 12 para pedir indicação simples de direção ou pista curta dedutível.
- `src/CalculadoraTesteLocal.tsx` agora apresenta lembrete quando a Habilidade está ativa. Em Percepção/Investigação, exibe aviso para confirmar a circunstância.
- **Não concede Vantagem automaticamente:** a pessoa escolhe Vantagem manualmente após confirmar o contexto com a Mesa.
- Teste estático acrescentado em `tests/ataques-calculadora.test.mjs`.

## Tentativa e Erro — auditoria
- `FichaLocal.tsx` deriva a ativação da Habilidade a partir de `habilidadesProgressaoIds`.
- A flag `temTentativaEErro` é passada à calculadora.
- `pericias.ts` aplica +1 somente quando a Perícia não está Treinada; a Perícia adicional escolhida para Treinar é tratada como Treinamento, não recebe o +1.
- `tests/pericias.test.mjs` já cobre os casos de Perícia não Treinada, Treinada e Perícia adicional. Nenhuma alteração foi necessária nesta frente.

## Validação
- **IMPLEMENTADO:** lembretes de CURIOSA na branch.
- **AUDITORIA:** integração de Tentativa e Erro confirmada no código e nos testes existentes.
- **TESTES EXECUTADOS:** não localmente neste ambiente.
- **CI:** aguardando conclusão do novo HEAD.
- **VALIDAÇÃO HUMANA:** pendente.
- **MERGE/PUBLICAÇÃO:** não realizados.
