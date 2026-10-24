# Testes humanos pendentes — roteiro consolidado
Atualizado em 23/10/2026. Este é o roteiro atual; o histórico foi preservado em [fila-testes-humanos.md](fila-testes-humanos.md).

## Situação atual — rodada respondida por Gus

- **T1, T3 e T4: aprovados.** Não repetir sem mudança relevante.
- **T2: fluxo aprovado por Gus, com sincronização imediata de B após compras em A.** A recusa de uma compra enviada com revisão antiga não foi demonstrada por esse comportamento; manter essa diferença de cobertura registrada, sem pedir repetição manual agora.
- **Celular: não executado por falta de acesso à prévia local.** Aguarda preparação de acesso adequado; a tentativa de abrir o link no celular não é teste de layout ou funcionamento.

Resultado e limites: [resultado-testes-humanos-2026-10-23.md](resultado-testes-humanos-2026-10-23.md).

Os passos abaixo ficam preservados como roteiro da rodada realizada, não como pedido de novos testes agora. Usar somente Mesa e personagens fictícias do ambiente TESTE em eventuais regressões futuras. Nenhum caso exige produção, publicação ou ativação de ficha.

## Preparação — cerca de 3 minutos
1. No PC que executa a prévia, abrir http://127.0.0.1:4174/ameaca-biologica-webapp/ . Se não abrir, informar que a prévia está indisponível; isso não é resultado de falha da ficha.
2. Conferir o aviso de ambiente de teste no topo.
3. Separar uma personagem fictícia sua. Anotar ou fotografar as preferências e o plano atuais, caso queira restaurá-los no final. Os testes incluem salvamentos intencionais nessa personagem.
4. Para os testes de conflito, abrir **duas abas com a mesma conta de Jogador, na mesma Mesa e na mesma personagem**. Podem ser duas abas na mesma janela anônima já autenticada. A janela do Mestre permanece separada.
5. Chamar as abas de A e B. Não atualizar, fechar ou reabrir B entre o carregamento inicial e a tentativa de salvar nela: B precisa manter a versão antiga.

Duas contas diferentes não servem para produzir conflito na mesma ficha, pois o rascunho é privado.

## T1 — conflito de preferências em duas abas
Tempo estimado: 3 minutos.

1. Em A, abrir Revisão da criação > Funcionamento da ficha · preferências. Selecionar Misto e clicar em **Salvar Preferências**. Esperar confirmação.
2. Em B, pressionar F5, reabrir a mesma ficha e o mesmo painel. Conferir que A e B mostram a mesma **Versão carregada**. Anotar esse número.
3. Em A, selecionar **Manual**, clicar em Salvar Preferências e aguardar sucesso. A versão deve avançar.
4. Sem recarregar B, selecionar **Automático** e clicar em Salvar Preferências.
5. Esperado em B: mensagem de conflito/versão desatualizada; a escolha local Automático permanece visível. O salvamento de A não pode ser sobrescrito silenciosamente.
6. Fotografar a mensagem e a versão em B. Só então pressionar F5 e reabrir a ficha.
7. Esperado após F5: **Manual**, que foi salvo em A. O Automático recusado não deve ter sido persistido.

Manual e Automático são usados para garantir dois pedidos diferentes. Repetir exatamente a configuração já salva pode ser aceito sem alteração; isso é comportamento intencional e não testa conflito.

## T2 — conflito de plano de compras em duas abas
Tempo estimado: 4 minutos. Este teste modifica o plano da personagem fictícia escolhida.

Pré-requisitos: kit **C · Personalizado**, capacidade de pelo menos **5 Espaços**, Faca liberada pelo Mestre **na mesma Mesa da personagem**. Se algum pré-requisito não estiver disponível, registrar T2 como não executado, sem alterar atributos para forçar o cenário.

1. Em A, abrir Itens > Compras iniciais · plano e prévia. Clicar em **Limpar prévia de compras** e depois **Salvar Plano de Compras**. Esperar confirmação.
2. Em B, pressionar F5, reabrir a mesma ficha e o painel de compras. Conferir que ambas mostram plano vazio e a mesma Versão carregada.
3. Em A, buscar Faca, adicionar **uma** e salvar. Esperado: sucesso, uma Faca, duas moedas, 4 Espaços ocupados e versão avançada.
4. Sem atualizar B, adicionar **duas** Facas e salvar.
5. Esperado em B: erro de versão; sua prévia de duas Facas permanece visível. O plano salvo em A não pode ser sobrescrito.
6. Fotografar mensagem, prévia e Versão carregada em B. Pressionar F5 e reabrir.
7. Esperado: o plano de A, com **uma Faca**, duas moedas e 4 Espaços ocupados. As duas Facas da tentativa recusada não devem aparecer como compra salva.

