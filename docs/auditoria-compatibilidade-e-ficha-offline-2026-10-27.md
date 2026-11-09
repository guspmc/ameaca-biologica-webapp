# Auditoria de compatibilidade e prioridade local/offline — 27/10/2026

## Escopo e limites

Auditoria somente de leitura dos dois projetos Supabase, do histórico de migrations, dos privilégios/políticas e do código da branch `feat/origens-rascunho-alfa04`. Nenhuma SQL de escrita foi executada; não houve alteração de dados, Auth, RLS, migrations remotas, merge ou publicação.

## Estado remoto observado

- Produção `ameaca-biologica-rpg` (`pftuhqioutvwnmvlbtrt`): ativa, 5 migrations registradas.
- Teste `ameaca-biologica-rpg-teste` (`elctulggqcokixswusre`): ativa, 15 migrations registradas.
- Todas as tabelas consultadas no schema `public` estão com RLS habilitada.
- O schema `app_private` não tem USAGE para `anon`; tem USAGE para `authenticated`.

## Reconciliação do histórico de migrations

Os nomes registrados no projeto de teste correspondem aos nomes das migrations locais, mas as versões/timestamps remotos não correspondem aos prefixos dos arquivos versionados. Exemplos:

| Nome registrado no TESTE | Arquivo local correspondente |
|---|---|
| `20261022225720 estrutura_inicial` | `20261022000100_estrutura_inicial.sql` |
| `20261022225723 politicas_rls` | `20261022000200_politicas_rls.sql` |
| `20261022225726 convites_e_solicitacoes` | `20261022000300_convites_e_solicitacoes.sql` |
| `20261022225733 participantes_e_realtime` | `20261022000400_participantes_e_realtime.sql` |
| `20261022225738 fichas_personagem_alfa04` | `20261022000500_fichas_personagem_alfa04.sql` |
| `20261022225745 origens_rascunhos` | `20261022000600_origens_rascunhos.sql` |
| `20261022225748 privacidade_e_limite_rascunhos` | `20261022224633_privacidade_e_limite_rascunhos.sql` |
| `20261023040357 pericias_criacao_rascunhos` | `20261023035943_pericias_criacao_rascunhos.sql` |
| `20261023043941 habilidade_basica_rascunhos` | `20261023042414_habilidade_basica_rascunhos.sql` |
| `20261023044310 habilidade_origem_compatibilidade` | `20261023043912_habilidade_origem_compatibilidade.sql` |
| `20261023045839 equipamento_inicial_rascunhos` | `20261023045501_equipamento_inicial_rascunhos.sql` |
| `20261023050850 identidade_rascunhos` | `20261023050653_identidade_rascunhos.sql` |
| `20261023140317 compras_iniciais_rascunhos` | `20261023134639_compras_iniciais_rascunhos.sql` |
| `20261023160853 disponibilidade_mestre` | `20261023160814_disponibilidade_mestre.sql` |
| `20261023173950 funcionamento_rascunho` | `20261023173853_funcionamento_rascunho.sql` |

O projeto de produção registra as cinco primeiras versões locais exatamente; ainda não contém as etapas posteriores de criação.

**Conclusão:** não executar `supabase db push`, `migration repair`, reset ou qualquer reconciliação automática. Os nomes e o formato das tabelas ajudam a mapear a história, mas não provam que todo o SQL remoto é byte a byte equivalente ao arquivo local. Antes de reparar o histórico, comparar definições atuais de funções, triggers, constraints e políticas com os arquivos de origem e produzir um plano de reconciliação que não reaplique DDL existente.

## Alerta de RLS em `app_private.convites_mesa`

A tabela está com RLS desabilitada em TESTE e produção. A consulta adicional de privilégios mostrou:

- `anon`: sem USAGE em `app_private` e sem privilégios diretos de SELECT/INSERT/UPDATE/DELETE na tabela.
- `authenticated`: USAGE em `app_private`, mas sem privilégios diretos de SELECT/INSERT/UPDATE/DELETE na tabela.
- As RPCs públicas de convite observadas são SECURITY DEFINER; EXECUTE permitido a `authenticated` e negado a `anon`.

