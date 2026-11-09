# Checkpoint — listagem e criação de Mesas locais — 01/11/2026

## Estado

**IMPLEMENTADO no branch de trabalho:** após login e confirmação de identidade, o cliente carrega a lista de Mesas da conta. A interface permite atualizar a lista e criar uma Mesa, exibindo o papel retornado pelo servidor.

**TESTES AUTOMATIZADOS:** foram acrescentados testes de integração para criação/listagem/logout e para isolamento entre duas contas. O workflow `validar-servidor-local` foi iniciado pelo GitHub Actions no commit desta etapa; consultar o resultado do check antes de considerar validado.

**NÃO PUBLICADO:** nenhuma alteração foi mesclada em `main`, nem publicada no GitHub Pages ou aplicada ao ambiente Supabase.

## Contrato conferido

As rotas de Mesa estão implementadas em `server/auth-local.mjs`:

- `GET /api/mesas`: lista somente Mesas em que a conta autenticada é participante.
- `POST /api/mesas`: cria a Mesa e registra atomicamente o criador como participante com papel `mestre`.
- `GET /api/mesas/:id`: retorna detalhes somente se a conta for participante; caso contrário, responde 404.
- Todas exigem sessão válida; sessão ausente/expirada retorna 401.
- Nome da Mesa: 1 a 80 caracteres após trim.
- A resposta da API corresponde aos tipos `MesaLocal` e aos métodos já existentes em `src/servidorLocal.ts`.

## Alterações

- `src/ConexaoServidorLocal.tsx`: após login, busca a lista inicial; exibe nome, data de criação e papel Mestre/Jogador; permite atualizar a lista; cria Mesa e busca novamente a lista antes de apresentar a confirmação. Trata 401 limpando sessão e lista local.
- `src/styles.css`: estilos responsivos para a lista e o formulário de criação.
- `tests/servidor-local.test.mjs`: teste adicional de isolamento entre duas contas, além dos testes anteriores de autenticação, criação, logout e CORS.
- Sem alterações no banco, migrations, Supabase, WebSocket, fluxo de ingresso ou módulos de ficha.

## Limites conhecidos

- Ainda não há convite, código de ingresso, aprovação, remoção de participante, limite de dez jogadores, nem sincronização Realtime de Mesas.
- A lista só é atualizada quando a tela solicita; não há atualização em tempo real.
- Criar uma Mesa torna a conta criadora Mestre, conforme o contrato atual.
- O servidor continua sendo protótipo HTTP sem TLS. Usar apenas contas/senhas fictícias e rede privada confiável.
- Token permanece somente em memória; recarregar perde o token no navegador, sem revogar automaticamente a sessão no servidor.
- Não iniciar testes humanos ainda; aguardar confirmação do CI e completar os fluxos necessários.

## Próxima etapa

Aguardar o resultado de `validar-servidor-local`. Se passar, avançar para a análise de ingresso/convites e limites de participantes, confrontando as decisões aprovadas do planejamento antes de desenhar ou implementar esse fluxo.
