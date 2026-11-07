# T19 — retomar organização após atualizar — dez casos PC

**10/10 pendentes.** Não repetir T18. Abrir no PC: [Retomar a organização](http://127.0.0.1:4174/ameaca-biologica-webapp/tests/ui/organizacao-sessao.html).

Confirmar **SIMULAÇÃO ISOLADA · ORGANIZAÇÃO APÓS ATUALIZAR**. Esta página conserva dados fictícios na sessão da mesma aba. **F5 agora faz parte dos testes**; não usar Reiniciar ou mudar cenário no meio de um caso. Fechar a aba, usar outra aba ou trocar endereço/IP/porta não é equivalente a F5 e pode perder a sessão. Não alterar armazenamento manualmente nem contas reais.

Antes de cada caso, escolher cenário e clicar **Reiniciar somente esta simulação**. Depois selecionar A e Consultar organização, salvo indicação diferente. O reinício remove somente dados fictícios desta página. Normal: revisão 7, oito exemplares, 6/7 Espaços, Envios 0/Alterações 0. Consultas podem aumentar; observar Envios/Alterações.

Operação padrão: escolher **Faca · espaço 4 · 103**, destino **7**, Preparar mudança, ler prévia, marcar **Conferi a troca de espaços e quero confirmar.**, Confirmar organização fictícia. Faca 103 tem 1/2; a 104 permanece no 5 com 2/2. Após F5 selecionar e consultar novamente; não deve consultar/enviar automaticamente.

## T19.1 — operação normal, atualização e nova organização
1. Normal, início padrão, mover Faca 103 ao 7 e confirmar: Envios 1/Alterações 1, revisão 8.
2. F5 na mesma aba: nenhuma ficha selecionada, contadores continuam 1/1, sem lista ou confirmação automática.
3. Selecionar A, Consultar: Faca 103 no 7 com 1/2, revisão 8.
4. Selecionar essa Faca, destino 4, preparar e confirmar: 2/2, revisão 9. F5/selecionar/consultar conserva a volta ao 4; nenhuma duplicação.

## T19.2 — resposta perdida recuperada após F5
1. Resposta perdida após gravar; operação padrão uma vez.
2. Esperado: não anunciar sucesso, pedido preservado, Envios 1/Alterações 1. Anotar final do identificador.
3. F5; selecionar A, sem consultar: mesmo pedido preservado, Repetir desabilitado, nenhum envio novo.
4. Consultar: recuperação por consulta, Faca no 7, revisão 8, mesmos 1/1. Pedido pendente deixa de aparecer. Consultar de novo não altera contadores de envio.

## T19.3 — falha anterior e repetição depois de F5
1. Falha antes de gravar; operação padrão: Envios 1/Alterações 0, pedido preservado.
2. F5, selecionar A: repetir desabilitado até Consultar.
3. Consultar: revisão 7/Faca no 4; repetição explícita do pedido fica disponível.
4. Repetir pedido preservado uma vez: Envios 2/Alterações 1, revisão 8/Faca no 7. Novo F5 e consulta conservam resultado e oito exemplares.

## T19.4 — indisponibilidade antes da preservação
1. Falha ao preservar pedido; manter marcada **Simular indisponibilidade local do cenário**.
2. Operação padrão: mensagem de que não foi possível preservar; **Envios 0/Alterações 0**, sem sucesso.
3. Desmarcar a simulação de indisponibilidade; Consultar e preparar novamente, com novo consentimento.
4. Confirmar: 1/1, revisão 8. F5/selecionar/consultar conserva o resultado. Não mexer em permissões reais do navegador.

## T19.5 — leitura indisponível não vira ficha vazia
1. Leitura local indisponível; simulação marcada. Selecionar A e Consultar.
2. Esperado: referência local não verificada; sem lista/formulário, Consultas 0/Envios 0/Alterações 0.
3. Desmarcar a simulação e Consultar: lista íntegra, revisão 7; nenhuma alteração enviada.
4. F5 reativa a falha programada deste cenário. Selecionar/Consultar volta a bloquear, sem inventar ou remover itens.

## T19.6 — referência inválida preservada
1. Referência inválida; início padrão e operação padrão confirmada: 1/1.
2. Clicar **Invalidar referência fictícia A**. Esperado: só a referência A é invalidada; sem lista utilizável e sem nova organização.
3. F5, selecionar A e Consultar: continua “Referência local não verificada”, contadores 1/1. Não oferecer repetição ou criar pedido novo para contornar.
4. Encerrar este caso mudando cenário/reiniciando **a simulação fictícia**, sem editar armazenamento ou dados reais.

## T19.7 — falha na limpeza após confirmação
1. Falha ao limpar referência; manter simulação marcada; operação padrão.
2. Esperado: resposta não confirmada, pedido preservado, 1/1; não permitir repetir sem consultar.
3. F5; desmarcar a simulação de indisponibilidade, selecionar A e Consultar.
4. Esperado: recuperada por consulta, revisão 8, Faca no 7, 1/1; pedido pendente some. Outra consulta continua sem envio.

## T19.8 — revisão divergente continua impedida
1. Revisão diferente; operação padrão: 1/0, resposta não confirmada.
2. Consultar: revisão 8/Faca ainda no 4; reconciliação necessária, pedido preservado e Repetir desabilitado.
3. F5/selecionar/consultar: mesmo impedimento e 1/0. Não apagar referência ou tentar destravar. Reconciliação definitiva é etapa futura.

## T19.9 — seleção de outra ficha após atualizar
1. Resposta perdida após gravar; operação padrão em A: 1/1.
2. F5, selecionar B e Consultar: nome B, Faca no 4/revisão 7, sem pedido de A em B.
3. Selecionar A e Consultar: recupera Faca no 7/revisão 8, contadores ainda 1/1.
4. Encerrar seleção e reabrir A/Consultar: estado preservado, sem envio automático.

## T19.10 — recusa de consulta conservada na sessão
1. Consulta recusada uma vez; selecionar A/Consultar: mensagem de consulta não verificada, sem lista, 0/0.
2. F5: ainda 0/0. Selecionar A/Consultar: lista íntegra/revisão 7, sem envio; a recusa programada ocorreu uma vez.
3. Preparar Faca 103 → 7 e marcar a caixa, **sem confirmar**. F5/selecionar/Consultar: Faca permanece no 4, 0/0, prévia/consentimento descartados.

Responder **T19.1 aprovado; ...; T19.10 aprovado**, ou falhou/não executado com passo e mensagem. Este roteiro não certifica persistência entre dispositivos, fechamento da aba, autenticação, concorrência ou operações no banco.
