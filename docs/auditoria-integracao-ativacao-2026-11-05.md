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
