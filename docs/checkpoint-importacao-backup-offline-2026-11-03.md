# Checkpoint — importação e restauração de backup local

**Data:** 03/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD de código desta etapa:** `a9096026b6b3d8d0a9c811c8fc6c937c0a88e70d`

## Implementado

- A tela offline permite selecionar um arquivo JSON de backup.
- A leitura usa `lerArquivoBackup()`, com validação de formato, versão, data, fichas e IDs duplicados.
- Arquivos acima de 10 MB são recusados antes da leitura.
- Uma prévia exibe data de exportação e personagens encontrados antes de qualquer alteração.
- O usuário escolhe explicitamente:
  - **Adicionar como cópias:** preserva as fichas locais, gera novos IDs e grava o lote em uma transação IndexedDB.
  - **Substituir fichas locais:** exige ação explícita e usa `substituirPersonagens()`, que limpa e grava tudo em uma única transação.
  - **Cancelar:** fecha a prévia sem alterar registros.
- Criada `adicionarPersonagens()` para inclusão atômica de um lote sem apagar registros existentes.
- Download do backup agora mantém a URL temporária por um curto intervalo após disparar o download.
- A interface recebeu estilos responsivos para prévia e opções de importação.
- O workflow de CI foi ajustado para disparar também em pushes na branch `feat/offline-first-ficha`.

## Segurança e integridade

- A validação ocorre antes de apresentar as opções.
- A substituição usa transação única: se a transação falhar, IndexedDB não confirma a operação parcial.
- A inclusão como cópias também usa transação única; falha em um registro aborta o lote.
- IDs novos são verificados contra os existentes no dispositivo e entre as cópias geradas.
- Nenhuma operação envia dados à rede.

## Verificação

- Os contratos de `backupFicha.ts` e `persistenciaFicha.ts` foram inspecionados antes da integração.
- O workflow GitHub Actions foi disparado para a branch e estava em execução durante o checkpoint. Resultado final ainda precisa ser consultado.
- Nenhum teste real em navegador foi executado nesta etapa.
- A importação ainda requer validação manual de ponta a ponta depois que o build passar.

## Pendências

1. Confirmar resultado do CI (instalação, testes, build TypeScript/Vite e checagem de tipos isolados).
2. Corrigir eventuais erros identificados pelo CI.
3. Criar testes de IndexedDB em navegador e validar importação/exportação com cópias, substituição, arquivo inválido e lote vazio.
4. Conferir fórmulas e opções da ficha contra o Arquivo do Jogador v1.0 antes de declarar a ficha funcional.
5. Revisar estados de salvamento e evitar perda de alterações em cliques rápidos.
6. Comparar o visual com o protótipo congelado.

## Não realizado

Nenhuma alteração em `main`, merge ou publicação. Esta etapa não declara a ficha pronta nem congelada.
