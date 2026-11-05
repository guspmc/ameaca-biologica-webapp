# Protótipo do servidor local — primeiro teste LAN

**Estado em 05/11/2026:** a interface React experimental já está conectada à API local para cadastro/login, Mesas, convites/solicitações e rascunhos de personagem. A CI passou no commit `e4e08a90da502d11162f4a0c39283df3ca7092a4`; alterações posteriores ao commit ainda precisam de nova execução de CI. A rodada humana F1/L1/L2 permanece pendente, embora o primeiro teste de abertura dos ambientes no PC tenha sido relatado como aprovado.  
**Objetivo:** validar incrementalmente a base Node.js + SQLite + WebSocket e os fluxos experimentais de Mesa LAN sem depender de Supabase.  
**Importante:** não é um servidor de campanha pronto para produção. Use somente dados e contas fictícios em rede privada confiável; o protótipo usa HTTP sem TLS e não deve ser exposto à internet.

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

**Limites importantes (estado atual):** as rotas antigas `/api/events` estão desativadas (HTTP 410). As rotas atuais exigem sessão local; a autorização de Mesa é validada no servidor. O Mestre administra convites e aprova solicitações, mas não recebe acesso à ficha completa dos jogadores. O Jogador pode manter rascunhos próprios, com controle de revisão para impedir sobrescrita concorrente; a API agora limita a três rascunhos por jogador em cada Mesa. A aprovação de ingresso aplica o teto de dez jogadores por Mesa. A remoção de participante pela interface ainda não está implementada, e não há sincronização automática entre rascunho SQLite da Mesa LAN e ficha pessoal IndexedDB. A limitação de tentativas de cadastro/login é experimental, mantida em memória por IP, e não substitui controles de produção. O protótipo continua usando HTTP sem TLS; portanto, não use credenciais reais ou dados de campanha. Ainda faltam transporte seguro, política de operação/backup do servidor e validação humana completa em dispositivos reais.

## Próximo marco

Próximo incremento: concluir a validação humana dos inicializadores Windows, Ficha offline e Mesa LAN; depois, priorizar os fluxos pendentes de remoção/revogação e continuidade de sessão, sem ultrapassar as regras de acesso offline do Planejamento v2.1.


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

**REGISTRO HISTÓRICO SUPERADO — NÃO IMPLEMENTAR:** este parágrafo registrava uma proposta antiga de permitir alterações offline em estados compartilhados. O Documento Mestre de Planejamento v2.1 e a diretriz vigente do projeto prevalecem: offline, o aplicativo consulta dados previamente autorizados (marcados como possivelmente desatualizados) e permite anotações pessoais; não permite alterar PV, SA, BI, Inventário, Baú, iniciativa ou outros estados compartilhados. Qualquer mudança nessa política exige revisão explícita do planejamento e da arquitetura de segurança antes de implementação.

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

## Estado atual da interface React — 05/11/2026

A entrada principal preserva a Ficha offline como padrão e oferece a rota experimental da Mesa local sob demanda:

- Ficha offline: `/ameaca-biologica-webapp/`
- Interface de conexão LAN: `/ameaca-biologica-webapp/?servidor=local`

A seleção está em `src/main.tsx`. A tela LAN usa a API SQLite local para cadastro/login, criação/listagem de Mesas, convites/solicitações e rascunhos de personagem.

**Estado observado no código desta branch:** a interface LAN solicita um ticket WebSocket após autenticar, abre o canal, inscreve individualmente as Mesas listadas e reage a invalidações consultando novamente as rotas HTTP autorizadas. Quando o canal fecha, tenta obter outro ticket e reconectar. A inscrição WebSocket não transporta fichas nem substitui a autorização das consultas HTTP.

