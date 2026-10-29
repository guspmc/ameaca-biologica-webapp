# Checkpoint — correção de reconexão WebSocket (29/10/2026)

**Projeto:** Ameaça Biológica RPG  
**Branch de trabalho:** fix/lan-websocket-reconnect-2026-10-29  
**Branch-base:** feat/origens-rascunho-alfa04  
**Estado atualizado (29/10/2026, após rodada humana):** heartbeat, reconexão automática, histórico/deduplicação e sincronização ao voltar para a aba estão implementados. O CI registrado no commit `bb8835e481c3774360a0ec682af77816c74cfa19` passou (267 testes e build concluído). Gus relatou L2–L6 aprovados; no PC o comportamento foi perfeito. No Android, após repouso prolongado com tela apagada, a conexão cai; atualizar a página recupera em 100% dos casos e às vezes ocorre reconexão automática. L5 fica aprovado com ressalva: a conexão não se mantém durante o repouso e a reconexão automática não é consistente. L7 adiado até estabilizar o PC como servidor.  
**Publicação/merge:** não realizados.

## 1. Motivo

No teste LAN, uma mensagem enviada pelo Android só apareceu no PC depois de atualizar a página. O usuário também observou que o indicador do canal mudou para vermelho. Isso mostra que a página detectou uma desconexão do WebSocket, mas não determina se o processo do servidor parou, se a rede caiu ou se o navegador/sistema suspendeu a conexão.

A implementação anterior não tentava reconectar automaticamente e não recuperava o histórico depois de uma desconexão.

## 2. Alterações implementadas nesta branch

- **Servidor — heartbeat:** envia ping WebSocket a cada 25 segundos e marca clientes responsivos por meio de pong. Se um cliente não responde até o ciclo seguinte, a conexão é encerrada para que o navegador possa reconstruí-la. O processo Node não tem temporizador de desligamento por inatividade.
- **Cliente — reconexão automática:** ao receber o evento de fechamento, agenda novas tentativas com espera progressiva, começando perto de 1 segundo e aumentando até cerca de 30 segundos, com pequena variação aleatória. O contador de espera só é zerado após a conexão permanecer estável por 10 segundos, evitando tentativas rápidas repetidas quando o canal oscila.
- **Recuperação de histórico:** quando o WebSocket abre ou reabre, a página consulta GET /api/events sem exigir F5.
- **Retorno ao primeiro plano:** ao voltar de uma aba suspensa, a página tenta reconectar se o WebSocket já estiver fechado; se ainda estiver aberto, consulta novamente o histórico para reconciliar possíveis eventos perdidos.
- **Teste de cliente sem resposta:** um cliente WebSocket que ignora os pings é encerrado pelo servidor após o próximo ciclo, permitindo que o navegador tente reconectar.
- **Deduplicação e ordenação:** eventos são identificados pelo ID do banco, não são inseridos duas vezes quando chegam pelo histórico e pelo canal ao vivo, e a lista permanece em ordem de ID. A página mantém até 50 eventos visíveis e limita o conjunto recente de IDs lembrados.
- **Testes automatizados novos:** verificam que um cliente WebSocket responsivo permanece conectado durante múltiplos ciclos de heartbeat e que o script da página LAN tem sintaxe válida, que a reconexão e a sincronização ao retomar a aba funcionam em um teste simulado do navegador, e que a deduplicação está presente.
- **Diagnóstico da causa:** logs no servidor registram conexão/fechamento, código e motivo quando informados, além de indicar explicitamente quando o heartbeat encerra um cliente sem resposta.
- **CI:** o workflow de validação do servidor local foi ajustado para executar também em branches fix/**, e não apenas na branch original do protótipo.

## 3. O que ainda não foi comprovado

- O CI passou no commit bb8835e481c3774360a0ec682af77816c74cfa19, incluindo retorno ao primeiro plano, reconexão simulada, encerramento de cliente que ignora pings e backoff após conexão estável. O reteste humano continua pendente.
- O heartbeat foi concebido para detectar conexão sem resposta, mas ainda precisa ser validado com navegadores reais. O teste automatizado usa o cliente WebSocket da biblioteca Node, não o Chrome do PC e o navegador Android.
- Não há evidência suficiente para afirmar que a queda original foi causada por inatividade. O servidor não possuía um desligamento por ociosidade; a causa provável continua em aberto entre rede, navegador/sistema, processo e canal WebSocket.
- Não é possível garantir que a conexão física fique aberta indefinidamente: o sistema operacional, a economia de bateria, o navegador, o roteador ou a rede podem suspendê-la. O objetivo é não desligar o processo por inatividade e recuperar a conexão automaticamente quando o ambiente permitir.

## 4. Próximas ações — ordem de execução

1. **L1 — CI (aprovado para o commit registrado):** 267 testes passaram e o build foi aprovado em `bb8835e481c3774360a0ec682af77816c74cfa19`. Reexecutar CI após novas alterações.
2. **L2 — inatividade visível: aprovado por Gus.** PC e Android trocaram mensagens; PC relatado como perfeito.
3. **L3 — reinício do servidor: aprovado por Gus.**
4. **L4 — queda e retorno do Wi-Fi: aprovado por Gus.**
5. **L5 — suspensão do Android: aprovado com ressalva por Gus.** Repouso prolongado pode derrubar a conexão; atualização da página recupera em 100% dos casos, reconexão automática ocorre em alguns casos. Não alegar reconexão automática garantida.
6. **L6 — LAN sem internet: aprovado por Gus.**
7. **L7 — Android como servidor: adiado a pedido de Gus até estabilizar o PC como servidor.**

O roteiro completo está em docs/testes-humanos-pendentes.md.

## 5. Resultado da validação automatizada

O GitHub Actions concluiu com sucesso o workflow “Validar protótipo local LAN” para o commit bb8835e481c3774360a0ec682af77816c74cfa19:

- **267 testes passaram; 0 falharam.**
- O build TypeScript + Vite concluiu com sucesso.
- Os testes de heartbeat, sintaxe do script, reconexão simulada e sincronização ao retomar a aba passaram.
- Execução: https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/40878510544

Esta evidência valida a suíte automatizada e a compilação para o commit bb8835e. O navegador real no PC e no Android ainda não foi retestado.

## 6. Segurança e limites preservados

- Protótipo continua sem autenticação e não deve receber dados reais de campanha.
- Usar somente rede confiável durante os testes.
- Nenhum merge, publicação no GitHub Pages, alteração de Supabase ou mudança na arquitetura aprovada foi executado.
- A correção está isolada na branch de desenvolvimento e não é considerada aprovada até CI e reteste manual.


## 7. Resultado da rodada humana relatada por Gus — 29/10/2026

- **L2–L6: aprovados por relato do usuário.** O PC funcionou perfeitamente durante os testes.
- **Android em repouso prolongado:** ao apagar a tela por bastante tempo, o cliente pode desconectar. Atualizar a página restabelece o funcionamento em 100% dos casos observados; em alguns casos, a reconexão é automática. Isso não comprova reconexão automática consistente após suspensão.
- **L7 adiado:** não investigar Android como servidor até o PC como servidor estar estabilizado.
- **Próxima ação técnica:** inspecionar o estado real da branch e a arquitetura-alvo antes de escolher a próxima mudança; executar CI novamente após qualquer alteração de código.

