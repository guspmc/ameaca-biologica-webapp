# Checkpoint — integração inicial de Reações defensivas na Ficha

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** declaração de Esquiva e bloqueio seguro de Aparar.

## Alterações implementadas

- `src/PainelAcoesLocal.tsx` ganhou um bloco de Reações defensivas.
- O jogador informa o resultado total do Ataque, o d20 natural e confirma os elementos contextuais do gatilho. As confirmações de Corpo a Corpo, acerto e possibilidade de Aparar começam desmarcadas; nenhum desses fatos é presumido.
- A janela é avaliada por `avaliarJanelaReacao()`; 20 natural mantém o fechamento das Reações defensivas normais.
- A declaração de Esquiva só aparece quando a janela autoriza Esquivar. O registro usa `registrarReacaoDefensiva()` dentro de `aplicarReacaoCombate()`, preservando a transição integrada da Economia de Ações.
- Se a Reação normal já foi usada, o registro compra outra por 1 SA e respeita a janela de 3 SA.
- O fluxo informa que a declaração ocorre antes de Dano, BI ou Condições; não realiza o Teste defensivo nem aplica efeitos.

## Proteção e limites

- **Aparar não foi habilitado na interface.** O módulo ainda não dispõe de estado confiável para validar arma empunhada, elegibilidade e Durabilidade. Exibir que o gatilho permitiria Aparar não equivale a autorizar o registro.
- A autorização de Esquiva depende de confirmação explícita do jogador com a Mesa; nenhuma Habilidade ou condição é inferida automaticamente.
- O Teste defensivo, a decisão de sucesso, Defesa, Dano, BI e Condições permanecem manuais.
- Não foi alterada a interpretação de 20 natural nem a exceção pendente de `VOCÊ APAROU UM MÍSSIL!?`.

## Testes e validação

- Adicionado `tests/reacao-defensiva-ficha.test.mjs` com verificações estruturais do fluxo e do bloqueio de Aparar.
- **Não executado localmente:** não há clone/ambiente local disponível nesta execução.
- **CI:** pendente de consulta após os commits.
- **Validação humana:** não solicitada, conforme decisão de realizar uma única sessão integrada depois de concluir a Ficha (exceto Inventário).

## Commits deste incremento

- `5a84faa` — integra declaração segura de Esquiva na Ficha.
- `95eff8a` — adiciona teste estrutural.
- `d9882f1` — atualiza a matriz de auditoria.
- `0311345` — corrige a validação dos campos numéricos.
- `6ff8cda` — exige confirmação explícita dos dados contextuais.

## Próximo passo

Consultar o HEAD e a CI da branch. Os workflows foram acionados, mas ainda constam como `queued`; não há resultado de aprovação disponível. Corrigir qualquer falha real. Em seguida, continuar a auditoria/integração das Reações, sem habilitar Aparar até existir estado seguro de equipamento e Durabilidade. Não iniciar Inventário ativo, não alterar `main`, não fazer merge ou deploy.
