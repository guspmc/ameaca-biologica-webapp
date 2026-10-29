# Protótipo do servidor local — primeiro teste LAN

**Estado em 29/10/2026:** CI passou no commit `d3cc618ec7bde59208fd62cae053088573137c91`, incluindo testes automatizados e build do frontend. O reteste manual PC + Android foi relatado como aprovado para a LAN; a reconexão Android pode exigir recarga. A API de autenticação local continua experimental e não está conectada ao frontend.  
**Objetivo:** provar a base técnica Node.js + SQLite + WebSocket sem depender de internet.  
**Importante:** não é um servidor de campanha. Existe uma API experimental de contas e sessões locais, mas ela ainda não está conectada ao frontend; há apenas o esquema inicial de Mesas e participantes; ainda não há API de Mesas, autorização por Mesa nem dados de RPG.

## O que foi implementado neste incremento

- Servidor HTTP Node.js que, por padrão, escuta apenas em `127.0.0.1`.
- Banco SQLite persistente em `.ameaca-local/servidor-prototipo.sqlite` (pasta ignorada pelo Git).
- Página de diagnóstico servida pelo próprio processo.
- API de saúde em `GET /api/health`.
- API demonstrativa para criar e listar mensagens de teste em `POST /api/events` e `GET /api/events`.
- Canal WebSocket em `/ws` que distribui cada evento aos navegadores conectados.
- Heartbeat de WebSocket a cada 25 segundos para detectar conexões que deixaram de responder; o processo servidor não tem desligamento por inatividade.
- Reconexão automática no navegador, com espera progressiva, e recuperação do histórico após reconectar.
- Deduplicação por ID e ordenação dos eventos para evitar repetição ou perda em corridas entre histórico e mensagens ao vivo.
- Sincronização do histórico quando a aba volta ao primeiro plano, além da reconexão automática.
- Diagnóstico no terminal para conexões/fechamentos WebSocket e clientes que não respondem ao heartbeat.
- Nove testes específicos do protótipo LAN, incluindo conexão ociosa responsiva, encerramento de clientes sem resposta, validação sintática do script e simulação de reconexão/retorno ao primeiro plano. A suíte completa já passou no CI em incrementos anteriores; consulte o status do commit mais recente antes de considerar uma nova alteração validada.

## Requisitos

- Node.js **22.12 ou superior**; recomenda-se uma versão 22 LTS atual.
- pnpm 11.25.0.
- Para o teste entre dispositivos, ambos devem estar conectados à mesma rede Wi-Fi/LAN.

## Instalar e validar no Windows

Abra o PowerShell na pasta do projeto e execute:

```powershell
node --version
pnpm.cmd install --frozen-lockfile --ignore-scripts
pnpm.cmd test
pnpm.cmd run build
```

Resultado esperado: instalação sem erro, testes concluídos com zero falhas e build concluído. O CI confirma o resultado apenas para o commit que foi efetivamente executado; valide novamente após qualquer alteração de código. O módulo SQLite nativo do Node é experimental na linha Node 22 e é iniciado explicitamente com `--experimental-sqlite`.

## Teste local no mesmo PC

```powershell
pnpm.cmd run server:local
```

Abra `http://localhost:4175/`. Envie uma mensagem fictícia e confirme que ela aparece na lista. Pare o servidor com **Ctrl+C**, inicie-o novamente e confirme que a mensagem anterior continua listada.

O banco de teste ficará em `.ameaca-local/servidor-prototipo.sqlite`. Não apague esse arquivo antes de concluir o teste de persistência.

## Teste entre dois dispositivos na rede local

1. No PC que será o servidor, execute:

   ```powershell
   pnpm.cmd run server:local -- --host 0.0.0.0
   ```

