# Checkpoint — consolidação da Ficha offline

**Data:** 04/11/2026  
**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Branch de trabalho:** `feat/offline-first-ficha`  
**HEAD conferido na atualização:** `a90f6aff65500a1558d48d0ba1c1a0321e01a847`  
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

- Banco IndexedDB: `ameaca-biologica-ficha`, store `personagens`, versão 1.
- Gravação, exclusão e restauração aguardam conclusão da transação IndexedDB.
- Fila serializada impede sobreposição de patches de salvamento dentro da instância da aplicação.
- Backup JSON versionado permite validar, exportar, importar como cópias e substituir o conjunto local em transação única.
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

Iniciar pela proposta técnica da seção 7 do documento `auditoria-esquema-dados-ficha-offline-2026-11-04.md`: desenhar o contrato versionado e os testes de integridade antes de alterar a implementação. Em paralelo, inspecionar os testes existentes e identificar a menor forma segura de executar a suíte no HEAD atual. Não iniciar mudanças no Inventário antes de fechar a integridade e a persistência/ciclo de vida, mas mantê-lo dentro deste mesmo ciclo da Ficha.
