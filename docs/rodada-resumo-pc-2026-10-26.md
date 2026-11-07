# T16 — resumo operacional — dez verificações no PC

**Fila PC: 10/10, pendente.** Todos independentes, somente simulação. MC1–MC4, T14 e T15 permanecem aprovados. Não usar contas ou fichas reais. Esta rodada verifica a nova consulta e a correção das quatro Passivas; não comprova autorização remota.

Abrir com o PC ligado: http://192.168.1.14:4175/tests/ui/resumo.html . Confirmar o aviso **SIMULAÇÃO ISOLADA · RESUMO DA MESA**. Se o servidor tiver sido encerrado, pedir a retomada da prévia. O endereço pode mudar após reiniciar. No início de cada caso selecionar o cenário indicado e clicar **Reiniciar simulação**; F5 também reinicia. Para “consultar A”: clicar **Selecionar Mesa A fictícia**, depois **Consultar resumo**. Cada falha programada ocorre uma vez por reinício.

## T16.1 — somente quatro Passivas
1. Cenário **Normal**; consultar A e abrir **Perícias Passivas**.
2. Esperado: somente **Percepção 13, Vontade 11, Fortitude 12 e Reflexos 12**, nessa ordem. Não aparecem Luta, Pontaria ou as outras seis.
3. Recolher e abrir novamente; os mesmos quatro valores permanecem.

## T16.2 — consulta não restaura recursos
1. Cenário **Normal**; consultar A.
2. Esperado: **PV 7/15, SA 1/3, BI 3/7, Defesa 12**, classe Operadora, nível 1.
3. Consultar novamente. Contagem Consultas passa de 1 para 2; valores permanecem. **Escritas 0**, sem botões de cura/edição.

## T16.3 — Passivas sem valor conhecido
1. Cenário **Passivas a conferir**; consultar A; abrir Passivas.
2. Esperado: Fortitude e Reflexos exibem **A conferir**; Percepção 13 e Vontade 11. Não converter ausência em zero ou presumir bônus.

## T16.4 — distinguir condições desconhecidas e registradas
1. Cenário **Condições registradas**; consultar A.
2. Primeiro cartão: **nenhuma registrada**. Segundo: **Condição fictícia de demonstração com descrição longa**.
3. Reiniciar no cenário **Normal**, consultar A: **não informadas**. São três estados diferentes; não é um editor de condições.

## T16.5 — seleção e Mesa vazia
1. Cenário **Mesa vazia**. Antes de selecionar, Consultar está indisponível e não há cartões.
2. Selecionar A: nenhuma consulta automática, Consultas 0. Consultar.
3. Esperado: **Nenhuma personagem ativa disponível**, Consultas 1, Escritas 0. Ausência de personagens não deve ser erro de acesso.

## T16.6 — lista com dez personagens
1. Cenário **Dez personagens**; consultar A.
2. Esperado: **10/10**, cartões numerados Sobrevivente 1 a 10, nomes longos legíveis.
3. Abrir Passivas de dois cartões distantes. Cada um tem quatro valores; a lista não duplica ao consultar de novo e não oferece edição.

## T16.7 — recusa e recuperação deliberada
1. Cenário **Recusa uma vez**; consultar A.
2. Esperado: **Não foi possível verificar o resumo…**, nenhum cartão ou erro interno. Consultas 1, sem nova tentativa automática.
3. Clicar Consultar novamente: cartão de A disponível, Consultas 2, Escritas 0.

## T16.8 — resposta parcialmente inválida não exibe parte da lista
1. Cenário **Resposta inválida uma vez**; consultar A.
2. Esperado: erro genérico e **nenhum cartão**, nem mesmo o primeiro que seria válido. Nenhuma história ou “SEGREDO” aparece.
3. Consultar novamente: um cartão válido de A aparece. Contagem 2, Escritas 0.

## T16.9 — resposta atrasada de outra Mesa
1. Cenário **Resposta atrasada da Mesa A**; consultar A. Esperado: Consultando, botão de consulta bloqueado e resposta aguardando.
2. Selecionar B: A desaparece imediatamente; B ainda não tem cartões. Consultar B.
3. Clicar **Entregar resposta atrasada**. Esperado: título **Mesa B fictícia** e cartão **Sobrevivente da Mesa B** permanecem; A não reaparece. Consultas 2, Escritas 0.

## T16.10 — encerramento e retorno ao mesmo contexto
1. Cenário **Resposta atrasada da Mesa A**; consultar A; clicar **Encerrar seleção fictícia** e entregar a resposta atrasada.
2. Esperado: **Selecione uma Mesa**, sem cartão e consulta bloqueada.
3. Reiniciar o mesmo cenário; consultar A, selecionar B e selecionar A novamente, **sem consultar A outra vez**. Entregar a resposta antiga.
4. Esperado: Mesa A selecionada, sem cartões; voltar ao mesmo nome não ressuscita a consulta anterior. Não há login/logout real neste teste.

Confirmar: “T16.1 aprovado; …; T16.10 aprovado”. Em falha informar número, passo, mensagem e, se possível, captura. Não precisa repetir casos aprovados sem alteração relevante.