2. O terminal mostrará um ou mais endereços identificados como **Acesso pela LAN**, por exemplo `http://192.168.1.25:4175/`. Use o endereço real que aparecer no seu PC; o exemplo não é um endereço a copiar.
3. Se o Windows perguntar, permita o Node.js somente em **redes privadas**. Não habilite acesso em redes públicas.
4. No segundo dispositivo, conectado ao mesmo Wi-Fi, abra o endereço LAN mostrado pelo PC.
5. Envie uma mensagem fictícia no notebook/celular e confira se ela aparece sem recarregar a página nos dois dispositivos.
6. Envie outra mensagem a partir do segundo dispositivo e confira o mesmo comportamento.
7. Para comprovar que a internet não é requisito, faça esse teste com a conexão WAN/internet indisponível, mas mantendo o roteador e a rede Wi-Fi local funcionando. Não desligue o Wi-Fi que conecta os dispositivos entre si.

Se os dispositivos não se conectarem, confira primeiro se ambos estão na mesma LAN e se o firewall do Windows permite conexões de entrada para a porta 4175 em redes privadas.

## Limites e segurança

- **As rotas demonstrativas `/api/events` não exigem autenticação.** Qualquer dispositivo que consiga alcançar o servidor pode ler e criar mensagens demonstrativas.
- Não digite nomes reais, credenciais, segredos de campanha, anotações privadas ou dados de jogadores.
- O servidor local usa HTTP sem TLS neste protótipo; use apenas uma rede privada e confiável para o teste.
- O servidor só escuta na LAN quando `--host 0.0.0.0` é informado explicitamente. O padrão `127.0.0.1` não permite conexões de outros dispositivos.
- Este protótipo não migra nem lê o Supabase e não altera o frontend publicado da Alfa 0.4. A API experimental cria contas locais no SQLite, mas ainda não é usada pela interface React.
- O fato de um teste automatizado estar escrito não significa que ele passou. Os resultados precisam vir da execução local ou do CI.
- O protótipo ainda não foi validado como servidor no Android. Essa será uma etapa posterior, depois de comprovar o fluxo no PC.

## Autenticação local e esquema inicial de Mesas

A branch de desenvolvimento agora contém uma API de autenticação local separada em `server/auth-local.mjs`:

- `POST /api/auth/register`: cria conta com e-mail normalizado e senha de 12 a 128 caracteres.
- `POST /api/auth/login`: valida a senha e emite um token de sessão aleatório com validade de sete dias.
- `GET /api/auth/me`: valida o token enviado no cabeçalho `Authorization: Bearer ...`.
- `POST /api/auth/logout`: revoga a sessão atual.
- Senhas são derivadas com scrypt e salt aleatório; o banco guarda o hash do token de sessão, não o token em si.
- O banco usa `schema_migrations`: a versão 1 cria contas/sessões e a versão 2 cria `mesas` e `participantes_mesa`, ambas com transação. As migrações usam `CREATE TABLE IF NOT EXISTS` e não recriam tabelas já existentes.
- Testes automatizados verificam o registro único da migração e a preservação de uma conta e sessão após reiniciar o servidor.
- Testes automatizados dedicados cobrem cadastro, login, sessão, logout, senha curta, e-mail duplicado e limite de tentativas.
- Limite experimental em memória por IP: até cinco tentativas por rota de cadastro/login em uma janela de dez minutos; ao exceder, responde HTTP 429 com `Retry-After`.

**Limites importantes:** esta API ainda não está conectada à interface React. A API de Mesas agora oferece `GET /api/mesas` (lista somente as Mesas da conta autenticada), `POST /api/mesas` (cria uma Mesa e registra seu criador como Mestre na mesma transação) e `GET /api/mesas/:id` (consulta somente se a conta participa). Todas exigem sessão válida; IDs de conta enviados no corpo são ignorados para autorização. Ainda não há convites/entrada de participantes, edição/remoção de Mesas, fichas ou presença online. As rotas demonstrativas `/api/events` e o WebSocket `/ws` continuam sem autenticação e devem ser tratados apenas como demonstração descartável, sem dados de campanha. A migração ainda não aplica os limites de 10 participantes e 10 personagens ativas; esses controles precisam ser implementados no serviço antes de aceitar dados reais. Também não há recuperação de conta. A limitação de tentativas é experimental, mantida apenas em memória, por IP; pode ser contornada reiniciando o servidor e não substitui controles de produção. O protótipo continua usando HTTP sem TLS; portanto, não use credenciais ou dados reais. Antes de colocar dados de campanha no servidor, precisamos tratar transporte seguro na LAN, reforçar os controles de limitação de tentativas, definir a política de criação de contas e implementar autorização no servidor. A presença desses endpoints não significa que o WebApp já tenha autenticação local pronta para uso real.

