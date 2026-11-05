# Checkpoint — consolidação da Ficha offline

**Data:** 04/11/2026  
**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Branch de trabalho:** `feat/offline-first-ficha`  
**HEAD conferido na atualização inicial:** `a90f6aff65500a1558d48d0ba1c1a0321e01a847`  
**HEAD após primeira implementação da validação:** `07e185a81184a8be563bb7c1d2e460934e83410a`  
**HEAD após primeira implementação/refinamentos:** `e162a0854d9ff86f07c3e757cc77e75581ac1f78`  
**HEAD após segunda revisão da validação incremental:** `0f4c037fe6f560da1e5a21c909e3e23909155da3`  
**Commit com CI completo anteriormente comprovado:** `71bc332c0dfbb9adcc24d0418eae33834b822794`

> Este checkpoint registra o estado observado nesta data. Não autoriza merge, publicação, alteração de `main` ou mudanças no Supabase de produção.

## 1. Linha de entrada atual

- `src/main.tsx` monta `FichaOfflineApp`, não o fluxo legado de autenticação.
- `src/FichaOfflineApp.tsx` usa `persistenciaFicha.ts` e a fila serializada local.
- A ficha abre em modo offline, sem exigir conta ou servidor.
- O Service Worker (`public/sw.js`) guarda somente o shell estático e recursos locais; não armazena respostas de API nem dados pessoais.
- `src/FichaLocal.tsx` apresenta ficha única e contínua, com Características, Atributos e Perícias, Combate e Inventário.
- A ficha permanece identificada como rascunho não ativo. Combate operacional, recursos atuais, estados ativos do inventário e demais módulos não devem ser considerados implementados só por aparecerem como resumo ou preparação na interface.

## 2. Persistência e segurança local

- Banco IndexedDB: `ameaca-biologica-ficha`, store `personagens`, versão 2. A migração v1→v2 atribui `geracao` aos registros anteriores.
- Gravação, exclusão e restauração aguardam conclusão da transação IndexedDB.
- Fila serializada impede sobreposição de patches de salvamento dentro da instância da aplicação. `salvarPatchPersonagem()` lê, compara, mescla e grava dentro de uma transação `readwrite`; conflitos na mesma chave são recusados e `geracao` invalida edições antigas após restauração.
- Backup JSON versionado permite validar, exportar, importar como cópias e substituir o conjunto local em transação única. A validação compartilhada entre backup e persistência está implementada inicialmente em `src/validacaoPersonagemLocal.ts`.
- Edições locais pendentes são rastreadas por seção. Fechar a ficha solicita confirmação de descarte; falhas de gravação impedem fechar.
- `beforeunload` solicita aviso do navegador quando há alterações locais pendentes. O comportamento final depende do navegador e não substitui persistência.
- O Service Worker não armazena dados pessoais. Os dados da ficha ficam no IndexedDB separado.
- Tratamento de `versionchange` e abertura bloqueada fecha conexões antigas e protege a referência da abertura mais recente.

## 3. Evidências automatizadas

No commit `71bc332c`, os dois workflows do GitHub Actions concluíram com sucesso:

1. **Verificação da ficha offline** — `pnpm test`: 348 testes, 348 aprovados, 0 falhas, 0 cancelamentos; TypeScript e build Vite concluídos com sucesso.
2. **Validar compilação do WebApp** — verificações locais de PostgreSQL/permissões, compilação TypeScript/Vite e verificação de tipos isolados concluídas com sucesso.

Testes acrescentados/cobertos nesta consolidação:
- `tests/pendencias-edicao.test.mjs`: rastreamento de edições e alerta de saída.
- `tests/persistencia-gravacao.test.mjs`: salvamento só resolve após `oncomplete` e rejeita transação abortada.
- `tests/persistencia-versionchange.test.mjs`: troca de versão, invalidação segura da abertura e conexão tardia após bloqueio.
- `tests/persistencia-operacoes.test.mjs`: listagem, leitura, exclusão, lote, colisão, substituição e rollback.
- `tests/service-worker-shell.test.mjs`: isolamento de API/escritas, fallback de navegação offline e limpeza de cache versionado.

