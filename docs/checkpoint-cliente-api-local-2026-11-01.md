# Checkpoint — cliente da API local no frontend

**Data:** 01/11/2026  
**Branch:** `fix/lab-criacao-feedback-2026-10-31`  
**Commit:** `702c27a54c0a7ed53df49eefe3b6529ee49c7c10`

## Objetivo

Criar uma camada única e tipada para o frontend conversar com a API experimental do servidor local, sem conectar ainda o laboratório de rascunhos nem alterar a aplicação Supabase publicada.

## Implementado

Arquivo novo: `src/servidorLocal.ts`.

- Cliente configurado com endereço explícito do servidor.
- Tipos para conta, sessão, Mesa, saúde do servidor e ticket WebSocket.
- Métodos correspondentes às rotas existentes: saúde, cadastro, login, sessão atual, logout, listar/criar/consultar Mesa e emissão de ticket WebSocket.
- Token de sessão é recebido pelo cliente e enviado somente no cabeçalho `Authorization: Bearer`; o módulo não grava credenciais em localStorage, sessionStorage ou IndexedDB.
- Requisições usam `cache: no-store` e `credentials: omit`.
- Erros HTTP preservam o status e a mensagem devolvida pela API; falha de rede recebe mensagem própria.
- Validação básica do endereço e do identificador de Mesa.

## Limites preservados

- Nenhuma tela React foi conectada ao cliente ainda.
- O laboratório continua usando apenas seus rascunhos fictícios locais.
- Supabase, produção, migrations e publicação não foram alterados.
- Não há fluxo de convite/entrada em Mesa, participantes, fichas, presença ou sincronização de dados de RPG na API atual.
- O protótipo continua usando HTTP sem TLS e não deve receber credenciais ou dados reais de campanha.

## Validação

**Implementado:** camada de comunicação tipada e isolada.  
**Não executado neste ambiente:** TypeScript, testes automatizados e build.  
**Pendente:** revisar o contrato em conjunto com o próximo passo de integração e executar CI antes de considerar o código validado.

## Próximo passo

Criar um pequeno estado de conexão local independente do Supabase, com configuração explícita do endereço do servidor e verificação de saúde. Só depois ligar o fluxo de autenticação local e a listagem/criação de Mesas, mantendo os rascunhos fictícios fora desse fluxo até haver uma decisão segura de migração/ativação.