## Próximo marco

Próximo incremento: implementar entrada/convites para participantes com política explícita, aplicar limites de 10 participantes e 10 personagens ativas por Mesa, e então proteger o canal de tempo real com autenticação e presença restrita aos participantes da Mesa. Só depois conectar gradualmente o frontend atual à API local.


## Reconexão, heartbeat e tempo ocioso

O processo Node não encerra o servidor por ficar sem atividade. O heartbeat de WebSocket é uma verificação de conexão, não um temporizador de desligamento: o servidor envia um ping a cada 25 segundos e encerra somente conexões que deixam de responder por um ciclo adicional. Quando o navegador detecta a queda, tenta reconectar automaticamente, aumentando a espera até cerca de 30 segundos, e consulta novamente os últimos 50 eventos.

Isso reduz o risco de um canal aparentemente conectado ficar morto sem ser percebido e evita exigir F5 para recuperar o histórico. **Não é possível garantir que a conexão física permaneça aberta para sempre:** suspensão do navegador/Android, economia de bateria, Wi-Fi/roteador ou encerramento do processo podem interrompê-la. O comportamento deve ser validado com os navegadores reais, especialmente após bloqueio de tela e inatividade prolongada.

## Reteste manual após o CI

1. Inicie o servidor no PC e abra o endereço LAN no PC e no Android.
2. Deixe as duas páginas abertas e visíveis por pelo menos 3–5 minutos, sem enviar mensagens.
3. Envie uma mensagem do Android e confira se ela aparece no PC sem F5; depois faça o caminho inverso.
4. Observe o indicador de conexão durante a espera. Se ficar vermelho, aguarde a reconexão automática e confirme se o histórico volta sem atualizar a página.
5. Repita com o celular bloqueado ou com o navegador em segundo plano. Esse cenário pode depender do sistema operacional e não deve ser confundido com desligamento por inatividade do servidor.

## Decisão aprovada — alterações offline com trilha de auditoria

**Aprovado pelo usuário em 29/10/2026:** permitir que o jogador altere também os estados compartilhados da própria ficha durante uma sessão offline (por exemplo, atributos, PV, SA, BI, munição e inventário), para não exigir conexão contínua durante o jogo presencial. Essa decisão amplia e substitui, para esse modo de uso, a restrição offline descrita no Planejamento v2.0, que permitia apenas leitura de snapshots e anotações pessoais. A alteração deve ser registrada como decisão posterior no histórico do planejamento; não modifica as regras do RPG nem concede ao Mestre editor universal.

### Trilha de auditoria

Toda alteração offline deve gerar um evento de histórico, em vez de depender apenas do valor final da ficha. O registro proposto contém:

- identificador único do evento e do pacote de sincronização;
- conta proprietária e personagem afetada;
- campo/entidade alterado;
- valor anterior e novo valor (ou operação equivalente para listas, como inventário);
- data/hora informada pelo dispositivo em formato ISO 8601, preservando o fuso/offset quando disponível;
- sequência local crescente e identificador da instalação/dispositivo;
- versão/base do estado a partir da qual a edição foi feita;
- origem marcada como offline e momento em que o servidor recebeu/importou o pacote.

Exemplo de apresentação ao Mestre: **“AGI 3 » 4 — 14/08/2026 às 18:02”**. A interface também deve indicar que a alteração foi feita offline e, quando útil, mostrar quando o pacote foi recebido pelo servidor.

### Limites de confiança e tratamento