**Limites ainda presentes:** a sessão e o token ficam somente na memória da página; recarregar a página exige novo login. A reconexão usa espera progressiva após falha, começando em 3 segundos e dobrando até o teto de 30 segundos; falha HTTP 401 ao obter ticket encerra a sessão na interface. Quando a aba retorna ao primeiro plano, a interface consulta novamente os dados autorizados e força a recuperação do canal WebSocket. A interface não possui um fluxo de remoção de participante, nem sincronização automática entre o rascunho SQLite da Mesa LAN e a Ficha offline em IndexedDB. O canal LAN e a interface permanecem experimentais; o teste manual em dois dispositivos e com expiração de sessão ainda está pendente.

## Canal LAN e execução no celular — 05/11/2026

O servidor agora aceita inscrições WebSocket individuais por Mesa, sem impor um limite artificial de Mesas por conta. O ticket continua temporário, de uso único e vinculado à sessão ativa. A inscrição recebe somente os identificadores de Mesas em que a conta é participante; antes de enviar uma invalidação, o servidor revalida sessão e vínculo. Eventos não transportam fichas, e-mails, solicitações ou conteúdo privado: a interface deve consultar novamente as rotas HTTP autorizadas. Alterações de rascunho emitem invalidação somente para outras conexões da mesma conta; não são transmitidas ao Mestre.

A interface React usa esse canal para atualizar listas de Mesas, solicitações e rascunhos. Se a conexão cair, tenta reconectar com novo ticket. Uma sessão revogada encerra o canal. A aplicação não substitui as consultas HTTP por dados recebidos no WebSocket.

### Teste de Mesa em LAN com dois dispositivos