Se aparecer “Item indisponível”, conferir primeiro a Mesa no painel do Mestre. Esse erro não comprova o teste de conflito; a Faca precisa estar liberada durante T2.

## T3 — proteção ao trocar kit com compras salvas
Tempo estimado: 3 minutos. Pode continuar na personagem de T2.

1. Garantir que exista uma Faca **salva** no plano C. Se T2 foi executado, essa condição já está pronta.
2. Em Equipamento inicial, selecionar **B** e clicar em **Salvar Equipamento Inicial**.
3. Esperado: recusa informando a necessidade de limpar o plano antes da troca. A opção C e a compra salva permanecem na ficha/grade. Apenas selecionar B não deve apagar nada.
4. No painel de compras ainda associado ao kit C salvo, clicar em Limpar prévia de compras e em Salvar Plano de Compras.
5. Esperado: plano vazio salvo, três moedas e 3 Espaços ocupados.
6. Voltar ao seletor de equipamento, escolher B e salvar.
7. Esperado: troca aceita. Pressionar F5 e reabrir; a opção B deve permanecer, com seu conjunto inicial, sem acumular a Faca comprada anteriormente.
8. Se desejar retornar ao Personalizado, selecionar C e salvar. Essa é uma nova escolha intencional; não recupera automaticamente o plano apagado.

## T4 — alteração não salva é descartada
Tempo estimado: 2 minutos. A persistência de preferências já foi aprovada; aqui o foco é somente não salvar.

1. Com a ficha carregada, abrir Funcionamento da ficha e anotar o modo e as opções salvos.
2. Mudar para um modo diferente. Se estiver no Misto, pode também alterar uma opção.
3. **Não clicar em Salvar Preferências**. Pressionar F5 e reabrir.
4. Esperado: configuração anteriormente salva, sem as alterações locais.
5. No plano C, se estiver disponível, adicionar ou retirar um item **sem salvar**, observar que a grade salva e a Revisão da criação continuam refletindo o plano já salvo, e pressionar F5.
6. Esperado: o plano salvo anterior permanece. O descarte deve afetar somente a prévia local.

O caso de compras de T4 é opcional se a personagem terminou T3 no kit B; não é necessário trocar novamente só para executá-lo.

## Como registrar o resultado
Para cada caso, informar: T1/T2/T3/T4, passou/falhou/não executado, passo em que parou e mensagem exibida. Em conflitos, uma captura antes de F5 com versão e erro, e outra depois de reabrir, ajudam a comparar. Evitar mostrar e-mails, senhas ou dados pessoais; não preciso dessas informações.

## Celular físico — aguardando acesso adequado
A janela estreita no PC já foi aprovada. O teste em aparelho físico permanece pendente, mas **a prévia está limitada ao próprio PC**: 127.0.0.1 no celular aponta para o celular, não para o computador.

Não há endereço de rede preparado nem abertura de firewall nesta etapa. Quando houver acesso local apropriado, o roteiro será: abrir ficha, usar os quatro atalhos, preencher e salvar um campo, percorrer Inventário e Revisão, verificar teclado/botões/rolagem e reabrir após atualização. Até lá, marcar como **não executável nesta prévia**, sem tentar expor o servidor.

## Não entram nesta rodada humana
- Ativação, inventário em uso, equipar/consumir/recarregar, teto coletivo de dez ativas e resumo operacional do Mestre: ainda não disponíveis na interface. Precisam de integração e checkpoint próprios.
- Requisições realmente simultâneas, falha de rede no meio da resposta e repetição após ativação: exigem um ensaio técnico controlado. Não é necessário tentar clicar simultaneamente em várias janelas.
- Remover e readmitir participante, apagar rascunhos ou mudar permissões: dependem de proposta e autorização específica; não executar como parte destes testes.

## Casos já aprovados — não repetir sem mudança relevante
Origens, Perícias, Habilidades, kits e persistência; identidade/flexões; busca e compras; liberação/bloqueio na Mesa correta; preservação da compra salva após bloqueio; limpeza do plano; privacidade dos rascunhos; revisão, contagens e atalhos; janela estreita; preferências salvas após F5 e independentes por ficha. As confirmações e capturas anteriores continuam válidas.
