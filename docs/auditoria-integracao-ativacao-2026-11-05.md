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

Os testes integrados existentes são valiosos, mas os testes lidos não demonstram:
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

## 5. Estado

- **IMPLEMENTADO:** contratos TypeScript e componentes isolados; proposta SQL local; testes integrados locais.
- **TESTADO:** CI da branch em `c3983fa` concluiu com sucesso nos fluxos de verificação da ficha offline e compilação.
- **CONFIRMADO ESTATICAMENTE:** o servidor LAN persiste somente rascunhos; a UI de ativação ainda não está integrada.
- **PENDENTE/BLOQUEADOR:** separar revisão estrutural de revisão de ciclo sem quebrar recibos e idempotência.
- **PENDENTE:** concorrência, rollback forçado, cascatas, RLS real e teste com duas contas.
- **NÃO REALIZADO:** execução SQL remota, migration aplicada, alteração no Supabase legado, merge, publicação ou ativação em produção.
