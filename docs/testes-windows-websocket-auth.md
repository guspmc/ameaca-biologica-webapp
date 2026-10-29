# Roteiro de testes — autenticação do canal WebSocket (Windows)

Este roteiro deve ser executado depois que os testes automatizados do branch estiverem verdes. O servidor permanece protótipo e deve usar somente contas e dados fictícios.

## Preparação

1. No Windows, abrir PowerShell.
2. Clonar ou atualizar o branch `fix/lan-websocket-reconnect-2026-10-29`.
3. Instalar Node.js 22 e pnpm 11.25.0.
4. Executar `pnpm install --frozen-lockfile`.
5. Executar `pnpm test` e `pnpm run build`. Ambos devem terminar sem erros.
6. Iniciar o servidor com `pnpm run server:local`.
7. Confirmar a página local em `http://localhost:4175/` e a saúde em `http://localhost:4175/api/health`.

## Testes automatizados já previstos

- Cadastro/login e sessão válida.
- Emissão de ticket somente com sessão.
- Ticket aleatório, com expiração curta e uso único.
- Ticket inválido/desconhecido recusado.
- Rotas antigas `/api/events` desativadas (HTTP 410).
- Migração SQLite registrada e persistente após reinício.

## Testes manuais no Windows

### 1. Acesso sem ticket

Tentar abrir uma conexão WebSocket em `ws://localhost:4175/ws` sem parâmetro `ticket`.

**Esperado:** handshake recusado com HTTP 401. Nenhum cliente deve aparecer como conectado no log do servidor.

### 2. Ticket válido e uso único

Com uma sessão autenticada, fazer POST em `/api/auth/ws-ticket` enviando o cabeçalho `Authorization: Bearer <token>`.

**Esperado:** HTTP 201, resposta `Cache-Control: no-store`, ticket opaco e `expiresAt` aproximadamente 30 segundos à frente. Abrir `ws://localhost:4175/ws?ticket=<ticket>`.

**Esperado:** conexão aceita e primeira mensagem JSON com `type: "ready"`. Repetir a conexão com o mesmo ticket.

**Esperado:** segunda tentativa recusada com HTTP 401.

### 3. Sessão revogada

Emitir ticket, executar logout da sessão que o originou e tentar consumir o ticket ainda não expirado.

**Esperado:** conexão recusada. Se o ticket for aceito após logout, registrar como falha de segurança; não usar o servidor com dados reais.

### 4. Expiração

Emitir ticket e aguardar pelo menos 31 segundos antes de tentar conectar.

**Esperado:** HTTP 401.

### 5. Origem

Tentar conectar com ticket válido, mas enviando cabeçalho Origin de outro host.

**Esperado:** HTTP 403; nenhuma conexão estabelecida.

### 6. Rotas demonstrativas

Fazer GET e POST em `/api/events`, com e sem sessão.

**Esperado:** HTTP 410 em ambos os casos. Essas rotas não podem transportar dados de campanha.

### 7. Reinício

Encerrar o servidor com Ctrl+C e iniciar novamente.

**Esperado:** encerramento limpo, banco SQLite preservado, migrações sem duplicação e autenticação ainda funcional para sessão não expirada.

## Critério para aprovação

Não aprovar esta etapa enquanto os testes automatizados e os testes manuais 1 a 7 não forem registrados. Qualquer aceitação de ticket expirado, reutilizado ou originado de sessão revogada bloqueia a etapa.

## Limitações conhecidas

- O ticket autentica uma conta, mas o WebSocket ainda não está inscrito em uma Mesa nem aplica autorização por Mesa.
- O transporte ainda é HTTP/WS sem TLS. Usar apenas dados fictícios; não inserir credenciais reais de campanha em rede compartilhada.
- O cliente de interface ainda precisa ser adaptado para solicitar ticket antes de abrir o WebSocket.
- O canal não deve ser considerado pronto para sincronização de ficha.