Assim, esta auditoria **não encontrou evidência de acesso direto à tabela pela API**, embora RLS desabilitada permaneça uma lacuna de defesa em profundidade. Não alterar automaticamente: ativar RLS sem políticas bloqueia o acesso direto e exige conferir cuidadosamente o desenho das RPCs e o proprietário efetivo das funções.

SQL candidato a revisão, **não executado**:

```sql
ALTER TABLE app_private.convites_mesa ENABLE ROW LEVEL SECURITY;
```

Não adicionar políticas genéricas para `authenticated`. O desenho atual parece intencionalmente concentrar o acesso por RPC autenticada; qualquer política deve ser justificada por uma necessidade de acesso direto e testada entre contas/Mesas. Esta decisão precisa de checkpoint próprio antes de alterar TESTE; produção continua fora do escopo.

## Ficha local/offline — estado real do código

- `public/manifest.webmanifest` existe e está ligado por `index.html`.
- Não foi encontrado service worker nem registro de service worker; `vite.config.ts` não configura plugin PWA.
- Não foi encontrada persistência da ficha em IndexedDB. O `localStorage` atual guarda apenas a configuração da conexão e o código de convite temporário.
- `src/FichasJogador.tsx` carrega personagens do Supabase e mantém a resposta em estado React; não existe fallback de leitura de ficha em cache.
- Portanto, há um manifesto de instalação, mas **a ficha offline ainda não está implementada**.

## Contrato funcional aprovado que deve guiar a implementação

1. Cachear somente dados que a conta recebeu legitimamente do servidor e que a interface já podia consultar.
2. Identificar claramente a ficha offline como potencialmente desatualizada e informar a última consulta confirmada.
3. Não permitir offline alterações de PV, SA, BI, Inventário/Baú, Iniciativa, combate ou outros estados compartilhados.
4. Permitir escrita de anotações pessoais offline, sem misturá-las com estado compartilhado. Na sincronização, preservar versões conflitantes para resolução explícita; nunca usar sobrescrita silenciosa.
5. Ao reconectar, revalidar autorização. Se a conta perdeu acesso à Mesa ou ela foi excluída, limpar o cache dessa Mesa antes de retomar sincronização; impedir que alterações atrasadas recriem dados excluídos.
6. Não tratar fechamento do app como encerramento de encontro/Missão. Não incluir notas pessoais em exportações automáticas.

## Plano incremental recomendado

**Etapa A — shell offline seguro:** adicionar service worker para a aplicação estática e seus assets versionados, sem cache de chamadas Supabase/API. Testar atualização de versão e fallback offline em GitHub Pages.

**Etapa B — contrato e armazenamento local:** decidir explicitamente a proteção local antes de persistir dados de ficha. Implementar armazenamento versionado e isolado por conta/Mesa/personagem, com validação de esquema, indicador de desatualização, falha de armazenamento tratada e limpeza por conta/Mesa. Nenhuma operação compartilhada entra numa fila offline.

**Etapa C — leitura offline da ficha ativa:** depois de existir uma ficha ativa e o carregamento online estar estável, guardar snapshots apenas após resposta autorizada; em offline, exibir snapshot somente para o contexto de conta conhecido e em modo de leitura. Sem cache válido, mostrar estado vazio/sem conexão em vez de inventar dados.

**Etapa D — notas pessoais:** criar armazenamento local de versões e contrato de sincronização que preserve conflitos. Não criar tabela nem gravar no Supabase até checkpoint próprio para o modelo e as políticas.

**Etapa E — aceitação real:** testes em duas contas, duas Mesas, remoção de participante, logout, cache antigo, modo avião, falha de IndexedDB, atualização de service worker e Samsung Browser físico. Testes automatizados e simulações não substituem estes casos.