Esses resultados são testes automatizados; há simulações de IndexedDB e Service Worker. Não equivalem a teste em navegador real nem em dispositivo móvel.

## 4. Revisões realizadas

- Confirmado que gravação só resolve após `oncomplete`.
- Confirmado que a gravação armazena cópia estruturada do personagem.
- Confirmado que importação em lote e substituição usam transação única; substituição abortada deve reverter o conjunto.
- Confirmado que a fila continua apta a processar a próxima operação após falha anterior.
- Confirmado que a interface atual não implementa combate operacional nem alterações de PV/SA/BI atuais.
- Confirmado que o layout contém regras responsivas para larguras móveis; ainda falta homologação visual humana.
- Identificados documentos antigos de teste que descrevem o fluxo Supabase anterior. Não usar esses roteiros como instrução para a bateria da Ficha offline sem revisão.

## 5. Pendências técnicas antes da bateria humana

1. Revisar integridade de dados e validação de estrutura dos registros locais e do backup, sem alterar o cânone.
2. Revisar ciclo de vida da ficha: criação, abertura, múltiplos salvamentos em seções diferentes, fechamento, reabertura e exclusão.
3. Revisar instalação/atualização real do Service Worker e comportamento de cache no navegador.
4. Conferir todos os campos e cálculos da criação contra o Arquivo do Jogador v1.0 e a organização do protótipo mobile aprovado.
5. Revisar legibilidade e fluxo mobile a partir do código e preparar validação visual.
6. Preparar um único roteiro humano atualizado, com testes desktop e Android, incluindo instalação PWA, primeiro carregamento, modo avião, recarga, backup e recuperação.

## 6. Estados

- **IMPLEMENTADO:** ficha offline como entrada principal, persistência IndexedDB, backup JSON, fila serializada, rastreamento de edições pendentes, aviso de saída.
- **TESTADO AUTOMATICAMENTE:** 348 testes e workflows do commit `71bc332c`.
- **NÃO TESTADO EM NAVEGADOR REAL:** IndexedDB nativo, Service Worker real, instalação PWA, recarga offline e comportamento móvel.
- **PENDENTE:** revisão integral do cânone, integridade e ciclo de vida, validação visual e preparação da bateria humana.
- **NÃO AUTORIZADO:** merge, publicação, alteração de `main` ou Supabase de produção.

## 7. Próxima etapa

Continuar com auditoria da criação da ficha contra o Arquivo do Jogador v1.0 e o Planejamento v2.0, seguida da revisão do ciclo de vida. A bateria humana só será solicitada quando as pendências técnicas relevantes estiverem resolvidas e o roteiro consolidado estiver pronto.


---

## 8. Atualização de decisões aprovadas pelo usuário — 04/11/2026

Esta seção registra decisões expressas por Gus nesta data e prevalece sobre propostas anteriores incompatíveis. O Documento Mestre de Planejamento v2.1 foi mencionado pelo usuário como criado anteriormente, mas seu conteúdo integral não está disponível neste repositório/contexto. Portanto, registrar somente as decisões explicitamente confirmadas abaixo; não reconstruir nem presumir o restante do v2.1.

### 8.1 Direção arquitetural e sequência do produto

