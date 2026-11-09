# MC7 — organização por toque — dez casos físicos
**10/10 pendentes, independentes de T18.** Galaxy S24 FE/Samsung Browser como ambiente informado. Abrir na mesma rede do PC ligado: [organização fictícia](http://192.168.1.2:4175/tests/ui/organizacao.html). [Página inicial](http://192.168.1.2:4175/) → Organizar espaços.

Sem login/banco/campanha. Confirmar o banner SIMULAÇÃO ISOLADA. Antes de cada caso: escolher cenário → **Reiniciar simulação** → **Selecionar A fictícia** → **Consultar organização**. Não atualizar a página no meio do caso: F5/trocar cenário/Reiniciar apaga tudo nesta simulação. Rotação não deve reiniciar.

Faca 103 = “Faca · espaço 4 · 103”, durabilidade 1/2. Faca 104 = espaço 5, 2/2. Destino é o número exibido, começando em 1. Confirmar exige Preparar, conferir prévia, marcar caixa e tocar Confirmar organização fictícia.

## MC7.1 — entrada e seleção por toque
1. Normal, reiniciar; conferir banner/botões em retrato.
2. Selecionar A: nenhuma consulta automática; depois Consultar.
3. Esperado: 6/7, revisão 7, oito exemplares. Rolar do formulário até Característicos e voltar sem controles cortados ou sobrepostos.

## MC7.2 — seletor e teclado numérico
1. Normal, início padrão. Abrir seletor nativo de exemplar.
2. Escolher Faca 103; tocar destino e digitar **7**.
3. Esperado: exemplar e destino legíveis; teclado permite preencher e recolher sem ocultar definitivamente Preparar mudança.
4. Preparar: prévia 4 → 7, Envios 0/Alterações 0.

## MC7.3 — prévia e cancelamento ao alcance
1. Normal; Faca 103 → 7, Preparar.
2. Conferir a caixa desmarcada e Confirmar desabilitado. Rolar até a lista: Faca ainda no 4.
3. Marcar a caixa e tocar **Cancelar prévia**.
4. Esperado: nenhuma mudança/Envio. Preparar novamente exige novo consentimento; a caixa anterior não é reutilizada.

## MC7.4 — confirmar movimento com um toque
1. Normal; Faca 103 → 7, preparar, marcar e confirmar.
2. Esperado: Envios 1/Alterações 1, revisão 8; Faca final 103 no 7 com 1/2.
3. Rolar e Consultar novamente: posição/estado permanecem; formulário e mensagem continuam alcançáveis, sem confirmação repetida.

## MC7.5 — distinguir duas facas na troca
1. Normal; Faca 103 → 5, preparar/confirmar.
2. Conferir por toque/rolagem: 103 no 5 com 1/2 e 104 no 4 com 2/2.
3. Esperado: IDs completos quebram dentro dos cartões; nenhuma rolagem horizontal indevida ou fusão das duas linhas.

## MC7.6 — pilhas após troca
1. **Pilhas de munição**; início padrão. Escolher pilha do espaço 7/final 108 → 8, confirmar.
2. Conferir final 108 no 8 com 30 e final 109 no 7 com 15.
3. Esperado: quantidades e rótulos legíveis em retrato, global 8/9; LEMI continua 4/10.

## MC7.7 — rotação durante a prévia
1. Normal; Faca 103 → 7, preparar e marcar a caixa.
2. Girar para paisagem e voltar retrato, **sem confirmar**.
3. Esperado: mesma prévia, exemplar e destino; Envios 0/Alterações 0; checkbox conserva a escolha durante simples rotação.
4. Cancelar. Nenhum envio. Botões não ficam fora do alcance nas duas orientações.

## MC7.8 — correção de destino no formulário
1. Normal; Faca 103 → 4, Preparar: mensagem de mesmo espaço legível.
2. Tentar 0 ou 8: recusa sem envio.
3. Corrigir para 7 e Preparar: prévia válida, sem manter mensagem antiga que pareça impedir a correção.
4. Esperado: seleção/destino recuperáveis com teclado e toque; Característicos continuam fora do seletor de movimento.

## MC7.9 — recuperar resposta sem repetir ação
1. **Resposta perdida após gravar**; Faca 103 → 7, preparar/confirmar.
2. Esperado: mensagem de resposta não confirmada e pedido preservado legíveis; Envios 1/Alterações 1.
3. Consultar: recuperada por consulta, Faca no 7, mesmos 1/1. Repetir permanece desabilitado.
4. Mensagem e identificador não cortam o cartão nem impedem rolagem.

## MC7.10 — troca de ficha enquanto aguarda
1. **Confirmação atrasada**; Faca 103 → 7, preparar/confirmar.
2. Selecionar B e Consultar: B continua com Faca no 4.
3. Entregar confirmação atrasada: B permanece.
4. Selecionar A e Consultar: recupera Faca no 7, Envios 1/Alterações 1.
5. Esperado: todos os botões necessários alcançáveis em retrato; nenhuma confirmação de A aparece dentro de B.

Responder **MC7.1 aprovado; ...; MC7.10 aprovado**, ou falhou/não executado com passo e navegador. Testes são físicos desta simulação; não certificam operações reais, Auth/RLS ou persistência após fechar/atualizar.

