# Checkpoint — primeira entrada funcional da Ficha offline

**Data:** 03/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD após as alterações:** `8fc5387ca6e3cf973f7e84dde4a733cff45b4fd5`

## Objetivo desta etapa

Criar uma entrada React independente para a Ficha do Jogador, sem exigir autenticação, Supabase, Mesa ou servidor, e conectar o ciclo básico de personagens ao IndexedDB já criado.

## Alterações realizadas

- Criado `src/FichaOfflineApp.tsx`.
  - Carrega a lista com `listarPersonagens()`.
  - Permite criar um registro local com nome e identificador estável.
  - Permite abrir a ficha contínua existente (`FichaLocal`).
  - Conecta os salvamentos de Características, Atributos/Perícias e Inventário a `salvarPersonagem()`.
  - Atualiza a interface somente depois da confirmação da transação IndexedDB.
  - Permite excluir uma ficha mediante confirmação na lista.
  - Exporta as fichas locais em JSON versionado por meio de `criarBackup()` e `serializarBackup()`.
  - Apresenta estados de carregamento, vazio, salvamento, sucesso e erro.
- `src/main.tsx` agora monta `FichaOfflineApp` em vez de `App`. O fluxo legado permanece no repositório, mas deixa de ser o caminho inicial da aplicação.
- `src/styles.css` recebeu estilos da entrada offline e da confirmação de exclusão.
- `index.html` recebeu título coerente com a nova entrada.
- Nenhum dado de personagem foi colocado em localStorage, Cache API ou Service Worker. A persistência de personagem continua no IndexedDB.

## Limites conhecidos — não confundir com ficha concluída

- A criação inicial nesta etapa solicita apenas o nome; o restante é preenchido nos editores já existentes dentro da ficha.
- A ficha contínua ainda se identifica como rascunho/não ativa.
- A seção Combate continua informativa; PV, SA e BI atuais, ações, rolagens e resolução de combate ainda não estão implementados.
- O inventário permanece no escopo de planejamento inicial existente; não equivale ao módulo completo de inventário ativo/Baú.
- Importação de backup, prévia, resolução de IDs duplicados e restauração ainda não foram conectadas à interface.
- A homologação visual contra o protótipo congelado ainda não foi realizada.
- O fluxo legado e a dependência Supabase permanecem no código, mas não são importados pela nova entrada offline.

## Verificações realizadas nesta etapa

- Consultada a branch antes das alterações; o HEAD inicial correspondia ao checkpoint arquitetural registrado.
- Conferidos os contratos atuais de `persistenciaFicha.ts`, `backupFicha.ts`, `FichaLocal.tsx`, editores, `main.tsx`, `styles.css`, `index.html` e `tsconfig.json`.
- Após as alterações, consultados novamente os arquivos centrais e confirmado:
  - a entrada React monta `FichaOfflineApp`;
  - os manipuladores de exclusão e a confirmação estão presentes;
  - as referências antigas de exclusão foram removidas;
  - os estilos da nova entrada, da ficha e da exclusão estão presentes.
- **Build TypeScript/Vite: não executado.** O ambiente de trabalho desta conversa não contém checkout local do repositório e não foi possível executar `pnpm build` pela API do GitHub.
- **Testes automatizados: não executados nesta etapa.** Não há resultado novo de teste de IndexedDB em navegador.
- **Teste manual em navegador: pendente.**

## Próxima etapa técnica

1. Conseguir executar build e suíte de testes em checkout atualizado da branch.
2. Corrigir qualquer erro encontrado pelo compilador.
3. Conectar importação JSON com validação e prévia, sem sobrescrita silenciosa.
4. Testar persistência IndexedDB em navegador real.
5. Prosseguir para a revisão canônica e integração gradual dos módulos da ficha.

## Segurança de branch

Nenhuma alteração foi feita em `main`; não houve merge, PR ou publicação. A branch de trabalho permanece isolada.
