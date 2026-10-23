# Funcionamento da ficha — prévia local

## IMPLEMENTADO
Prévia Automático/Misto/Manual dentro de Revisão da criação, conforme Planejamento v2.0 §§5.1 e 6.2, sem sétima etapa. Misto inicia com três padrões aprovados; BI infectante e Durabilidade ao Aparar a definir. Alternar modo conserva preferências locais do Misto. Manual mostra automações desabilitadas; Automático mostra habilitados os controles elegíveis da prévia.
Estado local isolado pela chave da ficha, descartado ao fechar/F5. Nenhuma gravação, automação de jogo, rolagem ou alteração de recursos. Dados físicos/virtuais/mistos e método de criação continuam separados.
Contrato de ativação preparado em contrato-ativacao-ficha.md, com dependências, privacidade, dez ativas, transação e inventário materializado uma única vez. Finalização permanece indisponível.

## TESTADO
58 testes locais aprovados, TypeScript e build de teste aprovados. Três testes novos de preferências verificam padrões, efetividade por modo sem mutar escolhas e estado inicial independente. Renderização da revisão cobre a prévia e o aviso de descarte, com duas opções a definir. Não comprovam clique no seletor, aparência em celular ou automações reais.
Gus confirmou que os atalhos da revisão levam às seções exatas; resumo e plano vazio também confirmados. Essa rodada anterior está concluída.

## PENDENTE DE TESTE HUMANO
Roteiro agrupado: abrir Revisão e Funcionamento da ficha. Misto: três habilitados, BI/Durabilidade a definir. Alterar uma escolha, alternar Manual e voltar a Misto: escolha local preservada. Automático mostra todos habilitados; retornar Misto preserva escolhas. F5 descarta esta prévia, como informado; recursos e inventário não mudam.
Não repetir testes de compra/bloqueio ou atalhos anteriores.

## BLOQUEADO
Persistir preferências e ativar ficha exigem estrutura/backend ainda não implementados e checkpoint específico antes de qualquer aplicação remota. Catálogo completo, inventário ativo, nível/método de Mesa e resumo do Mestre continuam dependências. Nenhuma mudança em banco, Auth, RLS ou produção nesta rodada.

## PRÓXIMO PASSO
Preparar contrato de persistência das preferências com testes locais, preservando valores indefinidos de BI/Durabilidade até escolha explícita. Depois materialização do inventário e ativação segura. Documentos oficiais preservados; sem merge/publicação ou custo adicional.
