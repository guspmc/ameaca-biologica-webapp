# Auditoria de integração da ativação — 05/11/2026

**Branch auditada:** `feat/offline-first-ficha`  
**Commit de referência:** `c3983fa`  
**Escopo:** contrato TypeScript, UI isolada, proposta SQL integrada, testes PostgreSQL locais e servidor LAN.  
**Estado:** leitura estática; nenhum SQL executado ou banco remoto alterado.

## 1. Estado confirmado

- `src/pedidoAtivacao.ts`, `src/RevisaoAtivacao.tsx`, `src/servicoAtivacao.ts` e `src/recuperacaoAtivacao.ts` formam um contrato de transporte/UI preparado, mas não integrado à aplicação conectada.
- A interface de revisão exige conferência, confirmação explícita, bloqueia duplicidade durante a mesma execução e preserva o mesmo identificador de operação para repetição ambígua.
- O serviço RPC valida formato e identidade das respostas; não chama rede durante criação/renderização.
- A proposta SQL `supabase/proposals/ativacao-integrada-local.sql` contém conferência, ativação, materialização, recibos, resumo operacional e ciclo arquivar/assumir.
- `tests/ativacao-integrada-local.test.mjs` executa cenários com PostgreSQL embutido. A suíte integrada observada cobre ativação, repetição/recibo, preservação de PV/SA/BI, resumo restrito do Mestre e bloqueio de anon.
- `server/personagens-local.mjs` implementa CRUD de rascunhos com propriedade por conta e controle otimista de revisão. A resposta serializada fixa `status: 'rascunho'`; não existe estado ativo nesse servidor.
- `src/ConexaoServidorLocal.tsx` confirma salvamentos no servidor e identifica as fichas como rascunhos não ativos. Não oferece botão/serviço de ativação.
- O servidor LAN usa SQLite e autenticação própria de protótipo; não é o backend apropriado para reaproveitar diretamente as RPCs Supabase.

## 2. Inconsistência que bloqueia a allowlist simples

A função SQL `app_private.versionar_criacao()` ainda compara a linha inteira, removendo apenas `revisao_criacao`. Isso faz alterações em `revisao_inventario`, recursos operacionais e estado/ciclo incrementarem a revisão estrutural.

A proposta aprovada de allowlist classifica `estado_ficha` e `jogador_id` como campos que não devem representar alteração estrutural. Porém, o contrato atual depende do incremento de `revisao_criacao` em operações de ciclo:
- ativação altera `estado_ficha` e o teste integrado exige que `revisaoCriacao` retornada seja maior que a revisão conferida;
- arquivar/assumir também altera `estado_ficha` e/ou `jogador_id`, retornando `revisao_criacao`;
- a consulta de recibo rejeita resultado cuja `revisaoCriacao` não seja maior que a revisão pedida;
- o cliente `lerRecibo()` também exige `revisaoCriacao > pedido.revisaoFicha`.

Portanto, aplicar literalmente a allowlist preliminar, excluindo estado/posse, pode quebrar a ativação e o ciclo, mesmo corrigindo o acoplamento com Inventário. Não alterar o SQL antes de resolver a separação entre:
1. revisão estrutural das escolhas de criação;
2. revisão/versão do estado do ciclo (rascunho, completa, arquivada e posse);
3. revisão especializada do Inventário.

A direção recomendada é introduzir uma revisão explícita de ciclo/estado, ou ajustar o contrato de recibo para usar um identificador/versão de ciclo próprio. A decisão exige cotejo com os contratos de arquivamento, retomada e recuperação; não deve ser feita por substituição mecânica do trigger.

## 3. Cobertura ainda ausente

Os testes integrados existentes são valiosos. Foi acrescentado `tests/ativacao-rollback.test.mjs`, que instala uma trigger de falha durante a inserção de instâncias e verifica que a ficha continua rascunho, sem instâncias, ativação ou materialização registradas. A primeira execução revelou que a função encapsula a falha interna e devolve erro genérico de resultado indisponível; o teste foi ajustado para verificar a rejeição pública e o estado transacional, sem depender da mensagem interna. A nova execução de CI está pendente.