- Priorizar o funcionamento **offline de cada parte do projeto**, começando pela Ficha.
- Depois de consolidar os módulos offline, implementar a conexão entre o projeto inteiro por **LAN (rede local)**.
- A sequência offline-first → conexão LAN substitui, como direção de desenvolvimento aprovada, a interpretação de que a próxima prioridade seria completar primeiro toda a arquitetura online/Supabase prevista no Planejamento v2.0.
- Não presumir detalhes ainda não confirmados da arquitetura LAN, sincronização, autoridade de dados, conflitos ou topologia. Projetá-los e documentá-los quando a etapa chegar.
- Referência histórica recuperada de conversa anterior: sequência local → abrir offline → persistência → sincronização pela LAN; sincronização do notebook do Mestre foi tratada separadamente. Também foi mencionado um protótipo de serviço local `ameaca-biologica-local-prototype` v0.1.0-prototipo, com SQLite e caminho Vite/`?servidor=local`/`ConexaoServidorLocal`. Isso é contexto histórico a verificar no código/documentos antes de reutilizar, não autorização para assumir que está integrado ou aprovado como arquitetura final.

### 8.2 Ordem de trabalho da Ficha neste ciclo

A ordem aprovada para concluir a Ficha offline é:

1. Corrigir a integridade dos dados e a validação interna de registros e backups. Criar contrato versionado que aceite rascunhos parciais legítimos, valide seções presentes, preserve campos desconhecidos e seja compartilhado entre persistência e backup.
2. Validar e corrigir a persistência, o ciclo de vida e a concorrência, incluindo salvamento, exclusão, restauração, múltiplas abas e geração do conjunto local.
3. Concluir a sequência integrada da ficha: criação → edição de Características → edição de Atributos e Perícias → salvamento → fechamento/reabertura → backup/exportação → importação/restauração → exclusão.
4. **Concluir o Inventário neste mesmo ciclo da Ficha**, depois dos itens anteriores. Inventário não deve ser empurrado para uma fase futura independente da conclusão da ficha.
5. Executar os testes automatizados possíveis e revisar a implementação antes de solicitar testes humanos.
6. Somente após os itens técnicos, realizar homologação humana desktop e mobile.

### 8.3 Identidade visual e homologação

- A identidade visual deve permanecer fiel aos protótipos congelados aprovados, tanto mobile quanto desktop.
- Os protótipos são a referência visual e funcional; não redesenhar a interface por preferência técnica nem substituir sua identidade.
- Os testes humanos ainda não começaram. A homologação visual e funcional será feita pelo usuário depois da conclusão das pendências técnicas e do Inventário.
- Quando um teste depender de interação humana, fornecer ao usuário um passo a passo claro, curto e reproduzível. Não solicitar testes humanos antecipadamente quando houver verificações automatizadas ou inspeções de código que possam ser feitas antes.

### 8.4 Processo de trabalho e autonomia técnica

- Avançar o máximo possível sem exigir acompanhamento de cada detalhe técnico.
- Executar atividades independentes em paralelo sempre que seguro, inclusive inspeções e preparação de tarefas enquanto o GitHub Actions/CI estiver executando testes.
- Não interromper o usuário com atualizações sobre cada operação rotineira. Apresentar resultados consolidados, riscos relevantes e decisões que realmente dependam dele.
- Não presumir conhecimento de programação; instruções humanas devem ser simples e reproduzíveis.
- Distinguir sempre PLANEJADO, IMPLEMENTADO, TESTADO AUTOMATICAMENTE, TESTADO HUMANAMENTE, HIPÓTESE e PENDENTE.
- Não declarar testes/build como aprovados sem evidência do commit correspondente. Resultado de commit anterior não comprova automaticamente o HEAD atual.
- Não fazer merge, publicar, alterar `main` ou modificar Supabase de produção sem autorização expressa.

### 8.5 Ambiente de homologação

- Prioridade de implementação e testes: Windows.
- Linux Mint: etapa posterior.
- Samsung DeX / Galaxy S24 FE: testar somente depois que o restante estiver pronto.
- A validação humana deve cobrir desktop e Android quando a etapa de homologação chegar.

### 8.6 Estado de CI na atualização deste checkpoint

