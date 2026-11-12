# Checkpoint — Auditoria das Condições na Ficha — 12/11/2026

**Branch:** `feat/offline-first-ficha`  
**HEAD do checkpoint:** `0483f7aa19e662a6828d3d8feb24b0b7b8df6467`  
**Fonte canônica:** Arquivo do Jogador v1.0, capítulo 4, pp. 81–83; referência contextual de Vontade/Amedrontado, p. 45.

## Escopo revisado

- `src/condicoesFicha.ts`: catálogo, registro/histórico, efeitos por turno e condições derivadas.
- `src/condicoesCalculadora.ts`: Desvantagens, Defesa e lembretes de restrições.
- `src/CondicoesFichaLocal.tsx`: registro manual, condições derivadas e histórico.
- `src/CalculadoraTesteLocal.tsx`: aplicação de Desvantagem, restrições e lembretes.
- `src/PainelAcoesLocal.tsx`: economia de ações, reação defensiva, movimento e lembretes por turno.
- `src/FichaLocal.tsx`: propagação das condições registradas e derivadas.
- `tests/condicoes-calculadora.test.mjs`, `tests/condicoes-ficha.test.mjs`.

## Achados e correções

1. **Imobilizado em Reflexos — CORRIGIDO.** A condição já impunha Desvantagem nos próprios Ataques, mas não era considerada em Testes de Reflexos. Agora a função `condicoesQueImpoemDesvantagem` também retorna Imobilizado para Testes da Perícia Reflexos. Isso alimenta a Esquiva do Painel de Ações, que já consulta a mesma função.
2. **Desacordado derivado — CORRIGIDO.** A UI de Condições mostrava Desacordado quando PV chegava a 0 ou ocorria Colapso Viral, mas essa condição derivada não era propagada à lista usada pelos avisos de atuação. A Ficha agora inclui `desacordado` na lista efetiva quando `pvAtual <= 0` ou a fase de BI é `colapso`. A função de restrições passa a lembrar que a personagem Desacordada não realiza Ações nem Reações e não percebe conscientemente o ambiente.
3. **Restrições no Painel de Ações — CORRIGIDO.** Atordoado, Incapacitado, Surpreendido e Desorientado geravam avisos na calculadora de Ataques, mas o Painel de Ações não exibia o mesmo lembrete ao registrar Ações, Reações e Movimento. Agora o painel apresenta avisos sem desabilitar controles, sem executar efeitos e sem substituir a decisão da Mesa. O texto de Surpreendido também explicita a proibição de Reações e gasto de SA enquanto durar.
4. **Limites de Movimento — CORRIGIDO COMO LEMBRETE.** O Painel de Ações agora relembra Movimento 0 para Agarrado/Imobilizado, deslocamento Rastejando e custo de levantar para Caído, e redução de 3 m para Intoxicado. Não calcula distância nem altera posições.
5. **Amedrontado — LEMBRETE CONTEXTUAL ADICIONADO.** A calculadora informa que o jogador deve confirmar se ainda percebe a fonte e se o Teste é aplicável; quando aplicável, seleciona Desvantagem manualmente. Não automatiza medo, percepção da fonte, fuga ou restrição de aproximação.

## Limites mantidos deliberadamente

- Vantagem contra um alvo Caído, Cego ou Atordoado depende da condição do alvo e do contexto do Ataque; a Ficha do jogador não presume estado de terceiros.
- Efeitos de Amedrontado dependem da fonte e da percepção da personagem; não são aplicados automaticamente.
- A Ficha não movimenta personagens, não resolve deslocamento, não bloqueia ações por decisão própria e não aplica Dano/efeitos de Condições.
- Duração e encerramento continuam conforme a fonte; o modo Offline não possui contador de rodadas.
- Nenhuma mudança visual/redesign, LAN, banco, Supabase, main, merge, deploy ou publicação.

## Cobertura e validação

- `tests/condicoes-calculadora.test.mjs` ampliado para Imobilizado em Reflexos/Esquiva, Desacordado derivado, avisos no Painel de Ações, limites de Movimento e lembrete contextual de Amedrontado.
- **Testes/build:** não executados nesta sessão. Os testes estruturais foram adicionados, mas não há alegação de aprovação.
- **Validação humana:** pendente.
- Revisão estática realizada nos arquivos listados acima e confronto com as pp. 81–83 do Arquivo do Jogador v1.0.
