# T18 — organização de espaços — dez testes no PC
**10/10 pendentes.** Não repetir T17/MC6. Abrir no Edge do PC: [organização fictícia](http://127.0.0.1:4174/ameaca-biologica-webapp/tests/ui/organizacao.html).

Confirmar **SIMULAÇÃO ISOLADA · ORGANIZAÇÃO DE ESPAÇOS**. Sem login/banco/campanha. Antes de cada caso, escolher cenário e clicar **Reiniciar simulação**, **Selecionar A fictícia** e **Consultar organização**, salvo quando o passo disser diferente. Estado normal: revisão 7, 6/7 espaços, oito exemplares, Envios 0/Alterações 0.

Convenção: **Faca 103** é “Faca · espaço 4 · 103”, durabilidade 1/2; **Faca 104** é a do espaço 5, durabilidade 2/2. O destino é digitado de **1 a 7**, conforme os rótulos da tela. Para confirmar: Preparar mudança → ler prévia → marcar “Conferi a troca...” → Confirmar organização fictícia.

**Não usar F5 no meio de cada caso:** F5/trocar cenário/Reiniciar zera a simulação inteira, inclusive pedidos. Ela não testa recuperação após F5. Selecionar outra ficha conserva pedidos apenas enquanto a página permanece aberta. Envios contam tentativas; Alterações contam mudanças aplicadas.

## T18.1 — seleção inerte, prévia e cancelamento
1. Normal, reiniciar. Selecionar A sem consultar: Consultas 0, sem formulário de mudança.
2. Consultar; escolher Faca 103, destino 7, Preparar.
3. Esperado: “4 → 7”, destino livre, confirmação desmarcada e botão Confirmar desabilitado. Lista registrada ainda mostra Faca 103 no 4. Envios 0/Alterações 0.
4. Marcar a caixa e **Cancelar prévia**: prévia some; lista, revisão e contadores permanecem. Preparar novamente exige marcar outra vez.

## T18.2 — mover para espaço livre
1. Normal, início padrão; Faca 103 → 7, preparar e confirmar.
2. Esperado: confirmada, revisão **8**, Envios **1**/Alterações **1**, Faca 103 no espaço 7 com **1/2**. Espaço 4 fica livre, Faca 104 permanece no 5 com 2/2.
3. Consultar organização: mesma posição/estado; global 6/7 e oito exemplares. Consultar não incrementa Envios.

## T18.3 — trocar dois exemplares
1. Normal, início padrão; Faca 103 → **5**.
2. Prévia deve informar troca com outra Faca, que irá ao 4.
3. Confirmar: espaço 5 = final 103/durabilidade 1/2; espaço 4 = final 104/durabilidade 2/2. Revisão 8, Envios 1/Alterações 1.
4. LEMI continua 4/10 e moedas continuam 2. Quantidade de exemplares e ocupação não mudam.

## T18.4 — destinos inválidos e Característicos
1. Normal; Faca 103 → **4**, Preparar: informar que já está nesse espaço; sem prévia confirmável/envio.
2. Testar **0**, **8** e **1,5** (ou 1.5 conforme navegador): recusados, nenhum envio. Se o navegador impedir a entrada decimal, isso é uma proteção aceitável.
3. Abrir seletor de exemplar: Hatchet e Gazua **não podem ser escolhidos para mover**. Continuam listados como Característicos.
4. Corrigir destino para 7: prévia válida, ainda sem envio até confirmar.

## T18.5 — pilha não é fundida ou recarregada
1. **Pilhas de munição**; início padrão. Selecionar “Munição 9 mm · espaço 7 · 108”, destino **8**.
2. Prévia informa troca com a outra pilha.
3. Confirmar: final 108 fica no 8 com **30 cartuchos**; final 109 fica no 7 com **15**.
4. LEMI permanece **4/10**, global **8/9** e dez exemplares. Envios 1/Alterações 1.

## T18.6 — estados gastos e capacidade excedida
1. **Estados gastos**; início padrão. LEMI (espaço 3/final 102) → 1, confirmar.
2. Esperado: LEMI no 1, **0/10, Empunhada**; Erva no 3. Faca 103 **0/2**, Kendo 0 placas e peça não instalada permanecem.
3. Mudar para **Capacidade excedida**, início padrão; Erva do espaço 1 → 2, Preparar.
4. Esperado: recusa por espaços fora da capacidade; 6/4, oito exemplares, Envios 0/Alterações 0. Nenhum item é apagado para caber.

## T18.7 — falha antes de gravar
1. **Falha antes de gravar**; Faca 103 → 7, confirmar uma vez.
2. Esperado: resposta não confirmada, pedido preservado, lista escondida, Envios **1**/Alterações **0**, Repetir desabilitado.
3. Consultar: pedido sem confirmação, posições antigas, **Repetir pedido preservado** disponível; sem novo envio automático.
4. Repetir uma vez: confirmada, Envios **2**/Alterações **1**, revisão 8, Faca no 7. Consultar de novo não repete a mudança.

## T18.8 — perda da resposta e confirmação inválida
1. **Resposta perdida após gravar**; Faca 103 → 7, confirmar.
2. Esperado: não anunciar sucesso; pedido preservado, Envios **1**/Alterações **1**.
3. Consultar: recuperada **sem novo envio**, revisão 8/Faca no 7; contadores continuam 1/1.
4. Reiniciar no cenário **Confirmação inválida uma vez** e repetir. Primeira resposta não é sucesso; Consultar recupera o recibo legítimo, também 1/1.

## T18.9 — revisão diferente e consulta recusada
1. **Revisão mudou antes de confirmar**; Faca 103 → 7, confirmar e depois Consultar.
2. Esperado: revisão 8, Faca ainda no **4**, pedido preservado, aviso de **reconciliação necessária**. Sem nova organização/repetição disponível; Envios **1**/Alterações **0**.
3. Não apagar armazenamento ou tentar destravar: a reconciliação definitiva é etapa futura. Trocar cenário encerra apenas a simulação.
4. **Consulta recusada uma vez**, início padrão: primeira consulta sem lista/formulário utilizável e Envios 0. Segunda consulta recupera a lista sem enviar organização.

## T18.10 — resposta atrasada e retorno à ficha
1. **Confirmação atrasada**; Faca 103 → 7, confirmar. Operação aguardando, Envios 1/Alterações 1.
2. Selecionar B, Consultar: Faca de B continua no 4; nome B visível.
3. Entregar confirmação atrasada: B permanece inalterada.
4. Selecionar A, Consultar: recupera mudança de A, Faca no 7, Envios ainda 1/Alterações 1.
5. Encerrar seleção: lista/formulário somem. Reabrir A e Consultar conserva a mudança durante esta simulação.

Responder **T18.1 aprovado; ...; T18.10 aprovado**, ou falhou/não executado com passo e mensagem. Nenhum teste certifica persistência remota, autorização real ou concorrência de conexões.

