# Checkpoint — diagnóstico do servidor local no frontend

**Data:** 01/11/2026  
**Branch:** `fix/lab-criacao-feedback-2026-10-31`  
**Commit principal:** `c95c5acb9e2cc9c707b384549df211b84606ee38`

## Implementado

- `src/ConexaoServidorLocal.tsx`: tela independente para informar o endereço do servidor e consultar `/api/health`.
- A tela apresenta versão, armazenamento, canal realtime, necessidade de internet e aviso operacional devolvidos pelo servidor.
- O endereço escolhido pode ser lembrado no navegador; nenhuma credencial é solicitada ou armazenada.
- `src/App.tsx`: rota experimental `?servidor=local`, sem alterar o fluxo online ou o laboratório `?laboratorio=local`.
- `src/styles.css`: estilos responsivos da tela.
- `server/index.mjs`: CORS restrito a uma lista explícita de origens; padrão inclui GitHub Pages deste projeto e Vite local nas portas 5173. Não usa curingas nem habilita credenciais de cookies. Preflight OPTIONS permite apenas GET/POST e cabeçalhos Accept, Authorization e Content-Type.

## Segurança e limites

- A consulta de saúde é pública e não envia dados de conta ou Mesa.
- A API de autenticação e Mesas permanece protegida por token Bearer no servidor.
- CORS não substitui autenticação nem autorização.
- O WebSocket ainda não foi integrado ao frontend; sua validação de origem atual é mais restritiva e deverá ser tratada separadamente antes da sincronização em tempo real entre origens.
- O servidor permanece um protótipo HTTP sem TLS. Não usar senhas reais, dados pessoais ou dados reais de campanha.
- A lista CORS padrão é adequada à URL GitHub Pages registrada e ao Vite local; instalações com outra origem deverão configurar explicitamente `allowedOrigins` ao criar o servidor.

## Validação

**Implementado:** tela e rota de diagnóstico, além de política CORS explícita no servidor.  
**Não executado:** build, TypeScript, testes automatizados ou teste de navegador; o ambiente atual não dispõe de execução local do projeto.  
**Pendente:** CI e teste manual da rota em mesma origem e entre origens autorizadas; testar origem não autorizada e preflight.

## Próximo passo

Preparar integração de autenticação local com estado efêmero em memória e tratamento de expiração, ainda sem persistir tokens nem conectar rascunhos de personagens. Antes disso, revisar testes existentes e a política de origem para o ambiente de desenvolvimento.