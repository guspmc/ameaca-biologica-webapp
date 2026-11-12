# Checkpoint — auditoria do Hub, PWA e backup Offline

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD de código/documentação auditado:** `94f7d4a17f2ba741ef2d2e90e7f3273dab7ffe84`  
**Escopo:** inspeção estática da entrada principal, QR/convites, PWA, scripts Windows, backup JSON e IndexedDB. Nenhum código de produto foi alterado neste checkpoint.

## 1. Entrada do aplicativo e Hub

### Evidências

- `src/main.tsx` é o ponto de entrada Vite efetivo inspecionado. Ele importa `FichaOfflineApp` e `ConexaoServidorLocal`.
- A URL com `?servidor=local` abre diretamente `ConexaoServidorLocal`.
- Sem esse parâmetro, a aplicação abre diretamente `FichaOfflineApp`.
- `src/App.tsx` contém uma lógica de rotas diferente, incluindo `LaboratorioLocal`, mas não é importado pelo `src/main.tsx` observado.
- `src/LaboratorioLocal.tsx` identifica o ambiente como laboratório fictício/local e informa que não conecta ao servidor nem sincroniza Mesas reais.

### Classificação

- Entrada Offline direta: **IMPLEMENTADO**.
- Entrada LAN direta por parâmetro: **IMPLEMENTADO**.
- Hub integrado com primeira escolha LAN/Offline: **INCOMPLETO / não localizado no ponto de entrada ativo**.
- `App.tsx` e `LaboratorioLocal.tsx`: **candidatos a legado/sem uso no caminho ativo**; não remover antes de mapear referências e testes.

## 2. QR Code e convite LAN

### Evidências

- `src/PainelMestreLocal.tsx` monta o link de convite usando o IP LAN, caminho atual, `servidor=local` e `convite=<código>`.
- O componente `QRCodeLocal` gera a imagem QR a partir do link recebido.
- `src/ConexaoServidorLocal.tsx` inicializa o campo de código de convite a partir do parâmetro `convite` da query string.
- O código de convite não concede acesso automaticamente; o usuário ainda solicita ingresso e depende de aprovação, conforme mensagem da interface.

### Classificação

- Geração de QR com endereço e convite: **IMPLEMENTADO**.
- Leitura do convite pela URL: **IMPLEMENTADO**.
- Fluxo ponta a ponta em dois dispositivos reais: **PENDENTE DE TESTE HUMANO**.
- Destino atual do QR é a tela LAN direta, não o Hub unificado: **divergência em relação ao fluxo desejado**.

## 3. PWA e operação offline

### Evidências

- `public/manifest.webmanifest` existe, com `start_url: "./"`, `scope: "./"` e `display: "standalone"`.
- `public/sw.js` faz cache do shell estático e assets locais. Não intercepta API LAN nem requisições cross-origin.
- `src/main.tsx` registra o Service Worker em produção e em prévia de teste quando `VITE_PWA_TESTE=true`; não o registra no servidor Vite em modo LAN.
- `vite.config.ts` configura a interface LAN em `0.0.0.0:4174` com proxy para API local na porta 4175.
- O script LAN atual acessa por HTTP usando IP privado.
- Navegadores exigem contexto seguro para Service Worker, com exceção de origens consideradas confiáveis como localhost. HTTP em IP privado de outro dispositivo normalmente não atende a esse requisito.

### Classificação

- Manifesto e shell Service Worker: **IMPLEMENTADOS**.
- Cache offline de shell e assets: **coberto por testes automatizados de código do Service Worker**.
- Instalação PWA e abertura Offline em dispositivos reais: **PENDENTE DE TESTE HUMANO**.
- PWA no acesso LAN por IP/HTTP em segundo dispositivo: **BLOQUEIO TÉCNICO A RESOLVER**; não presumir que o Service Worker será registrado.
- `start_url` atual abre a entrada padrão, que é a Ficha Offline, e não um Hub: **INCOMPLETO em relação ao fluxo aprovado**.

Não alterar o servidor LAN durante esta investigação. Estudar uma solução de origem segura/entrega do Hub com impacto mínimo e apresentar a alternativa técnica antes de qualquer alteração no servidor.

## 4. Scripts de inicialização

### Evidências

