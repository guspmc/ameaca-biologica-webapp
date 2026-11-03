# Continuidade técnica — linha Offline Primeiro

**Data da auditoria:** 03/11/2026  
**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Branch de trabalho:** `feat/offline-first-ficha`  
**HEAD conferido antes deste registro:** `5e304578e8ddfbacbcf8ac052e481c773256cd4a`  
**Escopo:** preservar contexto técnico verificável e orientar a próxima integração da Ficha do Jogador offline.

> Este documento é um mapa de continuidade. Não substitui o Arquivo do Jogador, o Arquivo do Mestre, o Planejamento v2.0 nem os protótipos congelados. Quando tratar de regras, consultar as fontes oficiais; quando tratar de interface, consultar o protótipo aprovado; quando tratar de implementação, conferir o código atual da branch.

---

## 1. Decisões de produto e arquitetura vigentes

A decisão do usuário de 03/11/2026 altera a sequência arquitetural anteriormente registrada:

1. **Ficha do Jogador 100% offline primeiro.**
2. **Painel do Mestre depois**, seguindo o protótipo aprovado.
3. **Laboratório por LAN por último**, integrando os módulos.

A arquitetura-alvo é **Offline > LAN**. Supabase não é requisito nem destino arquitetural desta linha de desenvolvimento. O fluxo antigo deve ser preservado temporariamente enquanto a migração é construída, mas não pode continuar sendo requisito para abrir e usar a Ficha offline.

Regras de trabalho:

- Não alterar `main`, fazer merge, publicar ou substituir a versão pública sem validação expressa do usuário.
- Não apagar o legado prematuramente. Isolar o novo caminho offline e remover dependências antigas somente depois de comprovar que deixaram de ser necessárias.
- Não introduzir serviços pagos, infraestrutura paga ou outra stack sem aprovação.
- Não declarar funcionalidade concluída com base apenas em código escrito.
- Não solicitar testes humanos antes que exista um bloqueio que realmente dependa de interação humana.
- Registrar cada checkpoint com estado, evidência, limitações e próxima dependência técnica.
- Evitar mudanças grandes e simultâneas. Uma alteração deve ter objetivo, arquivos afetados, risco e teste verificável.

## 2. Hierarquia das fontes

Em caso de dúvida, usar esta ordem:

1. **Arquivo do Jogador v1.0** — regras, termos, fórmulas e procedimentos do jogador.
2. **Arquivo do Mestre v1.0** — regras e atribuições do Mestre.
3. **Documento Mestre de Planejamento do WebApp v2.0** — decisões funcionais aprovadas.
4. **Protótipo congelado da Ficha Mobile v02** — referência visual e organização da ficha.
5. **Protótipo congelado do Painel Mestre v02** — referência visual do futuro painel.
6. **Decisão arquitetural Offline Primeiro de 03/11/2026** — prevalece quanto à sequência e à arquitetura.
7. **Este documento e checkpoints posteriores** — histórico técnico, sempre subordinado às fontes acima.

Código legado, protótipos demonstrativos e dados fictícios não são fontes de regra. Não copiar cálculos, limites ou efeitos de demonstração sem conferência no Arquivo do Jogador.

## 3. Estado confirmado da branch

A branch `feat/offline-first-ficha` foi consultada no GitHub e estava no commit `5e304578e8ddfbacbcf8ac052e481c773256cd4a` no início desta auditoria.

### 3.1 Implementado no código

