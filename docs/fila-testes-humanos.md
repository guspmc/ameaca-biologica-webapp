# Fila única de testes humanos — 23/10/2026

As confirmações anteriores de Gus permanecem registradas: Origens, Perícias, Habilidades, kits, identidade, flexões, busca, simulação, privacidade dos rascunhos e janela estreita. Não repetir sem mudança relevante.

## 1. Disponível agora: painel fictício, sem banco
Abrir http://127.0.0.1:4174/ameaca-biologica-webapp/tests/ui/disponibilidade.html
1. Antes de Atualizar: nenhum controle de liberação deve aparecer.
2. Atualizar disponibilidade: seis itens inicialmente bloqueados.
3. Liberar Faca: somente Faca muda para Liberado. Bloquear: volta a Bloqueado.
4. Simular falha na próxima operação e tentar liberar: mostrar falha e exigir Atualizar; depois de atualizar, Faca continua bloqueada.
5. Conferir janela estreita: nomes, estados e botões legíveis.
6. F5 reinicia esta fixture; isso é esperado. Ela não prova persistência real, autorização ou uso entre contas.

## 2. Após checkpoint de disponibilidade no TESTE
Não executar enquanto as novas funções não forem aplicadas e conferidas, painel conectado e itens especificamente liberados numa Mesa fictícia.
1. Mestre configura um item na própria Mesa; outra Mesa permanece inalterada.
2. Jogador não pode configurar disponibilidade; chamadas não autorizadas devem falhar.
3. Jogador salva plano permitido da opção C; F5 e reabrir preservam compras, moedas e grade.
4. Repetir pedido de compra sem duplicação. Alterar duas sessões da mesma personagem: plano diferente com revisão antiga deve falhar e manter a prévia local.
5. Bloquear item preserva plano existente, mas recusa nova gravação que ainda contenha item bloqueado. Limpar plano e salvar continua permitido.
6. Trocar kit com compras não vazias: recusa. Limpar e salvar antes: troca permitida.
7. Mestre e outra conta continuam sem acesso ao rascunho.
8. Celular físico: navegação e botões legíveis. Acesso ao servidor local pela rede ainda não foi aberto.

## Evidências e limites
50 testes locais passaram, incluindo PostgreSQL em memória, transporte simulado e renderização estática. Não substituem estes cliques. O painel fictício nunca usa Supabase, Auth ou armazenamento; F5 zera os dados. Concorrência de compra foi validada sequencialmente, sem prova de sobreposição de conexões.

Relatórios: relatorio-compras-integradas.md e relatorio-disponibilidade-local.md.


## Atualização: checkpoint aplicado e painel conectado

Gus confirmou o painel fictício com capturas: liberar/bloquear e falha simulada funcionaram. Esse teste está concluído. As duas funções já foram aplicadas e verificadas somente no TESTE, sem liberar itens. A seção 2 acima agora está disponível para execução humana. Abrir a prévia principal, selecionar uma Mesa fictícia em Participantes e usar o painel do Mestre. Nenhum acesso de celular pela rede foi aberto. Suíte atual: 52 testes aprovados. Relatório: relatorio-disponibilidade-integrada.md.


## Atualização: rodada de compra e bloqueio confirmada

Gus confirmou compra permitida e bloqueio de nova compra na mesma Mesa, com Faca salva preservada na grade (uma Faca, duas moedas, 4/5 Espaços). Mestre sem acesso ao rascunho também confirmado. Não repetir esses casos.
Próxima conferência: F5, abrir Revisão da criação e comparar compras/saldo/espaços com a grade. Alterações ainda não salvas não devem mudar a revisão. Persistem conflito de duas sessões, limpeza/troca de kit e celular. Relatório: relatorio-revisao-compras.md.


## Atualização: revisão visual confirmada e navegação enfileirada

Gus confirmou e mostrou Compras do Personalizado sem compras, 3/3 moedas, 3/5 espaços e equipamento inicial consistente. Conferência visual anterior concluída.
Novo item opcional da rodada agrupada: conferir resumo no topo da revisão e o atalho Habilidade Básica pendente, que deve levar a Características. Sem repetir compras, bloqueio ou limpeza. Caso inicial de plano vazio/revisão 0 agora é conferido sem exigir salvamento que não muda a versão. Relatório: relatorio-resumo-revisao.md.
