# Checkpoint — isolamento do SDK Supabase da dependência de produção

**Data:** 15/11/2026  
**Frente:** Ficha Offline PWA  
**Fase:** 0 — Preparação Offline  
**Branch:** `feat/offline-first-ficha`  
**HEAD de origem:** `9f8cc31cbfd1030f1eacd2cde4e05fa3ee37e70a`  
**Estado deste checkpoint:** alteração registrada; execução automatizada/CI pendente.

## Objetivo

Retirar o SDK Supabase das dependências de produção sem apagar os módulos legados nem enfraquecer a verificação TypeScript.

## Evidências que fundamentam a decisão

- `src/main.tsx` seleciona `FichaOfflineApp` como entrada padrão e `ConexaoServidorLocal` quando solicitado o modo LAN.
- O teste `tests/entradas-offline-sem-supabase.test.mjs` percorre os imports estáticos relativos a partir da entrada e protege o grafo ativo contra referências ao SDK Supabase.
- O legado permanece em `src/App.tsx`, `src/Convites.tsx`, `src/Participantes.tsx` e `src/FichasJogador.tsx`.
- `tests/ui/pericias.tsx` importa `FichasJogador` como fixture isolada; o arquivo usa o tipo `SupabaseClient`. Por isso, manter o SDK como dependência de desenvolvimento preserva a compilação e as fixtures sem colocá-lo no conjunto de dependências de produção.
- O ponto de entrada da Ficha Offline/LAN não importa o legado Supabase. A inspeção estática não substitui o build nem a análise do bundle gerado.

## Alterações deste ciclo

- `package.json`: movido `@supabase/supabase-js` de `dependencies` para `devDependencies`, preservando a versão `2.118.0`.
- `pnpm-lock.yaml`: atualizado o importer raiz para refletir a classificação de desenvolvimento; os registros do pacote e suas dependências foram preservados para instalação de desenvolvimento e verificação de tipos.
- `vite.config.ts`: removida a divisão manual de chunks específica do Supabase.
- `.github/workflows/pr-build.yml`: removidas as variáveis de ambiente públicas antigas do Supabase da etapa de build.
- `tests/entradas-offline-sem-supabase.test.mjs`: acrescentada regressão que falha se o SDK voltar a ser dependência de produção.
- Os arquivos legados foram preservados. Nenhuma regra, tela, schema, serviço LAN ou identidade visual foi alterada.

## Classificação

| Item | Estado |
|---|---|
| SDK fora de dependencies de produção | IMPLEMENTADO |
| SDK preservado em devDependencies para legado/fixtures | IMPLEMENTADO |
| Lockfile alinhado com o manifesto | IMPLEMENTADO — edição do importer; validação frozen-lockfile pendente |
| Grafo estático da entrada sem Supabase | TESTE EXISTENTE |
| Regressão do manifesto | IMPLEMENTADO — execução pendente |
| Testes automatizados | PENDENTE |
| Build TypeScript/Vite | PENDENTE |
| GitHub Actions | PENDENTE |
| Validação humana | PENDENTE — não é substituída por CI |

## Riscos e limites

- A instalação de desenvolvimento ainda instala o SDK, pois o legado e a fixture de Perícias dependem de seus tipos.
- O objetivo deste incremento é retirar o SDK da dependência de produção e do grafo ativo; não é uma remoção integral de todo código histórico Supabase.
- A edição do lockfile foi limitada ao importer raiz. O workflow com `pnpm install --frozen-lockfile` deve confirmar que o lockfile está coerente.
- Não houve execução local; as verificações serão feitas pelo GitHub Actions.

## Próxima ação exata

Aguardar os workflows disparados por este commit. Se a instalação frozen-lockfile, testes ou build falharem, corrigir apenas a causa demonstrada e registrar novo checkpoint. Se passarem, confirmar o isolamento pelo build e manter a Fase 0 aberta até cumprir os demais critérios offline e a validação humana aplicável.
