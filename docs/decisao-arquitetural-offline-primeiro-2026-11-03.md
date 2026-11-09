# Decisão arquitetural — Offline primeiro, LAN depois

**Data:** 03/11/2026  
**Projeto:** Ameaça Biológica RPG — WebApp  
**Branch de trabalho:** `feat/offline-first-ficha`  
**Base:** `212962f1a547ef7277addc832a7f01cac51c055c`  
**Status:** DECISÃO APROVADA PELO RESPONSÁVEL DO PROJETO

## 1. Decisão que prevalece

A ordem de desenvolvimento está definida como:

1. **Ficha do Jogador 100% independente e funcional offline.**
2. Persistência local confiável e exportação/importação de backup para transferência entre aparelhos.
3. Painel do Mestre, seguindo seu protótipo aprovado.
4. Laboratório e comunicação entre dispositivos por LAN.

A aplicação deve funcionar sem internet, conta, autenticação, banco remoto ou servidor. A LAN será adicionada depois como camada de comunicação; não será pré-requisito para abrir, consultar, editar ou salvar a ficha.

**Supabase está fora da arquitetura-alvo.** Não desenvolver novas funcionalidades dependentes dele, não corrigir Auth/RLS para sustentar esta linha e não fazer migrações ou operações no projeto Supabase. Código antigo pode permanecer temporariamente enquanto a separação é feita, mas não pode ser requisito de funcionamento da ficha.

## 2. Plataformas e distribuição

Alvo: aplicação web instalável/PWA, utilizável em Windows, Linux, Android e iOS, nos navegadores compatíveis.

- O shell, os módulos e os recursos necessários à ficha devem ser baixados/cacheados para uso posterior sem rede.
- O primeiro acesso/instalação e a obtenção de uma nova versão exigem conexão; depois de instalada e carregada, a ficha deve abrir offline.
- Não prometer instalação idêntica em todos os sistemas: a experiência de instalação PWA varia por navegador e sistema operacional.
- A aplicação deve detectar e comunicar indisponibilidade de recursos locais, sem afirmar que salvou quando a gravação falhou.
- Dados de personagem não devem ser armazenados em cache HTTP/service worker; devem usar o armazenamento estruturado local.

## 3. Persistência local

Adotar IndexedDB como armazenamento primário estruturado, com camada de repositório independente da interface e independente de rede.

Requisitos:
- Escritas transacionais e confirmação somente após conclusão da transação.
- Esquema de dados versionado e migrações locais explícitas.
- Identificadores estáveis para personagens, itens e registros relacionados.
- Validação de entrada e de formato na leitura e na importação.
- Recuperação de erro de quota, indisponibilidade, banco bloqueado ou corrupção sem perda silenciosa.
- Autosalvamento com estados visíveis e reais: alterando, salvando, salvo e erro ao salvar.
- Nenhuma dependência de localStorage como banco principal.
- Não depender de memória React para a sobrevivência dos dados após fechar ou recarregar.

O app deve preservar os dados locais ao atualizar o shell e os arquivos da aplicação.

## 4. Backup e transferência

Criar exportação de backup estruturado em JSON, com:
- identificador e versão do formato;
- data de exportação;
- dados completos da personagem e dependências necessárias para restaurá-la;
- validação de integridade/estrutura;
- exportação individual e, quando adequado, de conjunto de personagens.

Criar importação/restauração validada, com prévia do conteúdo, detecção de duplicatas e escolha explícita entre criar cópia ou substituir. Nunca sobrescrever silenciosamente dados existentes. Uma restauração deve ser transacional: tudo é aplicado ou nada é aplicado.

O backup JSON é o formato de recuperação e transferência entre aparelhos. PDF é exportação de leitura/impressão e não substitui backup nem será importável como restauração. Anotações pessoais só entram no backup quando estiverem explicitamente incluídas e identificadas.

A interface deve deixar claro que o backup precisa ser guardado fora do armazenamento do navegador. Dados locais podem ser removidos pelo usuário, pelo navegador ou pelo sistema operacional; a exportação externa é a proteção contra essa perda.

## 5. Escopo da Ficha do Jogador

Preservar o protótipo mobile aprovado `Ameaca_Biologica_Ficha_Mobile_Prototipo_v02_CONGELADO.html` como referência visual de alta fidelidade: papel envelhecido, paleta creme/carvão/vermelho, tipografia, hierarquia, cartões de recursos, seções contínuas e navegação inferior contextual. Não substituir por um painel administrativo genérico nem por quatro páginas/abas independentes.

