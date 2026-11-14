# Checkpoint — isolamento do caminho Offline em relação ao Supabase

**Data:** 14/11/2026  
**Frente:** Ficha Offline PWA  
**Fase:** 0 — Preparação Offline  
**Branch:** `feat/offline-first-ficha`  
**HEAD de código/teste após este ciclo:** `6eccc983f5e1f8a15e10d0ef4492677850f4c06a`  
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

O teste percorre imports relativos estáticos a partir de `src/main.tsx`, verifica resolução dos módulos de código locais (ignorando assets como CSS) e falha se encontrar referências ao SDK Supabase ou à URL de projeto Supabase no grafo alcançável. Imports de código relativos não resolvidos geram erro.

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


## 9. Auditoria estática da inicialização, persistência e PWA — 14/11/2026

### Inicialização

- \`src/main.tsx\` registra \`public/sw.js\` em produção e na prévia de teste quando \`VITE_PWA_TESTE=true\`; não registra no servidor de desenvolvimento.
- \`scripts/windows/Iniciar_Ficha_Offline.bat\` define \`VITE_PWA_TESTE=true\`, executa TypeScript e build em modo teste, inicia \`vite preview\` na porta 4176 e abre o endereço local. O script foi inspecionado, não executado por esta sessão.
- O roteiro humano espera \`http://127.0.0.1:4176/ameaca-biologica-webapp/\` e orienta verificar IndexedDB e controle do Service Worker.
- \`public/manifest.webmanifest\` declara \`start_url: "./"\`, \`scope: "./"\` e \`display: "standalone"\`.

### Persistência IndexedDB

- \`src/persistenciaFicha.ts\` declara IndexedDB como fonte de verdade local, banco \`ameaca-biologica-ficha\`, versão 3, store \`personagens\` e store separada \`vinculosLan\`.
- A abertura trata ausência de IndexedDB, falha de abertura, bloqueio por outra aba e \`versionchange\`; em mudança de versão, fecha a conexão e permite reabertura.
- As gravações aguardam \`transaction.oncomplete\`; abortamento/erro rejeitam a operação. A interface só apresenta “Salvo neste dispositivo” depois de \`salvarPatchPersonagem\` resolver.
- Patches leem a ficha vigente dentro da mesma transação \`readwrite\`, verificam geração, nome e valores-base das chaves editadas, e abortam conflitos na mesma seção.
- Substituição de backup limpa e grava o conjunto na mesma transação, atribuindo novas gerações; lotes de cópias também são transacionais.
- Testes existentes identificados: \`persistencia-gravacao.test.mjs\`, \`persistencia-operacoes.test.mjs\`, \`persistencia-migracao.test.mjs\`, \`persistencia-patch.test.mjs\`, além de testes de backup.

### Service Worker

- \`public/sw.js\` guarda o shell e assets estáticos; não intercepta métodos de escrita, API ou domínios externos e não armazena dados de personagem.
- \`tests/service-worker-shell.test.mjs\` cobre não interceptação de API/domínios/métodos de escrita, fallback de navegação offline pelo shell em cache e atualização do cache versionado.
- Esses testes usam ambiente simulado; não substituem a verificação em navegador real.

### Estado da evidência

- **IMPLEMENTADO:** inicialização da Ficha Offline, persistência IndexedDB v3, backup transacional, Service Worker e manifesto.
- **TESTES AUTOMATIZADOS EXISTENTES:** há testes específicos de persistência, migração, conflito, backup e Service Worker.
- **EXECUÇÃO AUTOMATIZADA NESTA SESSÃO:** nenhuma. A consulta de status do HEAD \`958234d32e0ff434ebe7f15f1c06d70f7a112930\` retornou lista vazia.
- **BUILD:** não executado/confirmado.
- **VALIDAÇÃO HUMANA OFFLINE:** pendente. A validação humana LAN previamente aprovada permanece fechada e não deve ser repetida.

### Observação documental

O \`index.html\` e a descrição do manifesto ainda contêm texto histórico que menciona “Mesas online”. Isso não demonstra chamada de serviço online no caminho ativo, mas é uma inconsistência de metadados a revisar em ciclo próprio, sem alteração visual.


- **Ajuste do teste antes da execução:** a resolução foi corrigida para ignorar assets estáticos sem extensão de código e falhar explicitamente apenas quando um import relativo de código não puder ser resolvido. HEAD atualizado do teste: `6eccc983f5e1f8a15e10d0ef4492677850f4c06a`. Continua sem execução confirmada.


## 10. Proteção adicional do Service Worker para rotas LAN — 14/11/2026

Foi ampliado o teste \`tests/service-worker-shell.test.mjs\` para garantir que o Service Worker não intercepte requisições GET às rotas locais \`/api/mesas\` e \`/ws\`, nem POST à API LAN. Os casos existentes para endpoint legado \`/rest/v1\`, domínio externo e método de escrita em asset foram preservados.

- **Código de produção alterado:** não.
- **Teste alterado:** sim, apenas cobertura adicional de rotas LAN.
- **Execução:** PENDENTE; o teste não foi executado nesta sessão.
- **Build/CI:** sem evidência de execução/aprovação.
- **Validação humana LAN:** não repetida; nenhuma alteração foi feita no servidor ou nos scripts LAN.
