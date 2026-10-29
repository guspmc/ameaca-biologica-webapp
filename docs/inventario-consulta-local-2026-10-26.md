# Consulta do inventário por exemplar — 26/10/2026

## IMPLEMENTADO
Retomado checkpoint 811f8f0, árvore limpa e validação GitHub #39 aprovada. T16 e MC5 foram encerrados pela confirmação humana, registrada em [resultado](resultado-t16-mc5-2026-10-26.md).

Nova preparação local somente leitura: contrato fechado por exemplar, controlador de consulta explícita e painel com busca por nome/detalhe/identificador, filtros de local e contagem global. A leitura não reconstrói itens a partir do kit: quantidades, munição, durabilidade, estado equipado e peças vêm do snapshot recebido. Duas facas permanecem independentes. Zero não vira máximo; reserva não recarrega arma. Característicos ocupam zero, filtros não mudam ocupação global e excesso informa divergência sem descartar itens.

Contexto inclui usuário, Mesa e personagem; cada seleção invalida a anterior, inclusive A→B→A. Cliques simultâneos compartilham a consulta. Atualização limpa o resultado anterior; erro/contrato inválido não exibe lista parcial ou texto interno. Identificadores duplicados, posições duplicadas, personagem divergente e campos excedentes são recusados.

Fixture em tests/ui/inventario.html, oito cenários fictícios em memória. Incluída como sétima entrada da prévia estática LAN, 22 arquivos no manifesto desta geração, com os bloqueios anteriores preservados. Nenhuma nova dependência.

## TESTADO
- **204/204 testes automatizados locais**, 16 novos, suíte sequencial completa: ../output/testes-inventario-2026-10-26.log.
- TypeScript da aplicação e QA, build no modo teste e empacotamento estático aprovados. Uma tentativa inicial de TypeScript com glob literal no PowerShell falhou na resolução do argumento; corrigida com lista de arquivos e confirmada também com tsconfig.ui.json.
- Testes de contrato, tipos/estados, cópias independentes, filtragem, capacidade, descarte de resposta antiga, repetição explícita e apresentação estática. Renderização escapa texto.
- Navegador no PC, pacote LAN: seleção inerte, consulta, duas facas abertas com estados diferentes, busca FACA/MUNICAO, filtro de Característicos com ocupação global preservada, resposta inválida sem lista parcial e recuperação explícita, A atrasada sem substituir B, encerramento limpando itens, estados zero/peça guardada, aviso de excesso e inventário vazio. Console sem erros/avisos. Evidência fora do Git: ../output/qa_inventario_2026-10-26/consulta.png. Não equivale ao aparelho físico.
- HTTP confirmado: inventário retorna 200 nos endereços do PC e LAN; .env, fonte de conexão e manifesto retornam 404 na LAN; CSP mantém connect-src none. A primeira tentativa de sondagem no processo restrito não alcançou os serviços; a conferência permitida dos endereços locais acima foi bem-sucedida. Nenhuma configuração de firewall foi alterada.

## PENDENTE DE TESTE HUMANO
**PC 10/10: T17.1–T17.10** no [roteiro PC](rodada-inventario-pc-2026-10-26.md).
**Celular 10/10: MC6.1–MC6.10** no [roteiro físico](rodada-inventario-celular-2026-10-26.md).
Fila no limite; aguardar resultados antes de ampliar. Não repetir a rodada aprovada T16/MC5.

## BLOQUEADO
A conexão desta leitura à aplicação e o contrato público remoto de inventário não foram ativados. Esta projeção não é uma autorização: uma futura integração deve validar sessão, propriedade e participação no servidor e invalidar contexto em toda troca de conta/sessão/Mesa/ficha. Não certifica Auth, RLS, JWT, concorrência remota ou persistência real.

Sem operações de usar, equipar, consumir, recarregar, descartar, transferir ou Baú. O contrato local aceita somente os 17 IDs já auditados do catálogo inicial e estruturas conhecidas; catálogo completo e validação das relações de instalação seguem etapas próprias. A consulta não altera regras do RPG nem atribui efeitos aos estados exibidos.

## PRÓXIMO PASSO
Receber os vinte resultados e continuar o inventário ativo por operações pequenas, separando autorização remota indispensável. Sem alteração de produção, Auth/RLS, dados existentes, migração aplicada, merge na principal ou publicação externa. Referências oficiais e histórico preservados.

