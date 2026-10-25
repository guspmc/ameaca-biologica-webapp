# T13 — recuperação e respostas antigas, somente simulação

**Rodada encerrada: T13.1–T13.10 aprovados por Gus em 25/10/2026, com 33 capturas.** [Resultado e limites](resultado-testes-humanos-2026-10-25.md). O roteiro abaixo fica preservado para regressões, sem pedido de repetição. T5–T9 permanecem encerrados. T10–T12 continuam separados e condicionados à integração/acesso; T13 não os encerra.

Abrir **no PC**, na mesma aba durante cada caso:
http://127.0.0.1:4174/ameaca-biologica-webapp/tests/ui/recuperacao.html

Confirmar o aviso **SIMULAÇÃO ISOLADA · RECUPERAÇÃO E CONTEXTO**. Não há login nem dados de campanha. Esta nova página conserva dados fictícios em armazenamento da sessão desta aba para permitir F5; a antiga `ativacao.html` continua reiniciando tudo com F5. Não confundir os dois comportamentos.

Antes de começar, clicar **Reiniciar simulação**. Apenas as chaves desta simulação são zeradas. Ao mudar cenário, ela também reinicia. Não editar o armazenamento manualmente, remover participantes ou usar fichas existentes.

## T13.1 — resposta perdida depois de gravar

1. Selecionar **Resposta perdida após gravar** e clicar Reiniciar simulação.
2. Esperado: Envios 0, conjuntos 0, referência ausente; Confirmar e Repetir desabilitados.
3. Clicar **Consultar resultado**. Confirmar pedido fictício deve ficar disponível.
4. Clicar **Confirmar pedido fictício** uma vez.
5. Esperado: aviso de resposta não verificada, referência preservada, **Envios 1 / conjuntos 1**, sem confirmação de sucesso. PV 7, SA 1 e BI 3 não mudam.
6. Pressionar **F5 na mesma aba**. Depois clicar Consultar resultado.
7. Esperado: resultado confirmado por consulta, ficha fictícia completa e identificador do pedido recuperado. **Envios continua 1 / conjuntos continua 1**. Anotar esse identificador.
8. Clicar **Repetir pedido preservado**. Esperado: continua um envio e um conjunto, pois a consulta encontra o recibo; somente consultas aumentam.

## T13.2 — perder apenas a referência local

1. Continuando em T13.1, clicar **Apagar só referência de teste**.
2. Esperado: referência ausente, servidor fictício inalterado, Envios 1 / conjuntos 1.
3. F5, depois Consultar resultado.
4. Esperado: recupera a confirmação **pelo ID da ficha**, mesmo sem referência local. Identificador igual ao anotado em T13.1; Envios 1 / conjuntos 1. Confirmar e Repetir permanecem desabilitados; não há pedido local para reenviar.

## T13.3 — falha antes de gravar

1. Selecionar **Falha antes de gravar**; clicar Consultar resultado e Confirmar pedido fictício.
2. Esperado: erro, referência preservada, **Envios 1 / conjuntos 0**.
3. F5, depois Consultar resultado.
4. Esperado: sem recibo neste momento, pedido preservado, conjuntos 0. A consulta sozinha não envia outra ativação.
5. Clicar Repetir pedido preservado.
6. Esperado: confirmação recuperada, **Envios 2 / conjuntos 1**, com PV 7 / SA 1 / BI 3 inalterados.

## T13.4 — armazenamento indisponível antes do envio

1. Selecionar **Normal**, clicar Consultar resultado.
2. Marcar **Simular falha ao preservar referência local** e clicar Confirmar pedido fictício.
3. Esperado: mensagem de que o pedido não pôde ser preservado e nenhuma ativação foi enviada. **Envios 0 / conjuntos 0**, referência ausente.
4. Desmarcar a opção, clicar Consultar resultado novamente e Confirmar pedido fictício.
5. Esperado: sucesso normal, **Envios 1 / conjuntos 1**. Não precisa alterar permissões do navegador ou desligar internet; a falha é simulada.

## T13.5 — resposta de Mesa/sessão anterior

Usar o painel **Mesa e sessão fictícias** à direita/abaixo. Ele não faz login/logout real e não consulta campanhas.