| Área | Evidência no repositório | Estado |
|---|---|---|
| Persistência primária | `src/persistenciaFicha.ts` | Implementada como módulo IndexedDB isolado |
| Formato de backup | `src/backupFicha.ts` | Implementado como módulo JSON versionado |
| Testes de backup | `tests/backup-ficha.test.mjs` | 4 testes isolados reportados como aprovados |
| PWA / manifesto | `public/manifest.webmanifest` | Existe; não comprova uso offline completo |
| Service Worker | `public/sw.js` | Cacheia shell e recursos estáticos; não guarda dados de personagens |
| Tela atual | `src/App.tsx` | Ainda é o fluxo antigo dependente de autenticação/Supabase |
| Ficha local existente | `src/FichaLocal.tsx` | Componente existente, com editores e callbacks; não integrado ao novo IndexedDB |
| Listagem/gestão antiga | `src/FichasJogador.tsx` | Ainda contém dependências de Supabase e cache antigo |
| Entrada do React | `src/main.tsx` | Renderiza `App`; registra o Service Worker em produção |

### 3.2 Não implementado ou não comprovado

- A interface principal não abre diretamente em uma área offline independente.
- A lista, criação, seleção e exclusão de personagens ainda não usam `persistenciaFicha.ts`.
- A ficha ainda não salva automaticamente/explicitamente no novo banco IndexedDB.
- A exportação e importação JSON ainda não estão ligadas a controles de interface.
- Não há prévia de importação nem fluxo de resolução de personagens com IDs coincidentes na interface.
- Não foi comprovada restauração real em navegador.
- Não foi comprovado o uso completo da aplicação após primeiro carregamento e desconexão.
- Não foi comprovado build integral da branch nesta etapa.
- Não foi comprovado teste em Android, iOS, Windows ou Linux.
- Não foi feita homologação visual comparativa com o protótipo congelado.
- Não foi autorizada alteração de `main`, merge ou publicação.

**Conclusão:** existe uma fundação de persistência e backup, mas a Ficha do Jogador ainda não pode ser apresentada como aplicação funcional offline.

## 4. Mapa dos componentes e dependências observados

### 4.1 `src/main.tsx`

- Importa `App` e `styles.css`.
- Renderiza o componente `App` na raiz.
- Registra `public/sw.js` em produção, respeitando o escopo do `BASE_URL`.
- O registro do Service Worker não torna automaticamente offline as rotinas que dependem de servidor.

### 4.2 `src/App.tsx`

- Importa `createClient`, `Session` e `SupabaseClient` de `@supabase/supabase-js`.
- Importa o Laboratório, conexão local, convites, participantes e `FichasJogador`.
- Implementa configuração de conexão, autenticação e lobby de Mesas.
- É atualmente o ponto de entrada que impede considerar o aplicativo independente de Supabase.
- Não substituir o arquivo inteiro sem antes mapear as rotas, estados e componentes ainda necessários para o legado.

### 4.3 `src/FichaLocal.tsx`

- Apresenta uma ficha contínua com seções de Características, Atributos e Perícias, Combate e Inventário.
- Recebe dados por props e delega gravação por callbacks assíncronos.
- Tem callbacks separados para salvar atributos/perícias, características e inventário.
- Tem navegação por âncoras dentro da mesma ficha.
- O componente identifica a ficha como rascunho e não deve ser tratado automaticamente como ficha final/ativa.
- O componente contém cálculos derivados no próprio arquivo. Antes de reaproveitar ou mover esses cálculos, comparar cada fórmula com o Arquivo do Jogador v1.0 e com os módulos de regras existentes. A presença de uma fórmula no componente não é prova de que ela esteja canônica.

### 4.4 `src/FichasJogador.tsx`

- É uma implementação anterior ligada a `supabase`, `usuarioId` e `mesas`.
- Contém estados e fluxos de criação/edição e consulta ao cache antigo.
- Não deve ser conectado diretamente ao banco IndexedDB novo sem separar as dependências de rede e conferir o modelo de dados.
- Reaproveitar componentes de formulário e lógica somente após identificar dependências e validar as regras.

### 4.5 `src/persistenciaFicha.ts`

Contrato atual:

- Banco: `ameaca-biologica-ficha`.
- Versão: `1`.
- Object store: `personagens`, chave primária `id`.
- Registro: `id`, `nome`, `criadoEm`, `atualizadoEm`, `dados`.
- Operações exportadas: `listarPersonagens`, `obterPersonagem`, `salvarPersonagem`, `excluirPersonagem`, `substituirPersonagens`, `fecharBancoFicha`.
- As operações de gravação aguardam a conclusão da transação antes de resolver.
- `substituirPersonagens` limpa e grava o conjunto em uma transação readwrite, para restauração atômica.
- O módulo não importa rede, autenticação, Supabase ou servidor.

Ponto técnico pendente: revisar o tratamento de `onblocked` em `abrirBanco()`. A implementação rejeita a abertura e limpa a referência compartilhada; é necessário garantir que uma eventual abertura tardia não deixe uma conexão aberta sem gerenciamento. Não mudar o comportamento sem teste direcionado.

### 4.6 `src/backupFicha.ts`

Contrato atual:

- Formato: `ameaca-biologica-backup`.
- Versão: `1`.
- Contém data de exportação e lista de personagens.
- Valida formato, versão, data, estrutura mínima e IDs duplicados.
- Faz cópia profunda com `structuredClone`.
- Funções: `criarBackup`, `validarBackup`, `serializarBackup`, `lerArquivoBackup`.

A versão do backup deve ser incrementada com estratégia explícita de migração quando o modelo persistido mudar de forma incompatível. Não reinterpretar silenciosamente arquivos de versão futura.

### 4.7 `public/sw.js` e `public/manifest.webmanifest`

- O Service Worker tem cache identificado como `ameaca-biologica-shell-v1`.
- Cacheia o shell HTML e recursos estáticos locais.
- Não cacheia respostas de API nem dados pessoais de personagens.
- O manifesto declara modo standalone, escopo relativo e ícone SVG.
- O banco IndexedDB é separado do cache do Service Worker.
- A política de atualização do shell e compatibilidade entre versões de código e banco ainda precisa de testes.

## 5. Dependências e scripts de projeto observados

No `package.json` consultado:

- `dev`: Vite.
- `build`: `tsc --noEmit && vite build`.
- `test`: `node --experimental-sqlite --test tests/*.test.mjs`.
- Dependências incluem React 19, React DOM, Vite 7, TypeScript 5.9 e Supabase JS.
- A dependência Supabase permanece no projeto legado. A decisão Offline Primeiro não autoriza removê-la antes de verificar todos os imports e fluxos ainda existentes.

A suíte de backup foi executada anteriormente de forma isolada com `node --experimental-strip-types --test tests/*.test.mjs`, em ambiente temporário preparado para aquele teste. Resultado registrado: 4/4 aprovados. Isso não equivale a executar o script `pnpm test` completo do repositório nem a executar `pnpm build`.

## 6. Próxima unidade de implementação: entrada offline mínima

A próxima alteração funcional deve ser pequena e isolada:

1. Criar uma entrada React independente para a Ficha offline, sem importar `App.tsx`, Supabase, autenticação, lobby ou servidor.
2. A nova entrada deve iniciar com listagem de personagens carregada de `listarPersonagens()`.
3. Permitir criar personagem com identificador estável, nome e timestamps; salvar usando `salvarPersonagem()`.
4. Permitir abrir/selecionar um registro e excluir somente após confirmação explícita.
5. Exibir estados distintos de carregamento, erro, vazio e gravação concluída.
6. Só exibir “Salvo” depois da resolução da transação IndexedDB.
7. Não inventar formulário de criação completo nem regras de personagem nessa primeira unidade. A integração da ficha completa vem depois da base de navegação e persistência.
8. Preservar a identidade visual do protótipo aprovado. A listagem inicial deve ser coerente com o protótipo e não virar um painel administrativo genérico.
9. Integrar a nova entrada pelo ponto de montagem apenas depois de conferir os imports e manter o legado isolado, sem alterar `main` ou publicar.
10. Acrescentar testes para a persistência com IndexedDB simulado ou navegador real, após verificar as dependências disponíveis e sem adicionar serviço pago.

