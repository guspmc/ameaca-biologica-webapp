# Flexões e prévia de compras — 23/10/2026

Segue o fluxo supervisionado. Nenhuma mudança de banco, RLS, autenticação, migração, conta, dados humanos, dependências ou publicação.

## IMPLEMENTADO

- Rótulos de Origem, Habilidade e Ramo acompanham gênero declarado: Investigadora, Acadêmica, Amnésica, Criminosa, Desgarrada, Lutadora, Mercenária, Mochileira, Operária, Servidora Pública, Armeira, Parruda, Impiedosa e Brigona. Masculino explícito permite Universitário e Curioso. Termos invariantes permanecem iguais; sem declaração reconhecida, conserva o nome canônico.
- Flexão no cabeçalho, Características, sumários, opções e revisão. Registro da Sobrevivente acompanha feminino. IDs, valores dos selects, regras, catálogos canônicos e SQL foram preservados. Jogador/Mestre referem-se à pessoa na Mesa, não ao gênero da personagem. Não substituir indiscriminadamente o gênero de alvos/itens em descrições.
- Corrigidas mensagens antigas sobre recursos visíveis ao Mestre e Habilidades não aplicadas à Defesa: rascunho continua privado e Colete guardado não acrescenta Defesa.
- Opção C tem “Planejar compras · prévia não salva”: busca, adição/retirada, saldo 3 e capacidade, com limpeza. Estado exclusivamente local, sem RPC ou gravação. Fechar/recarregar/abandonar C descarta o plano. Grade salva permanece separada.
- Catálogo parcial verificado: Bastão e Faca (J 50), Colete Acolchoado/Leve e Lanterna Simples (J 67), 9 mm em lotes de 15 por uma moeda e até 30 por Espaço (J 65). Todos custam uma moeda, exceto Colete Leve duas. Não é catálogo universal completo. Disponibilidade depende do acesso na Mesa. Sem equipar ou conceder bônus pela simulação.

## TESTADO

- 36 testes da suíte ampliada passaram, mais teste reproduzível de renderização React aprovado separadamente (37 na integração a validar no CI). Casos novos: saldo/capacidade, saldo zero sem bloco de moedas, 15/30/45 munições, inválidos, não mutação e flexões/invariantes.
- React renderizou seis itens e seis retiradas desabilitadas, saldo 3/3 e ocupação 3/4, aviso de prévia não salva e ausência de formulário de compra. Isso não testa cliques ou layout.
- TypeScript e Vite passaram. Principal 72,17 kB; Supabase 217,75 kB; vendor 227,96 kB minificados. Sem novos pacotes; auditoria anterior permanece histórica.
- Gus confirmou sessão normal restaurada, login pedido na janela anônima, Operadora funcional, janela mínima legível e Mestre sem rascunhos. Relato não certifica celular físico ou todos os caminhos de Auth.
- Fontes oficiais e prints do usuário não foram publicados.

## PENDENTE DE TESTE HUMANO

Uma sessão na prévia 4174, sem excluir fichas:

| Passo | Esperado |
|---|---|
| F5 numa personagem Feminino | Investigadora e Armeira nos rótulos; escolhas e recursos preservados |
| Num rascunho fictício com C salvo, abrir Planejar compras | Aviso não salvo, três moedas e três Espaços iniciais |
| Adicionar duas compras de Munição 9 mm | 30 unidades em um Espaço, uma moeda restante, quatro Espaços totais |
| Adicionar a terceira compra | 45 unidades em dois Espaços, zero moeda e quatro Espaços totais; bloqueia gasto adicional |
| Limpar e recarregar | Plano vazio; kit salvo e recursos permanecem |
| Janela estreita | Busca, linhas e controles utilizáveis |

Pode usar a fixture local tests/ui/compras.html; ela é fictícia e reinicia por definição. Não modificar um kit real só para testar. A revisão anterior pode ser conferida junto.

## BLOQUEADO

Navegador automatizado não respondeu e reiniciou por timeout; sem evidência visual nova ou teste de cliques. Não houve rejeição de aprovação automática. Editor/terminal restrito também não responderam; estado conferido antes de retomar com Node direto no terminal autorizado. Sem alterar política de segurança ou executar software de terceiros.

Compra persistida depende de contrato de catálogo/acesso e gravação validada no servidor, com autorização específica antes de ampliar permissões ou modificar dados existentes. A simulação não é autoridade de segurança. Celular físico depende de acesso aprovado; não expus loopback na rede.

## PRÓXIMO PASSO

Validar flexões/prévia numa única sessão e preparar contrato local de compras persistidas: catálogo, acesso, saldo, quantidade, capacidade, idempotência e finalização. Manter checkpoints para gravação/permissões. Preservar pendências de modo Misto, dez jogadores/dez ativas, concorrência estrita, readmissão, resumo do Mestre e histórico da 006 em produção.

## Confirmação humana recebida

Gus confirmou flexões femininas, teste de compras e busca funcionais. Capturas mostram Investigadora/Armeira e busca por colete; não são evidência de persistência, ainda indisponível. Próxima preparação em contrato-compras-persistidas.md, sem nova solicitação de repetir os testes já aprovados.
