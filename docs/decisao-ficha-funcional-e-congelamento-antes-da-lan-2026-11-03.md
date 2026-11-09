# Decisão de produto — congelamento da Ficha antes da integração LAN

**Data:** 03/11/2026  
**Branch:** `feat/offline-first-ficha`

## Decisão confirmada pelo usuário

A Ficha do Jogador deve primeiro chegar a um estado **funcional e independente**, para que seja possível testar diretamente seu visual e seu funcionamento. Os ajustes de interface e comportamento serão feitos nessa fase. Quando a ficha estiver validada, ela será **congelada como versão-base** antes de iniciar a integração com a LAN.

A LAN será uma etapa posterior de integração, não uma condição para a ficha funcionar.

## Ciclo de vida aprovado

### Fase 1 — Ficha local funcional

- Abrir e utilizar a ficha sem autenticação, Supabase ou servidor.
- Criar, selecionar, editar, salvar e excluir personagens localmente.
- Persistir os dados no dispositivo.
- Permitir uso offline depois que o aplicativo e seus recursos tiverem sido carregados/instalados.
- Preservar a ficha contínua e a identidade visual do protótipo aprovado.
- Implementar exportação e importação de backup, com validação e proteção contra sobrescrita acidental.
- Testar visual, navegação, campos, estados de salvamento, persistência e comportamento em telas móveis e desktop.
- Corrigir os problemas encontrados e registrar a homologação.

### Fase 2 — Congelamento da Ficha

O congelamento só acontece após validação do usuário. Deve incluir:

- referência exata ao commit/tag da versão aprovada;
- registro do escopo funcional e visual congelado;
- testes executados e resultados;
- pendências conhecidas aceitas;
- garantia de que o backup/exportação continua funcionando.

Congelar significa estabelecer uma base estável para integração. Não significa impedir correções de bugs; alterações posteriores devem ser controladas e documentadas.

### Fase 3 — Integração LAN

Depois do congelamento, desenvolver a camada LAN para:

- enviar alterações confirmadas ao servidor local;
- permitir salvamento no servidor sem exigir exportação manual;
- disponibilizar informes/atualizações em tempo real aos clientes autorizados;
- manter a ficha utilizável localmente quando a LAN estiver indisponível;
- preservar exportação/importação como backup e transferência independente.

A sincronização LAN deve ser uma camada adicional sobre o modelo local, sem transformar o servidor em requisito para abrir a ficha.

Antes de implementar a LAN, especificar e testar: identidade dos dispositivos/usuários, autorização por Mesa/personagem, protocolo e formato de mensagens, reconexão, fila de alterações pendentes, confirmação de gravação, conflitos de edição simultânea, idempotência, versionamento e recuperação após falhas. Não assumir que uma simples conexão WebSocket resolve esses requisitos.

## Princípios que permanecem

- A ficha local é a fonte de trabalho disponível no dispositivo; a LAN adiciona sincronização e compartilhamento.
- Exportação continua existindo como backup externo e mecanismo de transferência.
- Nenhuma sincronização pode mostrar “salvo no servidor” antes da confirmação do servidor.
- Falha ou perda de conexão LAN não pode apagar nem invalidar dados locais já salvos.
- Não armazenar dados de personagem no cache do Service Worker.
- Não introduzir serviços pagos nem depender de Supabase.
- O Painel do Mestre e o Laboratório continuam na ordem definida pela decisão arquitetural Offline Primeiro; esta decisão detalha o marco de validação da Ficha antes da etapa LAN.
- Nenhum merge em `main`, publicação ou congelamento final sem validação expressa do usuário.

## Critérios mínimos para declarar a Ficha pronta para congelamento

1. CRUD de personagens persistente e testado.
2. Ficha contínua utilizável, com campos e regras conferidos nas fontes oficiais.
3. Visual comparado com o protótipo aprovado e validado pelo usuário.
4. Estados de salvamento honestos e tratamento de falhas.
5. Backup JSON exportável e restaurável, incluindo tratamento explícito de duplicatas.
6. PWA abre e permite trabalhar sem rede após primeiro carregamento.
7. Testes automatizados e testes manuais críticos registrados.
8. Documentação de versão, limitações e procedimento de backup.
9. Aprovação expressa do usuário para congelar.

Esta decisão complementa, sem substituir, `docs/decisao-arquitetural-offline-primeiro-2026-11-03.md` e `docs/continuidade-offline-primeiro-2026-11-03.md`.
