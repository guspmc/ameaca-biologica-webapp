# Checkpoint — autenticação WebSocket e conteúdo de Classe na ficha

**Data:** 29/10/2026  
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`  
**Estado:** alterações registradas no branch; execução local de testes/build ainda não realizada nesta rodada. Nenhuma publicação, merge ou alteração no Supabase de produção.

## 1. Segurança do canal WebSocket

### Implementado
- Migration 4 adiciona `session_token_hash` à tabela de tickets WebSocket.
- Tickets legados são descartados na aplicação da migration 4.
- A emissão armazena somente o hash SHA-256 da sessão emissora, nunca o token de sessão em texto puro.
- O consumo exige ticket não expirado e sessão emissora ainda ativa, pertencente à mesma conta.
- O consumo continua transacional e de uso único.
- Logout remove a sessão; tickets pendentes daquela sessão deixam de autenticar.
- A validação de Origin continua ocorrendo antes do consumo do ticket, evitando que origem inválida queime ticket legítimo.

### Testes adicionados (ainda não executados nesta rodada)
- Revogação do ticket após logout.
- Handshake real usando o cliente `ws`: ausência de ticket (401), origem inválida (403), ticket válido (101 + mensagem `ready`), repetição (401), expiração (401) e ticket emitido antes do logout (401).
- A validação da origem inválida também verifica que o ticket continua disponível para a conexão legítima seguinte.

## 2. Conteúdo oficial de Classe na ficha

Criado `src/classesFicha.ts`, com dados rastreados ao Arquivo do Jogador v1.0:
- PV por Nível, BI Base, SA Máxima e Pontos de Perícia;
- identidade/resumo da Classe;
- três Ramos;
- Proficiências;
- dois Itens Característicos.

A seção Características da ficha agora apresenta:
- fórmulas oficiais e valores persistidos de PV, BI, SA e Defesa;
- capacidade de Inventário calculada pela fórmula básica, incluindo o bônus de Mochileiro;
- Movimento base de 9 m;
- dados completos de Classe, Ramos e Proficiências.

O painel é informativo: não executa rolagens, não concede proficiência dinâmica e não altera valores persistidos. Bônus condicionais e equipamentos continuam seguindo os módulos próprios.

## 3. Testes e build

- Criado `tests/classes-ficha.test.mjs` para proteger os dados de Classe contra divergências acidentais.
- O workflow existente é acionado por alterações em `tests/**` no branch `fix/**`; as alterações recentes incluem testes nessa pasta.
- **Não há resultado novo de execução nesta rodada.** Testes e build permanecem pendentes até a rodada de terminal combinada com Gus ou evidência de CI verificável.

## 4. Limites conhecidos

- O canal WebSocket ainda não tem escopo de Mesa associado à conexão; autenticar uma conta não equivale a autorizar acesso a todos os dados de uma Mesa.
- O protótipo LAN ainda não substitui os serviços Supabase do frontend.
- A ficha ainda não é criação completa: progressão até níveis superiores, finalização, combate ativo e inventário ativo permanecem pendentes.
- Nenhuma alteração foi feita no banco Supabase de produção.

## 5. Próximo trabalho

1. Revisar o vínculo de autorização WebSocket por Mesa antes de transportar qualquer dado de campanha.
2. Auditar a consistência entre dados oficiais de Origem, Habilidades Básicas, Equipamento Inicial e os RPCs/migrations que os persistem.
3. Avançar em conteúdo da ficha sem ativar regras automáticas ou efeitos narrativos.
4. Reservar execução de `pnpm test` e `pnpm run build` para o checkpoint de validação conjunta com Gus.
