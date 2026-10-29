# MC5 — dez verificações independentes no celular

**Fila celular: 10/10, pendente; independente da fila PC.** MC1–MC4 já aprovados no Galaxy S24 FE. Estes casos cobrem a nova tela de resumo e suas interações físicas; não solicitam repetir os testes antigos nem certificam banco remoto. Podem ser feitos em qualquer ordem e em partes.

PC ligado, celular no mesmo Wi-Fi/rede do PC. Abrir **no navegador do telefone** http://192.168.1.14:4175/tests/ui/resumo.html ou o novo link **Resumo em consulta segura** na página inicial. Se reiniciar o PC, o servidor precisa ser iniciado novamente; se o endereço mudar, obter o endereço atual. Não usar 127.0.0.1 no celular. Confirmar o aviso de simulação. Não informar dados pessoais.

Antes de **cada** caso escolher o cenário e tocar **Reiniciar simulação**. “Consultar A” significa tocar **Selecionar Mesa A fictícia** e **Consultar resumo**. A troca de cenário também reinicia, sem dados persistidos. Não é necessário executar T16 antes de MC5.

## MC5.1 — quatro Passivas em retrato
1. Cenário **Normal**, consultar A, abrir Passivas por toque.
2. Esperado: somente Percepção 13, Vontade 11, Fortitude 12, Reflexos 12. As quatro linhas e valores são legíveis em retrato, sem corte horizontal.
3. Recolher e expandir pelo título sem abrir outro controle por engano.

## MC5.2 — recursos ao girar o aparelho
1. Cenário **Normal**, consultar A; observar PV 7/15, SA 1/3, BI 3/7, Defesa 12.
2. Girar para paisagem e voltar. Esperado: rótulos e valores continuam associados e legíveis; nenhuma cura, consulta extra ou alteração por rotação. Escritas 0.

## MC5.3 — ausências legíveis
1. Cenário **Passivas a conferir**, consultar A e abrir Passivas.
2. Esperado: **A conferir** em Fortitude e Reflexos cabe na linha; rótulos/valores não se sobrepõem. Ampliar texto/zoom do navegador, se disponível, e voltar: ainda é possível ler e rolar. Não precisa mudar ajustes globais do aparelho.

## MC5.4 — condição longa e rolagem
1. Cenário **Condições registradas**, consultar A.
2. Ler o primeiro cartão (nenhuma registrada) e rolar até a condição longa no segundo.
3. Esperado: texto quebra em linhas, sem encobrir Passivas ou sair do cartão. Abrir/recolher Passivas do segundo por toque.

## MC5.5 — seleção sem consulta acidental
1. Cenário **Mesa vazia**, reiniciar e tocar somente Selecionar A.
2. Esperado: Consultas 0, nenhum cartão. Tocar Consultar: mensagem de Mesa vazia legível, Consultas 1, sem alerta de erro.
3. O botão permanece alcançável em retrato; tocar o seletor ou rolar não dispara consulta.

## MC5.6 — dez cartões e nomes longos
1. Cenário **Dez personagens**, consultar A.
2. Rolar do primeiro ao décimo cartão usando o dedo; abrir as Passivas do décimo.
3. Esperado: dez cartões, nomes quebram corretamente, valores não saem da tela, sem rolagem horizontal necessária. Voltar ao topo e consultar novamente não acumula mais dez cartões.

## MC5.7 — alerta de recusa e alvo de toque
1. Cenário **Recusa uma vez**, consultar A.
2. Esperado: mensagem de erro legível na tela, sem cartões. O botão permite nova consulta por toque, sem precisar recarregar.
3. Tocar Consultar novamente: um cartão de A, Consultas 2. Não é necessário sair da conta ou alterar permissão do telefone.

## MC5.8 — resposta inválida sem cartão transitório
1. Cenário **Resposta inválida uma vez**, consultar A.
2. Esperado: erro genérico; nenhum cartão incompleto, história ou segredo. Rolar o painel não revela dados ocultos da resposta recusada.
3. Consultar novamente: um cartão válido legível. Escritas 0.

## MC5.9 — controles durante consulta atrasada
1. Cenário **Resposta atrasada da Mesa A**, consultar A.
2. Esperado: Consultando indisponível para novo toque; botões de selecionar B e entregar resposta continuam alcançáveis. Girar o aparelho uma vez.
3. Selecionar B, consultar B e entregar resposta atrasada. Esperado: somente B, sem retorno a A e sem sobreposição dos botões.

## MC5.10 — encerrar e reabrir por toque
1. Cenário **Resposta atrasada da Mesa A**, consultar A; encerrar seleção e entregar resposta.
2. Esperado: nenhum cartão, **Selecione uma Mesa**, Consultar indisponível.
3. Selecionar B e consultar: cartão de B aparece. Usar Voltar no navegador para retornar à página inicial, se entrou por ela; abrir novamente **Resumo em consulta segura**. Esperado: nova simulação inicial sem cartões e Consultas 0. Isso é reset da simulação, não perda de dados de campanha.

Responder “MC5.1 aprovado; …; MC5.10 aprovado”, com modelo/navegador se diferente do Galaxy S24 FE. Se falhar, informar número, retrato/paisagem, passo e mensagem; captura ajuda. Estes dez casos não dependem das confirmações do PC.
