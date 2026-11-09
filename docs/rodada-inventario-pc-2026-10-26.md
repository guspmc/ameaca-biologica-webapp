# T17 — inventário por exemplar — PC

**10 testes pendentes, independentes da rodada aprovada T16.** Usar Windows 11/Edge. Somente simulação, sem conta, banco ou dados de campanha.

Abrir [inventário fictício no PC](http://127.0.0.1:4174/ameaca-biologica-webapp/tests/ui/inventario.html). Confirmar o aviso **SIMULAÇÃO ISOLADA · INVENTÁRIO POR EXEMPLAR**. Antes de cada caso escolher o cenário indicado e clicar **Reiniciar simulação**. Trocar cenário ou F5 também zera tudo. “Selecionar A” significa **Selecionar ficha A fictícia**; depois clicar **Consultar inventário**, salvo indicação contrária. Em todos os casos, **Escritas: 0** deve permanecer.

## T17.1 — seleção não consulta automaticamente
1. Cenário **Normal**, reiniciar: Consultas 0 e Consultar inventário desabilitado.
2. Selecionar A: título A, Consultas ainda 0 e sem lista.
3. Consultar: Consultas 1; **6/7 Espaços**, **8 exemplares**, revisão 7.
4. Abrir/fechar Erva Verde: nenhuma nova consulta ou escrita. Esperado: quantidade 1, sem consumo.

## T17.2 — duas facas, estados independentes
1. Normal; selecionar A e consultar.
2. Abrir **Faca · Espaço 4** e **Faca · Espaço 5**.
3. Esperado: durabilidades **1/2** e **2/2**; identificadores terminados em **103** e **104**, diferentes.
4. Fechar/abrir e consultar novamente: os dois estados continuam iguais. Nenhum reparo ou fusão.

## T17.3 — busca por nome, detalhe e exemplar
1. Normal; selecionar A e consultar. Digitar **FACA**: duas facas.
2. Substituir por **4/10**: somente LEMI.
3. Abrir LEMI; copiar seu identificador exibido e pesquisar esse identificador: somente esse exemplar.
4. Esperado em todas as buscas: **6/7** global, 8 exemplares totais e Consultas 1.

## T17.4 — locais e limpeza
1. Normal; selecionar A e consultar.
2. Local dos itens = **Característicos**: Hatchet e Gazua, **2 de 8**, global 6/7.
3. Local = **Inventário**: seis exemplares, global 6/7.
4. Buscar Faca e clicar **Limpar busca e filtros**: busca vazia, Todos, oito exemplares.

## T17.5 — pilhas de reserva separadas
1. **Pilhas de munição**; selecionar A e consultar.
2. Buscar **MUNICAO**, sem acento: duas linhas, espaços 7 e 8.
3. Abrir ambas: quantidades **30** e **15**, reserva separada da arma.
4. Limpar filtros e abrir LEMI: **4/10** tiros. Global **8/9 Espaços**, dez exemplares. Consultar novamente não recarrega.

## T17.6 — estados gastos preservados
1. **Estados gastos e peças**; selecionar A e consultar.
2. Abrir LEMI, Faca do espaço 4, Hatchet, Colete Kendo e Pente Estendido.
3. Esperado: LEMI **0/10, Empunhada**; Faca **0/2**; Hatchet **Indestrutível**; Kendo **Guardado, 0 placas**; Peça **guardada, não instalada**.
4. Consultar novamente: mesmos estados, **6/7**, dez exemplares. Nenhum botão para usar/equipar/reparar/recarregar.

## T17.7 — lista vazia e busca sem resultado são diferentes
1. **Inventário vazio**; selecionar A e consultar: **0/7**, zero exemplares e “sem itens registrados”.
2. Mudar para **Normal**; selecionar A e consultar; buscar **ZZZINEXISTENTE**.
3. Esperado: “Nenhum item corresponde”, **0 de 8**, mas global **6/7**.
4. Limpar busca e filtros: reaparecem os oito, Consultas continua 1 nesse cenário.

## T17.8 — capacidade excedida não apaga itens
1. **Capacidade excedida**; selecionar A e consultar.
2. Esperado: **6/4 Espaços**, oito exemplares e aviso de excesso sem descarte/reorganização.
3. Filtrar Característicos: dois visíveis; global 6/4 e aviso permanecem.
4. Limpar: os oito continuam. A consulta não corrige inventário por conta própria.

## T17.9 — falha e resposta inválida
1. **Recusa uma vez**; selecionar A e consultar.
2. Esperado: mensagem genérica, nenhuma lista ou detalhe interno, Consultas 1, Escritas 0.
3. Clicar Consultar de novo: lista normal, Consultas 2.
4. Repetir os passos com **Resposta inválida uma vez**. Esperado igual: nenhuma lista parcial na primeira tentativa e recuperação apenas no segundo clique.

## T17.10 — resposta antiga não troca o inventário
1. **Resposta atrasada de A**; selecionar A e consultar: aguardando, lista ausente.
2. Selecionar B e consultar: título B, **Erva Verde de B**, 6/7.
3. **Entregar resposta atrasada**: B permanece, sem itens de A substituindo B.
4. Reiniciar; selecionar A, consultar, **Encerrar seleção fictícia**, Entregar resposta atrasada.
5. Esperado: “Selecione uma personagem”, nenhum exemplar e Consultar desabilitado. Não é logout real.

Responder **T17.1 aprovado; ...; T17.10 aprovado**, ou falhou/não executado, indicando passo e mensagem. Capturas são úteis em falhas; não incluir credenciais. Estes casos não validam persistência remota ou autorização entre contas.

