# Checkpoint de continuidade — inventário, Moedas Antigas e Kendo

**Data:** 29/10/2026
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`
**Repositório:** `guspmc/ameaca-biologica-webapp`
**Commit-base:** `687f999c2092e94b108f3d947fa440bf8f927d92`

Leia junto:
- `docs/checkpoint-continuidade-criacao-ativacao-2026-10-29.md`
- `docs/auditoria-disponibilidade-compras-ativacao-2026-10-29.md`
- `docs/checkpoint-concorrencia-compras-kendo-2026-10-29.md`
- `docs/auditoria-moedas-kendo-2026-10-29.md`

## Decisões que não devem ser reabertas

- Compras personalizadas pertencem ao Painel do Mestre, não à ficha do Jogador.
- Planos de compra já salvos são preservados quando o Mestre bloqueia um item. Disponibilidade controla novos salvamentos.
- O protótipo congelado do Painel Mestre não deve ser alterado.
- Nenhuma migration/proposta SQL pode ser aplicada ao Supabase remoto sem autorização específica.
- Não mesclar, criar PR ou publicar sem autorização específica.
- Testes de terminal ficam guardados até serem imprescindíveis e devem ser reunidos em um roteiro único com o usuário.

## Trabalho mais recente

### Concorrência de disponibilidade e compras

- Identificado que `definir_disponibilidade_inicial` bloqueia a Mesa, enquanto `salvar_compras_rascunho` antes bloqueava primeiro a ficha e lia disponibilidade depois.
- Criada proposta local `supabase/proposals/serializar-compras-disponibilidade-local.sql`, commit anterior `a89f2c292a6d4e3a8eee99d2786da9205ce2abfd`.
- A proposta usa Mesa → ficha, revalida autoria/participação/estado e preserva compras salvas.
- É proposta, não migration, não aplicada e não testada. Exige testes concorrentes antes de integração.

### Inventário e Kendo

- `src/inventarioCriacao.ts` prepara um plano local de itens e estados; não grava nem ativa inventário.
- `supabase/proposals/inventario-instancias.sql` é protótipo local, sem API pública e sem ativação autorizada.
- O protótipo materializa Kendo como item característico com `placas:0` e Moedas Antigas em blocos de até 3.
- `src/inventarioConsulta.ts` valida snapshots e estados, inclusive moeda e placas; `src/organizacaoInventario.ts` prepara movimentação local com revisão, mas depende de autorização real no servidor.
- Não foi encontrada operação ativa de gasto de moedas ou compra de placas Kendo.
- Regra do livro: Operador começa com Kendo sem placas; cada placa adicional custa 1 Moeda Antiga, máximo 3.
- Decisão técnica: não criar RPC de compra de placas até integrar inventário por instâncias com autorização server-side, revisão, idempotência e recibo.

## Estado

- Implementado no branch: protótipos e contratos descritos acima.
- Pendente: integração do inventário, ativação, operações reais de inventário e compra Kendo.
- Não testado: migrations/propostas SQL, testes automatizados, build, concorrência, ativação ponta a ponta.
- Nenhuma alteração de dados de produção, migration remota, merge ou publicação.

## Próximo trabalho recomendado

1. Revisar `supabase/proposals/ativacao-integrada-local.sql` e `supabase/proposals/inventario-instancias.sql` em conjunto: ordem de locks, grants, RLS, SECURITY DEFINER/INVOKER, constraints e recibos.
2. Comparar o inventário materializado com `src/inventarioConsulta.ts` e com os contratos de serviço; identificar diferenças de formato e revisão.
3. Verificar como a proposta de ativação trata remoção de participante, mudança de Mesa, concorrência e falha após commit antes da resposta.
4. Só depois propor plano incremental de integração; não despejar o protótipo inteiro em migration.
5. Guardar testes locais e de banco para sessão conjunta.

## Retomada sugerida

“Continue o projeto Ameaça Biológica RPG na branch `fix/lan-websocket-reconnect-2026-10-29`. Leia os checkpoints e auditorias listados acima. O foco atual é revisar segurança, idempotência e integração da proposta de inventário por instâncias com a ativação. Compras salvas são preservadas após bloqueio do Mestre; Kendo começa com zero placas e cada placa custa 1 Moeda Antiga até 3, mas não implementar compra até existir inventário ativo autorizado no servidor. Não executar SQL remoto, não mesclar nem publicar. Não pedir testes de terminal ainda.”