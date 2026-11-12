# Checkpoint — Registro de Decisões da Mesa

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** registro de decisões/acontecimentos sem automação de efeitos na Ficha.

## Princípio funcional

A Ficha calcula e registra. O Jogador realiza os testes. O Mestre decide os desfechos que dependem de adjudicação. Este painel armazena o relato escolhido pela Mesa; não aplica morte, transformação, reversão, alteração de Recursos ou Condições.

## Implementação

- `src/registroDecisoesMesa.ts`: tipos, validação estrita, limite e inclusão append-only.
- `src/RegistroDecisoesMesaLocal.tsx`: formulário/histórico integrado em `src/FichaLocal.tsx`, logo após Condições.
- Categorias: Morte, Transformação, Reversão de transformação, Desfecho de Reanimação, Exceção/decisão especial, Retificação e Outro acontecimento.
- Campos: ID, tipo, descrição (máx. 500 caracteres), responsável informado (máx. 80), data/hora do acontecimento e carimbo de registro do dispositivo.
- Exige confirmação e só apresenta sucesso após `aoSalvar` confirmar a gravação.
- Interface não permite editar ou apagar entradas; correções são novas entradas do tipo Retificação.
- Histórico ausente em ficha antiga é tratado como lista vazia. Valor presente inválido (inclusive `null`) é preservado e bloqueia a edição, sem sobrescrita silenciosa.
- Limite de 30 eventos por personagem. A decisão considera o limite de 32 KB atualmente aplicado ao corpo da API LAN; ainda é necessário monitorar o tamanho real do JSON completo da ficha em uso.

## Persistência, backup e LAN

- `validacaoPersonagemLocal.ts` valida o novo campo no armazenamento Offline.
- `server/personagens-local.mjs` valida o mesmo contrato no PUT LAN e rejeita histórico malformado com HTTP 422.
- O salvamento Offline usa o patch por chave existente; conflito na mesma chave é recusado pelo mecanismo atual de IndexedDB.
- O servidor LAN mantém a autorização existente: somente a conta Jogador proprietária da personagem pode escrever na ficha. O Mestre continua sem editor da ficha completa.
- `responsavel` é autodeclarado pelo usuário que registra; não prova identidade, papel ou autoria autenticada do Mestre.
- Backup usa JSON extensível e preserva o campo; teste explícito de ida/volta adicionado em `tests/backup-ficha.test.mjs`.

## Testes adicionados/atualizados

- `tests/registro-decisoes-mesa.test.mjs`: validação, duplicidade, limite, IDs e contrato básico da UI.
- `tests/personagens-local.test.mjs`: gravação LAN, rejeição de registro inválido e preservação da ficha após HTTP 422; os testes existentes também confirmam que Mestre/terceiro não editam a ficha.
- `tests/backup-ficha.test.mjs`: ida e volta do novo campo e rejeição de evento malformado.
- **Não executados nesta sessão.** Nenhum resultado de teste/build é declarado.

## Limites e próximos passos

- Não há autoria autenticada de decisões do Mestre; isso exigiria fluxo próprio sem conceder editor universal da ficha.
- Não há vínculo estruturado de um evento com uma instância específica de Condição ou registro de Reanimação; a descrição pode contextualizar o fato, mas não substitui relacionamento formal.
- O carimbo de registro usa o relógio do dispositivo; não é prova temporal de servidor.
- Validar manualmente Offline (gravar, recarregar, backup/restauração), LAN (gravar, recarregar, conflito de revisão), acesso por Jogador proprietário e recusa de conta sem permissão.
- Revisar, em etapa própria, se os estados terminais calculados pela Reanimação devem permanecer apenas como resultados pendentes de decisão do Mestre, conforme o princípio funcional confirmado.
- Sem alteração de CSS/layout geral, navegação, versão do IndexedDB, schema SQLite, Inventário, branch principal, publicação ou merge.
