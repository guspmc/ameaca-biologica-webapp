# Revisão das compras salvas — 23/10/2026

## IMPLEMENTADO
A conferência da criação considera compras_iniciais e revisao_compras já salvas no kit C. Mostra itens/quantidades, saldo e ocupação usando o mesmo cálculo do planejador. Plano ainda não confirmado continua pendente; plano salvo válido pode ser conferido, inclusive vazio com moedas preservadas. Conferido significa consistência dessas escolhas salvas, não ficha finalizada ou catálogo completo.

Plano inválido, orçamento excedido, capacidade insuficiente, revisão inválida ou compras fora do kit C são sinalizados sem alterar escolhas. Disponibilidade atual não é consultada: bloquear posteriormente não retira uma compra já salva. A conferência não realiza chamadas, gravações, finalização ou restauração de recursos.

## TESTADO
54 testes locais aprovados, TypeScript e compilação de teste aprovados. Novos casos conferem Faca e saldo, 45 munições em dois Espaços, moedas de plano vazio, preservação do objeto original e detecção de planos/versões/orçamento/capacidade inválidos.
Gus confirmou compra permitida e bloqueio de nova compra na mesma Mesa; capturas mostram uma Faca salva, duas moedas restantes e ocupação 4/5, preservadas ao bloquear. Mestre sem acesso ao rascunho confirmado anteriormente. O problema inicial era configuração de outra Mesa (Reservada em vez de Teste), sem necessidade de corrigir backend.
Persistência depois de F5 não foi declarada comprovada apenas por capturas sem recarga explícita.

## PENDENTE DE TESTE HUMANO
Uma conferência visual: após F5, abrir a ficha com a Faca salva e a seção Revisão da criação. Compras do Personalizado deve mostrar Faca × 1, duas moedas e ocupação igual à grade (4/5 no exemplo). Uma alteração ainda não salva na prévia não deve mudar a revisão.
Mantidas pendências anteriores: conflito entre sessões, troca de kit após limpeza e celular físico. Não repetir compra/bloqueio já aprovados.

## BLOQUEADO
Finalização, inventário ativo e catálogo completo continuam fora desta etapa. Produção, merge/publicação e alterações adicionais de banco exigem checkpoint. Nenhum SQL remoto ou dado humano alterado nesta rodada.

## PRÓXIMO PASSO
Conferir a revisão visualmente e continuar os incrementos independentes do fluxo aprovado. PR permanece em rascunho. Documentos oficiais e histórico preservados.
