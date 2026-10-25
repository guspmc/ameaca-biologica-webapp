# T14 — contexto de criação, somente simulação

**Enfileirados: quatro casos, pendentes de teste humano.** Fazem parte da fila de até dez; não é necessário interromper outras atividades para executá-los agora. T13 permanece encerrado. Estes identificadores pertencem à fila do WebApp, não à tabela de cenários do Planejamento oficial.

Abrir no PC: http://127.0.0.1:4174/ameaca-biologica-webapp/tests/ui/contexto.html

Confirmar **SIMULAÇÃO ISOLADA · CONTEXTO DE CRIAÇÃO**. Sem login ou dados reais. **F5, trocar cenário ou Reiniciar zera esta página**; não usar F5 no meio de cada caso. Ela difere da simulação de recuperação T13, que conserva estado após F5.

## T14.1 — preparar, pausar e permitir finalizações

1. Selecionar **Mesa vazia**, clicar Reiniciar simulação.
2. Esperado: Envios 0, servidor sem contexto, Consultar disponível; Salvar e Permitir desabilitados.
3. Clicar **Consultar contexto**. Esperado: contexto ainda não preparado, Envios 0. A consulta não o prepara.
4. Marcar **Permitir novas finalizações**. Sem marcar a confirmação de preparação, Salvar continua desabilitado.
5. Marcar **Confirmo preparar esta Mesa vazia com criação Padrão de nível 1** e clicar **Salvar contexto fictício**.
6. Esperado: configuração confirmada, preparado, revisão 0, finalizações permitidas, Envios 1; a confirmação de preparação deixa de aparecer.
7. Desmarcar Permitir novas finalizações e salvar. Esperado: pausadas, revisão 1, Envios 2.
8. Marcar novamente e salvar. Esperado: permitidas, revisão 2, Envios 3.
9. PV 7, SA 1 e BI 3 devem permanecer iguais. A mensagem explica que isso não encerra a campanha nem congela/apaga rascunhos.

## T14.2 — Mesa existente sem contexto não recebe configuração presumida

1. Selecionar **Mesa existente sem contexto**, Consultar contexto.
2. Marcar Permitir novas finalizações e a confirmação de preparação. Clicar Salvar contexto fictício para simular a tentativa recusada pelo servidor.
3. Esperado: **Configuração recusada. A preparação desta Mesa exige um fluxo específico.**
4. Servidor continua sem contexto, Envios 1, Personagens preservadas 1 e recursos inalterados. A escolha local permitir continua visível, mas Salvar está desabilitado até consultar novamente.
5. Não remover personagem ou alterar dados de campanha para contornar a recusa; este cenário é inteiramente fictício.

## T14.3 — conflito conserva escolha, atualização exige nova decisão

1. Selecionar **Contexto mudou antes de salvar**, Consultar contexto.
2. Marcar Permitir novas finalizações e a confirmação de preparação; salvar.
3. Esperado: contexto desatualizado, escolha local **permitir** preservada, Salvar desabilitado. Servidor fictício mostra revisão 1, finalizações **pausadas**, Envios 1.
4. Clicar Consultar contexto. Esperado: revisão 1 e pausadas passam ao estado consultado, caixa Permitir fica desmarcada. Envios permanece 1; consultar não salva a escolha anterior.
5. Deliberadamente marcar Permitir e salvar. Esperado: configuração confirmada, revisão 2, permitidas, Envios 2. Recursos iguais.

## T14.4 — resposta perdida recuperada por consulta, sem outro envio

1. Selecionar **Resposta perdida após salvar**, Consultar contexto.
2. Marcar Permitir novas finalizações e a confirmação de preparação; salvar uma vez.
3. Esperado: **Resposta não confirmada. Consulte o contexto antes de tentar novamente.** Sem anúncio de confirmação, Salvar desabilitado, escolha local permitir preservada. A faixa de diagnóstico do servidor fictício mostra revisão 0, permitidas, Envios 1.
4. Clicar Consultar contexto, sem reiniciar e sem F5.
5. Esperado: estado consultado preparado, revisão 0, permitidas; **Envios continua 1**. Nenhuma nova configuração é enviada para recuperar a resposta.

## Confirmar resultados

Responder quando puder: **T14.1 aprovado; T14.2 aprovado; T14.3 aprovado; T14.4 aprovado**. Em falha, informar caso, passo, mensagem e captura. Não executar estes procedimentos em Mesas reais. Esta rodada avalia a interface fictícia; não certifica Auth, RLS ou integração remota.
