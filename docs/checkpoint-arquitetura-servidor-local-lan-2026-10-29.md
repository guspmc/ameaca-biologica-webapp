# Checkpoint de arquitetura — servidor local e rede LAN

**Data:** 29/10/2026  
**Branch de referência:** `feat/origens-rascunho-alfa04`  
**Estado:** stack aprovada pelo usuário em 29/10/2026 (Node.js + SQLite + WebSocket); primeiro protótipo técnico adicionado à branch. CI de testes e build passou para a árvore de código `5c31a5b4f99d38219a6b75853a3ae8dd5a65b16c`, idêntica à árvore atual. Validação manual LAN pendente.  
**Governança:** nenhum merge, publicação no GitHub Pages, alteração remota de Supabase ou mudança de cânone autorizada por este checkpoint.

## 1. Direção confirmada pelo usuário

- **Internet não é requisito** para o uso normal do WebApp na mesma rede.
- **Rede local é requisito** para os dispositivos trocarem dados em tempo real.
- Um PC, notebook ou celular pode ser escolhido para hospedar o servidor autoritativo da sessão.
- O dispositivo servidor também pode abrir a interface da Mesa do Mestre; essas funções são independentes. O servidor também pode operar sem uma interface de Mestre aberta nele.
- Os demais dispositivos conectam-se ao servidor pela LAN.
- O acesso pela internet para participantes fora da rede local é um cenário opcional e separado, a ser desenhado posteriormente com segurança.
- Exportação/importação de Mesas e fichas deve permitir backup, transporte e recuperação entre máquinas.
- Importações devem validar os arquivos, detectar conflitos e pedir confirmação antes de substituir dados; nunca sobrescrever alterações silenciosamente.
- Hospedar o servidor não concede papel de Mestre. As permissões continuam vinculadas à conta e à Mesa.
- Deve existir um servidor autoritativo por sessão. Não presumir replicação ativa ou escrita concorrente entre vários servidores.
- O objetivo não é continuar aperfeiçoando uma experiência dependente do Supabase hospedado; o produto-alvo deve operar localmente na LAN.

## 2. Estado verificado no repositório

Branch inspecionada: `feat/origens-rascunho-alfa04`.

- **Frontend:** React, TypeScript e Vite. `package.json` não define ainda um servidor de aplicação próprio.
- **Dados e autenticação atuais:** componentes como `src/App.tsx` e `src/FichasJogador.tsx` usam Supabase para consultar Mesas/personagens e receber atualizações. As migrations versionadas definem tabelas, políticas RLS e operações de banco para essa arquitetura.
- **Atualizações ao vivo atuais:** a configuração de Realtime está ligada ao Supabase; não há ainda um serviço LAN próprio que substitua essa dependência.
- **PWA/cache:** `public/sw.js` cacheia o shell estático e assets da aplicação, sem cachear respostas do Supabase. `src/offlineCache.ts` usa IndexedDB para snapshots limitados e leitura offline. Isso não equivale a um servidor local nem permite sincronizar dispositivos sem acesso ao backend hospedado.
- **Anotações pessoais:** `src/notasPessoais.ts` e `src/AnotacoesPessoais.tsx` armazenam as notas no navegador, sem enviá-las ao Supabase.
- **Publicação atual:** `.github/workflows/pages.yml` compila e publica a aplicação no GitHub Pages a partir de `main`. O Pages pode continuar servindo downloads e versões públicas, mas não pode ser o servidor autoritativo de uma Mesa local.
- **Testes:** a suíte atual inclui testes de banco em memória e testes de contrato/código; ela não demonstra ainda autenticação, banco ou WebSocket LAN em um servidor local real.

## 3. Consequência arquitetural

A implementação atual é **cloud-first com recursos limitados de leitura offline**, não uma aplicação LAN-first. O cache do shell e os snapshots não removem a dependência do Supabase para autenticação inicial, leitura online, gravação compartilhada e atualizações ao vivo.

A nova direção exige uma camada de servidor local responsável por:
1. armazenar os dados persistentes da campanha;
2. autenticar contas locais e aplicar autorização por Mesa no servidor;
3. expor uma API de rede local;
4. distribuir eventos de atualização em tempo real aos clientes conectados;
5. importar/exportar dados com validação, versão de formato e tratamento de conflitos;
6. continuar funcionando sem internet.

O frontend existente pode ser reaproveitado gradualmente, mas os acessos diretos ao Supabase precisarão ser substituídos por uma camada de serviços compatível com o servidor local. A migração deve ser incremental, sem reescrever a ficha inteira nem alterar regras do RPG.

## 4. Proposta de implementação incremental

### Marco 0 — decisão técnica e prova de viabilidade

**Decisão de stack aprovada:** Node.js + SQLite + WebSocket para o primeiro protótipo. A execução no Android continua pendente de prova de viabilidade; a validação inicial começa no PC.

### Marco 1 — servidor local mínimo

- iniciar/parar o servidor e mostrar endereço/porta LAN;
- banco local persistente e migrações versionadas;
- contas e sessões locais, com senha armazenada apenas por hash apropriado;
- API autenticada e autorização validada no servidor;
- endpoint de saúde e testes automatizados;
- nenhuma chamada ao Supabase hospedado necessária para criar/ler dados de teste no servidor local.

### Marco 2 — uma Mesa de ponta a ponta

