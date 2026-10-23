# Ameaça Biológica RPG — WebApp

WebApp gratuito e de código aberto para **Ameaça Biológica**, RPG de horror e sobrevivência, com fichas digitais, gerenciamento de campanhas, Mesas online e sincronização.

## Estado atual

**Alfa 0.4 (primeiro módulo):** mantém a Alfa 0.3 e adiciona criação de rascunhos de personagem por jogadores aprovados, distribuição inicial de Atributos (FOR/AGI/VIG/AST), cálculo da base de PV/SA/BI/Defesa da Classe e sincronização dos recursos atuais PV, SA e BI. A Ficha do Jogador tem quatro seções e navegação móvel conforme o protótipo congelado v0.2.1, mas Origem, treinamento, habilidades, ataques e inventário ainda estão explicitamente pendentes. O Mestre tem acesso somente de consulta. **Não confundir este módulo com a ficha completa pronta para campanha.** Os protótipos aprovados da **Ficha do Jogador v0.2.1** e do **Painel do Mestre v0.2** continuam referências visuais separadas.

## Executar localmente

Requisitos: Node.js 22 ou superior.

1. Instale pnpm 11.25.0 e rode `pnpm install --frozen-lockfile --ignore-scripts`.
2. Rode `pnpm run dev`.
3. Abra o endereço indicado pelo Vite.

No primeiro acesso, forneça a URL do projeto Supabase e **somente** uma chave pública `sb_publishable_...` (ou JWT público com role `anon`). Esses dados ficam no `localStorage` do navegador. Nunca use senha do banco nem `service_role`.

Opcionalmente defina as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` para pré-configurar a conexão. Elas serão incluídas no JavaScript público durante a compilação e portanto **não podem conter segredos**.

## Publicação gratuita no GitHub Pages

A automação está em `.github/workflows/pages.yml`. Em GitHub → Settings → Pages, selecione **GitHub Actions** como fonte de publicação. Na primeira publicação, o administrador do repositório pode precisar autorizar o workflow. O caminho configurado é `/ameaca-biologica-webapp/`.

Antes de testar o cadastro com e-mail, configure em Supabase → Authentication → URL Configuration:
- Site URL: `https://guspmc.github.io/ameaca-biologica-webapp/`
- Redirect URLs: `https://guspmc.github.io/ameaca-biologica-webapp/**`

O serviço SMTP padrão do Supabase limita os e-mails e não é destinado a inscrições públicas; configure SMTP próprio antes do lançamento aberto.

## Banco e segurança

As migrações PostgreSQL vivem em `supabase/migrations/`. As tabelas iniciais são `mesas`, `mesa_participantes` e `personagens`, com RLS. A migração 003 adiciona convites privados (somente hashes), pedidos protegidos por RLS e funções que validam Mestre/jogador no banco. A migração 004 adiciona apelidos nos participantes, restringe a leitura do elenco a membros da Mesa e habilita Realtime nas tabelas usadas no portal. A migração 005 adiciona os campos básicos de personagem e o fluxo validado de criação de rascunhos, limitado a dez fichas por Mesa. Não faça inserções de teste pelo papel administrativo sem entender as políticas; vamos testar RLS com duas contas autenticadas e depois implementar transferência de mestragem e gestão de personagens.

Os livros oficiais e imagens de terceiros não devem ser publicados neste repositório sem autorização.

## Portabilidade

O projeto deve permitir exportar campanhas, migrar o banco PostgreSQL e utilizar servidor próprio. Backups completos e sincronização são objetivos planejados e **ainda não foram implementados**. A disponibilidade gratuita dos provedores depende de seus limites vigentes.

## Testes recomendados para a Alfa 0.3

1. Abrir o WebApp como Mestre e como Jogador em navegadores diferentes.
2. Conferir se ambos visualizam apenas participantes da mesma Mesa, sem e-mails alheios.
3. Renomear uma Mesa no Mestre e conferir se o Jogador vê a alteração sem F5.
4. Enviar um novo pedido para outra Mesa e verificar o surgimento automático para o respectivo Mestre.
5. Remover o Jogador, confirmar que sua lista de Mesas atualiza e que não consegue mais consultar aquela Mesa.
6. Conferir se `Something Valentine`, o membro Claire e os dados anteriores continuam preservados.

**Observação:** o indicador "ao vivo" mostra a assinatura Realtime ativa, não é uma certificação da regra RLS. Testar acesso de contas diferentes continua obrigatório. O contador de participantes refere-se a usuários vinculados, não ao limite futuro de personagens.


## Verificação da Alfa 0.4

