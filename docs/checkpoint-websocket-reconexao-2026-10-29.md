# Checkpoint — correção de reconexão WebSocket (29/10/2026)

**Projeto:** Ameaça Biológica RPG  
**Branch de trabalho:** fix/lan-websocket-reconnect-2026-10-29  
**Branch-base:** feat/origens-rascunho-alfa04  
**Estado atualizado (29/10/2026):** heartbeat, reconexão automática, histórico/deduplicação e sincronização ao voltar para a aba estão implementados na branch. CI passou no commit ae300ed; CI para a nova alteração de visibilidade está em execução. Reteste humano ainda pendente.  
**Publicação/merge:** não realizados.

## 1. Motivo

No teste LAN, uma mensagem enviada pelo Android só apareceu no PC depois de atualizar a página. O usuário também observou que o indicador do canal mudou para vermelho. Isso mostra que a página detectou uma desconexão do WebSocket, mas não determina se o processo do servidor parou, se a rede caiu ou se o navegador/sistema suspendeu a conexão.

A implementação anterior não tentava reconectar automaticamente e não recuperava o histórico depois de uma desconexão.

## 2. Alterações implementadas nesta branch

- **Servidor — heartbeat:** envia ping WebSocket a cada 25 segundos e marca clientes responsivos por meio de pong. Se um cliente não responde até o ciclo seguinte, a conexão é encerrada para que o navegador possa reconstruí-la. O processo Node não tem temporizador de desligamento por inatividade.
- **Cliente — reconexão automática:** ao receber o evento de fechamento, agenda novas tentativas com espera progressiva, começando perto de 1 segundo e aumentando até cerca de 30 segundos, com pequena variação aleatória.
- **Recuperação de histórico:** quando o WebSocket abre ou reabre, a página consulta GET /api/events sem exigir F5.
- **Retorno ao primeiro plano:** ao voltar de uma aba suspensa, a página tenta reconectar se o WebSocket já estiver fechado; se ainda estiver aberto, consulta novamente o histórico para reconciliar possíveis eventos perdidos.
- **Deduplicação e ordenação:** eventos são identificados pelo ID do banco, não são inseridos duas vezes quando chegam pelo histórico e pelo canal ao vivo, e a lista permanece em ordem de ID. A página mantém até 50 eventos visíveis e limita o conjunto recente de IDs lembrados.
- **Testes automatizados novos:** verificam que um cliente WebSocket responsivo permanece conectado durante múltiplos ciclos de heartbeat e que o script da página LAN tem sintaxe válida, com os ganchos de reconexão, sincronização e deduplicação presentes.
- **Diagnóstico da causa:** logs no servidor registram conexão/fechamento, código e motivo quando informados, além de indicar explicitamente quando o heartbeat encerra um cliente sem resposta.
- **CI:** o workflow de validação do servidor local foi ajustado para executar também em branches fix/**, e não apenas na branch original do protótipo.

## 3. O que ainda não foi comprovado

- O CI passou no commit ad944c055ecb9982ba1ef7c0cf6baf106976c6a0, que inclui a instrumentação de diagnóstico, e no commit ae300ed74190eed3ce33489cb900aac37f80cd8e, que consolidou o checkpoint. O CI para a atualização de retorno ao primeiro plano está em execução; o reteste humano continua pendente.
- O heartbeat foi concebido para detectar conexão sem resposta, mas ainda precisa ser validado com navegadores reais. O teste automatizado usa o cliente WebSocket da biblioteca Node, não o Chrome do PC e o navegador Android.
- Não há evidência suficiente para afirmar que a queda original foi causada por inatividade. O servidor não possuía um desligamento por ociosidade; a causa provável continua em aberto entre rede, navegador/sistema, processo e canal WebSocket.
- Não é possível garantir que a conexão física fique aberta indefinidamente: o sistema operacional, a economia de bateria, o navegador, o roteador ou a rede podem suspendê-la. O objetivo é não desligar o processo por inatividade e recuperar a conexão automaticamente quando o ambiente permitir.

## 4. Próximas ações — ordem de execução

1. **L1 — CI:** confirmar testes e build verdes para o commit atual. Corrigir qualquer falha antes de solicitar teste manual.
2. **L2 — inatividade visível:** deixar PC e Android com as páginas abertas por 3–5 minutos; enviar mensagens nos dois sentidos sem F5 e verificar ausência de duplicatas.
3. **L3 — reinício do servidor:** parar e iniciar o servidor com os navegadores ainda abertos; confirmar reconexão automática e recuperação do histórico.
4. **L4 — queda e retorno do Wi-Fi do cliente:** confirmar reconexão e sincronização do histórico.
5. **L5 — suspensão do Android:** repetir com tela bloqueada ou navegador em segundo plano e registrar o comportamento observado.
6. **L6 — LAN sem internet:** testar que a comunicação continua quando a internet está indisponível, mas a rede local permanece funcional.
7. **L7 — Android como servidor:** investigar somente depois de estabilizar o PC como servidor.

O roteiro completo está em docs/testes-humanos-pendentes.md.

## 5. Resultado da validação automatizada

O GitHub Actions concluiu com sucesso o workflow “Validar protótipo local LAN” para o commit ad944c055ecb9982ba1ef7c0cf6baf106976c6a0:

- **265 testes passaram; 0 falharam.**
- O build TypeScript + Vite concluiu com sucesso.
- Os testes de heartbeat e sintaxe do script da página passaram.
- Execução: https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/40815758261

Esta evidência valida a suíte automatizada e a compilação para o commit ad944c0. O navegador real no PC e no Android ainda não foi retestado.

## 6. Segurança e limites preservados

- Protótipo continua sem autenticação e não deve receber dados reais de campanha.
- Usar somente rede confiável durante os testes.
- Nenhum merge, publicação no GitHub Pages, alteração de Supabase ou mudança na arquitetura aprovada foi executado.
- A correção está isolada na branch de desenvolvimento e não é considerada aprovada até CI e reteste manual.
