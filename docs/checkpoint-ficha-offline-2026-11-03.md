# Checkpoint técnico — persistência primária e backup da Ficha Offline

**Data:** 03/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Base arquitetural:** `212962f1a547ef7277addc832a7f01cac51c055c`  
**Status:** CAMADA DE DADOS INICIAL IMPLEMENTADA; INTEGRAÇÃO NA INTERFACE PENDENTE

## 1. Alterações registradas

- `src/persistenciaFicha.ts`: banco IndexedDB próprio da ficha, separado do cache antigo do Laboratório e sem imports de rede/autenticação.
- `src/backupFicha.ts`: formato JSON versionado, validação estrutural, serialização e leitura de arquivo.
- `tests/backup-ficha.test.mjs`: testes de backup válido, conteúdo aninhado, JSON corrompido, formato/versão incompatíveis, ficha inválida e IDs duplicados.

## 2. Contrato atual da persistência

Banco: `ameaca-biologica-ficha`, versão 1.  
Object store: `personagens`, chave primária `id`.

Cada personagem possui:
- `id`: identificador estável;
- `nome`;
- `criadoEm`;
- `atualizadoEm`;
- `dados`: objeto extensível com as seções da ficha.

Operações expostas:
- listar personagens;
- obter personagem por ID;
- salvar personagem (aguarda conclusão da transação);
- excluir personagem;
- substituir o conjunto inteiro em transação (base para restauração);
- fechar a conexão do banco.

O módulo não importa Supabase, fetch, servidor ou autenticação. Erros de quota e indisponibilidade não são tratados como sucesso.

## 3. Contrato do backup

Formato: `ameaca-biologica-backup`, versão 1.  
O backup contém data de exportação e conjunto completo de personagens. A leitura valida o formato, versão, datas, estrutura dos registros e unicidade dos IDs. A importação ainda não foi ligada à interface; o mecanismo de substituição transacional existe na camada de persistência, mas o fluxo de prévia/duplicatas/decisão do usuário permanece pendente.

PDF permanece exportação de leitura/impressão, não backup.

## 4. Testes observados

**Executado em ambiente isolado:** 4/4 testes do módulo de backup passaram usando Node 22.16 com `--experimental-strip-types`.

**Limitação importante:** o clone completo do repositório não pôde ser obtido neste ambiente por indisponibilidade de resolução de rede para github.com. Portanto, não foram executados o build TypeScript/Vite nem a suíte completa do repositório. O teste isolado valida somente a lógica do formato JSON; não valida IndexedDB real em navegador.

Não declarar a persistência como homologada nem a ficha como funcional offline nesta etapa.

## 5. Pendências obrigatórias

1. Integrar IndexedDB à interface principal e retirar a dependência do fluxo de autenticação/Supabase da experiência padrão.
2. Criar tela de personagens e ficha contínua fiel ao protótipo mobile congelado.
3. Conectar edição e autosalvamento a transações IndexedDB, com estados reais de salvamento.
4. Implementar exportação de arquivo JSON, prévia de importação, política de duplicatas e restauração transacional sem sobrescrita silenciosa.
5. Implementar exportação PDF.
6. Garantir cache PWA do shell e testar inicialização offline após instalação/primeiro acesso.
7. Adicionar testes de integração IndexedDB em navegador e executar build + suíte integral.
8. Testes humanos ficam enfileirados até que o fluxo integrado esteja pronto.

## 6. Arquivos alterados

- `src/persistenciaFicha.ts` (novo)
- `src/backupFicha.ts` (novo)
- `tests/backup-ficha.test.mjs` (novo)
- `docs/checkpoint-ficha-offline-2026-11-03.md` (este documento)

Nenhuma alteração foi feita em `main`, no Supabase, no PR #3 ou na publicação.
