# Checkpoint — lembretes adicionais de Habilidades de Operador

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`

## Alterações
Em `src/CalculadoraTesteLocal.tsx`, a Calculadora de Ataques agora apresenta lembretes contextuais quando as seguintes Habilidades estão ativas:

- **Casca-Grossa:** Dano Desarmado ou de Coronhada sobe uma categoria de Dado; uma vez por turno, após Ataque bem-sucedido, permite Cabeçada ou Pisão com Desvantagem.
- **Armamento Especial:** Proficiência com Magnums e Armas Especiais; redução em uma categoria dos custos de Recarga, Bombear/Manejar e Coice, nunca abaixo de Interação Gratuita com Objeto.
- **Controle de Fogo:** ao usar Rajada, pode substituir Cone por até 6 espaços conectados dentro do alcance, cada um com linha de efeito.

Teste estático adicionado em `tests/ataques-calculadora.test.mjs`.

## Limites preservados
- Casca-Grossa não altera automaticamente fórmulas de Dano, não confirma Coronhada elegível e não controla usos por turno.
- Armamento Especial não altera custos de ação automaticamente.
- Controle de Fogo não desenha nem valida geometria, conectividade, alcance ou linha de efeito.
- Nenhum lembrete resolve decisões narrativas ou substitui a Mesa.

## Validação
- **IMPLEMENTADO:** lembretes na branch.
- **TESTES ADICIONADOS:** teste estático.
- **TESTES EXECUTADOS:** não localmente neste ambiente.
- **CI:** aguardando novo HEAD.
- **VALIDAÇÃO HUMANA:** pendente.
- **MERGE/PUBLICAÇÃO:** não realizados.
