# Resumo em consulta segura — checkpoint local de 26/10/2026

## IMPLEMENTADO

Conferido `2339641`, árvore limpa, histórico e validações anteriores antes da etapa. MC1–MC4 registrados como aprovados por Gus no Galaxy S24 FE. Corrigidas as Perícias Passivas para **Percepção, Vontade, Fortitude e Reflexos** na apresentação, validação fechada, dados fictícios e proposta SQL `supabase/proposals/resumo-operacional-local.sql`. Nenhuma proposta aplicada remotamente. Contrato antigo com doze campos agora é recusado, em vez de aceito parcialmente.

Novo controlador desconectado `consultaResumoLocal.ts`: seleção inerte, consulta explícita, cópia de estado, uma leitura por vez na mesma seleção, limpeza imediata de cartões ao consultar/trocar/encerrar, descarte de sucesso e falha tardios por geração, inclusive A→B→A. Erro genérico sem reproduzir mensagens internas ou mostrar lista parcial. Somente chama o contrato de leitura; não ativa, compra, cura ou altera personagem. Identificação do usuário no contexto não substitui autorização no servidor. Não há Auth real, cancelamento de transações ou integração na aplicação principal.

`PainelResumoLocal.tsx` e `tests/ui/resumo.html` apresentam estados vazio, desconhecido, dez cartões, erro/recuperação e resposta atrasada. O pacote de celular passou de cinco para seis entradas, com link na página inicial. O servidor temporário permanece limitado à mesma LAN e ao manifesto. Não houve mudança de firewall, banco, permissões ou publicação externa. A proposta SQL manteve as mesmas permissões e verificações de autorização, apenas reduziu a projeção de Passivas. Revisão orientada pela [documentação oficial de funções](https://supabase.com/docs/guides/database/functions) e [changelog](https://supabase.com/changelog), sem nova API Supabase nesta etapa.

## TESTADO

- **188 testes automatizados aprovados, sequencialmente** (`node --test --test-concurrency=1 --test-reporter=spec tests/*.test.mjs`). Dez testes novos cobrem o controlador, os dados usados pela UI, contrato fechado e apresentação. Teste SQL local existente passou com as quatro chaves exatas e privacidade preservada.
- A primeira rodada completa em paralelo não passou: quatro arquivos falharam; o modo resumido não preservou diagnóstico suficiente para atribuir causa. Não contabilizada como aprovada. Reexecução focada do SQL passou; rodada sequencial completa passou, sem mudar regras ou excluir testes. Log fora do Git: `../output/testes-resumo-2026-10-26.log`. A diferença de execução não certifica ausência de problema de concorrência do runner.
- TypeScript da aplicação e da QA, build normal no modo teste e pacote estático QA aprovados. Sem novas dependências. `git diff --check` aprovado.
- Navegador no PC pelo endereço LAN: quatro Passivas e recursos gastos, desconhecidos, condições, vazio, dez cartões, recusa com recuperação, resposta inválida e troca A→B com resposta antiga descartada. Console sem erros nos fluxos verificados. Evidência: `../output/qa_resumo_2026-10-26/quatro-passivas.png`, fora do Git. Não é teste da nova tela no aparelho físico.

## PENDENTE DE TESTE HUMANO

- **PC 10/10: T16.1–T16.10** em [roteiro PC](rodada-resumo-pc-2026-10-26.md).
- **Celular 10/10: MC5.1–MC5.10** em [roteiro físico](rodada-resumo-celular-2026-10-26.md).

Total vinte verificações independentes entre as filas. São os estados e interações da nova tela; nenhuma aprovação antiga foi apagada. Parar de ampliar a fila enquanto esta rodada aguarda resposta. Cada caso começa por cenário/reinício próprio, sem depender de outro teste humano. F5 reinicia somente dados fictícios.

## BLOQUEADO

Integração remota de ficha ativa/contexto/resumo e reconciliação definitiva de pedidos aguardam pacote e autorização específicos. Nada aplicado em produção ou TESTE remoto. O servidor e o agente param ao desligar o PC; não há execução autônoma enquanto o host estiver desligado.

## PRÓXIMO PASSO

Retomar conferindo este checkpoint, estado do Git e servidores. Quando Gus voltar, iniciar a prévia estática sem regenerar arquivos já validados, verificar o IP privado e entregar os dois roteiros. Receber resultados em partes; corrigir eventuais falhas antes de ampliar a fila. Manter documentos oficiais/Planejamento e evidências anteriores preservados.