- O horário do aparelho pode estar incorreto e o arquivo exportado pode ser manipulado antes da importação. Portanto, a trilha é um histórico de transparência e revisão, não prova criptográfica de que a alteração ocorreu exatamente naquele horário ou de que o jogador não adulterou o arquivo.
- O servidor registra o horário de recebimento separadamente e nunca substitui silenciosamente o horário declarado pelo dispositivo.
- A importação valida conta, propriedade, permissões, estrutura, sequência, IDs de eventos e versão-base. Eventos duplicados não podem ser aplicados duas vezes.
- Se a ficha no servidor mudou desde a exportação, o sistema apresenta conflito para revisão; não sobrescreve dados mais recentes automaticamente.
- O Mestre pode consultar o histórico e solicitar ao jogador que corrija uma alteração irregular. Não haverá reversão automática nem julgamento automático de legitimidade pelo aplicativo.
- O registro deve ser append-only na aplicação normal: correções posteriores geram novos eventos, sem apagar o histórico anterior. Isso não torna o arquivo offline inviolável; a importação deve preservar a origem e sinalizar limitações de confiança.
- O pacote de exportação deve ser versionado e validado antes de qualquer gravação. Dados privados ou segredos não relacionados à ficha não devem ser incluídos.

### Escopo e próximo passo

**Planejado, ainda não implementado:** fila local de operações, exportação do pacote, pré-visualização no Mestre, importação idempotente, resolução de conflitos e tela de histórico por personagem. A sessão LAN continua sendo o caminho principal e sincroniza diretamente com o servidor autoritativo; o pacote offline é um caminho alternativo para transportar alterações até o Mestre. Não usar a API demonstrativa atual para esses dados.

A política anterior do Planejamento v2.0 sobre anotações pessoais continua valendo: notas pessoais não são incluídas automaticamente em exportações. A trilha de auditoria aqui descrita é para alterações estruturadas da ficha e demais dados compartilhados autorizados.
## Precisões aprovadas — permissões e documentos servidos pela LAN

**Aprovado pelo usuário em 29/10/2026:**

- O Mestre não recebe permissão para editar fichas de personagens por meio de editor comum. A auditoria das alterações offline é somente leitura/revisão; o Mestre pode apontar uma irregularidade e pedir que o proprietário corrija a ficha. A correção é feita pelo jogador e gera seu próprio registro.
- **Notas e Anotações pessoais dos Jogadores ficam fora da trilha de auditoria de alterações da ficha.** Permanecem privadas, visíveis somente ao autor, e não são incluídas automaticamente em exportações ou pacotes de sincronização.
- Documentos e mapas que o Mestre disponibilizar/revelar podem ser consultados pelos participantes autorizados por meio do servidor LAN, sem exigir que cada jogador baixe manualmente uma cópia permanente para o celular. Segredos não revelados permanecem exclusivos do Mestre; a revelação compartilha o conteúdo com toda a Mesa conforme as permissões funcionais aprovadas.

### Cache e armazenamento temporário — proposta técnica

O servidor mantém o arquivo original. O cliente solicita o documento quando abre a visualização e recebe o conteúdo em fluxo HTTP; o navegador pode manter buffers temporários e, dependendo dos cabeçalhos e da implementação do PWA/Service Worker, pode também armazenar uma cópia em cache. Portanto, 'não baixar manualmente' é possível, mas não significa que o conteúdo nunca seja transferido ou armazenado em memória/cache do aparelho.

**Diretriz de implementação:** documentos do Mestre não devem ser adicionados automaticamente ao cache offline persistente do Service Worker nem a um armazenamento permanente do app. Priorizar o cabeçalho HTTP Cache-Control: no-store nas respostas de documentos privados e não armazenar esses arquivos no IndexedDB. Limpar referências/visualização ao sair da Mesa ou quando o acesso for revogado, na próxima comunicação com o servidor. Conteúdo já visualizado não pode ser apagado retroativamente de capturas de tela, fotografias ou cópias feitas pelo usuário; a revogação impede novos acessos online, não desfaz conhecimento já recebido.

**Ainda precisa ser implementado e testado:** autorização server-side para cada documento, distinção entre rascunho secreto e documento revelado, entrega autenticada pela LAN, cabeçalhos de cache, comportamento do Service Worker e limpeza local na próxima conexão após revogação.
