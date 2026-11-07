# Ambiente de teste gratuito

Atualização de 23/10/2026: [Perícias da criação](pericias-criacao.md) implementadas e aplicadas somente no projeto de teste. São agora oito migrações; o relato das sete abaixo preserva o checkpoint anterior. Gus também confirmou mudança imediata do nome da Mesa e isolamento da Mesa Reservada após F5. São evidências favoráveis ao Realtime nesse fluxo e ao isolamento entre Mesas; concorrência e eventos específicos de ficha permanecem pendentes.

Preparado em 22/10/2026, com autorização do Gus para continuar somente a custo zero.

## Identificação e custo

- Organização: Ameaça Biológica RPG, plano Free.
- Projeto: `ameaca-biologica-rpg-teste`, referência `elctulggqcokixswusre`.
- URL: https://elctulggqcokixswusre.supabase.co
- Região: us-east-1; PostgreSQL 17.11.
- Cotação consultada: US$ 0/mês para o novo projeto. Não houve contratação de plano, branch paga, SMTP pago ou hospedagem adicional. Não autorizar custos futuros automaticamente.
- Produção continua sendo `pftuhqioutvwnmvlbtrt`. Não foram aplicadas nela a proposta de privacidade/limite nem alterações de Auth nesta etapa.

## Preparação e evidências

Projeto vazio conferido antes das alterações. Aplicadas sequencialmente as sete migrações da branch: estrutura, RLS, convites, participantes/Realtime, fichas, Origens e privacidade/limite de rascunhos.

O conector registra timestamps da aplicação no histórico, diferentes dos nomes dos arquivos locais. Foram conferidas sete entradas, em ordem e pelos nomes. Não usar `db push` ou reparação de histórico cegamente contra nenhum projeto.

RLS ativa nas quatro tabelas públicas. EXECUTE da RPC de Origem: anon=false, authenticated=true. Advisors de segurança apontaram cinco RPCs SECURITY DEFINER autenticadas, operações intencionais com validação explícita de autorização; isso não equivale a ausência de riscos. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

`tests/staging-smoke.sql` foi executado somente neste ambiente vazio. Criou identidades sem senha/e-mail, Mesas e fichas fictícias dentro de transação; alternou roles PostgreSQL e verificou:

- Origem Policial persistida, bônus repetido sem acumulação.
- Quarto rascunho recusado e limite independente para outra conta.
- Escrita direta em Origem e RPC de outra conta recusadas.
- Rascunhos invisíveis a outro jogador e ao Mestre.
- Mestre lê ficha completa e não altera seus recursos.
- Jogador removido perde acesso e capacidade de criar.
- Anon não executa a RPC.

Resultado final: `smoke_staging_aprovado`, 0 Mesas e 0 personagens após ROLLBACK. As identidades também estavam na transação desfeita. Não houve leitura de usuários privados de produção, nem criação de senha, token ou conta autenticável para esse teste.

Continuam pendentes login real, PostgREST autenticado, Realtime entre sessões e concorrência com conexões independentes. O teste SQL não certifica esses caminhos.

## Prévia local

Endereço neste computador: http://127.0.0.1:4174/ameaca-biologica-webapp/

Iniciar com `pnpm run dev:teste` após preencher `.env.teste` conforme `.env.example`. Neste computador o arquivo local já foi preparado, somente com URL e chave pública. `.env.teste` é ignorado pelo Git e não contém chave administrativa.

Modo de teste exibe faixa amarela, ignora conexão salva no navegador e rejeita o projeto de produção como alternativa. Se configuração estiver ausente/inválida, mostra erro em vez de abrir configuração manual que poderia apontar para produção. Dez testes automatizados passaram localmente: sete de banco e três de seleção de conexão. TypeScript/Vite também passaram.

No painel Auth do projeto de teste, Site URL e única Redirect URL foram configuradas para o endereço local exato acima. Não foi desabilitada confirmação de e-mail nem reduzida proteção de login. O conector não oferece ajuste de Auth, por isso foi usado o painel. A tela local de entrada e a faixa de teste foram conferidas no navegador; não houve cadastro/login de usuário pelo agente.

O servidor local só funciona neste computador enquanto o processo estiver ativo. Não é uma publicação da Alfa. O Supabase é remoto e gratuito dentro dos limites do plano; não contratar serviços para contornar limites sem autorização.

## Primeiro teste humano

1. Abra a prévia local em dois perfis de navegador, um para Mestre e outro para Jogador. Em ambos, confirme a faixa AMBIENTE DE TESTE.
2. Use Cadastrar para criar duas contas de teste com e-mails sob seu controle. As contas de produção não são copiadas. Digite você mesmo as senhas e confirme os e-mails; não envie senhas, links de confirmação ou tokens ao chat.
3. Entre com a primeira conta, crie uma Mesa fictícia e gere o convite. Na outra, solicite entrada pelo convite e aguarde aprovação pelo Mestre.
4. Jogador cria um rascunho e escolhe Policial/Pontaria; Mestre não deve encontrar esse rascunho. Atualize ambas as telas e recarregue para conferir persistência.
5. Jogador cria mais dois rascunhos. Contador deve marcar 3/3 e impedir o quarto. Isso é por jogador/Mesa, não três jogadores por Mesa.

