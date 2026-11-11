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
- Após a declaração, o modo Automático oferece o Teste de Reflexos contra o resultado total do Ataque recebido, por `resolverTesteDefensivo()`.
- O valor de Reflexos vem de `valorBasePericia()`, sem duplicar Atributo. Desvantagem por Condições aplicáveis a Reflexos e pela Fase da BI usa dois d20 e escolhe o pior.
- Dados Físicos exigem resultados informados; Virtuais são sorteados somente após comando explícito; Mistos permitem escolher o método.
- O cálculo é oferecido após solicitação explícita nos modos Automático, Misto e Manual; o modo de funcionamento não bloqueia rolagens solicitadas. A preferência de dados controla Físicos/Virtuais/Mistos. O resultado não altera recursos, Defesa, Dano, BI ou Condições.
- No cálculo automático da Esquiva, sucesso/falha alimenta a confirmação local de defesa bem-sucedida usada pelo painel de Retaliação/Contra-Ataque. Alterar o gatilho ou declarar nova Esquiva limpa a confirmação.

## Proteção e limites

- **Aparar não foi habilitado na interface.** O módulo ainda não dispõe de estado confiável para validar arma empunhada, elegibilidade e Durabilidade. Exibir que o gatilho permitiria Aparar não equivale a autorizar o registro.
- A autorização de Esquiva depende de confirmação explícita do jogador com a Mesa; nenhuma Habilidade ou condição é inferida automaticamente.
- O cálculo do Teste de Esquiva é solicitado pelo jogador e segue a preferência de dados; no modo Físico, o jogador informa as faces, no Virtual solicita a rolagem e no Misto escolhe o método. Nenhum efeito, recurso, Defesa, Dano, BI ou Condição é aplicado pelo cálculo. Em Misto/Manual, a administração das consequências permanece com o jogador e a Mesa.
- Não foi alterada a interpretação de 20 natural nem a exceção pendente de `VOCÊ APAROU UM MÍSSIL!?`.

## Testes e validação

- Adicionado `tests/reacao-defensiva-ficha.test.mjs` com verificações estruturais do fluxo e do bloqueio de Aparar.
- Adicionado `tests/teste-defensivo-ficha.test.mjs` para cálculo, Perícias, Desvantagem e modos de dados.
- **Não executado localmente:** não há clone/ambiente local disponível nesta execução.
- **CI:** pendente de consulta após os commits.
- **Validação humana:** não solicitada, conforme decisão de realizar uma única sessão integrada depois de concluir a Ficha (exceto Inventário).

## Commits deste incremento

- `5a84faa` — integra declaração segura de Esquiva na Ficha.
- `95eff8a` — adiciona teste estrutural.
- `d9882f1` — atualiza a matriz de auditoria.
- `0311345` — corrige a validação dos campos numéricos.
- `6ff8cda` — exige confirmação explícita dos dados contextuais.
- `65be4a6` — conecta o Teste de Esquiva à Ficha.
- `923c028` — tipa condições para o cálculo.
- `389e8fd` — fornece Perícias e configuração de funcionamento à Ficha.
- `46dc969` — corrige tipagem/mensagens.
- `28c65b1` — adiciona testes do cálculo defensivo.
- `8fa7ad1` — atualiza a matriz.
- `06d96ce` — valida e registra a Reação de Na Minha Mira.
- `a314e04` — atualiza testes do helper.
- `fa4d2a8` — integra Na Minha Mira ao Painel.
- `dcc84b9` — adiciona teste estrutural.
- `d58215f` — registra a integração na matriz.
- `42ce3c2` — sincroniza o resultado da Esquiva com Retaliação.
- `5ef334f` — adiciona teste dessa integração.
- `1c4bcf0` — limpa sucesso anterior ao mudar o gatilho.
- `10d597c` — permite cálculo solicitado nos três modos.
- `3b7bb41` — atualiza testes dos modos.
- `52b0a96` — atualiza a matriz sobre os modos.
- `2826365` — apresenta Atordoado de Retaliação após defesa bem-sucedida.
- `e2894d8` — adiciona teste dessa apresentação.
- `8d9affd` — corrige os limites descritos na matriz.

## Integração paralela — Na Minha Mira

- `src/reacoesCombate.ts` agora exige, além dos gatilhos já existentes, confirmação de arma de fogo carregada e apta ao Ataque de Oportunidade à distância.
- `registrarNaMinhaMira()` registra Reação normal ou compra adicional por 1 SA, com validação estrita do resultado.
- `src/PainelAcoesLocal.tsx` apresenta a seção somente com a Habilidade ativa e exige confirmações manuais de uso disponível na rodada, alvo percebido, Alcance Médio, nova Condição e estado/elegibilidade da arma.
- O painel não acompanha rodada, posição, percepção, alvo, equipamento ou munição; não executa o Ataque nem aplica efeitos.
- Teste estrutural novo: `tests/na-minha-mira-ficha.test.mjs`; testes de helper atualizados em `tests/reacoes-combate.test.mjs`. Não executados localmente.

## Revisão posterior — modos e Retaliação

- A primeira versão condicionava o cálculo ao modo Automático. A revisão corrigiu isso: uma rolagem solicitada é oferecida nos três modos; a preferência Físico/Virtual/Misto controla a obtenção do dado. Não há rolagem espontânea.
- O resultado calculado sincroniza a confirmação local de defesa bem-sucedida. A confirmação é limpa ao editar o gatilho ou declarar nova Esquiva, evitando reaproveitar sucesso anterior.
- Retaliação apresenta Atordoado após a defesa bem-sucedida mesmo sem Contra-Ataque; Vantagem e +1 dado aparecem na opção de Contra-Ataque.
- Teste estrutural atualizado em `tests/teste-defensivo-ficha.test.mjs`. Não executado localmente.

## Próximo passo

Consultar o HEAD e a CI da branch. Os workflows foram acionados, mas ainda constam como `queued`; não há resultado de aprovação disponível. Corrigir qualquer falha real. Em seguida, continuar a auditoria/integração das Reações, sem habilitar Aparar até existir estado seguro de equipamento e Durabilidade. Não iniciar Inventário ativo, não alterar `main`, não fazer merge ou deploy.
