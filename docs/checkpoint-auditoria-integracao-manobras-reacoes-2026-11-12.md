# Checkpoint — auditoria de integração das Manobras e Reações de Combate

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD de código consultado:** `bc211a1d1f9d880fa7806dd7b358e5f115659eea`  
**Método:** inspeção estática do código e dos testes existentes via GitHub; confronto com o Arquivo do Jogador v1.0, especialmente pp. 76–80.  
**Execução:** nenhum teste foi executado nesta sessão.

## 1. Economia de Ações e Esforço

### Evidências
- `src/economiaAcoes.ts` modela Ação, Movimento, Ação Bônus e Reação normais; compras por Esforço custam 1 SA para Movimento/Ação Bônus/Reação e 2 SA para Ação.
- O estado valida SA não negativo, gasto na janela entre 0 e 3, compras e marcadores de uso.
- Interação Gratuita é separada e não pode ser comprada por Esforço.
- Fora do próprio turno, apenas Reação pode ser consumida/comprada; compras fora do turno são bloqueadas sem autorização.
- O gasto de SA permanece acumulado do fim de um turno próprio ao fim do seguinte. O fim do turno encerra a janela anterior; o início renova recursos normais, sem zerar o gasto acumulado.
- `src/estadoTurnoCombate.ts` mantém o registro composto versionado e migra formatos históricos conhecidos em memória, sem gravar correções silenciosas.

### Classificação
**IMPLEMENTADO — coerência estática nos limites e transições inspecionados.** A persistência real, recuperação entre abas e comportamento em concorrência continuam pendentes de teste humano.

## 2. Manobras com integração identificada

- **Disparada:** consome Ação normal e registra um Movimento adicional; não executa deslocamento.
- **Fuga:** exige Disparada, consome 1 SA e registra outro Movimento adicional.
- **Finalizar:** consome 3 SA, sem consumir Ação nem Movimento normais; ataque, deslocamento e resolução do alvo continuam manuais.
- **Finalização Dupla:** valida confirmações contextuais, consome Reação normal + 3 SA e grava o compromisso de Ação e Movimento do próximo turno. Ação Bônus e Interação Gratuita permanecem disponíveis.
- **Combate com Duas Armas:** helper exige Ataque inicial registrado, elegibilidade confirmada e consome Ação Bônus; o Ataque adicional fica autorizado e sua resolução é registrada separadamente.
- **Ajudar:** consome Ação após confirmação de elegibilidade/treinamento; benefícios contextuais do Servidor Público são apresentados.
- **Ação Completa** e **Interação Gratuita:** possuem controles próprios.
- **Mirar:** consome 1 SA e registra preparação, mas a integração do bônus não está concluída (ver seção 3).

## 3. Lacunas concretas de integração na interface

### 3.1 Mirar não aplica o bônus +2 ao Teste de Ataque

**Evidência:** `registrarMirar()` define `mirarPreparado`; `registrarAtaque()` consome a Ação e apaga essa preparação. Porém:
- `CalculadoraTesteLocal.tsx` não recebe estado/prop de Mirar e não inclui +2 no cálculo de Ataque.
- `FichaLocal.tsx` instancia a calculadora de Ataques sem qualquer informação do estado de Manobras.
- A própria interface informa que Mirar não aplica o bônus; o registro de Ataque apenas consome a preparação.

**Classificação: INCOMPLETO.** O custo e o marcador existem, mas o efeito canônico de +2 no Teste de Ataque e a escolha da região específica não estão conectados à rolagem. Não corrigido neste ciclo.

### 3.2 Combate com Duas Armas depende indevidamente de Mirar para registrar o Ataque inicial

**Evidência:**
- `registrarCombateDuasArmas()` exige `manobras.ataqueNormalRealizado === true`.
- O único controle da interface que chama `registrarAtaque()` está condicionado a `mirarPreparado` e rotulado “Registrar Ataque (consome Mirar)”.
- O controle genérico de Ação pode marcar Ação como usada, mas não define `ataqueNormalRealizado`.
- Portanto, uma personagem que use Atacar normalmente, sem Mirar, pode consumir a Ação, mas não consegue satisfazer a pré-condição interna para registrar Combate com Duas Armas.

**Classificação: COM ERRO DE INTEGRAÇÃO demonstrado por inspeção estática.** A elegibilidade do Ataque inicial não deve depender de Mirar. Nenhuma alteração de código foi feita; a correção deve separar registro de Atacar de consumo opcional da preparação de Mirar, preservando os estados existentes.

### 3.3 Manobras universais sem controles específicos

**Evidência:** `src/manobrasOperacionais.ts` contém helpers para Desengajar e Usar Objeto, mas `PainelAcoesLocal.tsx` não os chama. O painel permite consumir genericamente Movimento/Ação, sem registrar o contexto/efeito específico dessas Manobras. Também não foram identificados controles operacionais específicos no painel para Adiar Ação, Agarrar, Empurrar/Derrubar e Esconder-se; o catálogo textual de Manobras não equivale a integração operacional.