- HEAD consultado: `a90f6aff65500a1558d48d0ba1c1a0321e01a847`.
- A consulta de status de commit não retornou verificações associadas a esse SHA; a consulta de workflows associadas ao commit também não retornou execuções.
- O resultado de 348/348 testes, TypeScript e build Vite aprovado continua comprovado somente para o commit `71bc332c0dfbb9adcc24d0418eae33834b822794`, conforme a seção 3. Não atribuir esse resultado ao HEAD `a90f6aff` sem nova execução.
- O commit `a90f6aff` ajustou o mock da transação no teste de migração; ainda é necessário executar/observar a suíte no HEAD atual.

## 9. Próxima etapa operacional aprovada

A proposta de contrato compartilhado da seção 13 do documento `auditoria-esquema-dados-ficha-offline-2026-11-04.md` recebeu uma implementação inicial nas seções 14 e 15. Próximo: confirmar suíte completa e build no HEAD `e162a085`, corrigir falhas encontradas e revisar todos os caminhos de escrita/importação. Depois concluir ciclo de vida/concorrência e Inventário, nesta ordem e dentro do mesmo ciclo da Ficha.


## 10. Andamento após as decisões do usuário — 05/11/2026

- Decisões de produto e processo registradas na seção 8 deste documento.
- A auditoria do contrato local evoluiu para uma implementação inicial de validador compartilhado entre IndexedDB e backup.
- O patch de salvamento passou a validar o registro mesclado antes de confirmar a transação.
- Testes específicos foram adicionados/ajustados para refletir o contrato atual.
- Referência detalhada: `docs/auditoria-esquema-dados-ficha-offline-2026-11-04.md`, seções 14 a 16.
- **CI/build nos HEADs posteriores (`0f4c037f` e `0c0ff480`): pendentes de confirmação.** Não considerar os testes aprovados até obter o resultado do workflow correspondente.
- **Testes humanos:** ainda não iniciados, conforme decisão do usuário; solicitar somente após concluir verificações técnicas e Inventário.


## 11. Revisão adicional — 05/11/2026

- A validação incremental agora verifica nomes de Perícia e compatibilidade com Origem mesmo antes de a seção estar completa.
- A proteção JSON-safe agora rejeita estruturas que seriam descartadas ou transformadas silenciosamente pelo backup JSON.
- Os imports da cadeia do planejador de inventário foram ajustados para a resolução ESM do runner Node.
- Foram acrescentados testes específicos para esses casos.
- HEAD de código após esses ajustes: `0f4c037fe6f560da1e5a21c909e3e23909155da3`.
- **Execução de `pnpm test` e `pnpm build`: não confirmada.** O conector consultado não retornou status nem workflow runs associados ao commit. A validação permanece pendente; não iniciar homologação humana ainda.


## 12. Correções do checkpoint e estado consolidado — 05/11/2026

Esta seção atualiza pontos do retrato inicial que ficaram desatualizados.

### Estado real do código

- **Banco IndexedDB:** versão 2, não versão 1. A migração v1→v2 atribui `geracao` às fichas antigas.
- **Integridade:** `src/validacaoPersonagemLocal.ts` centraliza a validação usada por persistência e backup. A implementação cobre rascunho mínimo, seções parciais, campos conhecidos, validação de Perícias, Características, Identidade e compras iniciais, além de preservação de campos futuros JSON válidos.
- **Persistência concorrente:** o patch transacional e o token de geração estão implementados. A homologação em duas abas reais ainda falta; os testes existentes usam mocks.
- **Backup:** a leitura de backup legado sem `geracao` gera um novo token antes de permitir a importação; a escrita/exportação atual exige geração válida.
- **Validação de Perícias parciais:** nomes e compatibilidade com Origem são conferidos mesmo antes de a seção estar completa.
- **JSON-safe:** rejeita estruturas que JSON descartaria/transformaria silenciosamente, como `undefined`, símbolos, propriedades não enumeráveis, getters, arrays com lacunas, ciclos e protótipos não simples.

### Commits relevantes de código