Ainda não demonstram:
- concorrência real de duas conexões tentando ocupar a décima vaga;
- ativação concorrente com alteração de Inventário/ciclo;
- rollback forçado no meio da materialização;
- falha de trigger/cascata ao excluir rascunho, remover participante e excluir Mesa;
- combinação efetiva de RLS/grants do banco-alvo e tentativas com duas contas reais distintas;
- integração real da UI com sessão Supabase, RPCs e atualização de estado da ficha.

A auditoria anterior já registra parte desses itens como pendentes. Não considerar a suíte atual prova de segurança remota ou concorrência.

## 4. Direção de integração

- Manter o destino da ativação no backend online que possui autorização de Mesa, contexto de criação e serialização do teto de 10 personagens.
- Não implementar ativação no servidor LAN SQLite nesta etapa. Ele permanece um laboratório de rascunhos.
- Antes de ligar `RevisaoAtivacao` à interface principal, resolver o modelo de revisões e preparar testes de concorrência/rollback no PostgreSQL local.
- Depois, revisar grants/RLS e funções `SECURITY DEFINER` como conjunto; só então preparar um ambiente Supabase de teste isolado.
- A integração deve consultar a conferência e o recibo por meio do serviço já preparado, sem expor a ficha completa ao Mestre.
- A ativação deve materializar o Inventário uma única vez, na mesma transação que muda o estado; reabrir/editar rascunho nunca materializa.


## 5. Verificação complementar do servidor LAN

- A aprovação de ingresso no servidor LAN usa transação `BEGIN IMMEDIATE`, conta jogadores com papel `jogador` e recusa a aprovação quando já existem 10. Isso protege o teto de jogadores no protótipo SQLite.
- A criação de rascunho é vinculada por chave estrangeira composta a `participantes_mesa`; remoção do vínculo apaga rascunhos por cascata. Testes cobrem isolamento entre conta de jogador, terceiro e Mestre, além de remoção do vínculo.
- A autenticação local usa hash de senha via scrypt, token aleatório de 32 bytes, armazenamento apenas do hash do token, limitação de tentativas por IP em memória e expiração da sessão em sete dias. Logout remove a sessão no servidor.
- O servidor declara expressamente que usa HTTP sem proteção de transporte e deve receber apenas dados fictícios em rede privada confiável. Portanto, não é adequado para dados reais de campanha/credenciais até existir transporte seguro e revisão de implantação.
- Não encontrei rota de remoção de participante/Mesa ou ativação de personagem no protótipo LAN nesta revisão; não presumir que a autorização administrativa esteja completa só porque aprovação de ingresso funciona.

## 6. Estado

- **IMPLEMENTADO:** contratos TypeScript e componentes isolados; proposta SQL local; testes integrados locais.
- **TESTADO:** CI da branch em `c3983fa` concluiu com sucesso nos fluxos de verificação da ficha offline e compilação.
- **CONFIRMADO ESTATICAMENTE:** o servidor LAN persiste somente rascunhos; a UI de ativação ainda não está integrada.
- **PENDENTE/BLOQUEADOR:** separar revisão estrutural de revisão de ciclo sem quebrar recibos e idempotência.
- **IMPLEMENTADO, CI PENDENTE:** teste de rollback forçado durante materialização.
- **PENDENTE:** concorrência, cascatas, RLS real e teste com duas contas.
- **NÃO REALIZADO:** execução SQL remota, migration aplicada, alteração no Supabase legado, merge, publicação ou ativação em produção.

## 7. Revalidação do cache diante de falhas de autorização

Na revisão do fluxo em `src/App.tsx`, foi identificado que qualquer erro retornado pela consulta de Mesas podia recorrer ao cache offline, inclusive respostas que indicam recusa de autenticação/autorização. Isso confundia indisponibilidade transitória com acesso negado.

- **IMPLEMENTADO:** `src/erroAutorizacaoCache.ts` classifica HTTP 401/403 e SQLSTATE 42501 como falhas que exigem bloqueio do cache.
- **IMPLEMENTADO:** tanto o erro retornado pela consulta quanto uma exceção com esses metadados bloqueiam o cache, limpam a lista exibida e persistem o marcador local quando possível.
- **IMPLEMENTADO:** erros transitórios não classificados continuam elegíveis ao fallback offline previamente autorizado.
- **PENDENTE:** CI da correção e teste em navegador real, inclusive com sessão expirada/revogação real.

