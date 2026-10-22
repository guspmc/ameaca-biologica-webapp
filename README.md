# Ameaça Biológica RPG — WebApp

WebApp gratuito e de código aberto para **Ameaça Biológica**, RPG de horror e sobrevivência, com fichas digitais, gerenciamento de campanhas, Mesas online e sincronização.

## Estado atual

**Alfa 0.3:** tudo da Alfa 0.2, mais lista de participantes por Mesa, apelidos recuperados dos pedidos aprovados, renomeação de campanhas pelo Mestre, remoção controlada de jogadores e atualizações ao vivo por Supabase Realtime (Postgres Changes). Há verificação periódica como contingência se o navegador suspender a conexão. Ainda não há sincronização de atributos/fichas nem gerenciamento de personagens. Os protótipos aprovados da **Ficha do Jogador v0.2.1** e do **Painel do Mestre v0.2** continuam referências visuais separadas.

## Executar localmente

Requisitos: Node.js 22 ou superior.

1. Rode `npm install`.
2. Rode `npm run dev`.
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

As migrações PostgreSQL vivem em `supabase/migrations/`. As tabelas iniciais são `mesas`, `mesa_participantes` e `personagens`, com RLS. A migração 003 adiciona convites privados (somente hashes), pedidos protegidos por RLS e funções que validam Mestre/jogador no banco. A migração 004 adiciona apelidos nos participantes, restringe a leitura do elenco a membros da Mesa e habilita Realtime nas tabelas usadas no portal. Não faça inserções de teste pelo papel administrativo sem entender as políticas; vamos testar RLS com duas contas autenticadas e depois implementar transferência de mestragem e gestão de personagens.

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