- `b4060b44`: validação de Perícias em rascunhos parciais.
- `cf44e7f7`, `3fa4b16c`, `6bb16fc0`: endurecimento da verificação JSON-safe e testes.
- `0f4c037f`: imports do planejador de inventário compatíveis com a resolução ESM do runner Node.
- `7de2e0e9`: editor de Identificação remonta quando os dados da ficha são atualizados/recarregados.
- `30008bb2`, `fb7b66b2`, `0c0ff480`: validação de arrays sem executar getters, regressões e remoção de auxiliar sem uso.

### Documentação

- Auditoria técnica: `docs/auditoria-esquema-dados-ficha-offline-2026-11-04.md`, seções 13 a 17.
- O histórico de concorrência foi corrigido: a antiga recomendação de implementar patch transacional e geração por registro já foi atendida no código; permanece pendente somente o teste real em navegador com duas abas.

### Verificação e próximos passos

- **CI / `pnpm test` / `pnpm build`: pendentes de confirmação no HEAD atual.** A consulta disponível ao GitHub não retornou status nem execuções associadas aos commits recentes.
- Não considerar a validação concluída nem iniciar a bateria humana até executar a suíte/build em runner real.
- Próximo: confirmar automação, revisar o fluxo integrado de criação e backup, depois homologar em duas abas reais a mesclagem de patches e a invalidação por `geracao` após restauração, e concluir o Inventário neste ciclo da Ficha.
- **HEAD do código após os últimos ajustes:** `0c0ff48016bc5532949018609c069203cb7eb35d`.
- **HEAD documental após esta atualização:** `549b817320d0a848e94e752a350970c70aada6b1` (antes da presente correção documental).

## 13. Continuação da auditoria — 05/11/2026

- Corrigido o estado do editor de Identificação após recarga de dados externos: agora o componente é remontado quando nome/Identidade mudam. Isso evita manter valores narrativos antigos em memória depois de recarregar a ficha.
- A validação JSON-safe de arrays agora rejeita lacunas, propriedades extras e getters sem executar esses getters nem criar alocação desnecessária.
- Testes de regressão foram acrescentados em `tests/pendencias-edicao.test.mjs` e `tests/validacao-personagem-local.test.mjs`.
- Auditoria detalhada: seção 18 de `docs/auditoria-esquema-dados-ficha-offline-2026-11-04.md`.
- **CI/build:** ainda sem confirmação observável. Não houve execução local nem retorno de checks do GitHub para o HEAD atual.

## 14. Auditoria do Inventário inicial — 05/11/2026

- Confirmado no código: esta etapa implementa planejamento/prévia do Inventário inicial, não o Inventário ativo.
- A suíte `tests/inventario-criacao.test.mjs` já cobre nove kits, itens característicos, armas não equipadas, munição, moedas, compras, instâncias, determinismo, entradas inválidas e capacidade.
- As lacunas do Inventário ativo foram registradas em `docs/auditoria-inventario-inicial-2026-11-05.md`.
- **Próxima etapa funcional:** primeiro confirmar testes/build e o ciclo de persistência do plano; depois implementar a grade/instâncias e operações do Inventário ativo em incrementos pequenos, respeitando a versão de planejamento mais recente. O v2.1 mencionado pelo usuário ainda não está anexado aqui.
- **Não iniciar ainda:** Baú, fabricação, consumo ou combate como um pacote único. São operações distintas, com efeitos e permissões próprios.

## 15. Decisão de sequência do Baú — 05/11/2026

- Decisão expressa do usuário: o **Baú será implementado somente ao final**, quando começar a conexão integrada de todo o projeto ao Laboratório via LAN.
- O Baú compartilhado, transferências e sincronização correspondentes ficam fora do ciclo atual de Inventário offline.
- O trabalho atual pode avançar no Inventário individual/offline e em suas operações próprias, sem antecipar o Baú nem presumir o desenho de sincronização LAN.
- A auditoria específica foi atualizada em `docs/auditoria-inventario-inicial-2026-11-05.md`.