1. Clicar **Consultar Mesa A com atraso** e depois **Trocar para Mesa B**.
2. Esperado: contexto Mesa B e dados fictícios da Mesa B visíveis.
3. Clicar **Entregar resposta antiga**. Esperado: “Resposta antiga descartada”, e os dados da Mesa B continuam.
4. Clicar Consultar Mesa A com atraso, Trocar para Mesa B e **Voltar para Mesa A**. Depois Entregar resposta antiga.
5. Esperado: contexto Mesa A, **dados visíveis: nenhum**, resposta antiga descartada. Voltar ao mesmo nome não ressuscita a consulta anterior.
6. Clicar Consultar Mesa A com atraso, **Encerrar sessão fictícia** e Entregar resposta antiga.
7. Esperado: contexto nenhum e dados nenhum; resposta antiga descartada.

## T13.6 — leitura e controles em janela estreita

1. Reduzir a largura da janela no PC e percorrer os dois painéis.
2. Esperado: textos, mensagens, identificador recuperado e botões legíveis; painéis empilhados, sem rolagem horizontal indevida ou controles escondidos.
3. O celular físico continua pendente; este caso não valida toque/teclado no aparelho.

**Atualização de 25/10/2026:** rodada ampliada de seis para dez casos a pedido de Gus. T13.1–T13.6 permanecem pendentes; os quatro casos abaixo são independentes dessas confirmações. Todos continuam somente na simulação. T10–T12 não entram nesta contagem e continuam condicionados à integração/acesso.

## T13.7 — consulta recusada, sem envio automático

1. Selecionar **Consulta recusada uma vez**. A troca reinicia a simulação.
2. Clicar **Consultar resultado**.
3. Esperado: mensagem de acesso não autorizado; **Envios 0 / conjuntos 0**. Confirmar e Repetir desabilitados. Essa recusa é fictícia; não fazer login ou alterar permissões.
4. Clicar Consultar resultado novamente.
5. Esperado: rascunho fictício sem recibo, Confirmar disponível, ainda Envios 0 / conjuntos 0. A consulta não ativa a ficha.

## T13.8 — recibo inválido depois de gravar

1. Selecionar **Recibo inválido após gravar**, clicar Consultar resultado e Confirmar pedido fictício.
2. Esperado: aviso de resposta não verificada, referência preservada, **Envios 1 / conjuntos 1**, sem mensagem de sucesso. A resposta inválida não é aceita como confirmação.
3. F5 na mesma aba e Consultar resultado.
4. Esperado: confirmação recuperada por consulta, identificador apresentado, **Envios continua 1 / conjuntos continua 1**. PV 7 / SA 1 / BI 3 inalterados.

## T13.9 — ficha já completa, sem recibo recuperável

1. Selecionar **Completa sem recibo** e Consultar resultado.
2. Esperado: mensagem **Ficha fictícia completa sem recibo recuperável. Não iniciar outra ativação.** Confirmar e Repetir desabilitados, referência ausente.
3. F5 e Consultar resultado novamente.
4. Esperado: mesma mensagem e bloqueio; **Envios 0 / conjuntos 0**. Zero conjuntos significa nenhum conjunto criado nesta simulação; não significa que a ficha completa está vazia. Este cenário representa uma ficha anterior, sem recibo conhecido, e não oferece recriação automática.

## T13.10 — consulta retorna outro pedido

1. Selecionar **Consulta retorna outro pedido uma vez**, clicar Consultar resultado e Confirmar pedido fictício.
2. Esperado: resposta não verificada, referência preservada, **Envios 1 / conjuntos 1**.
3. Clicar Consultar resultado. Nesta consulta o servidor fictício devolve um pedido diferente do preservado.
4. Esperado: aviso de resposta não verificada, **sem sucesso e sem identificador recuperado apresentado**. Confirmar e Repetir desabilitados; referência preservada; Envios 1 / conjuntos 1.
5. Clicar Consultar resultado outra vez.
6. Esperado: confirmação do pedido original, identificador apresentado, **Envios continua 1 / conjuntos continua 1**. Nenhuma ativação extra ocorre para corrigir a resposta divergente.

## Confirmação da rodada ampliada

Informar **T13.1 a T13.10**, aprovado/falhou/não executado. Pode testar em partes; os novos casos não exigem concluir os seis anteriores. Se falhar, informar caso, passo, mensagem e captura. Não repetir T5–T9.

Pode responder em partes: **“T13.7 aprovado; T13.8 aprovado; T13.9 aprovado; T13.10 aprovado”**, incluindo também os seis anteriores quando realizados. Contagem de consultas pode variar conforme os cliques; o principal são Envios, conjuntos e o identificador recuperado.

Todos os dados desta rodada são fictícios. Nenhum teste exige SQL, autorização complementar, publicação ou acesso ao banco. Relatório técnico: [consulta-resultado-e-qa.md](consulta-resultado-e-qa.md).
