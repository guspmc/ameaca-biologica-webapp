# Checkpoint — lembretes de restrições de Ataque por Condições

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** integração de lembretes de Condições com a Calculadora de Ataques.

## Objetivo
Exibir proibições de ação já definidas no catálogo de Condições, sem transformar a calculadora em fiscal da narrativa nem bloquear rolagens.

## Alterações
- `src/condicoesCalculadora.ts`: nova função `restricoesDeAtaquePorCondicoes()`.
- Condições cobertas:
  - Desorientado: não pode usar Atacar.
  - Atordoado: não pode realizar Ações, Reações ou Movimento.
  - Incapacitado: não pode realizar Ações nem Reações.
  - Surpreendido: no primeiro turno, não pode se mover nem realizar Ações.
- `src/CalculadoraTesteLocal.tsx`: exibe o bloco “Condições que restringem Ataques” quando aplicável.
- `tests/condicoes-calculadora.test.mjs`: teste de mapeamento e presença do aviso.
- Matriz de estado e pendências atualizada.

## Limites preservados
- Nenhuma rolagem é bloqueada/desabilitada.
- A calculadora não determina se a condição ainda está em vigor, não conta turnos, não avalia exceções nem altera a ficha.
- A condição Atordoado também impede Reações e Movimento, mas o aviso é apresentado no escopo de Ataques, não substitui a futura integração com economia de ações/turnos.

## Validação
- **IMPLEMENTADO:** helper, aviso e teste gravados na branch.
- **TESTES ADICIONADOS:** sim.
- **TESTES EXECUTADOS:** não localmente neste ambiente.
- **CI:** aguardando execução para o novo HEAD.
- **VALIDAÇÃO HUMANA:** pendente.
- **MERGE/PUBLICAÇÃO:** não realizados.

## Próxima frente
Continuar auditoria paralela de catálogo de armas, Peças e Habilidades, priorizando inconsistências demonstráveis pelo Arquivo do Jogador v1.0.
