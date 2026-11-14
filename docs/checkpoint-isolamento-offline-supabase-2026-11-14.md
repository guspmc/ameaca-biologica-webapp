# Checkpoint — isolamento do caminho Offline em relação ao Supabase

**Data:** 14/11/2026  
**Frente:** Ficha Offline PWA  
**Fase:** 0 — Preparação Offline  
**Branch:** `feat/offline-first-ficha`  
**HEAD após este ciclo:** `3e77717b9f415e9ac075e71560bbd6b5368d95d6`  
**Escopo:** inspeção estática do ponto de entrada e das dependências do caminho ativo; criação de teste de regressão do grafo de imports.  
**Limites:** sem alteração de `main`, servidor LAN, banco, scripts de inicialização, identidade visual, deploy ou publicação.

## 1. Objetivo

Comprovar se as entradas atuais da Ficha Offline e da Mesa LAN carregam código Supabase, sem remover arquivos ou dependências por suposição.

## 2. Evidências inspecionadas

- `src/main.tsx` importa diretamente `FichaOfflineApp` e `ConexaoServidorLocal`.
- Sem o parâmetro `servidor=local`, a entrada abre `FichaOfflineApp`; com esse parâmetro, abre `ConexaoServidorLocal`.
- `FichaOfflineApp.tsx` usa módulos locais de persistência e backup.
- `ConexaoServidorLocal.tsx` usa o cliente do servidor local, sem importar o SDK Supabase.
- A cadeia de componentes consultada inclui `FichaLocal.tsx`, `PainelMestreLocal.tsx`, `ArquivosJogadorLocal.tsx`, `QRCodeLocal.tsx` e `servidorLocal.ts`; os arquivos inspecionados não importam o SDK Supabase.
- `public/sw.js` declara cache apenas do shell estático e assets locais; não armazena dados de personagem nem respostas de API.
- `src/App.tsx`, `src/Convites.tsx`, `src/Participantes.tsx` e `src/FichasJogador.tsx` ainda contêm integração Supabase, mas não são importados pelo ponto de entrada `src/main.tsx` observado.
- `src/conexao.ts` conserva a URL do projeto Supabase e é usado pelo legado `App.tsx`; não integra a entrada atual da Ficha Offline/LAN.
- `package.json` e `pnpm-lock.yaml` ainda declaram `@supabase/supabase-js`. `vite.config.ts` conserva uma regra de divisão de chunk para esse pacote.
- `tsconfig.json` inclui todo o diretório `src`. Portanto, remover o pacote do manifesto sem retirar/isol ar o código legado ou rever a estratégia de compilação quebraria a verificação TypeScript dos arquivos antigos que ainda importam seus tipos e runtime.

## 3. Decisão técnica deste ciclo

O caminho de execução atual da Ficha Offline e da Mesa LAN está separado do legado Supabase por seu ponto de entrada e pelos módulos percorridos na inspeção estática.

**Não remover ainda** `@supabase/supabase-js`, os arquivos legados ou a regra de chunk. A dependência permanece necessária para compilar o conjunto atual de fontes legado enquanto `tsconfig.json` inclui todo `src`. Uma limpeza completa exige uma decisão delimitada sobre aposentadoria/isolamento desses módulos e atualização reproduzível do lockfile. Isso não deve ser resolvido com exclusões ou deleções silenciosas.

A presença da dependência no manifesto significa que ela ainda é instalada no ambiente de desenvolvimento/build; não prova que o caminho Offline/LAN a execute em runtime.

## 4. Teste de regressão criado

Arquivo: `tests/entradas-offline-sem-supabase.test.mjs`.

O teste percorre imports relativos estáticos a partir de `src/main.tsx`, verifica resolução dos módulos locais e falha se encontrar referências ao SDK Supabase ou à URL de projeto Supabase no grafo alcançável.

- **Estado:** IMPLEMENTADO.
- **Execução:** PENDENTE.
- **CI:** a consulta de status do commit `3e77717b9f415e9ac075e71560bbd6b5368d95d6` retornou lista vazia; não há evidência de execução ou aprovação.
- **Build:** não executado por esta sessão.
- **Limitação:** o teste é uma proteção estática para imports literais; não substitui análise de bundle nem execução no navegador.

## 5. Arquivos alterados

- `tests/entradas-offline-sem-supabase.test.mjs` — novo teste de regressão.

Nenhum arquivo de produto, manifesto, Service Worker, configuração, lockfile ou script foi alterado.

## 6. Validação e estado

| Item | Estado | Evidência |
|---|---|---|
| Entrada padrão aponta para Ficha Offline | IMPLEMENTADO | inspeção de `src/main.tsx` |
| Entrada LAN selecionada por parâmetro | IMPLEMENTADO | inspeção de `src/main.tsx` |
| Separação estática dos módulos Supabase | IMPLEMENTADO | inspeção dos módulos percorridos |
| Teste de regressão do grafo de imports | IMPLEMENTADO | novo arquivo de teste |
| Execução do novo teste | PENDENTE | não executado nesta sessão |
| Testes automatizados gerais | PENDENTE | sem execução confirmada |
| Build atual | PENDENTE | sem execução confirmada |
| Inicialização e persistência local em navegador real | PENDENTE | bateria humana Offline ainda não executada |
| Validação humana LAN | VALIDADO HUMANAMENTE | validação anterior confirmada por Gus; não repetir sem regressão concreta |

## 7. Riscos e pendências

1. O SDK Supabase continua declarado no manifesto e no lockfile por causa do código legado ainda incluído no escopo TypeScript.
2. A limpeza integral do legado exige mapear todos os importadores e decidir como preservar a compilação sem manter a dependência; nenhuma remoção foi feita.
3. A análise deste ciclo não certifica ausência de toda e qualquer chamada de rede em todos os módulos; limita-se ao isolamento do SDK Supabase e à inspeção dos pontos de entrada/módulos citados.
4. Não há resultado de CI, testes ou build associado ao novo commit no momento do registro.
5. A bateria humana pendente é a da Ficha Offline local. Não misturar com LAN, cujo fluxo já foi validado por Gus.

## 8. Próxima ação exata

1. Consultar novamente o status do commit `3e77717b9f415e9ac075e71560bbd6b5368d95d6` e obter evidência do workflow de testes/build, se disponível.
2. Se o teste de grafo falhar, corrigir somente a referência concreta que surgir.
3. Prosseguir na Fase 0 com a auditoria da inicialização e persistência IndexedDB, sem alterar o fluxo LAN aprovado.
4. Não avançar para a bateria humana da Fase 2 antes de cumprir os critérios técnicos da Fase 1.
5. Não iniciar Inventário ativo, Painel do Mestre ou Laboratório nesta etapa.
