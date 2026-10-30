# Auditoria — segurança e revisões da ativação integrada

**Data:** 29/10/2026  
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`  
**Escopo:** leitura estática das migrations e da proposta `supabase/proposals/ativacao-integrada-local.sql`. Não houve execução SQL, build ou testes.

## Resultado

A proposta apresenta boas barreiras estruturais (RLS habilitada nas tabelas privadas, revogação de acesso direto, RPCs públicas com projeções fechadas, funções privilegiadas com `search_path=''`, revalidação sob locks e recibo idempotente). Isso ainda não basta para considerá-la pronta: encontrei um acoplamento de revisões confirmado no código e alguns pontos que exigem teste de banco antes de qualquer integração.

## Achado confirmado — revisão de criação é incrementada por mudanças no inventário

Em `app_private.versionar_criacao()`, a comparação considera todas as colunas da linha de `public.personagens`, exceto `revisao_criacao`:

```sql
(to_jsonb(new)-'revisao_criacao')
is distinct from
(to_jsonb(old)-'revisao_criacao')
```

Mais adiante, o trigger `app_private.versionar_inventario_local()` incrementa `public.personagens.revisao_inventario` ao inserir/alterar/remover uma instância. Esse UPDATE da personagem também aciona `versionar_criacao()`; como `revisao_inventario` não é excluída da comparação, a revisão de criação também sobe.

**Consequência:** uma alteração de inventário altera simultaneamente `revisao_inventario` e `revisao_criacao`. Isso mistura duas versões que a proposta parece querer manter separadas e pode invalidar operações/revisões de ficha por uma movimentação de item. A confirmação é estática, pela interação explícita dos dois triggers; o efeito transacional completo ainda deve ser coberto por teste.

**Correção a projetar, não aplicada:** definir precisamente quais colunas representam escolhas/identidade da criação e excluir da comparação as revisões e os estados operacionais (ao menos `revisao_inventario`; avaliar também PV/SA/BI atuais). Não alterar a função antes de revisar os contratos de revisão e os fluxos que dependem dela.

## Pontos positivos observados

- As tabelas `app_private.materializacoes_inventario`, `inventario_instancias`, `contextos_criacao_mesa`, `ativacoes_ficha` e `operacoes_ciclo_ficha` habilitam RLS e revogam acesso direto das roles comuns.
- As funções de entrada privilegiadas usam `SECURITY DEFINER` com `search_path=''` e checam `auth.uid()`/autoria/vínculo antes de projetar dados.
- `public.ativar_personagem`, `public.conferir_ativacao_personagem`, `public.consultar_resultado_ativacao` e `public.resumo_operacional_mesa` têm contratos de retorno limitados, não retornando a linha completa da ficha.
- A ativação serializa por Mesa, relê ficha e contexto sob bloqueio, valida revisões, verifica teto de jogadores/personagens e materializa inventário + estado completo + recibo na mesma transação.
- O recibo usa `personagem_id` como chave primária e `operacao_id` único, e repetição do mesmo pedido retorna a resposta gravada.
- O lock de Mesa precede os locks de participação/ficha/contexto na ativação, e a proposta de serialização de compras também adota Mesa → ficha.

## Riscos e verificações ainda necessárias

1. **Triggers durante cascatas:** `versionar_inventario_local()` atualiza `public.personagens` quando instâncias são excluídas. Verificar comportamento em cascata de exclusão de Mesa/personagem e em exclusão de rascunho; um trigger filho não deve tentar atualizar a linha-pai que está sendo removida. Não há teste executado.
2. **Revisões e ações operacionais:** revisar se alterações de PV/SA/BI atuais, nome, arquivamento e transferência de portador devem incrementar `revisao_criacao`, `revisao_inventario` ou ambas. Hoje a regra genérica de `versionar_criacao` mistura mudanças de qualquer coluna.
3. **Funções SECURITY INVOKER internas:** elas são chamadas por funções SECURITY DEFINER e, nesse contexto, executam com o usuário efetivo privilegiado da função chamadora. Validar owner real, privilégios de schema/tabela e RLS/FORCE RLS no banco de teste; não presumir que o comportamento de owner seja idêntico entre ambientes.
4. **Remoção de participante:** testar a concorrência entre ativação (Mesa → participação → ficha) e saída/remoção (Mesa → participação), incluindo trigger que apaga rascunhos.
5. **Snapshot e isolamento:** testar duas ativações concorrentes na mesma Mesa, ativações em Mesas diferentes, e transações sob o isolation level realmente usado pelo Supabase/PostgreSQL. A atualização de `sequencia_ativacao` pretende invalidar snapshots antigos; precisa de prova concorrente.
6. **Integridade de inventário:** validar no banco que quantidade/estado JSON, destino, portador, vínculo e revisão não podem ser adulterados por caminhos não previstos; a tabela privada não deve ganhar grants diretos acidentalmente.
7. **Ciclo da ficha:** arquivar/assumir e exclusões/cascatas precisam ser testados em conjunto com as revisões e os triggers de inventário.

## Migrations e escopo

A árvore atual contém migrations 001–004 e outras migrations posteriores até `20261028122021_rls_convites_mesa.sql`. A proposta integrada continua em `supabase/proposals/`, não é migration aplicada. A migration de compras iniciais tem comentário de proposta local e exige conferência do histórico aplicado antes de qualquer reconciliação; o arquivo no repositório, sozinho, não prova o estado remoto.

## Próxima etapa

- Revisar contratos de revisão em `docs/contrato-ativacao-ficha.md`, `docs/contrato-integracao-ativacao.md`, `docs/inventario-persistencia-local.md` e `docs/ciclo-e-interface-local.md`.
- Projetar ajuste mínimo do trigger de revisão, sem alterar o SQL ainda.
- Preparar testes SQL locais para triggers, cascatas, concorrência e repetição idempotente.
- Não aplicar SQL remoto, não criar migration ativa, não mesclar nem publicar.
