# Checkpoint — auditoria de cobertura das Origens

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Matriz atualizada:** `0388291c4e8f937079e0c70e118a7ec3299081e8`

## Objetivo

Comparar o catálogo `src/origens.ts` com as integrações atuais da Ficha para separar benefícios implementados dos que dependem de módulos ainda não concluídos. Evitar reimplementar benefícios já presentes ou criar automações sem o contexto necessário.

## Resultado da auditoria

### Benefícios com implementação identificada no código (12)

- Acadêmico — Vantagem em Teste elegível de AST, com uso limitado a Descanso Completo e confirmação manual.
- Atleta — +5 em Teste de Perícia baseado em FOR/AGI, exceto Luta/Pontaria, mediante gasto confirmado de 1 SA.
- Cobaia — +2 BI Máxima e Vantagem nos Testes de Reanimação durante Colapso Viral.
- Criminoso — Vantagem em Investigação para procurar itens/recursos, uma vez por Descanso Completo.
- Desgarrado — PV Temporários ao aumentar BI pelo ajuste de Recursos, calculados sobre a BI atual.
- Investigador — +5 em Investigação para procurar pista, mediante gasto confirmado de 1 SA.
- Lutador — aumento de categoria em Ataque Desarmado e Arma Improvisada; acumula com Casca-Grossa no Desarmado.
- Mochileiro — +1 Espaço de Inventário nos derivados.
- Operário — bônus de Ataque e Dano com a arma escolhida na criação.
- Policial — +2 Defesa.
- Servidor Público — Ajudar elegível concede Vantagem e +2 ao aliado, mediante confirmações.
- Universitária — +1 SA Máxima.

A identificação é de implementação no código, não certifica validação humana ou CI.

### Benefícios pendentes (5)

- Agente de Saúde — precisa de fluxo de cura de aliado por item/efeito para adicionar +1d4 aos Dados de Cura sem aplicar à própria personagem.
- Amnésico — precisa de contexto de sessão/local conhecido e registro temporário da Vantagem no próximo Teste de Sobrevivência relacionado.
- Chef — depende da criação/fabricação de item em Sala de Descanso; não iniciar Inventário ativo antes do marco de validação humana da Ficha.
- Mercenário — depende de gatilho de surpresa por hostil oculto, arma de fogo carregada e Reação, além de limite por Descanso Completo.
- Militar — depende de registrar derrota causada por arma de fogo e conceder Vantagem no primeiro Ataque de arma de fogo do próximo turno.

## Decisões para evitar retrabalho

- Não duplicar benefícios já implementados.
- Não criar um fluxo fictício de cura, sessão, crafting, surpresa ou derrota de alvo antes que os módulos correspondentes existam.
- Manter os cinco benefícios pendentes vinculados às dependências funcionais descritas na matriz.
- Inventário ativo continua bloqueado até a conclusão da Ficha e sessão integrada de validação humana.
- Progressão de Nível permanece sem novas alterações até existir desenho neutro que não obrigue o grupo a escolher método dentro do WebApp.

## Validação

- Inspecionados: `src/origens.ts`, `src/efeitosOrigens.ts`, `src/CalculadoraTesteLocal.tsx`, `src/derivadosCriacao.ts`, `src/recursosFicha.ts`, `src/ReanimacaoFichaLocal.tsx`, `src/PainelAcoesLocal.tsx`.
- Testes locais não executados neste ambiente.
- CI do HEAD precisa concluir; nenhuma aprovação foi presumida.
- Nenhuma validação humana solicitada.

## Segurança e publicação

- Sem alterações em `main`, merge, deploy ou publicação.
- Sem alterações em Supabase ou banco de produção.
