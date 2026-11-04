# Checkpoint — consolidação da Ficha offline

**Data:** 04/11/2026  
**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Branch de trabalho:** `feat/offline-first-ficha`  
**HEAD conferido:** `ab4c37cd702b674b0c6981f6a8e43176920fb19e`

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

## 3. Evidências automatizadas

No commit `ab4c37cd`, os dois workflows do GitHub Actions concluíram com sucesso:

1. **Verificação da ficha offline** — `pnpm test`: 342 testes, 342 aprovados, 0 falhas; build executado também com sucesso.
2. **Validar compilação do WebApp** — verificações locais de PostgreSQL/permissões, compilação TypeScript/Vite e verificação de tipos isolados concluídas com sucesso.

Testes acrescentados nesta rodada:
- `tests/pendencias-edicao.test.mjs`: cobre rastreamento de edições e alerta de saída.
- `tests/persistencia-gravacao.test.mjs`: verifica que o salvamento só resolve após `oncomplete` e rejeita transação abortada.

Esses resultados são testes automatizados, com simulações de IndexedDB onde indicado. Não equivalem a teste em navegador real nem em dispositivo móvel.

## 4. Revisões realizadas

- Confirmado que `salvarPersonagem` aguarda `oncomplete` antes de resolver.
- Confirmado que a gravação armazena `structuredClone(personagem)`.
- Confirmado que importação em lote usa `add` dentro de uma transação única e substituição usa `clear` + `put` dentro de uma transação única.
- Confirmado que a fila continua apta a processar a próxima operação após falha anterior (testes existentes).
- Confirmado que a interface atual não implementa combate operacional nem alterações de PV/SA/BI atuais.
- Confirmado que o layout contém regras responsivas para larguras móveis; ainda falta homologação visual humana.
- Identificados documentos antigos de teste que descrevem o fluxo Supabase anterior. Não usar esses roteiros como instrução para a bateria da Ficha offline sem revisão.

## 5. Pendências técnicas antes da bateria humana

1. Ampliar testes automatizados de operações IndexedDB (listar, obter, excluir, lote e substituição) com cenários de falha/abortamento.
2. Revisar integridade de dados e validação de estrutura dos registros locais e do backup, sem alterar o cânone.
3. Revisar ciclo de vida da ficha: criação, abertura, múltiplos salvamentos em seções diferentes, fechamento, reabertura e exclusão.
4. Revisar service worker e instalação/atualização do shell, sem cachear dados pessoais.
5. Conferir todos os campos e cálculos da criação contra o Arquivo do Jogador v1.0 e a organização do protótipo mobile aprovado.
6. Preparar um único roteiro humano atualizado, com testes desktop e Android, incluindo instalação PWA, primeiro carregamento, modo avião, recarga, backup e recuperação.

## 6. Estados

- **IMPLEMENTADO:** ficha offline como entrada principal, persistência IndexedDB, backup JSON, fila serializada, rastreamento de edições pendentes, aviso de saída.
- **TESTADO AUTOMATICAMENTE:** 342 testes e workflows do commit acima.
- **NÃO TESTADO EM NAVEGADOR REAL:** IndexedDB nativo, Service Worker real, instalação PWA, recarga offline e comportamento móvel.
- **PENDENTE:** revisão integral do cânone e da interface, ampliação dos testes de persistência e preparação da bateria humana.
- **NÃO AUTORIZADO:** merge, publicação, alteração de `main` ou Supabase de produção.

## 7. Próxima etapa

Continuar com testes automatizados de persistência e revisão do ciclo de vida da ficha. A bateria humana só será solicitada quando as pendências técnicas relevantes estiverem resolvidas e o roteiro consolidado estiver pronto.