A classificação é deliberadamente conservadora para códigos de autenticação/permissão conhecidos; não afirma que todo erro HTTP 4xx seja revogação.

## 8. Auditoria das revisões da ficha no ciclo de vida

### Comportamento observado na proposta SQL

- `public.personagens.revisao_criacao` é incrementada pelo trigger `app_private.versionar_criacao` sempre que qualquer coluna da linha muda, exceto a própria revisão (linhas 123–134 da proposta).
- A ativação compara essa revisão com a revisão enviada pelo cliente e, ao concluir, altera `estado_ficha` e `metodo_criacao`, produzindo uma nova revisão que é devolvida no recibo (função `ativar_ficha_local`).
- O ciclo de arquivamento/assunção usa a mesma revisão como controle otimista. Arquivar move itens comuns ao Baú e muda estado/proprietário; assumir muda estado e proprietário. Ambos incrementam a mesma revisão.
- A consulta/recuperação do recibo exige que a revisão do recibo seja maior que a revisão solicitada. Portanto, simplesmente impedir que alterações de estado/proprietário incrementem `revisao_criacao` quebraria a validação atual do recibo e a expectativa dos testes.
- O Inventário já possui `revisao_inventario` própria, incrementada por trigger sobre as instâncias (linhas 440–450), mas a ficha não tem revisão própria de ciclo de vida.

### Risco e conclusão

A revisão denominada `revisao_criacao` está funcionando na prática como revisão geral da linha da ficha, não apenas como revisão das escolhas de criação. Ela também serve de versão de concorrência para o ciclo de arquivamento/assunção. Isso não é necessariamente incorreto para o controle otimista atual, mas mistura três conceitos: alterações estruturais da ficha, transições de ciclo de vida e a versão usada para confirmar/recuperar uma operação.

**Não alterar o trigger isoladamente.** Uma revisão estrutural separada exigiria revisar em conjunto: pedido e recibo de ativação, consulta de resultado, idempotência, revisão usada no arquivamento/assunção, recuperação após resposta perdida, validação do cliente e cenários de edição concorrente.

### Contrato recomendado para a próxima etapa (ainda não implementado)

1. Manter uma versão monotônica geral da ficha para concorrência e transições, sem reaproveitar seu nome como se fosse apenas criação.
2. Introduzir revisão estrutural da criação apenas se houver necessidade concreta de comparar escolhas iniciais independentemente do ciclo de vida.
3. Manter `revisao_inventario` independente, pois instâncias podem mudar sem alterar a estrutura inicial da ficha.
4. Fazer o recibo identificar a versão/ciclo resultante da ativação, em vez de depender implicitamente de uma regra genérica de que qualquer revisão posterior é maior que a revisão de entrada.
5. Antes de migration, definir como versões antigas e fichas legadas recebem os valores iniciais e como o cliente distingue revisão de ficha, revisão de criação e revisão de inventário.

**Estado:** auditoria estática concluída; desenho de contrato pendente; nenhuma migration aplicada ou alterada.

## 9. Auditoria de saída, exclusão e notas pessoais

### Saída/remoção do participante

- A proposta integrada instala um gatilho BEFORE DELETE em public.mesa_participantes; quando o vínculo removido tem papel jogador, apaga somente personagens rascunho daquele usuário e daquela Mesa.
- Fichas completas/arquivadas não são apagadas por esse gatilho. A proteção de exclusão individual impede apagar uma ficha não rascunho enquanto a Mesa ainda existe.
- A RPC de saída confirma identidade, papel de jogador e Mesa, bloqueia a linha da Mesa e a participação antes de remover o vínculo. A limpeza dos rascunhos ocorre pelo gatilho dentro da mesma transação.
- IMPLEMENTADO NO TESTE: dois testes integrados foram acrescentados em tests/ativacao-integrada-local.test.mjs: saída preservando ficha completa/recursos/instâncias e exclusão da Mesa verificando cascatas. Commit d2ba370; CI aprovado nos dois fluxos (testes da ficha offline e build).
- IMPLEMENTADO NO TESTE: commit a0f73dd acrescenta falha deliberada durante a limpeza e exige rollback integral da transação de saída (rascunho e participação preservados); CI pendente na última consulta.
- PENDENTE: verificação de notas pessoais após saída/readmissão.