Se o cadastro atingir limite de e-mail, pare e relate a mensagem, sem contratar SMTP. Pode ser necessário aguardar o limite gratuito. Não testar removendo pessoas ou fichas reais.

## Capacidades aprovadas e pendências

### Validação humana recebida em 22/10/2026

Gus relatou funcionamento e forneceu cinco capturas de duas sessões de navegador no endereço local. Evidências visíveis:

- Jogador admitido e Mestre na mesma Mesa de teste, em sessões separadas.
- Três rascunhos de Classes diferentes, disponíveis ao jogador; painel do Mestre sem essas fichas.
- Origens Policial/Pontaria, Cobaia/Vontade e Investigador/Investigação, com mensagens de salvamento e ficha mantida em rascunho.
- Contador evoluindo de 2/3 para 3/3, orientação para continuar os existentes e botão de criação desabilitado.

Os prints complementam os testes automatizados de limite e autorização. O botão também está sujeito à distribuição de Atributos; a recusa de um quarto rascunho com entrada válida foi comprovada nos testes SQL, não por uma tentativa humana visível nas capturas.

Não foram copiados prints, e-mails, identificadores de conta ou conteúdo alheio ao teste para o repositório. As capturas não demonstram recarga com F5, fechamento/reabertura de sessão, entrega de eventos Realtime, concorrência ou todos os cálculos de Perícias. Esses itens não foram marcados como aprovados por inferência.

Na mensagem seguinte, Gus confirmou que as verificações adicionais funcionaram exatamente como esperado: F5 nas duas sessões, escolhas/recursos preservados ao reabrir, Mestre sem acesso aos rascunhos e criação bloqueada em 3/3 mesmo com Atributos válidos. Registro baseado no relato explícito do usuário; não depende de inferência das capturas.

### Verificações adicionais — 23/10/2026

- CI da revisão `c259218` concluída com sucesso: https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/39871299284 . Nenhuma alteração de código foi necessária nesta rodada.
- `pnpm audit --prod --json`: zero avisos retornados para as 12 dependências de produção. `pnpm audit --json`: zero avisos retornados incluindo desenvolvimento, 131 dependências totais. Consulta ao serviço público de advisories, limitada ao banco de avisos disponível naquele momento; não certifica ausência de vulnerabilidades desconhecidas.
- PostgREST sem login no projeto de teste: HEAD da tabela personagens = HTTP 401; RPC definir_origem_rascunho = HTTP 401, código 42501. HEAD não retorna linhas; a chamada RPC usou UUID fictício e foi recusada sem escrita. Não foram lidas fichas individuais.
- Foram criadas duas séries isoladas de fixtures descartáveis, cada uma com identidades sem senha/e-mail, Mesa e dois rascunhos. Chamadas adicionais preservaram o máximo de três: uma criação aceita e outra recusada. Nenhuma fixture foi compartilhada com a Mesa usada pelo Gus.
- Na segunda série, instrumentação com advisory lock e identificadores de backend mostrou conexões distintas, mas `sobreposicao_confirmada=false`. Logo, a execução não comprova contenção entre transações simultâneas. Corrige a conclusão preliminar da atualização de progresso: concorrência estrita continua pendente, apesar de o limite observado ter sido preservado.
- Limpeza das duas séries conferida por identificadores exatos: zero contas, Mesas e fichas das fixtures restantes. Apenas os registros criados pelo agente foram removidos. Contas e registros do teste humano foram preservados.
- Advisor de performance do projeto de teste: uma FK sem índice de cobertura em jogador_id e dois índices ainda sem uso observado. Nenhum índice foi criado ou removido. Referências: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys e https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index .

Pendências de validação: entrega e isolamento de eventos Realtime em duas sessões autenticadas; concorrência com sobreposição efetivamente confirmada, inclusive ajustes simultâneos de recursos. Não foram extraídas sessões, tokens ou senhas dos navegadores para automatizar esses testes. A confirmação de F5 não foi tratada como prova de Realtime.

Nenhum custo adicional, mudança de produção, merge ou publicação nesta rodada. Não houve alteração na proposta de SQL nem nas dependências.

Planejamento aprovado: até 10 jogadores por Mesa, até 10 personagens ativas no total e até 3 rascunhos por conta/Mesa. Os três rascunhos não ocupam vagas ativas. Esta etapa implementa privacidade e limite de rascunhos; não certifica o teto de jogadores nem implementa finalização e seu teto de ativas.

Exclusão automática dos rascunhos na saída/remoção permanece pendente, por envolver dados. Reconciliação da 006 em produção permanece pendente. Merge, publicação da Alfa e mudanças adicionais de produção continuam sujeitos ao checkpoint explícito do Gus.