A tela inicial de listagem é apenas infraestrutura de acesso aos registros; não deve ser confundida com a ficha final nem com o Painel do Mestre.

## 7. Requisitos de integração da ficha

Ao conectar a ficha contínua ao IndexedDB:

- Definir um adaptador explícito entre o modelo de dados atual da ficha e `PersonagemLocal.dados`.
- Evitar persistir objetos transitórios de interface, callbacks ou dados derivados desnecessários.
- Preservar todos os campos relevantes e permitir evolução versionada.
- Não sobrescrever campos desconhecidos ao editar um subconjunto de dados.
- Evitar condições de corrida: serializar gravações por personagem ou implementar controle de revisão antes de permitir edição simultânea em múltiplas abas.
- Indicar visualmente estados como carregando, alterações pendentes, salvando, salvo e falha.
- Não mostrar confirmação de salvamento antes da conclusão real da transação.
- Ao excluir, informar que a operação remove o registro local daquele dispositivo; incentivar backup antes de exclusão definitiva.
- Dados de personagem não devem ir para localStorage, Cache API, logs ou telemetria.

## 8. Requisitos de backup e transferência

A exportação/importação deve ser parte do produto, não uma rotina técnica escondida.

### Exportação

- Ler os registros persistidos do IndexedDB.
- Criar JSON versionado usando `criarBackup` e `serializarBackup`.
- Gerar arquivo baixável com nome e data compreensíveis.
- Não afirmar que o backup foi salvo em nuvem; ele é um arquivo entregue ao usuário.
- Futuramente, PDF pode ser oferecido para leitura/impressão, mas não substitui JSON.

### Importação

- Ler o arquivo escolhido e validar integralmente antes de alterar o banco.
- Exibir prévia: quantidade de personagens, nomes e data de exportação.
- Detectar IDs já existentes no dispositivo.
- Não substituir dados existentes silenciosamente.
- Oferecer caminhos explícitos e compreensíveis: importar como cópias com novos IDs, ou substituir o conjunto local após confirmação. Se outra política for escolhida, documentá-la antes.
- Aplicar a operação em transação atômica.
- Se a operação falhar, manter os dados anteriores intactos.
- Registrar a decisão de tratamento de duplicatas e a estratégia de IDs no checkpoint correspondente.

## 9. Requisitos PWA e operação offline

Para considerar a Ficha utilizável offline, comprovar:

1. Primeiro acesso online instala/carrega o shell e os recursos necessários.
2. Após fechamento e reabertura, o app inicia sem rede.
3. O conteúdo da ficha e os registros vêm do IndexedDB.
4. Nenhum caminho essencial faz requisição de rede para abrir, consultar, editar ou salvar uma ficha.
5. A atualização do aplicativo não apaga nem corrompe dados locais.
6. Dados de personagens não são incluídos no cache do Service Worker.
7. Falhas de quota, armazenamento bloqueado ou indisponibilidade de IndexedDB são comunicadas sem simular salvamento.
8. A documentação informa que dados do navegador podem ser apagados pelo usuário ou pelo sistema; backup externo continua necessário.

A instalação PWA varia conforme sistema operacional e navegador. Não prometer instalação idêntica em todos os dispositivos.

## 10. Matriz de testes e critérios de conclusão

| Teste | Critério | Estado |
|---|---|---|
| Criar registro | Registro aparece após recarregar | Pendente |
| Editar registro | Alterações persistem após fechar/reabrir | Pendente |
| Falha de gravação | Interface não mostra “Salvo” | Pendente |
| Excluir registro | Exclusão confirmada e persistida | Pendente |
| Exportar JSON | Arquivo abre e valida em nova sessão | Pendente |
| Importar JSON válido | Registros restaurados sem perda | Pendente |
| Importar JSON inválido | Nenhum registro alterado | Pendente |
| IDs duplicados | Conflito tratado sem sobrescrita silenciosa | Pendente |
| Offline após primeiro acesso | App abre e ficha funciona sem rede | Pendente |
| Atualização do shell | Dados persistidos permanecem íntegros | Pendente |
| Múltiplas abas | Não há perda silenciosa por concorrência | Pendente |
| Mobile | Layout e controles utilizáveis em tela pequena | Pendente |
| Desktop | Layout responsivo e legível | Pendente |
| Regras | Fórmulas e opções conferem com Arquivo do Jogador | Pendente |
| Visual | Comparação com protótipo congelado aprovada | Pendente |