### Exclusão da Mesa

- A proposta configura cascata para contexto de criação e recibos; personagens também dependem da Mesa nas migrations anteriores. Instâncias de Inventário têm mesa_id com cascata e relações com materialização/personagem.
- A proteção de exclusão individual permite a cascata legítima quando a Mesa já não existe. O teste recém-adicionado verifica o comportamento real do conjunto de gatilhos e FKs, em vez de assumir que a cascata funciona.
- O teste não deve ser interpretado como autorização para excluir dados reais: ele usa exclusivamente o banco PGlite e fixtures fictícias.

### Notas pessoais: diferença entre regra e implementação

- O componente src/AnotacoesPessoais.tsx persiste notas em window.localStorage; a chave é particionada por conta, Mesa e personagem em src/notasPessoais.ts.
- A nota não é enviada ao servidor e o componente aparece apenas quando a ficha pertence ao usuário. Portanto, não há atualmente sincronização entre dispositivos, recuperação no servidor ou exclusão remota.
- Ao sair/remover a participação, a chave local permanece no navegador. Isso combina com “preservar, mas tornar inacessível” enquanto a pessoa não tem acesso à ficha; uma readmissão com a mesma conta e os mesmos IDs pode tornar a nota local visível novamente naquele dispositivo.
- Ao excluir a Mesa/personagem no servidor, a chave local não é removida automaticamente. A UI deixa de ter uma ficha autorizada para exibir a nota, mas o texto continua fisicamente no armazenamento local até limpeza dos dados do navegador ou remoção explícita pela própria pessoa.
- PENDENTE DE DECISÃO/IMPLEMENTAÇÃO: definir se a exclusão da Mesa deve também disparar uma limpeza local na próxima conexão, e como isso funcionaria em dispositivos que estejam offline. Não implementar apagamento local indiscriminado: a chave é por conta/Mesa/personagem e deve ser removida somente após confirmação confiável da exclusão daquela Mesa. Também não prometer preservação entre dispositivos, pois o armazenamento atual é local.
- Não há no modelo atual uma tabela de notas pessoais no servidor. Não criar uma sem decisão expressa, pois isso muda privacidade, sincronização e tratamento de conflitos.

Estado: auditoria estática concluída; testes de saída/cascata aprovados em d2ba370; teste de rollback adicionado em a0f73dd e aguardando CI; comportamento de notas locais identificado; nenhuma migration, exclusão remota, sincronização ou publicação realizada.
## 10. Revalidação dos testes de saída e preservação de fichas

- **CI aprovado em `43e964d`:** o workflow “Verificação da ficha offline” concluiu com sucesso após corrigir a importação da fixture `B` no teste de remoção administrativa. A falha anterior em `04b2831` era `ReferenceError: B is not defined`, isto é, defeito no próprio teste, não evidência de falha da função SQL.
- O cenário integrado verifica Mestre removendo somente o jogador escolhido, exclusão dos rascunhos daquele jogador, preservação de rascunhos de outro jogador e preservação de ficha completa, recursos e instâncias do Inventário. Também verifica que a tentativa de exclusão direta por jogador não remove vínculo alheio e que a função de saída voluntária não está executável pelo papel `authenticated` no contrato atual.
- **PENDENTE DE CI em `572013d`:** foi acrescentado cenário para arquivar uma ficha e depois remover seu antigo jogador, verificando que a ficha arquivada, seus recursos e instâncias permanecem. Os workflows de teste e build estavam em execução na última consulta.
- **PENDENTE DE IMPLEMENTAÇÃO:** a saída voluntária continua bloqueada no contrato SQL atual: `app_private.sair_mesa_local` usa `SECURITY INVOKER` e tem execução revogada para `public`, `anon` e `authenticated`. A política RLS de DELETE em `mesa_participantes` autoriza somente o Mestre. Não conceder execução nem mudar para `SECURITY DEFINER` sem teste dedicado de identidade, papel, Mesa, revogação e atomicidade.
- Nenhuma alteração foi aplicada ao Supabase remoto, nenhuma migration foi criada/aplicada e não houve publicação.
## 11. Limite de participantes e concorrência na aprovação