- criar Mesa e contas fictícias localmente;
- separar papéis por Mesa;
- abrir o mesmo estado em dois navegadores/dispositivos na LAN;
- sincronizar uma alteração de teste por eventos em tempo real;
- comprovar que o fluxo funciona com a conexão de internet desligada, mantendo a LAN ativa.

### Marco 3 — migração do WebApp por fatias

Substituir, em pequenos incrementos, os serviços de Mesas, participantes e personagens. Preservar o layout contínuo aprovado, as permissões e os limites funcionais. Não declarar o sistema completo enquanto outras telas ainda dependerem do Supabase hospedado.

### Marco 4 — exportação e importação

Criar formato versionado, validação de schema, exportação de Mesa/fichas permitidas, importação em outra instalação, detecção de duplicatas/conflitos e confirmação explícita. Anotações pessoais permanecem locais e não entram em exportações automáticas.

### Marco 5 — execução móvel e acesso remoto opcional

Validar a execução como servidor em Android, inclusive limitações de suspensão/background e descoberta/endereço na rede. Só depois desenhar acesso remoto pela internet, com autenticação, TLS, exposição de portas e proteção contra acesso indevido. Acesso remoto não deve ser necessário para o uso LAN.

## 5. Decisões técnicas ainda pendentes

1. **Runtime do servidor e compatibilidade móvel:** qual tecnologia pode ser executada de forma mantível no Windows e no Android, sem transformar a configuração em uma tarefa técnica difícil.
2. **Banco local:** formato, migrações, backup e recuperação.
3. **Autenticação local:** cadastro/credenciais, recuperação de acesso e proteção das sessões sem provedor de nuvem.
4. **Transporte de tempo real:** eventos WebSocket ou alternativa, reconexão e detecção de servidor indisponível.
5. **Origem e distribuição do frontend na LAN:** URL, instalação PWA e implicações de HTTP/HTTPS em dispositivos clientes.
6. **Migração dos dados existentes:** estratégia de exportar/importar ou reconstruir Mesas de teste; não assumir compatibilidade automática com o esquema Supabase.
7. **Segurança do arquivo exportado:** quais dados podem ser incluídos e como proteger arquivos que contenham segredos de campanha.

## 6. Recomendação técnica para o próximo passo

Antes de trocar a stack, fazer uma comparação curta de duas opções e um protótipo de viabilidade:

- **Opção A — servidor Node.js com banco local:** reaproveita o ecossistema TypeScript do projeto e pode ser executável no Windows; a execução no Android precisa de validação e possivelmente de empacotamento ou um runtime dedicado.
- **Opção B — servidor empacotado multiplataforma:** avaliar um runtime compilado para Windows e Android, com banco embarcado, mantendo React/TypeScript no cliente. Pode facilitar a distribuição, mas introduz tecnologia nova e requer uma prova de conceito.

**Recomendação:** não escolher banco ou framework apenas por conveniência de desenvolvimento. Primeiro comprovar que o mesmo servidor pode ser iniciado de forma realista no PC e no Android; em seguida congelar a stack e começar pelo Marco 1. Não iniciar a migração de todos os componentes Supabase antes dessa prova.

## 7. O que este checkpoint não declara

- Nenhum servidor LAN foi implementado ou testado ainda.
- Nenhuma autenticação local foi implementada.
- Nenhum banco local autoritativo substituiu o Supabase.
- Nenhuma exportação/importação de Mesas/fichas está pronta por causa deste documento.
- Nenhuma migration remota, mudança de produção, merge ou publicação foi feita.
- Os resultados manuais anteriores de notas/offline não certificam a nova arquitetura LAN-first.

**Próximo passo:** aprovar a tecnologia/runtime do protótipo depois de comparar a viabilidade real no Windows e Android.

## 8. Implementação atual — 29/10/2026

**Implementado na branch, ainda não declarado testado:**
- `server/index.mjs`: servidor HTTP Node.js, SQLite persistente, endpoint de saúde, API de eventos de demonstração e distribuição por WebSocket.
- `server/index.html`: página de teste servida pelo próprio servidor.
- `tests/servidor-local.test.mjs`: cinco testes para saúde, gravação/leitura, persistência após reinício, evento em tempo real e validação de mensagens.
- `package.json` e `pnpm-lock.yaml`: comando `server:local`, execução de testes com a flag SQLite do Node 22 e dependência WebSocket.
- `.github/workflows/ci-local-server.yml`: workflow isolado para instalar dependências, rodar testes e compilar o frontend; não publica GitHub Pages.
- `docs/servidor-local-prototipo.md`: instruções para teste local e em dois dispositivos.
- `.gitignore`: banco gerado em `.ameaca-local/` não entra no Git.

**Limites explícitos:** o protótipo não tem autenticação, contas, papéis, Mesas reais, fichas ou integração com o frontend existente. Não usar dados reais. O frontend atual ainda usa Supabase hospedado. A nova implementação não substitui essa arquitetura ainda.

**Validação automatizada:** [workflow de testes do protótipo](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/40811908864) concluiu com sucesso (instalação congelada, testes automatizados e build). O workflow de compilação existente também concluiu com sucesso na mesma árvore: [workflow de compilação](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/40811908875). A árvore atual foi conferida como idêntica à árvore validada.

**Validação manual pendente:** executar os comandos locais descritos no guia, validar persistência após reinício e testar atualização entre dois dispositivos na mesma LAN com a internet indisponível. O servidor deve permanecer apenas na rede confiável durante os testes.

**Próximo marco:** após a validação técnica, adicionar autenticação local e autorização server-side antes de qualquer migração de dados reais.
