# MC6 — inventário no celular físico

**10 testes físicos independentes, separados dos dez do PC.** Galaxy S24 FE/Samsung Browser é o ambiente já informado. A aprovação de MC5 fica encerrada.

Na mesma rede do PC ligado, abrir diretamente no Samsung Browser: [inventário fictício](http://192.168.1.14:4175/tests/ui/inventario.html). Também há o cartão Inventário por exemplar na [página inicial](http://192.168.1.14:4175/). Se o endereço não responder após desligar o PC, pedir retomada do servidor; não alterar firewall ou tentar abrir 127.0.0.1 no celular.

Confirmar o aviso SIMULAÇÃO ISOLADA. Não há login. Antes de cada caso escolher cenário e tocar **Reiniciar simulação**. Selecionar A = tocar **Selecionar ficha A fictícia**, depois **Consultar inventário**. Trocar cenário/F5 zera a simulação. Todos os casos preservam **Escritas: 0**.

## MC6.1 — entrada e controles por toque
1. Em retrato, **Normal**, reiniciar.
2. Conferir banner e botões sem corte. Consultar começa desabilitado.
3. Selecionar A: Consultas 0; consultar: 6/7, oito exemplares. Botões respondem a um toque, sem exigir precisão excessiva.

## MC6.2 — abrir exemplares próximos
1. Normal, selecionar A e consultar.
2. Rolar até as duas facas; tocar cada título.
3. Esperado: ambas abrem separadamente, 1/2 e 2/2, IDs diferentes. Fechar a primeira mantém a segunda aberta. Nenhum toque aciona a linha vizinha.

## MC6.3 — teclado e pesquisa
1. Normal, selecionar A e consultar.
2. Tocar busca, digitar **FACA** com o teclado do celular.
3. Esperado: duas facas; campo e resultado acessíveis ao recolher o teclado. Global 6/7.
4. Apagar/substituir por **4/10**: somente LEMI. Nenhuma consulta adicional.

## MC6.4 — seletor nativo de locais
1. Normal, selecionar A e consultar.
2. Abrir **Local dos itens** e escolher Característicos.
3. Esperado: duas linhas, global 6/7; seletor utilizável por toque.
4. Escolher Inventário: seis linhas; Todos: oito. Textos e opção selecionada legíveis.

## MC6.5 — identificador longo e rotação
1. Normal, selecionar A e consultar, abrir uma Faca.
2. Conferir o identificador completo, inclusive o final 103 ou 104.
3. Girar para paisagem e voltar retrato.
4. Esperado: texto quebra dentro do cartão, sem corte ou rolagem horizontal indevida; mesmo exemplar e durabilidade, nenhuma consulta extra ou reinício pela rotação.

## MC6.6 — pilhas e rolagem
1. **Pilhas de munição**, selecionar A e consultar.
2. Buscar **municao**, recolher teclado, abrir as duas linhas.
3. Esperado: 30 e 15 cartuchos, dois exemplares, global 8/9.
4. Rolar para cima/baixo: busca, quantidades e controles continuam acessíveis, sem sobreposição.

## MC6.7 — estados gastos legíveis
1. **Estados gastos e peças**, selecionar A e consultar.
2. Abrir LEMI, Faca do espaço 4, Kendo e Pente Estendido.
3. Esperado: 0/10, 0/2, 0 placas e não instalada, legíveis em retrato.
4. Consultar de novo: mesmos valores, sem reposição. Abrir detalhes não é uma ação de uso.

## MC6.8 — limpar busca sem perder a lista
1. Normal, selecionar A e consultar; buscar **ZZZINEXISTENTE**.
2. Esperado: nenhum resultado, 0 de 8, global 6/7.
3. Recolher teclado e tocar **Limpar busca e filtros**.
4. Esperado: campo vazio, Todos e oito linhas; botão alcançável sem recarregar a página.

## MC6.9 — avisos e recuperação por toque
1. **Capacidade excedida**, selecionar A e consultar: aviso 6/4 legível, oito itens preservados.
2. **Recusa uma vez**, selecionar A e consultar: erro legível, nenhuma lista.
3. Tocar Consultar novamente: lista aparece, Consultas 2. Sem tela branca ou salto que impeça localizar o resultado.

## MC6.10 — trocar seleção durante espera
1. **Resposta atrasada de A**, selecionar A e consultar.
2. Selecionar B e consultar: título B e Erva Verde de B.
3. Tocar Entregar resposta atrasada: B continua.
4. Tocar Encerrar seleção: lista some e Consultar desabilita. Todos os controles necessários devem permanecer alcançáveis em retrato.

Responder **MC6.1 aprovado; ...; MC6.10 aprovado**, ou falhou/não executado com passo, navegador e captura quando útil. Esta rodada certifica a experiência física dessa simulação, sem afirmar integração, dados reais ou uso de inventário ativo.

