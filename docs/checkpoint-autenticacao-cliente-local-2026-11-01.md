# Checkpoint — autenticação local no cliente — 01/11/2026

## Estado desta etapa

**IMPLEMENTADO no branch de trabalho:** tela de conexão local com cadastro, login, confirmação de identidade, consulta de sessão e logout explícito.

**NÃO TESTADO nesta execução:** build TypeScript/Vite, testes Node e fluxo em navegador. O ambiente desta tarefa permite alterações via GitHub, mas não disponibiliza checkout local nem execução do projeto. Não considerar a etapa validada ou publicada.

## Contrato da API conferido

Inspecionados `src/servidorLocal.ts`, `server/auth-local.mjs` e `server/index.mjs` no commit anterior à implementação. As respostas conferem com os tipos e métodos do cliente:

- Cadastro: `POST /api/auth/register` → `{ account }`; não cria sessão automaticamente.
- Login: `POST /api/auth/login` → `{ account, token, expiresAt }`.
- Conta atual: `GET /api/auth/me` → `{ account }`.
- Logout: `POST /api/auth/logout` → `{ ok: true }`.
- Ticket WebSocket: `POST /api/auth/ws-ticket` → ticket de uso único com validade curta.
- Mesas: `GET/POST /api/mesas`, protegidas por sessão; criação atribui papel de Mestre ao criador.
- Duração de sessão definida no servidor: sete dias.

## Alterações

- `src/ConexaoServidorLocal.tsx`: após diagnóstico saudável, exibe cadastro/login. Após login, consulta `/api/auth/me` antes de mostrar sessão autenticada. Permite validar sessão e encerrar no servidor.
- Token permanece somente no estado React em memória; não é gravado em localStorage/sessionStorage nem exibido na interface. Recarregar/fechar a página perde a credencial no cliente.
- O endereço do servidor fica bloqueado enquanto a sessão estiver ativa, evitando descartar localmente uma sessão sem permitir logout pelo mesmo endereço.
- A interface verifica a data de expiração periodicamente e trata HTTP 401 como sessão ausente/expirada.
- Cadastro exige senha de 12 a 128 caracteres conforme a API.
- `src/styles.css`: estilos responsivos da etapa de autenticação.
- `tests/servidor-local.test.mjs`: adicionados testes de contrato para cadastro, login, /me, listagem/criação de Mesa, logout, bloqueio após logout, CORS permitido, preflight e origem bloqueada.

## Segurança e limites conhecidos

- O servidor é um protótipo LAN por HTTP, sem TLS. Usar somente dados fictícios e rede privada confiável; não usar senhas reais nem dados de campanha.
- Perder o estado de memória ao recarregar a página **não revoga** o token no servidor. A credencial permanece válida até logout ou expiração (sete dias). A interface informa isso.
- A sessão ainda não é renovada automaticamente.
- Cadastro/login ainda não liberam operações de Mesa pela interface.
- WebSocket cross-origin ainda não foi integrado. A validação de origem no upgrade WebSocket permanece uma etapa separada; a política CORS HTTP não resolve isso.
- A API de Mesa não implementa ingresso/convites/limites de participantes, nem fichas ou sincronização de campanha. Não conectar os módulos de personagem a essa API ainda.
- A proteção CORS não substitui autenticação, autorização ou TLS.

## Próxima etapa sugerida

Executar a suíte automatizada no ambiente de desenvolvimento e corrigir eventuais falhas. Depois, integrar a listagem e criação de Mesas na interface autenticada, sem implementar ingresso por código até que o contrato e as regras de autorização estejam definidos e testados.

## Evidência Git

Alterações gravadas no branch `fix/lab-criacao-feedback-2026-10-31`. Último commit desta etapa: `97c2271c044ab7d34b6c207f49a5b2dd2e2a69ae` (ajuste da tela para bloquear a troca de endereço durante sessão). Os testes foram adicionados no commit `bfa2c23a863846284b1a609667e5adeaa846afe8`. O commit de estilos é `5ea3fb1c866736ead2e8a5af1e082eea05d1f63d`; a tela de autenticação está em `c6e5ab2c9e23698c82493e66a18a845b2c69fcad`.