## 16. Funcionalidade da ficha em paralelo à infraestrutura — 05/11/2026

A pedido do usuário, o trabalho funcional da ficha avançou em paralelo à prioridade 1 LAN, sem esperar a infraestrutura ficar concluída.

### Implementado no protótipo da ficha contínua

- **Preferências de funcionamento:** novo editor de Automático/Misto/Manual, com escolhas específicas do Misto preservadas ao alternar modos. A configuração é validada estritamente e gravada no registro da personagem, tanto no armazenamento local quanto no fluxo de servidor local. A confirmação visual ocorre somente após a resposta de sucesso. Isso registra preferências; ainda não dispara automações de combate/inventário.
- **Perícias:** cálculo do valor base como Atributo associado + bônus de Treinamento; exibição do Passivo como 10 + valor base. O Atributo não deve ser somado novamente ao realizar o Teste.
- **Bio-Infecção:** cálculo da fase a partir de BI atual e BI máxima, com limites das cinco fases e indicação de Colapso Viral. Para rascunho sem campo de BI atual, a exibição inicial usa BI 0, conforme a criação. O módulo não aumenta BI, não aplica efeitos, não rola dados nem inicia Reanimação.
- **Revisão da criação:** painel local que lê os dados salvos, mostra itens conferidos/pendentes/a revisar e oferece atalhos para as seções. Não altera dados, não restaura recursos e não ativa a personagem.
- O painel de funcionamento e a revisão foram mantidos dentro da ficha contínua, sem criar navegação paralela de abas.

### Validação automatizada

- Commit 76a1320800ed3a0d511eb0573b7c3e8164b6658e: ambos os workflows concluíram com sucesso; **386/386 testes**, TypeScript e build Vite aprovados.
- Commit 2c370dc033376a6aebce966a7b57c204570c3ec7: ambos os workflows concluíram com sucesso; **387/387 testes**, TypeScript, build Vite e verificações PostgreSQL aprovados.
- As falhas intermediárias de CI foram analisadas e corrigidas antes desses resultados; não são consideradas aprovação.
- O HEAD de código desta atualização é 2c370dc033376a6aebce966a7b57c204570c3ec7.

### Limites e pendências

**IMPLEMENTADO E TESTADO AUTOMATICAMENTE:** preferências persistidas/validadas; cálculos de Perícias e Passivos; cálculo de fase de BI; revisão da criação.

**AINDA NÃO IMPLEMENTADO:** execução das automações configuradas, controles operacionais de PV/SA/BI, combate ativo, rolagens, consumo de munição/itens, inventário ativo e finalização/ativação. Esses módulos devem ser implementados individualmente, conforme cânone e planejamento; não tratar o editor de preferências como se já executasse as automações.

**TESTES HUMANOS:** adicionados à etapa H4, agrupados para o final. Nenhum foi realizado nesta etapa.

Nenhuma publicação, merge, alteração em main ou mudança no Supabase de produção.


## 17. Calculadora manual de Testes — 05/11/2026

Foi implementada uma calculadora de conferência em src/testes.ts e src/CalculadoraTesteLocal.tsx, integrada à seção Atributos e Perícias.

- Permite escolher Teste de Perícia ou Teste puro de Atributo.
- Perícia utiliza o valor já calculado (Atributo associado + Treinamento); o Atributo não é somado novamente.
- Recebe modificador circunstancial e DT; aceita tarefa Impossível sem pedir rolagem.
- Em rolagem Normal recebe um resultado físico de d20; com Vantagem/Desvantagem recebe dois e escolhe o melhor/pior.
- Trata 20 natural como sucesso automático quando possível; 1 natural como Falha Crítica e Exposto, salvo regra específica.
- A ferramenta não gera dados aleatórios, não grava histórico, não altera ficha/recursos e não executa ações.

