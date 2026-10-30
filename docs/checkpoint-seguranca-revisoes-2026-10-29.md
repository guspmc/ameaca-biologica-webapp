# Checkpoint — auditoria de segurança e revisões da ativação

**Data:** 29/10/2026  
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`  
**Commit:** `80d8d9b334db77f5d3e6890966d49198fb7f994c`

## Ler antes de continuar
- `docs/checkpoint-inventario-kendo-2026-10-29.md`
- `docs/auditoria-moedas-kendo-2026-10-29.md`
- `docs/auditoria-seguranca-revisoes-ativacao-2026-10-29.md`
- `docs/checkpoint-continuidade-criacao-ativacao-2026-10-29.md`
- `docs/checkpoint-concorrencia-compras-kendo-2026-10-29.md`

## Estado atual

A revisão estática de `supabase/proposals/ativacao-integrada-local.sql`, `supabase/proposals/inventario-instancias.sql` e migrations 001–004/005 e posteriores encontrou um acoplamento de revisão:

- `versionar_criacao()` compara todas as colunas de `public.personagens`, exceto `revisao_criacao`.
- `versionar_inventario_local()` atualiza `revisao_inventario` na linha de personagem quando uma instância muda.
- Esse UPDATE também aciona `versionar_criacao()`, portanto mudanças no inventário incrementam também `revisao_criacao`.

É um achado confirmado pela composição dos triggers. O impacto exato nos fluxos deve ser demonstrado com testes SQL. Não corrigido ainda.

Outros pontos de teste: cascatas de exclusão e trigger filho atualizando pai; isolamento/snapshot e concorrência; owner/RLS efetivos das funções internas invocadas por SECURITY DEFINER; concorrência com remoção de participante; ciclo arquivar/assumir; integridade do JSON e privilégios do inventário.

## O que está implementado vs. pendente

- **Implementado no branch:** propostas locais de inventário/ativação/ciclo e documentos de auditoria.
- **Não integrado:** inventário por instâncias e ativação completa no app conectado.
- **Não testado:** execução SQL, triggers, cascatas, concorrência, build e fluxo ponta a ponta.
- **Não realizado:** aplicação ao Supabase remoto, migration ativa, merge, PR ou deploy.

## Próximo passo recomendado

Ler os contratos de revisão e ciclo da ficha; definir quais campos incrementam `revisao_criacao` e quais incrementam `revisao_inventario`; propor correção mínima dos triggers. Depois preparar um roteiro único de testes SQL locais, para executar em sessão conjunta quando imprescindível.

Não aplicar SQL remoto, não mesclar nem publicar. Não implementar compra Kendo até inventário ativo e autorizado no servidor.