Um teste só muda para **Aprovado** com evidência observável (saída automatizada, captura/registro de execução ou validação humana documentada). Código escrito ou teste planejado não é evidência de aprovação.

## 11. Fila de trabalho e bloqueios

Ordem sugerida, sem autorização para pular validações:

- **Etapa A — Entrada offline e CRUD mínimo:** tela isolada, listar/criar/abrir/excluir, IndexedDB integrado.
- **Etapa B — Adaptador de dados da ficha:** mapear campos e preservar dados; conferir regras antes de consolidar cálculos.
- **Etapa C — Ficha contínua:** integrar editores existentes de forma progressiva, preservando o protótipo.
- **Etapa D — Backup JSON:** exportação, prévia de importação, duplicatas e restauração atômica.
- **Etapa E — PWA offline real:** cache do shell, inicialização sem rede, testes de atualização e persistência.
- **Etapa F — PDF de leitura/impressão:** somente depois de ficha estável.
- **Etapa G — Homologação humana:** instruções simples e sequenciais, apenas quando os testes automatizados e inspeções técnicas não bastarem.

Depois da Ficha offline validada, iniciar o Painel do Mestre. O Laboratório LAN fica para a fase seguinte.

## 12. Registro de checkpoints conhecidos

### 03/11/2026 — Decisão arquitetural Offline Primeiro

Documento: `docs/decisao-arquitetural-offline-primeiro-2026-11-03.md`.

Registra a ordem Ficha offline → Painel do Mestre → Laboratório LAN e a decisão de não depender de Supabase como arquitetura-alvo.

### 03/11/2026 — Persistência e backup offline (Checkpoint 02)

Documento: `docs/checkpoint-ficha-offline-2026-11-03.md`.

Arquivos criados:
- `src/persistenciaFicha.ts`
- `src/backupFicha.ts`
- `tests/backup-ficha.test.mjs`

Resultado registrado: 4 testes isolados de backup aprovados. Persistência ainda sem teste real em navegador e sem integração com a interface.

### 03/11/2026 — Auditoria de continuidade desta linha

Este documento registra a leitura de `package.json`, `main.tsx`, `App.tsx`, `FichaLocal.tsx`, `FichasJogador.tsx`, `persistenciaFicha.ts`, `backupFicha.ts`, `sw.js`, manifesto e configuração Vite na branch indicada.

Conclusão: o ponto de integração principal é a entrada do React atualmente renderizada por `main.tsx`; o caminho offline precisa ser isolado antes de retirar dependências do fluxo legado.

---

## 13. Instrução de retomada para futuras conversas

Antes de alterar qualquer arquivo:

1. Ler este documento e a decisão arquitetural Offline Primeiro.
2. Consultar o HEAD atual da branch `feat/offline-first-ficha`; este documento não garante que o código permaneça no mesmo commit.
3. Ler o checkpoint mais recente.
4. Inspecionar os arquivos e dependências atuais, sem presumir que nomes, assinaturas ou estrutura permaneceram iguais.
5. Consultar os documentos oficiais quando a mudança tocar regras, termos, fórmulas ou experiência aprovada.
6. Fazer uma alteração pequena, executar os testes possíveis, registrar exatamente o que foi e não foi testado e criar novo checkpoint.
7. Não alterar `main`, fazer merge ou publicar sem autorização expressa do usuário.

**Regra de ouro:** a documentação descreve evidências e decisões; não transforma pendências em funcionalidades concluídas.