### Evidência automatizada

Commit ab313a7c84cec825d368ba3ed6743ee413eabd4b: os dois workflows do GitHub Actions concluíram com sucesso; **395/395 testes aprovados**, TypeScript, build Vite e verificações PostgreSQL concluídos.

**HUMAN TESTED:** não. A validação de interface continua enfileirada em H4, junto com as preferências, valores de Perícia/Passivo, BI e revisão da criação.

**Limite funcional:** esta calculadora é de entrada manual de dados físicos. O fluxo de dados virtuais/mistos e o registro/histórico de rolagens ainda não foram implementados.


## 18. Refinamentos de regras e validação — 05/11/2026

A revisão do Planejamento v2.1 corrigiu a apresentação do Passivo e consolidou os efeitos numéricos de Bio-Infecção:

- **Passivo:** a ficha mostra somente o valor normal (10 + valor da Perícia) e um lembrete de +5 com Vantagem / -5 com Desvantagem. Não são exibidos três valores calculados, conforme decisão expressa A11 do planejamento.
- **Bio-Infecção:** além da fase e do texto de efeito, o código deriva Movimento efetivo por BI, bônus em Testes de Ataque, dano adicional corpo a corpo e Desvantagem da 5ª fase. Esses dados são apenas informativos; não aplicam efeitos nem alteram recursos.
- **Calculadora manual:** texto esclarece que, em Ataque de Pontaria/Luta, 20 natural também acerta automaticamente, fecha Reações defensivas normais e causa Crítico. Arma, Dano e efeitos específicos continuam sem execução automática.
- **Método de dados:** Físicos/Virtuais/Mistos, histórico e visibilidade não estão implementados pelo editor de automações. A calculadora atual aceita somente resultados físicos informados manualmente; a interface explicita essa limitação.

### Evidência automatizada atualizada

Commit acfa0e537049f4e84b142d16ab65f49cffe04287: ambos os workflows concluíram com sucesso; **396/396 testes aprovados**, TypeScript, build Vite e verificações PostgreSQL concluídos.

**PENDENTE:** teste humano H4 dos valores exibidos e da calculadora; módulos operacionais de Combate, Inventário ativo, recursos atuais e rolagens virtuais/mistas continuam por implementar.


## 19. Preferências de dados, visibilidade e compatibilidade — 05/11/2026

A configuração de funcionamento agora persiste, por personagem, também:
- método de dados: Físicos, Virtuais ou Mistos;
- visibilidade padrão: Pública ou Privada;
- padrões aprovados: Mistos e Pública.

A configuração antiga que ainda contém apenas modo de automação e preferências do Misto continua válida. Ao abrir a ficha, o normalizador apresenta Mistos/Pública como padrão; ao salvar, a configuração completa é persistida. Não há migration SQL porque as preferências ficam no JSON da personagem.

A pré-ativação passou a usar a mesma função de validação da configuração. Configuração antiga é reconhecida, mas as duas opções do Misto que permanecem sem padrão universal (BI infectante e Durabilidade ao Aparar) continuam exigindo escolha explícita antes da ativação. Nenhuma escolha é preenchida automaticamente.

### Validação automatizada

Commit 9a8b45d519cf664402e6b88fc4418a61f5904305: ambos os workflows concluíram com sucesso; **396/396 testes aprovados**, build Vite, TypeScript, tipos dos cenários isolados e verificações PostgreSQL aprovados.

**IMPLEMENTADO E TESTADO AUTOMATICAMENTE:** persistência local/servidor das preferências de modo de dados e visibilidade; padrões Mistos/Pública; compatibilidade com configuração antiga; validação compartilhada na pré-ativação.

**PENDENTE:** geração de dados virtuais, fluxo misto de rolagem, registro/histórico, visibilidade efetiva de registros e permissões. A calculadora existente continua limitada a resultados físicos informados manualmente.
