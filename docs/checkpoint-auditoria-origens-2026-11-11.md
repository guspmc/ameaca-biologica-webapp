# Checkpoint — auditoria de cobertura das Origens

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Matriz atualizada:** ver `docs/matriz-auditoria-funcional-ficha.md` no HEAD atual.

## Objetivo

Comparar o catálogo `src/origens.ts` com as integrações atuais da Ficha para separar benefícios implementados dos que dependem de módulos ainda não concluídos. Evitar reimplementar benefícios já presentes ou criar automações sem o contexto necessário.

## Resultado da auditoria

### Benefícios com implementação identificada no código (16)

- Acadêmico — Vantagem em Teste elegível de AST, com uso limitado a Descanso Completo e confirmação manual.
- Agente de Saúde — lembrete de +1d4 aos Dados de Cura ao curar aliado com item/efeito; não aplica cura cruzada.
- Amnésico — Vislumbres do Passado: uso 1/sessão, local conhecido e tentativa AST DT 10 confirmados pelo jogador; informação útil registra Vantagem pendente no próximo Teste relacionado de Sobrevivência.
- Atleta — +5 em Teste de Perícia baseado em FOR/AGI, exceto Luta/Pontaria, mediante gasto confirmado de 1 SA.
- Cobaia — +2 BI Máxima e Vantagem nos Testes de Reanimação durante Colapso Viral.
- Criminoso — Vantagem em Investigação para procurar itens/recursos, uma vez por Descanso Completo.
- Desgarrado — PV Temporários ao aumentar BI pelo ajuste de Recursos, calculados sobre a BI atual.
- Investigador — +5 em Investigação para procurar pista, mediante gasto confirmado de 1 SA.
- Lutador — aumento de categoria em Ataque Desarmado e Arma Improvisada; acumula com Casca-Grossa no Desarmado.
- Mercenário — gatilho manual de hostil oculto que surpreenderia, arma de fogo carregada e uso disponível; Reação normal ou adicional por 1 SA e uso 1/Descanso Completo salvos na mesma operação.
- Militar — registro manual de morte por arma de fogo e Vantagem pendente no primeiro Ataque com arma de fogo do próximo turno.
- Mochileiro — +1 Espaço de Inventário nos derivados.
- Operário — bônus de Ataque e Dano com a arma escolhida na criação.
- Policial — +2 Defesa.
- Servidor Público — Ajudar elegível concede Vantagem e +2 ao aliado, mediante confirmações.
- Universitária — +1 SA Máxima.

A identificação é de implementação no código, não certifica validação humana ou CI. Benefícios contextuais que dependem de confirmação da Mesa continuam sem inferência automática.

### Benefício pendente (1)

- Chef — em Sala de Descanso, ao criar item, pode escolher 10 no d20. Depende do fluxo de criação/fabricação, que será concluído junto ao Inventário. Não implementar crafting isolado nem criar uma rolagem paralela fictícia.

## Decisões para evitar retrabalho

- Não duplicar benefícios já implementados.
- Não criar fluxos fictícios de crafting ou rolagem narrativa; gatilhos que dependem da Mesa são confirmados pelo jogador.
- Amnésico e Militar têm estados versionados persistidos e validados por `validarPersonagemLocal`.
- Mercenário grava Reação/custo de SA e uso por Descanso Completo na mesma transição persistida.
- Agente de Saúde é lembrete contextual; não cura outra personagem nem altera PV alheio.
- Chef permanece dependente do Inventário/Fabricação.
- Inventário ativo continua bloqueado até o marco definido no checkpoint consolidado da Ficha.
- A Progressão foi neutralizada: grupo decide o critério fora do WebApp; a Ficha registra autorização explícita. Ver `docs/checkpoint-progressao-neutra-2026-11-11.md`.

## Validação

- Inspecionados inicialmente: `src/origens.ts`, `src/efeitosOrigens.ts`, `src/CalculadoraTesteLocal.tsx`, `src/derivadosCriacao.ts`, `src/recursosFicha.ts`, `src/ReanimacaoFichaLocal.tsx`, `src/PainelAcoesLocal.tsx`.
- Atualizações posteriores: `src/BeneficiosOrigemContextuaisLocal.tsx`, `src/beneficiosOrigensContextuais.ts`, `src/validacaoPersonagemLocal.ts`, `src/FichaLocal.tsx` e os testes específicos de Agente de Saúde, Mercenário, Amnésico e Militar.
- Testes locais não executados neste ambiente.
- CI do HEAD precisa concluir; nenhuma aprovação foi presumida.
- Nenhuma validação humana solicitada.

## Segurança e publicação

- Sem alterações em `main`, merge, deploy ou publicação.
- Sem alterações em Supabase ou banco de produção.
