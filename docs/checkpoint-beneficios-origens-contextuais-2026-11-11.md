# Checkpoint — benefícios contextuais de Origem na Ficha Offline

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Cânone:** Arquivo do Jogador v1.0, Origens (pp. 23–24).

## Benefícios implementados

### Agente de Saúde
- A Ficha exibe o lembrete de +1d4 aos Dados de Cura ao curar um aliado com item ou efeito.
- Não aplica cura cruzada nem altera PV de outra personagem.

### Amnésico — Vislumbres do Passado
- Estado local persistente registra uso 1/sessão e Vantagem pendente no próximo Teste relacionado de Sobrevivência.
- Exige confirmação de local conhecido antes da amnésia e tentativa AST DT 10 resolvida pelo jogador conforme o modo da Ficha.
- O jogador registra a tentativa AST DT 10 e confirma se a informação foi útil; informação útil gera a Vantagem pendente, conforme o texto canônico.
- A Vantagem permanece pendente até o jogador marcar seu consumo após o Teste relacionado.
- O botão de nova sessão renova apenas o uso; preserva Vantagem pendente ainda não consumida.

### Militar
- O jogador confirma que um inimigo morreu por Ataque com arma de fogo.
- A Ficha registra Vantagem pendente no primeiro Ataque com arma de fogo do próximo turno.
- O jogador aplica a Vantagem manualmente e confirma o consumo após esse Ataque.

### Mercenário
- Gatilho de hostil oculto que surpreenderia, arma de fogo carregada e uso disponível confirmados manualmente.
- Registra a Reação normal ou compra de Reação adicional por 1 SA, respeitando limite de 3 SA.
- Reação e uso 1/Descanso Completo são salvos na mesma operação.
- Saque, Ataque e rolagem continuam manuais; o uso não pode ser marcado separadamente no painel geral de benefícios.

## Arquivos e testes

- `src/beneficiosOrigensContextuais.ts` — contratos e transições persistentes para Amnésico e Militar.
- `src/BeneficiosOrigemContextuaisLocal.tsx` — UI de confirmação e consumo.
- `src/FichaLocal.tsx` — integração dos benefícios contextuais e lembrete de Agente de Saúde.
- `src/validacaoPersonagemLocal.ts` — valida os novos estados persistidos de Amnésico e Militar.
- `src/reacoesCombate.ts` e `src/PainelAcoesLocal.tsx` — avaliação, custo e gravação combinada da Reação do Mercenário.
- `src/UsosDescansoCompletoLocal.tsx` — impede consumo separado do Mercenário.
- `tests/beneficios-origens-contextuais.test.mjs` — regras de Amnésico/Militar e integração.
- `tests/origem-agente-saude-ficha.test.mjs` — lembrete de Agente de Saúde.
- `tests/reacoes-combate.test.mjs` e `tests/mercenario-ficha.test.mjs` — gatilho, custos e persistência do Mercenário.

## Limites explícitos

- A Ficha não controla o início/fim de sessão; o jogador registra nova sessão para renovar Amnésico.
- A Ficha não rola AST DT 10 neste painel; o jogador resolve o Teste conforme Automático/Misto/Manual e confirma o resultado.
- A Ficha não controla Iniciativa nem administra turnos; o benefício Militar depende da confirmação do jogador de que se trata do primeiro Ataque com arma de fogo do próximo turno.
- A Ficha não verifica se o inimigo morreu, se o Ataque foi de arma de fogo, se o hostil estava oculto, se surpreenderia ou se a arma está carregada.
- Nenhum desses fluxos realiza Ataque, cura outro personagem, aplica PV, Dano ou efeitos automaticamente.
- Chef continua pendente por depender da criação/fabricação na Sala de Descanso, que será integrada com Inventário.

## Commits principais

- `2c52a18`, `7972601`, `467e983`, `edea31f`, `a12a69e` — Mercenário.
- `5a185ca`, `a422f94` — Agente de Saúde.
- `42e38d5`, `932cb0f`, `b7b65b2`, `a14babca`, `e0d0fdb`, `531e4db`, `e06f352`, `bb209a9`, `52437a9` — Amnésico e Militar.
- `09fb81e`, `67d6ba5` — validação dos estados contextuais.
- `26a1e4a`, `3ce37a8` — matriz.

## Validação

- **Implementado:** fluxos Offline na branch.
- **Testes:** adicionados; não executados localmente nesta sessão.
- **CI:** verificar os workflows do HEAD atual; nenhuma aprovação presumida.
- **Validação humana:** adiada até conclusão de todas as funcionalidades da Ficha, exceto Inventário.
- **LAN/main/merge/deploy:** não alterados.