A conexão WebSocket insegura (ws://) é bloqueada pelos navegadores quando iniciada a partir de uma página HTTPS, como GitHub Pages. Para não depender de certificados locais, o teste de Mesa em rede usa o servidor Vite de desenvolvimento como proxy same-origin; o WebSocket e a API são encaminhados para o servidor SQLite na própria máquina.

**Na máquina que hospedará a Mesa, abra dois terminais na pasta do projeto:**

Terminal 1 — servidor SQLite, restrito ao loopback:
```powershell
pnpm.cmd run server:local -- --host 127.0.0.1 --port 4175
```

Terminal 2 — interface LAN:
```powershell
pnpm.cmd run dev:lan
```

No computador, abra:
`http://127.0.0.1:4174/ameaca-biologica-webapp/?servidor=local`

No celular conectado à mesma rede Wi-Fi, abra o mesmo caminho usando o IP privado do computador no lugar de `127.0.0.1`, por exemplo:
`http://IP-DO-COMPUTADOR:4174/ameaca-biologica-webapp/?servidor=local`

O endereço do servidor na interface já será preenchido com a origem atual e passará pelo proxy. Se o firewall do Windows perguntar, permita acesso somente em rede privada confiável. O Vite mantém a validação padrão do cabeçalho Host (sem desativar a proteção com `allowedHosts: true`) e aceita IPs locais para esse teste. O modo LAN **não deve ser executado em Wi-Fi público ou exposto à internet**.

**Limite importante:** o modo `dev:lan` é um ambiente de teste online, não uma instalação PWA segura. O Service Worker não é registrado no servidor Vite de desenvolvimento e HTTP por IP privado não oferece contexto seguro para instalação PWA. A Ficha offline deve continuar sendo testada separadamente pelo build de prévia local (localhost) ou pela PWA publicada. Não confundir os dois testes.

### Estado após a implementação

- IMPLEMENTADO: ticket de WebSocket vinculado ao hash da sessão; inscrição por IDs de Mesa; validação de participação; invalidações de solicitações e vínculo; invalidação de rascunho restrita às outras conexões da mesma conta; revalidação periódica de sessão; reconexão da interface.
- IMPLEMENTADO: modo `dev:lan` com proxy same-origin para `/api` e `/ws`, permitindo o teste HTTP a partir de outro dispositivo na rede privada.
- TESTE AUTOMATIZADO: cobre inscrição individual autorizada/negada, evento após solicitação, notificação da conta após aprovação, invalidação de rascunho, encerramento do canal após logout e integração real do proxy HTTP/WebSocket.
- CI: commit `836a8fd` passou em compilação e testes da Ficha offline. Após endurecimento da validação de Host no Vite e ajustes dos testes correspondentes, o commit `b550a98` está em nova execução; não considerar essa última rodada aprovada até o resultado final.
- PENDENTE: teste manual em dois dispositivos e em navegadores reais; verificação de firewall, reconexão após queda de Wi-Fi e sessão expirada.
- PENDENTE: não existe ainda sincronização automática entre IndexedDB da Ficha offline e SQLite da Mesa LAN.


### Roteiro humano — Mesa LAN em dois dispositivos

Executar somente depois de CI verde. Usar dados fictícios e duas contas distintas.

1. No computador, iniciar o servidor SQLite e o Vite em modo LAN conforme os comandos acima. Abrir a interface local e confirmar que a saúde do servidor responde.
2. No computador, cadastrar a conta do Mestre, entrar, atualizar a lista e criar uma Mesa.
3. Gerar um convite e manter a tela de solicitações aberta.
4. No celular, conectado ao mesmo Wi-Fi, abrir a URL LAN e cadastrar uma segunda conta. Solicitar ingresso usando o código.
5. Sem tocar em **Ver solicitações** no computador, confirmar que o Mestre recebe a atualização da lista. O evento não deve conter e-mail nem dados do pedido; a interface consulta a rota autenticada.
6. Aprovar o pedido no computador. Sem atualizar manualmente o celular, confirmar que a Mesa aparece na lista da conta Jogador.
7. No celular, criar um rascunho de personagem. Em outra sessão autenticada da mesma conta Jogador, confirmar que a lista de rascunhos é atualizada. O Mestre não deve receber conteúdo ou detalhes desse rascunho.
8. Com a sessão do Jogador aberta, encerrar essa sessão no servidor por logout em outra sessão/cliente. Confirmar que o canal é encerrado e a interface solicita novo login.
9. Desligar e religar o Wi-Fi do celular. Confirmar tentativa de reconexão e atualização das listas após a nova conexão. Enquanto desconectado, nenhuma operação compartilhada deve ser apresentada como confirmada.
10. Repetir a solicitação/ aprovação com uma Mesa sem vaga, e confirmar que o servidor recusa o ingresso sem ultrapassar o limite de 10 jogadores.

Registrar cada passo como **aprovado**, **falhou** ou **não executado**, com dispositivo/navegador e mensagem observada. Testes automatizados de autorização não substituem este roteiro, e este roteiro não substitui a verificação de duas contas e sessões reais.


## Inicialização simplificada no Windows

Para evitar digitar os comandos manualmente, use o arquivo `scripts\\windows\\Iniciar_Mesa_LAN.bat` com duplo clique. Ele:

1. verifica Node.js 22.12+ e pnpm 11.25.0;
2. confere/instala as dependências com o lockfile congelado;
3. verifica se as portas 4174 (Vite) e 4175 (API) estão livres;
4. inicia a API SQLite em `127.0.0.1:4175` e a interface Vite LAN em janelas separadas;
5. abre a interface no próprio computador.

No celular, use o IP privado do computador no endereço da interface, mantendo ambos na mesma rede confiável. O proxy Vite recebe o tráfego da LAN e encaminha API/WebSocket ao loopback; a API SQLite não precisa ficar exposta diretamente na rede. Mantenha as duas janelas abertas e encerre cada processo com Ctrl+C na respectiva janela.

A Ficha Offline tem inicializador separado: `scripts\\windows\\Iniciar_Ficha_Offline.bat`. Ela compila o modo de teste e usa a porta **4176**, evitando conflito com a interface LAN, que usa **4174**. Os dois ambientes podem, assim, permanecer abertos simultaneamente no mesmo PC. A prévia offline deve ser acessada por `http://127.0.0.1:4176/ameaca-biologica-webapp/`.

Se uma porta estiver ocupada, o inicializador LAN interrompe a preparação em vez de encerrar processos desconhecidos. Não finalize processos Node de outros projetos. Os inicializadores não publicam, não fazem merge e não alteram qualquer banco remoto.