- Existem scripts Windows para verificar ambiente, preparar dependências, iniciar LAN, iniciar Ficha Offline e abrir menu de testes.
- `Preparar_Dependencias.bat` usa lockfile congelado e instala dependências somente quando necessário.
- `Iniciar_Mesa_LAN.bat` verifica portas, inicia API SQLite e Vite em janelas separadas, aguarda health checks e abre o navegador.
- `Iniciar_Ficha_Offline.bat` prepara dependências, executa TypeScript/build de teste, inicia preview e abre o navegador.
- O menu de testes permite iniciar Offline, LAN ou ambos.
- A árvore atual contém scripts Windows e utilitários de prévia celular; a etapa Linux permanece futura, conforme ordem aprovada.

### Classificação

- Preparação automática de dependências no Windows: **IMPLEMENTADA**.
- Inicialização LAN e abertura do navegador no Windows: **IMPLEMENTADA**.
- Minimização de janelas de terminal: **INCOMPLETO**; o script LAN abre janelas separadas para API e Vite, além do terminal do inicializador.
- Fluxo autônomo unificado a partir de um único Hub: **INCOMPLETO**.
- Linux: **ADIADO**, quarta etapa posterior.

## 5. Importação e exportação da Ficha

### Evidências

- `src/backupFicha.ts` define formato `ameaca-biologica-backup`, versão 1, data de exportação e lista de personagens.
- A exportação valida fichas e IDs duplicados, clona os dados e serializa JSON.
- A importação valida formato, versão, data, personagens e IDs duplicados; backups legados sem geração recebem geração nova.
- A interface limita o arquivo a 10 MB e apresenta prévia antes da operação.
- O usuário escolhe adicionar como cópias, substituir o conjunto local ou cancelar.
- `src/persistenciaFicha.ts` grava lotes em transação IndexedDB; a substituição limpa e grava em uma única transação, atribuindo novas gerações para invalidar editores antigos.
- Existem dois arquivos de teste relacionados: `tests/backupFicha.test.mjs` e `tests/backup-ficha.test.mjs`. Cobrem formato, versão, dados aninhados, identidade, habilidades, progressão, campos não serializáveis, duplicidade e geração.
- Os testes não equivalem a validação humana do download e da seleção/importação de arquivo em navegador real.

### Classificação

- Exportação JSON: **IMPLEMENTADA**.
- Importação com cópias/substituição: **IMPLEMENTADA**.
- Validação de conteúdo e gravação transacional: **implementadas no código e cobertas por testes automatizados existentes**.
- Portabilidade entre dispositivos/navegadores reais: **PENDENTE DE TESTE HUMANO**.
- Integridade completa de todos os campos da Ficha atual: **continua sujeita ao confronto canônico e à validação de versão do backup**.

## 6. Persistência Offline

- IndexedDB v3 usa a store `personagens` para fichas e store separada `vinculosLan` para metadados de vínculo.
- `salvarPatchPersonagem` lê a ficha vigente na transação, valida geração e valores-base das chaves editadas e recusa conflitos na mesma seção.
- Operações de importação em lote usam transações; a interface aguarda conclusão antes de confirmar o resultado.
- A inspeção estática desta rodada não identificou defeito concreto que justifique alteração na persistência local.
- Testes com IndexedDB simulado não substituem navegador real, duas abas ou dispositivos.

Classificação geral: **IMPLEMENTADO**, com cobertura automatizada existente; **PENDENTE DE TESTE HUMANO** em IndexedDB real e nos fluxos entre dispositivos.

## 7. Correções e decisões nesta rodada

- Nenhum código de produto foi modificado.
- O ponto de entrada efetivo foi distinguido de `src/App.tsx`; não tratar o arquivo legado como roteador ativo.
- O Hub integrado foi confirmado como lacuna no caminho de entrada atual.
- A exigência de contexto seguro para Service Worker em IP LAN/HTTP foi registrada como bloqueio a resolver.
- O servidor LAN, banco, Supabase, `main`, deploy e publicação não foram alterados.

## 8. Próximas ações

1. Investigar a solução técnica para PWA/Service Worker no acesso por segundo dispositivo sem refatorar o servidor LAN funcional.
2. Mapear o grafo de imports antes de classificar/remover `App.tsx`, `LaboratorioLocal.tsx` ou dependências legadas.
3. Auditar os scripts e o contrato de inicialização frente à experiência autônoma desejada, sem implementar ainda o instalador Linux.
4. Continuar o confronto da Ficha com o Arquivo do Jogador v1.0 e atualizar `docs/matriz-auditoria-funcional-ficha.md`.
5. Ao concluir a auditoria, consolidar a bateria humana progressiva e aguardar a validação do Gus antes de avançar.

**Sem teste humano, sem homologação. Sem alteração visual. Sem alterações ao servidor LAN.**