- Conferir colunas `classe`, `forca`, `agilidade`, `vigor`, `astucia`, `sa_atual`, `bi_atual` e `estado_ficha` em `personagens`.
- Entrar em Mesa como jogador aprovado. Distribuir exatamente +3 pontos e criar um rascunho.
- Conferir o novo registro e abrir as quatro seções da ficha: Características, Atributos e Perícias, Combate, Inventário.
- Alterar PV ou SA como proprietário; o Mestre deve ver a alteração, mas não dispor de controles de edição.
- Validar persistência com F5; confirmar que outras Mesas e usuários não veem a ficha.
- Em `personagens`, os valores de Origem e Treinamento ainda não são conhecidos, por isso Defesa e demais derivados exibidos são **valores básicos, não necessariamente os valores finais**.

A Ficha v0.2.1 e o Painel do Mestre v0.2 continuam congelados como referências; esta implementação não altera aqueles protótipos.

## Proposta de privacidade e limite de rascunhos (PR #1)

A migração `20261022224633_privacidade_e_limite_rascunhos.sql` está somente preparada para revisão. Ela reserva rascunhos ao autor e limita novas criações a três por conta/Mesa, sem excluir excedentes legados. A interface desta branch acompanha essa proposta. **Não publicar antes de aprovar e aplicar a migração no ambiente de destino.** O limite de dez ativas será implementado na futura finalização, ainda indisponível.

Execute `pnpm test` para recriar PostgreSQL em memória com fixtures fictícias e aplicar os arquivos SQL reais. Não usa Supabase remoto, contas, chaves ou rede. As verificações cobrem RLS e RPC; não substituem testes de Auth, PostgREST, Realtime e concorrência com conexões independentes. Execute `pnpm run build` para validar o aplicativo.

Consulte [o checkpoint e roteiro humano](docs/checkpoint-privacidade-rascunhos.md). As seções antigas acima descrevem a Alfa anterior; o relatório de auditoria preserva o estado observado em produção, sem afirmar que esta proposta foi aplicada.

O [ambiente gratuito de teste](docs/ambiente-de-teste.md) já recebeu as sete migrações e passou no teste SQL com rollback. Para a prévia isolada, preencha `.env.teste` usando `.env.example` e execute `pnpm run dev:teste`. A faixa AMBIENTE DE TESTE identifica essa versão. Ela ignora conexão guardada no navegador e não aceita o projeto de produção como alternativa. Produção permanece sem a nova proposta.

Incremento de 23/10: [distribuição dos Pontos de Perícia da Classe](docs/pericias-criacao.md), com oito migrações no ambiente de teste e 16 testes automatizados. Fichas continuam em rascunho de nível 1; Habilidades, equipamento e finalização ainda estão pendentes. Aplicar a migração aprovada no destino antes de publicar esta interface; ela seleciona a nova coluna.

Incremento seguinte: [Habilidade Básica de nível 1](docs/habilidades-basicas.md). O ambiente de teste tem agora dez migrações; 19 testes automatizados cobrem os incrementos. Perícias foram aprovadas nos testes humanos do Gus; a seleção de Habilidade e persistência aguardam o novo checkpoint. Equipamento e finalização continuam pendentes. As contagens e pendências dos parágrafos anteriores são históricas.

Novo incremento: [equipamento inicial no rascunho](docs/equipamento-inicial.md), com kits A/B/C, Característicos e grade de criação. Onze migrações no teste; 24 testes passaram. Habilidades aprovadas pelo Gus; persistência humana do equipamento aguarda checkpoint. Compras, inventário ativo e finalização continuam pendentes.

[Identidade narrativa](docs/identidade-rascunho.md) adicionada: campos opcionais e edição do nome no rascunho. Doze migrações no teste, 27 testes passaram. Gus confirmou equipamento persistente após F5; o checkpoint atual é a narrativa. Autosave geral, compras, inventário ativo e finalização seguem pendentes.

## Desenvolvimento supervisionado

Seguir o [fluxo autônomo autorizado](docs/fluxo-autonomo-supervisionado.md). A [rodada de revisão da criação](docs/relatorio-revisao-criacao.md) adiciona conferência de escolhas salvas, fórmulas e flexão de Classe, com 32 testes. Sem mudança no banco nesta rodada; finalização segue indisponível.

[Flexões e prévia local de compras](docs/relatorio-flexoes-compras.md): Investigadora/Armeira e demais termos, simulador não salvo da opção C. Sem alteração de banco ou permissões.

[Contrato local de compras persistidas](docs/contrato-compras-persistidas.md): proposta com 43 testes integrados, ainda NÃO aplicada em nenhum Supabase remoto. Não executar db push/reparação de histórico automaticamente. Prévia continua não salva.


Estado de compras persistidas no TESTE: [implementação, evidências e pendências humanas](docs/relatorio-compras-integradas.md).
