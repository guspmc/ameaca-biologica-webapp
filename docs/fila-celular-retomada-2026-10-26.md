# Celular — fila total dez: dois anteriores e oito novos

Ambiente de referência: Galaxy S24 FE/Samsung Browser, PC ligado na mesma rede. **MC7.1–MC7.8 aprovados; não repetir. MC7.9 e MC7.10 ainda pendentes.** Os oito MC8 abaixo são independentes dos testes PC.

## 1. MC7.9 — recuperar resposta sem repetir ação (pendente anterior)
Abrir [organização anterior](http://192.168.1.2:4175/tests/ui/organizacao.html). Escolher **Resposta perdida após gravar** → Reiniciar simulação → Selecionar A fictícia → Consultar organização.
1. Faca do espaço 4/final 103 → destino 7 → Preparar → conferir caixa → Confirmar.
2. Esperado: resposta não confirmada e pedido preservado legíveis, Envios 1/Alterações 1.
3. Consultar: recuperada por consulta, Faca no 7, mesmos 1/1, Repetir desabilitado. Mensagem/ID não cortam o cartão.
4. **Não atualizar no meio deste caso:** a página anterior reinicia com atualização.

## 2. MC7.10 — resposta atrasada ao trocar ficha (pendente anterior)
Na mesma [página anterior](http://192.168.1.2:4175/tests/ui/organizacao.html), escolher **Confirmação atrasada** e Reiniciar.
1. Selecionar A/Consultar; Faca 103 do 4 → 7, preparar/conferir/confirmar.
2. Selecionar B/Consultar: Faca de B continua no 4. Entregar confirmação atrasada: B permanece.
3. Selecionar A/Consultar: recupera Faca no 7, Envios 1/Alterações 1. Botões alcançáveis em retrato; nenhuma confirmação de A aparece em B.

## Preparação dos oito casos novos MC8
Abrir [Retomar organização](http://192.168.1.2:4175/tests/ui/organizacao-sessao.html), ou página inicial → Retomar organização após atualizar.

Confirmar **SIMULAÇÃO ISOLADA · ORGANIZAÇÃO APÓS ATUALIZAR**. **Nesta página nova, atualizar conserva a simulação.** Usar o comando Atualizar do Samsung Browser, na mesma aba/endereço. Não fechar, duplicar aba ou mudar IP/porta durante o caso. Antes de cada caso escolher cenário e **Reiniciar somente esta simulação**; depois selecionar A e Consultar, salvo indicação diferente. Sem login ou banco.

Operação padrão: escolher **Faca · espaço 4 · 103**, destino **7**, Preparar, marcar **Conferi a troca...** e Confirmar organização fictícia. Normal = revisão 7/oito exemplares/6 de 7 Espaços. Atualizar não deve selecionar, consultar ou enviar sozinho. Envios/Alterações contam tentativas e mudanças aplicadas; Consultas podem aumentar.

## 3. MC8.1 — retomar por toque depois de atualizar
1. Normal, início padrão; operação padrão: 1/1/revisão 8.
2. Atualizar nesta aba: sem seleção/lista automática; mesmos 1/1.
3. Selecionar A/Consultar por toque: Faca 103 no 7 com 1/2, oito exemplares. Formulário/lista alcançáveis sem sobreposição.

## 4. MC8.2 — recuperar resposta perdida na mesma aba
1. Resposta perdida após gravar; operação padrão: aviso sem sucesso, pedido preservado, 1/1.
2. Atualizar/selecionar A: pedido ainda visível, repetir desabilitado.
3. Consultar: recuperada por consulta, revisão 8/Faca no 7, mesmos 1/1. Mensagem e identificador legíveis em retrato.

## 5. MC8.3 — repetição só após consulta
1. Falha antes de gravar; operação padrão: 1/0.
2. Atualizar/selecionar A: repetir desabilitado. Consultar: posição antiga/revisão 7 e Repetir disponível.
3. Tocar Repetir uma vez: 2/1, Faca no 7/revisão 8. Atualizar/selecionar/consultar: permanece, sem item duplicado.

## 6. MC8.4 — corrigir indisponibilidade simulada
1. Falha ao preservar pedido; manter marcada Simular indisponibilidade local do cenário. Operação padrão: mensagem legível, **0/0**.
2. Recolher teclado e desmarcar a simulação por toque. Consultar e preparar de novo.
3. Caixa exige nova confirmação. Confirmar: 1/1. Não alterar configurações/permissões reais do aparelho.

## 7. MC8.5 — prévia e teclado não persistem sem envio
1. Normal; selecionar Faca 103, digitar destino 7 e preparar, sem confirmar.
2. Atualizar usando o navegador; selecionar A/Consultar.
3. Esperado: Faca no 4/revisão 7, Envios 0/Alterações 0; prévia e caixa anteriores não reaparecem. Seletor/teclado permitem preparar novamente.

## 8. MC8.6 — rotação com pedido incerto
1. Resposta perdida após gravar; operação padrão: 1/1/pedido preservado.
2. Girar retrato → paisagem → retrato. Aviso/ID/botão Consultar continuam alcançáveis; não há envio novo.
3. Atualizar/selecionar/Consultar: recupera resultado, mesmos 1/1. Rolar até Faca 103 no 7 sem cortes horizontais.

## 9. MC8.7 — outra ficha após atualização
1. Resposta perdida após gravar; operação padrão em A.
2. Atualizar, selecionar B/Consultar: B tem Faca no 4/revisão 7, sem pedido A.
3. Selecionar A/Consultar: Faca no 7/revisão 8, 1/1. Nomes de A/B e botões distinguíveis por toque.

## 10. MC8.8 — recuperação após falha na limpeza
1. Falha ao limpar referência; simulação marcada, operação padrão: resposta não confirmada/pedido preservado/1/1.
2. Atualizar; desmarcar Simular indisponibilidade local do cenário; selecionar A/Consultar.
3. Recuperada por consulta; pedido pendente some, Faca no 7, 1/1. Mensagens e botões não ficam escondidos pelo teclado ou orientação.

Responder **MC7.9 aprovado; MC7.10 aprovado; MC8.1 aprovado; ...; MC8.8 aprovado**. Falha: informar caso/passo/mensagem. Não contam como testes remotos, entre dispositivos ou de autenticação. Limite da fila móvel: dez, não doze.