A ficha é única e contínua, com:
1. Características;
2. Atributos e Perícias;
3. Combate;
4. Inventário.

A navegação inferior PERFIL / PERÍCIAS / COMBATE / ITENS funciona como atalhos para seções da mesma ficha, conforme o protótipo; não são fichas separadas.

A interface deve adaptar-se a desktop e dispositivos móveis, sem perder a identidade visual aprovada. Os dados de demonstração do protótipo não são dados reais nem regras canônicas.

## 6. Autoridade das regras e decisões funcionais

- Arquivo do Jogador v1.0 e Arquivo do Mestre v1.0 são fontes canônicas de regras.
- Documento Mestre de Planejamento v2.0 rege decisões funcionais aprovadas, exceto quando esta decisão posterior altera explicitamente a arquitetura e a ordem de implementação.
- O aplicativo auxilia o jogo; não inventa rolagens, Testes, efeitos ou consequências.
- Preservar os modos Automático, Misto e Manual e as preferências de dados Físicos, Virtuais e Mistos.
- Não inferir regra ausente. Registrar lacunas como dúvidas pendentes e solicitar decisão somente quando bloquearem a implementação.
- Reaproveitar catálogos, fórmulas e validadores já existentes após auditoria; evitar duplicar regras em componentes.

## 7. Estratégia LAN futura

A LAN será uma camada posterior. A ficha deve continuar sendo utilizável sem ela. Antes de introduzir sincronização, definir contratos de dados, identidade de dispositivos, autoridade por registro, conflitos, reconexão, permissões e comportamento quando o servidor LAN estiver desligado.

Não implementar sincronização implícita ou sobrescrita silenciosa. O funcionamento individual offline não pode ser degradado quando a LAN não estiver disponível.

## 8. Processo de desenvolvimento e validação

- Trabalhar nesta branch isolada. Não alterar `main`, não fazer merge e não publicar sem checkpoint e validação.
- Preservar branches e histórico existentes; não apagar nem reescrever trabalho anterior.
- Implementar em incrementos pequenos, registrando arquivos alterados, decisões, testes executados, resultados e pendências.
- Distinguir sempre PLANEJADO, IMPLEMENTADO, TESTADO, HIPÓTESE e PENDENTE.
- Automatizar o máximo possível: TypeScript, build, testes unitários, integração do IndexedDB, testes de exportação/importação e testes de regressão.
- Enfileirar testes humanos até que uma decisão ou validação física seja realmente bloqueadora. Quando necessários, entregar roteiro passo a passo, com resultado esperado e como relatar falhas.
- Não declarar uma funcionalidade pronta apenas porque compila.

## 9. Estado conhecido ao iniciar esta linha

Na base escolhida:
- React + TypeScript + Vite já existem.
- Existe um manifesto PWA e um service worker que cacheia o shell estático; isso ainda não prova funcionamento offline completo.
- Existe módulo IndexedDB antigo voltado a cache de dados Supabase; ele não é automaticamente adequado como banco primário da ficha.
- Existe uma ficha contínua local em componentes e fluxo de rascunho, mas checkpoints anteriores registram ausência de build/testes e de homologação manual.
- O fluxo principal do aplicativo ainda contém dependência de Supabase.
- O protótipo mobile é uma simulação, não uma implementação persistente.
- Painel do Mestre possui protótipo congelado próprio e será tratado após a Ficha do Jogador.

Esta lista é diagnóstico inicial, não declaração de conclusão. Cada ponto deve ser revalidado no código da branch antes de ser alterado.

## 10. Critério de aceite da Ficha Offline

A ficha somente será considerada homologada quando:
- abrir depois de instalada, sem conexão;
- criar, editar e excluir personagem localmente;
- salvar automaticamente e sobreviver a recarga, fechamento e reabertura;
- manter integridade dos dados após atualização da aplicação;
- exportar backup JSON válido;
- importar/restaurar backup em outro perfil/dispositivo sem sobrescrita silenciosa;
- exportar PDF de leitura/impressão sem alterar os dados;
- operar sem Supabase, autenticação ou servidor;
- passar testes automatizados e testes humanos nos ambientes-alvo disponíveis;
- manter fidelidade visual ao protótipo aprovado.

**Nenhum teste humano é considerado realizado até que o responsável execute o roteiro e informe o resultado.**
