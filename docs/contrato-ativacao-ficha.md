# Contrato de ativação — preparação sem operação remota

Referências somente de leitura: Planejamento WebApp v2.0 §§2.3, 3.3, 3.5, 4, 5.1–5.5, 6.1–6.2, 9.1–9.6 e critérios T04, T08, T13, T14; Arquivo do Jogador v1.0 J 21–27 e opções de Classe já auditadas.
Este documento orienta implementação futura. Não autoriza executar SQL, ativar registros ou modificar políticas existentes.

## Separação obrigatória
Método de criação (Padrão/Regra da Casa), preferência de dados (Físicos/Virtuais/Mistos) e funcionamento (Automático/Misto/Manual) são configurações distintas. Não usar modo Manual para aceitar fórmula ilegal no Padrão. Preferências de dados são individuais e não devem ser gravadas como automações por personagem.

## Preferências de funcionamento
Na sexta etapa, Misto inicia com munição após disparos registrados, Inventário após uso confirmado e duração de efeitos habilitados. BI infectante e Durabilidade ao Aparar são independentes; não inventar padrão universal. Prévia local deixa ambas a definir. Nenhuma rolagem espontânea, Dano contínuo automático ou teste não solicitado é permitido.
Configuração futura salva pertence à ficha e ao jogador; mudar modo só afeta operações futuras, preservando escolhas específicas do Misto e recursos/histórico passados. Recolher o painel não desabilita automações.

## Pré-condições no servidor
- Autenticação, autoria, jogador ainda admitido, Mesa no estado que permite criar e ficha ainda em rascunho.
- Revalidar método vigente, nível permitido e escolhas compatíveis; preservar o trabalho e indicar o que mudou. O incremento atual cobre apenas criação Padrão de nível 1; não fingir suporte a Casa ou criação experiente.
- Atributos, Origem/Treinamento, orçamento completo das Perícias, Habilidade Básica, derivados, kit, compras e capacidade conferidos com fonte canônica no servidor, nunca confiar em status Conferido do cliente.
- Compras salvas e recursos devem permanecer consistentes. Bloqueio posterior de catálogo preserva itens existentes; decidir explicitamente como a ativação consumirá o plano já aprovado, sem reaplicar liberação retroativa ou apagar compras.
- Dez jogadores e dez personagens ativas são contagens distintas. Rascunho não ocupa vaga ativa. A atual implementação não certifica o limite de dez jogadores ou modelo completo do ciclo ativo/arquivado.
- Automações precisam de contrato persistente validado e sem escolher silenciosamente opções indefinidas no Misto.

## Transação e repetição
A futura ativação deve revalidar e materializar inventário na mesma transação que troca o estado. Serializar por Mesa para respeitar dez ativas; bloquear ficha e verificar versão esperada. Duas ativações simultâneas não podem ultrapassar o limite.
Criar itens com identidade e estado próprios uma única vez: carregada/capacidade da arma, reserva prevista, moedas em blocos, quantidades/pilhas, durabilidade, posição e vínculos de Característicos. Armas carregadas não concedem reserva extra; Colete/Peças guardados não são equipados antecipadamente.
Repetição do mesmo comando retorna o resultado existente e não recria kit, moedas ou munição. Falha de qualquer etapa preserva rascunho, escolhas e recursos. Não usar projeção de equipamentoInicial para reconstruir inventário depois de uso/transferência. Não restaurar recursos gastos por efeito colateral da conferência.

## Privacidade antes de liberar ativas
O Mestre só pode ler resumo operacional; jogador sem ativa não recebe ficha alheia. Política antiga de ficha completa para Mestre não pode ser liberada com ativação. A revisão de RLS, leitura por resumo e acesso a instâncias de itens requer proposta e checkpoint específicos.
Rascunhos continuam privados. Edição de recursos, catálogo e automações deve respeitar autoria e papel em toda chamada, inclusive evento de sincronização. Não ampliar grants de colunas por conveniência da interface.

## Matriz mínima de validação futura
1. Nona ativa + dois pedidos concorrentes: somente um ocupa a décima vaga; o outro preserva rascunho.
2. Mesmo comando repetido após resposta perdida: uma ativação e um conjunto de itens.
3. Mudança de método/nível/participação durante a revisão: recusa informativa sem perda de escolhas.
4. Falha durante materialização de item: rollback de tudo.
5. Duas fichas da mesma conta permitidas dentro do teto coletivo; Mestre não acumula ficha de jogador.
6. Planos A/B/C, moedas zero/um/três, munição em pilhas e Característicos sem custo de Espaço.
7. Rascunho privado antes e resumo autorizado depois; usuário alheio/anon/removido negados.
8. Preferências distintas por ficha, modo alterado sem restituir recursos ou refazer histórico.
9. Celular, retorno após F5 e resposta interrompida em fixture isolada, sem dados humanos.

## Ordem dos próximos incrementos
1. Contrato de persistência das preferências e testes locais; gerar proposta revisável antes de pedir checkpoint de TESTE.
2. Modelo de instâncias de inventário e ciclo ativo/arquivado, mais validações locais de materialização.
3. Proposta de permissões/resumo operacional e ativação transacional em banco local.
4. Somente após revisão/checkpoint, aplicar ao TESTE e executar smoke com fixtures/rollback.
5. Rodada humana agrupada; merge/publicação/produção continuam separados.
