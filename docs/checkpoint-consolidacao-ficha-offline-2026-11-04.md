# Checkpoint — consolidação da Ficha offline

**Data:** 04/11/2026  
**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Branch de trabalho:** `feat/offline-first-ficha`  
**HEAD conferido:** `71bc332c0dfbb9adcc24d0418eae33834b822794`

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