- **PENDENTE DE PROTEÇÃO NO BANCO:** a migration `20261022000300_convites_e_solicitacoes.sql` e sua substituição em `20261022000400_participantes_e_realtime.sql` implementam `responder_solicitacao_mesa` com bloqueio da linha da solicitação (`FOR UPDATE`), mas não bloqueiam a linha da Mesa nem verificam o teto de participantes no ato de aprovação.
- A estrutura inicial (`20261022000100_estrutura_inicial.sql`) não define, no trecho da tabela `mesa_participantes`, constraint ou trigger que imponha esse teto. Portanto, não há evidência no esquema inspecionado de proteção transacional para duas aprovações simultâneas perto do limite.
- O teto funcional de 10 jogadores por Mesa continua sendo requisito do produto. A aprovação atual deve ser tratada como lacuna de concorrência até existir validação sob lock da Mesa e teste de duas aprovações concorrentes no banco alvo.
- **Não corrigido nesta etapa:** falta definir se o teto conta apenas jogadores ou também o Mestre; o requisito de produto indica 10 jogadores, além do Mestre. A validação futura deve refletir essa distinção sem contar solicitações pendentes como participantes.
- Nenhuma migration ou alteração foi aplicada a banco remoto.
## 12. Caminho alternativo de inclusão direta de participantes

- A revisão de `src/Participantes.tsx` e `src/Convites.tsx` confirma que a interface atual remove participantes diretamente por DELETE (protegido pela RLS) e aprova entradas via RPC `responder_solicitacao_mesa`; não foi encontrado INSERT direto na interface.
- Contudo, a migration `20261022000200_politicas_rls.sql` concede `INSERT` em `public.mesa_participantes` a `authenticated` e mantém a policy `participantes_adicionar`, que permite ao Mestre inserir jogador diretamente. Esse caminho de API pode contornar qualquer limite implementado apenas dentro da RPC de aprovação.
- **Implicação:** a correção de limite não pode se restringir a `responder_solicitacao_mesa`. É necessário decidir e testar um único caminho autorizado de inclusão (idealmente RPC transacional) e revogar o INSERT direto/retirar a policy permissiva em migration posterior, preservando o trigger que registra o Mestre e a inclusão feita pela RPC SECURITY DEFINER.
- Não há INSERT direto no componente atual, mas a permissão SQL existe e é um caminho alternativo real. Nenhuma permissão foi alterada nesta etapa.
## 13. Proposta de limite transacional de participantes

- Criada `supabase/proposals/limite-participantes-concorrencia.sql` (commit `8f08bea`). A substituicao da RPC mantem autenticacao, autorizacao do Mestre, bloqueio da solicitacao, verificacao de estado pendente e atualizacao atomica.
- Para aprovacao, a funcao bloqueia a linha da Mesa com `FOR NO KEY UPDATE`, conta somente linhas `papel='jogador'` e rejeita quando ja existem 10 jogadores. O Mestre nao ocupa vaga. A mesma linha da Mesa serializa aprovacoes concorrentes para aquela Mesa.
- A proposta remove a policy `participantes_adicionar`, revoga INSERT de `authenticated` em `mesa_participantes` e preserva SELECT/DELETE. O trigger `registrar_mestre` e SECURITY DEFINER e permanece responsavel pela inclusao automatica do Mestre.
- Criado `tests/limite-participantes.test.mjs` (commit `fa2c2b2`) com cenarios de Mesa cheia, solicitacao mantida pendente, INSERT direto negado e aprovacao normal com vaga disponivel.
- **Pendente:** CI da nova proposta/testes; teste de concorrencia real com duas conexoes PostgreSQL independentes; validar o comportamento de grants/triggers no projeto de teste Supabase antes de propor migration oficial. PGlite sequencial nao prova sozinho a ausencia de corrida.
- Nenhuma migration oficial, permissao remota ou banco Supabase foi alterado.
