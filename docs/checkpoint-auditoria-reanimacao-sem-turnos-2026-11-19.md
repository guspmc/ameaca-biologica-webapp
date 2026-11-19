# Checkpoint — auditoria do fluxo de Reanimação — 19/11/2026

## Identificação
- Projeto: Ameaça Biológica RPG — Ficha Offline PWA.
- Branch: `feat/offline-first-ficha`.
- HEAD no momento do registro: `8745a3aa6c3055920b513bb03bfe23b8e56281d2`.
- Fase: 1 — Ficha Offline. Testes humanos da Fase 2 continuam pendentes.

## Fontes canônicas
- Arquivo do Jogador v1.0, p. 90: Colapso Viral deixa a personagem Desacordada e inicia Testes de Reanimação mesmo que ainda tenha PV. Cada Teste usa 1d20 contra DT 12, sem modificador salvo regra específica. Em até 5 tentativas, 3 sucessos mantêm Desacordada, sem transformação, até a BI ficar abaixo do máximo; 3 falhas fazem retornar no próximo turno como Zumbi Especial. Cobaia tem Vantagem em cada Teste durante Colapso Viral: role 2d20 e use o melhor.
- A mesma página define o Colapso e seus resultados; não estabelece Falha Crítica para resultado natural 1 no Teste de Reanimação.
- Arquivo do Jogador v1.0, p. 91: transformação de Infectado Especial/Cabeça Carmesim tem efeitos específicos a 0 PV; os controles da Ficha continuam informativos e dependentes da decisão da Mesa nos casos já auditados.
- Não foi encontrada na passagem canônica consultada uma exigência de a Ficha aguardar o próximo turno para começar a registrar os Testes por 0 PV. O fluxo de turno/iniciativa é responsabilidade externa à Ficha.

## Achados confirmados
1. **Botão de próximo turno:** Reanimação por 0 PV era criada no estado `aguardando_proximo_turno`, exigindo que o Jogador clicasse em “Iniciar Testes no próximo turno”. A Ficha não administra iniciativa/turnos; esse estado introduzia uma dependência artificial.
2. **Dados físicos:** a UI pedia as faces de um ou dois d20. O requisito de uso informado por Gus é que, com dados físicos, a Ficha apenas registre se o Teste foi sucesso ou falha, sem tentar controlar a rolagem física.
3. **Falha Crítica:** o motor retornava `falhaCritica` quando o resultado era 1 e a UI exibia aviso de Falha Crítica. O Arquivo do Jogador p. 90 só define comparação com DT 12 e contagem de sucessos/falhas; não define efeito especial para 1 natural nesse Teste. O botão “Registrar falha crítica (1 natural)” do Teste de Medicina também não aplicava efeito mecânico e foi removido.
4. **Medicina:** permanece o registro do resultado do Teste de Medicina DT 15 como sucesso/falha; sucesso concede Vantagem ao próximo Teste de Reanimação por 0 PV. Não se registra Falha Crítica específica.
5. **Colapso Viral:** mantém rolagem virtual 1d20/2d20 conforme modo e Vantagem da Origem Cobaia. Três sucessos mantêm Desacordada até BI abaixo do máximo; três falhas deixam desfecho para decisão da Mesa, sem executar narrativa automaticamente.

## Implementação
- `src/reanimacaoFicha.ts`:
  - Novas Reanimações por 0 PV já iniciam em `em_andamento`.
  - Adicionada `registrarResultadoReanimacao` para gravar diretamente sucesso/falha de Teste feito com dados físicos ou fora da Ficha.
  - A resolução virtual continua comparando d20(s) com DT 12 e usa o mesmo mecanismo de contagem.
  - Removido `falhaCritica` do resultado mecânico; 1 natural é apenas falha por ficar abaixo da DT.
  - Estado legado `aguardando_proximo_turno` permanece aceito e pode receber o resultado, migrando para `em_andamento` na próxima gravação. A função antiga de avanço de turno permanece apenas para compatibilidade técnica, sem botão/uso na interface.
- `src/ReanimacaoFichaLocal.tsx`:
  - Removido botão “Iniciar Testes no próximo turno”.
  - Dados físicos/Modos Manual e Misto apresentam apenas “Registrar sucesso” e “Registrar falha”; não pedem faces de d20.
  - Dados Virtuais em modo Automático continuam com rolagem integrada e vantagem.
  - Removidos campos de faces físicas e estado local associado.
  - Removido botão “Registrar falha crítica (1 natural)” do Teste de Medicina.
  - Texto orienta registrar apenas o desfecho do Teste de Medicina e do Teste físico.
- Testes atualizados:
  - `tests/reanimacao-ficha.test.mjs`
  - `tests/reanimacao-integracao-ficha.test.mjs`
  - `tests/reanimacao-registro-invalido.test.mjs`

## Compatibilidade e riscos
- Registros antigos com `aguardando_proximo_turno` não são apagados nem reescritos em massa; continuam válidos e a UI permite registrar o próximo resultado diretamente.
- A Ficha continua não administrando turnos, morte, transformação ou consequências narrativas.
- A contagem de até 5 tentativas, 3 sucessos/3 falhas, cura acumulada, Vantagem de Medicina e Cobaia foi preservada.
- O modo Automático com dados físicos continua pedindo somente o resultado (sucesso/falha), não as faces; com dados Virtuais, a Ficha rola.

## Testes e build
- CI no HEAD de código/UI/testes `8745a3aa6c3055920b513bb03bfe23b8e56281d2`:
  - Testes offline: run `44451540098` — **IN_PROGRESS** no registro inicial.
  - Build TypeScript/Vite: run `44451540101` — **IN_PROGRESS** no registro inicial.
- Falhas de build anteriores nos commits intermediários `7a56376` e `f526c5c` apontaram referências remanescentes aos setters de faces físicas; esses setters foram removidos no commit `8745a3a`. Não considerar os commits intermediários como aprovados.
- Não houve execução local nesta sessão; implementação via GitHub. CI final é a evidência automática pendente.
- Validação humana: **PENDENTE**.

## Próxima ação exata
1. Consultar conclusão dos workflows `44451540098` e `44451540101`; corrigir apenas falhas demonstradas.
2. Após CI verde, pedir teste humano: Reanimação por 0 PV, dados físicos (registrar sucesso/falha), dados virtuais em Automático, Vantagem de Cobaia no Colapso, ajuda de Medicina, 3 sucessos/3 falhas, persistência após recarga e compatibilidade de ficha antiga em estado `aguardando_proximo_turno`.
3. Não avançar para Inventário ativo ou fases posteriores antes dos critérios anteriores e da validação humana.

## Estado
- Fluxo de Reanimação sem controle de turno: **IMPLEMENTADO / TESTE AUTOMATIZADO PENDENTE / VALIDAÇÃO HUMANA PENDENTE**.
- Registro físico por sucesso/falha: **IMPLEMENTADO / TESTE AUTOMATIZADO PENDENTE / VALIDAÇÃO HUMANA PENDENTE**.
- Rolagem virtual e regra de Vantagem: **IMPLEMENTADO / TESTE AUTOMATIZADO PENDENTE / VALIDAÇÃO HUMANA PENDENTE**.
- Remoção de Falha Crítica não prevista no cânone: **IMPLEMENTADO / TESTE AUTOMATIZADO PENDENTE / VALIDAÇÃO HUMANA PENDENTE**.
