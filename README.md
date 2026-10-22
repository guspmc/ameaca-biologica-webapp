# Ameaça Biológica RPG — WebApp

WebApp gratuito e de código aberto para **Ameaça Biológica**, RPG de horror e sobrevivência, com fichas digitais, gerenciamento de campanhas, Mesas online e sincronização.

## Estado atual

**Alfa 0.1 (portal inicial):** cadastro e login por e-mail via Supabase Auth, criação e listagem de Mesas por usuário e interface responsiva. Ainda não há convites, gerenciamento de personagens nem sincronização em tempo real na UI. Os protótipos aprovados da **Ficha do Jogador v0.2.1** e do **Painel do Mestre v0.2** continuam referências visuais separadas.

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

As migrações PostgreSQL vivem em `supabase/migrations/`. As tabelas iniciais são `mesas`, `mesa_participantes` e `personagens`, com RLS. O primeiro portal manipula apenas `mesas`. Não faça inserções de teste pelo papel administrativo sem entender as políticas; vamos testar RLS com duas contas autenticadas e depois implementar convites, transferência de mestragem e gestão de personagens.

Os livros oficiais e imagens de terceiros não devem ser publicados neste repositório sem autorização.

## Portabilidade

O projeto deve permitir exportar campanhas, migrar o banco PostgreSQL e utilizar servidor próprio. Backups completos e sincronização são objetivos planejados e **ainda não foram implementados**. A disponibilidade gratuita dos provedores depende de seus limites vigentes.