**Classificação: INCOMPLETO na interface.** Parte dos custos pode ser marcada por recursos genéricos, mas a Ficha não registra a Manobra específica nem seus efeitos/condições. É necessário decidir, conforme escopo aprovado, quais dessas ações devem ser apenas consulta/registro manual e quais precisam de controles próprios. Não inventar automações de movimento, disputa ou condição.

## 4. Reações defensivas e reações contextuais

- `avaliarJanelaReacao()` fecha Reações defensivas normais em 20 natural; Aparar exige Ataque Corpo a Corpo que atingiu Defesa e confirmação de que pode ser aparado; Esquiva depende de gatilho autorizado.
- A interface exige confirmação manual do contexto e declaração antes do cálculo do Teste de Esquiva.
- O cálculo defensivo usa Luta/Reflexos e resultado do Ataque como DT; não aplica Dano, BI ou Condições.
- Contra-Ataque padrão exige defesa bem-sucedida, respeita a restrição padrão a Ataque Corpo a Corpo (salvo exceção expressa), consome Reação e 1 SA; se a Reação normal já foi usada, compra Reação adicional por Esforço quando autorizado.
- Contra-Ataque Instintivo pode reutilizar a Reação registrada na defesa; a origem da Reação é persistida em `reacaoDefensivaRegistrada`.
- Ataque de Oportunidade exige confirmação de saída voluntária, quadrado ameaçado e ausência de proteção; não interrompe Movimento.
- Na Minha Mira, Não Vai Escapar, Retaliação e Resposta do Mercenário possuem validações contextuais/confirmadas, mas não executam Ataques nem resolvem consequências narrativas.
- **Aparar permanece deliberadamente bloqueado na interface** enquanto não existir estado confiável de arma empunhada, elegibilidade e Durabilidade. Não antecipar Inventário para contornar isso.

**Classificação:** helpers e integrações descritos estão IMPLEMENTADOS nos limites consultados; Aparar operacional permanece INCOMPLETO por dependência deliberadamente adiada. Testes humanos são necessários para validar sequência, salvamento e retomada.

## 5. Persistência e recuperação do estado de turno

- `carregarEstadoTurnoCombate()` valida o estado composto ou migra estruturas legadas reconhecidas em memória.
- Estado composto inválido bloqueia fallback para economia legada, evitando mascarar corrupção.
- `PainelAcoesLocal.aplicar()` serializa operações locais com bloqueio de operação, aguarda `aoSalvar` e só atualiza o estado visual/confirmação após retorno positivo.
- `FichaLocal.tsx` fornece o salvamento do painel por `aoSalvarRecursos`; a auditoria desta rodada não percorreu integralmente a transação IndexedDB para cada transição de Combate. A robustez estática da persistência geral foi registrada no checkpoint de persistência anterior, mas isso não substitui testes reais de reabertura/duas abas.

**Classificação:** IMPLEMENTADO em leitura estática; recuperação/concorrência PENDENTE DE TESTE HUMANO. Não há evidência nesta rodada para afirmar falha de persistência.

## 6. Testes encontrados e validação

Arquivos de teste identificados incluem:
- `tests/economia-acoes.test.mjs`
- `tests/manobras-operacionais.test.mjs`
- `tests/manobras-universais.test.mjs`
- `tests/estado-turno-combate.test.mjs`
- `tests/reacoes-combate.test.mjs`
- `tests/reacao-defensiva-ficha.test.mjs`
- `tests/teste-defensivo-ficha.test.mjs`

A existência desses arquivos não comprova execução/aprovação no HEAD atual. Nenhum teste local, CI ou humano foi executado por esta sessão.

## 7. Alterações e restrições

- Nenhum arquivo de código foi alterado.
- Este ciclo registra achados e pendências; não corrige os dois problemas de integração acima.
- Sem alteração visual, LAN, Supabase, banco, `main`, merge, deploy ou publicação.
- Nenhuma branch foi criada.
- Inventário ativo permanece bloqueado até validação humana da Ficha Offline e aprovação expressa.

## 8. Próximas ações

1. Corrigir em alteração pequena o registro de Ataque normal para que Combate com Duas Armas não dependa de Mirar.
2. Integrar o +2 de Mirar ao Teste de Ataque e a escolha da região específica, sem aplicar bônus quando a preparação não estiver ativa e sem remover Desvantagem.
3. Definir/implementar o nível de integração de Desengajar, Usar Objeto, Agarrar, Empurrar/Derrubar, Esconder-se e Adiar Ação, sem automatizar deslocamento ou disputas.
4. Continuar auditoria de exceções de Reações/Habilidades e verificar salvamento/recuperação das transições restantes.
5. Atualizar a matriz e a linha de continuidade em cada ciclo; depois concluir a bateria humana progressiva antes de qualquer módulo futuro.
