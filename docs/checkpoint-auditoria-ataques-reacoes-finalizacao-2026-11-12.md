# Checkpoint — auditoria de Ataques, Reações e Finalização

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Fontes:** Arquivo do Jogador v1.0, pp. 76–81 e Habilidades do Agente, p. 29.

## 1. Regras gerais conferidas

**Conferidas estaticamente, sem divergência identificada nos cálculos/contratos revisados:**
- Janela defensiva ocorre depois de conhecido o resultado do Ataque e antes de Dano, BI ou Condições.
- 20 natural fecha Reações defensivas normais; margem crítica 19–20 de arma não fecha por si só.
- Aparar exige Ataque Corpo a Corpo bem-sucedido e aparável; Teste de Luta contra DT igual ao resultado do Ataque. O registro de Aparar permanece bloqueado na interface enquanto não houver arma empunhada e Durabilidade verificáveis.
- Esquivar exige gatilho autorizado por Habilidade/regra e Teste de Reflexos contra DT igual ao resultado do Ataque. A janela pode ser usada mesmo se o Ataque errou, conforme a regra geral de Reações.
- Contra-Ataque exige Aparar/Esquivar bem-sucedido, custa 1 SA + Reação; se a Reação normal já foi usada, pode comprar outra por Esforço, respeitando a janela de 3 SA. Contra-Ataque padrão responde a Ataque Corpo a Corpo, salvo exceção.
- Ataque de Oportunidade universal exige saída voluntária de quadrado ameaçado sem proteção; usa Reação e não interrompe o Movimento do alvo por padrão.
- Finalizar custa 3 SA, não consome Ação nem Movimento normais; ataque, deslocamento até o alvo e Fortitude são resolvidos manualmente.
- Finalização Dupla mantém confirmação dos três requisitos e compromete Ação + Movimento do próximo turno, preservando Ação Bônus e Ação Livre.
- Ajudar, Desengajar, Usar Objeto e economia de ações respeitam os custos/requisitos descritos nas páginas consultadas.

## 2. Habilidades com lembretes contextuais adicionados

Em `src/PainelAcoesLocal.tsx`:
- **Brecha Tática:** lembrete dos gatilhos ampliados (Sacar arma, Usar Objeto, interagir ou atacar outro alvo), Vantagem em Ataques de Oportunidade e interrupção da ação provocadora se o Ataque causar Dano.
- **Finalização à Distância:** lembrete do uso de arma de fogo, limite de alcance da arma e Alcance Médio, custo normal de SA, Fortitude/Dano e Atordoamento quando não houver Morte Instantânea.
- **Luta Livre:** lembrete de alvo Atordoado, deslocamento em linha reta até 12 m, +1d8 por Nível de Agente (máximo 10d8) quando o alvo não estiver Vulnerável e exceção de custo quando a Manobra derrotar o alvo.

Os lembretes não verificam posições, gatilhos, Condições, geometria, resultados do alvo nem executam Ataques ou Manobras. Confirmações continuam com Jogador/Mesa.

## 3. Exceção de Luta Livre — pendência explicitada

Foi identificado um limite real do controle atual: o botão genérico **“Registrar Finalizar · 3 SA”** chama `registrarFinalizar()` e sempre registra 3 SA. Ele não diferencia o caso em que Luta Livre derrota o alvo e, portanto, não cobra SA.

**Mitigação nesta etapa:** o lembrete de Luta Livre agora adverte expressamente que o botão genérico sempre registra 3 SA e não deve ser usado quando a Finalização de Luta Livre derrotar o alvo. Se o alvo sobreviver, o registro normal de 3 SA continua aplicável.

**PENDENTE:** desenhar fluxo específico de Finalizar com resultado informado após resolução manual, que registre 3 SA apenas quando devido e não antecipe nem decida a derrota. Não alterar agora a economia ou o contrato de turno sem um fluxo seguro para o resultado condicionado.

## 4. Limites restantes

- Aparar não pode ser registrado até que o Inventário ativo forneça arma efetivamente empunhada, elegibilidade para Aparar e Durabilidade.
- Esquiva tem registro de Reação e rolagem, mas o deslocamento de Rolamento e o compromisso da Ação Bônus de Reflexos de Sobrevivente ainda não têm controle persistente completo.
- Não foi automatizado o uso por turno de Ambidestria, Cabeçada/Pisão, bônus de Retaliação, armas/Peças instaladas ou efeitos que dependem do alvo.
- Ataques de Oportunidade e lembretes de Brecha Tática não executam Ataques nem verificam posições/eventos.
- Nenhuma decisão narrativa ou consequência de alvo é inferida.

## 5. Validação e alterações

- **Revisão estática:** `src/reacoesCombate.ts`, `src/manobrasOperacionais.ts`, `src/economiaAcoes.ts`, `src/estadoTurnoCombate.ts`, `src/PainelAcoesLocal.tsx`, `src/CalculadoraTesteLocal.tsx`, `src/condicoesFicha.ts`, `src/condicoesCalculadora.ts`.
- **Testes estruturais adicionados:** `tests/ataque-oportunidade-ficha.test.mjs` cobre lembretes de Brecha Tática, Finalização à Distância e Luta Livre, inclusive o aviso da exceção de SA.
- **Testes/build/CI:** não executados nesta sessão; aprovação de CI não confirmada.
- **Validação humana:** pendente em modos Automático, Misto e Manual, com e sem Habilidades.
- **Sem alterações:** fórmulas de combate, economia, contratos persistidos, esquema, LAN, Supabase, CSS global, navegação, merge, publicação ou deploy.

## 6. Próxima frente

Auditar Dano e propriedades especiais de armas na calculadora, comparando os perfis consultivos e os lembretes de munição/rajada/armas modificadas com o cânone. Manter a dependência do Inventário ativo explícita.
