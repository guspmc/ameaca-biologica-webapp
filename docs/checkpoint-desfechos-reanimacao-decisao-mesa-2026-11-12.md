# Checkpoint — desfechos de Reanimação sob decisão da Mesa

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** ajuste de linguagem e apresentação dos desfechos após três falhas; sem alteração do cânone ou da resolução mecânica.

## Princípio aplicado

A Ficha calcula e registra resultados mecânicos. O Jogador realiza os Testes. A Mesa decide e registra os desfechos que dependem de adjudicação narrativa. A regra canônica continua sendo apresentada como referência, não como decisão automática da aplicação.

## Alterações

- `src/ReanimacaoFichaLocal.tsx`: os estados internos existentes de três falhas continuam preservados para não invalidar registros persistidos.
- A apresentação dos dois estados terminais agora usa a mesma linguagem: **“Três falhas — decisão da Mesa pendente”**.
- A mensagem após o Teste informa que o resultado mecânico foi registrado, que nenhuma consequência narrativa foi executada e que a decisão tomada deve ser lançada no Registro de Decisões da Mesa.
- Foram removidas as mensagens que apresentavam a morte como “sinalizada para registro do Mestre” ou o retorno como Zumbi Especial como consequência já pendente para o próximo turno.
- `tests/reanimacao-integracao-ficha.test.mjs`: adicionada verificação estrutural da linguagem neutra e da orientação para o histórico.

## O que não mudou

- Contagem de sucessos, falhas e tentativas.
- DT 12, Vantagem, resultados de dados e regras de cura acumulada.
- Estados internos persistidos, contratos de dados e validação de Reanimação.
- Despertar após três sucessos em 0 PV.
- Permanência Desacordada após três sucessos no Colapso até a BI ficar abaixo do máximo.
- Nenhuma alteração de PV, BI, Condições, controle da personagem ou consequências narrativas por decisão automática.
- Sem alteração visual deliberada, CSS, layout, LAN, schema, IndexedDB, Supabase, Inventário, `main`, merge, deploy ou publicação.

## Validação

- Alteração de código e teste estrutural gravadas na branch.
- **Testes automatizados e build não executados nesta etapa.**
- **Validação humana pendente.**
- O teste estrutural adicionado verifica a linguagem apresentada; não substitui teste de navegador nem valida a persistência dos fluxos completos.

## Risco residual

Os nomes internos `morte_a_registrar` e `transformacao_no_proximo_turno` permanecem como identificadores técnicos de estados persistidos. A interface não os exibe literalmente. Uma migração de nomes exigiria compatibilidade com fichas já gravadas e não foi necessária para corrigir a ambiguidade apresentada ao Jogador.
