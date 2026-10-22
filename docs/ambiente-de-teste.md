# Ambiente de teste gratuito

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

Próximo teste humano curto: F5 nas duas sessões, reabrir cada ficha como jogador e conferir que Origem/Perícia/recursos continuam iguais e o Mestre permanece sem acesso aos rascunhos. Em 3/3, distribuir Atributos válidos e confirmar que criar continua bloqueado, sem apagar qualquer ficha.

Planejamento aprovado: até 10 jogadores por Mesa, até 10 personagens ativas no total e até 3 rascunhos por conta/Mesa. Os três rascunhos não ocupam vagas ativas. Esta etapa implementa privacidade e limite de rascunhos; não certifica o teto de jogadores nem implementa finalização e seu teto de ativas.

Exclusão automática dos rascunhos na saída/remoção permanece pendente, por envolver dados. Reconciliação da 006 em produção permanece pendente. Merge, publicação da Alfa e mudanças adicionais de produção continuam sujeitos ao checkpoint explícito do Gus.