## Decisão de proteção local necessária antes da Etapa B

Opção recomendada para a primeira versão: IndexedDB com dados estritamente allowlisted e escopo por conta/Mesa/personagem; limpeza no logout voluntário e na próxima conexão quando a autorização for revogada; aviso persistente de desatualização; nenhum dado do Mestre/segredo privado no cache do Jogador; nenhuma criptografia própria na primeira etapa, contando com o perfil isolado do navegador e a proteção do dispositivo. Isso reduz complexidade, mas não protege contra outra pessoa que consiga usar o mesmo perfil de navegador desbloqueado.

Alternativa: acrescentar desbloqueio por PIN/frase local e criptografia via Web Crypto. Isso adiciona UX e recuperação de chave, e precisa de desenho próprio; a chave não pode ser armazenada como texto junto dos dados e depois descrita como proteção forte.

**Não assumir a opção recomendada sem confirmação do responsável pelo produto.** A política de proteção local estava pendente no planejamento e afeta a exposição de dados pessoais em aparelhos compartilhados.

## Próximo checkpoint

A preparação local da ativação passou 243/243 testes, build e verificações de tipos na execução #49. O próximo trabalho de código deve priorizar a Etapa A e o contrato offline; a Etapa B aguarda a decisão de proteção local. A reconciliação remota e a correção de RLS aguardam checkpoint específico. Nenhuma migration remota, ajuste de RLS/Auth, merge ou publicação foi feita.


## Atualização de checkpoint — 28/10/2026

### Etapa A IMPLEMENTADA na branch (shell estático)

- Adicionado `public/sw.js`: pré-cache de `index.html`, assets locais referenciados pelo HTML, manifesto e ícone; navegação tenta rede e recorre ao shell guardado se estiver offline.
- O service worker intercepta apenas GETs da mesma origem/escopo para navegação e assets estáticos conhecidos. Não intercepta nem guarda chamadas cross-origin ao Supabase/API.
- `src/main.tsx` registra o worker apenas em build de produção e fora do modo `teste`; o escopo usa `import.meta.env.BASE_URL` para respeitar GitHub Pages.
- Criado `tests/pwa-shell.test.mjs` com cinco testes de instalação/cache, fallback offline, isolamento das chamadas Supabase e base do Pages.

**TESTADO — GitHub Actions #54:** 248/248 testes passaram, incluindo os cinco testes novos; build Vite/TypeScript e verificação de tipos de QA concluídos com sucesso. Os testes do service worker usam um ambiente simulado de Node; ainda não é prova de instalação/atualização no Edge ou Samsung Browser físico.

**Limite explícito:** isto disponibiliza o shell estático, não a ficha offline. Não foi adicionado cache de dados de personagem, IndexedDB, edição offline de notas, alteração de Supabase ou publicação. A etapa de dados locais continua bloqueada pela decisão de proteção descrita acima.

### Divergência adicional de configuração remota

A leitura dos catálogos mostrou um event trigger habilitado somente em produção:

- Evento: `ensure_rls`, em `ddl_command_end`, para `CREATE TABLE`, `CREATE TABLE AS` e `SELECT INTO`.
- Função: `public.rls_auto_enable()`, que habilita RLS em novas tabelas do schema `public`.
- Não está presente no histórico de migrations versionadas nem no projeto de teste.
- A função tem EXECUTE concedido a `anon` no catálogo, mas retorna o tipo especial `event_trigger` e é chamada pelo event trigger do PostgreSQL, não como RPC comum. A concessão é desnecessária para a invocação pelo trigger e deve ser revisada como hardening, sem afirmar que foi possível invocá-la pela API.

Esse mecanismo parece protetivo, mas a diferença significa que o comportamento de criação de novas tabelas não é igual entre produção e teste. Não foi alterado. A próxima reconciliação deve decidir se a proteção é configuração intencional a versionar e reproduzir no TESTE, e remover privilégios EXECUTE desnecessários somente após teste e checkpoint.

### Próximo checkpoint

1. Resolver a política de proteção local antes de persistir snapshots de ficha.
2. Em paralelo, preparar a comparação de definições remotas (funções, triggers, constraints e policies) com os arquivos versionados; não executar reparo de histórico.
3. Obter checkpoint específico para qualquer ajuste remoto de RLS/privileges no TESTE. Produção permanece fora do escopo.


## Atualização de checkpoint — 28/10/2026, etapa RLS e cache da ficha

### RLS em convites — TESTE

- **APLICADO** somente no projeto Supabase de teste, ID elctulggqcokixswusre: ALTER TABLE app_private.convites_mesa ENABLE ROW LEVEL SECURITY.
- A migration remota ficou registrada como 20261028122021 rls_convites_mesa; o arquivo versionado correspondente é supabase/migrations/20261028122021_rls_convites_mesa.sql.
- **VALIDADO antes e depois:** as RPCs gerar_convite_mesa e solicitar_entrada_mesa foram executadas sob role authenticated e contexto de usuário de teste, dentro de transação revertida. Ambas passaram após a ativação do RLS.
- **VALIDADO:** RLS habilitada, zero políticas na tabela, e nenhum privilégio direto SELECT/INSERT/UPDATE/DELETE para anon/authenticated. O teste de acesso direto por role authenticated foi bloqueado como esperado. Contagens de Mesas, solicitações e convites permaneceram inalteradas após rollback.
- **Produção não alterada.** Nenhuma política genérica foi adicionada.
- Advisor de segurança do Supabase ainda aponta tabelas privadas sem políticas (incluindo app_private.convites_mesa e app_private.disponibilidade_compra_inicial) e funções SECURITY DEFINER intencionalmente executáveis por authenticated; esses avisos exigem revisão de cada função/tabela e não foram corrigidos em lote.

### Ficha offline — código na branch, ainda sem publicação

- Adicionado src/offlineCache.ts: IndexedDB versionado, snapshots isolados por conta/Mesa/personagem, data/hora da última consulta confirmada, limpeza da conta no logout voluntário e remoção de snapshots de personagens quando uma consulta online confirma que uma Mesa deixou de estar autorizada. O cache armazena somente personagens cujo jogador_id corresponde à conta; fichas completas de outras pessoas não são persistidas offline.
- src/App.tsx tenta recuperar a lista de Mesas de cache quando a rede falha; exibe aviso de dados potencialmente desatualizados, bloqueia criação de Mesas e oculta convites/participantes no modo de consulta.
- src/FichasJogador.tsx guarda apenas respostas de personagens que a consulta do Supabase autorizou. Quando offline/sem resposta, usa snapshots existentes em modo de leitura; PV/SA/BI, criação, Origem, Perícias, Habilidade, Identidade, Equipamento e revisão interativa ficam bloqueados.
- O cache não guarda tokens, sessão ou e-mail; o service worker não armazena dados pessoais. Não há fila de alterações compartilhadas offline. Conforme a decisão aprovada, não há criptografia própria do aplicativo: a proteção depende do perfil do navegador/dispositivo.
- Criado tests/offline-cache.test.mjs com verificações de escopo, revalidação, limpeza e bloqueio de edição offline.
- O modo de teste ganhou um opt-in de build (VITE_PWA_TESTE=true) para registrar o service worker apenas em um build de teste explicitamente solicitado; em desenvolvimento e no modo teste padrão, o worker continua desativado. O roteiro reproduzível está em docs/teste-offline-navegador.md.

**CI VALIDADO:** run 40688815404 passou com 254/254 testes, build Vite/TypeScript e verificação de tipos dos cenários isolados. **PENDENTE:** testes reais em Edge/Samsung Browser, comportamento em duas contas e revisão da persistência/edição de notas pessoais. Esta etapa ainda não oferece edição offline de notas nem sincronização de notas; nenhuma tabela remota foi criada para isso.
