# Checkpoint — edição contextual do Inventário inicial (2026-11-01)

## Estado
Implementação registrada na branch `fix/lab-criacao-feedback-2026-10-31`. Não houve merge, publicação, alteração em `main` ou operação no Supabase.

## Implementado
- Novo componente `src/EditorInventarioLocal.tsx`, integrado à seção Inventário da ficha contínua local.
- Permite alterar o conjunto inicial A/B/C conforme as opções da Classe.
- Para o conjunto C, reaproveita `PreviaCompras` e o catálogo parcial existente.
- A prévia precisa ser aplicada antes de salvar o conjunto C.
- O salvamento grava no mesmo rascunho e preserva seu ID.
- Validação no laboratório confirma compatibilidade do kit com a Classe e, para C, orçamento, capacidade e revisão aplicada.
- Ao salvar A/B, o plano de compras C é explicitamente descartado; a interface avisa isso antes do salvamento.
- A ficha continua exibindo a projeção de itens gerada por `planejarInventarioCriacao`.

## Limites importantes
- Isto é edição do **planejamento do inventário inicial do rascunho**, não um inventário ativo.
- Não permite equipar, usar, consumir, recarregar, transferir, organizar ou alterar estado de exemplares.
- Os componentes locais de consulta/organização do inventário permanecem separados e não foram ligados a esta ficha.
- O catálogo de compras continua parcial e não foi ampliado.

## Verificação
- Arquivos consultados: `inventarioCriacao.ts`, `equipamento.ts`, `comprasIniciais.ts`, `PreviaCompras.tsx`, `inventarioConsulta.ts`, `consultaInventarioLocal.ts`, `PainelInventarioLocal.tsx` e `organizacaoInventario.ts`.
- Build, TypeScript e testes automatizados: pendentes; não há runner local nesta sessão.
- Teste manual desktop/mobile: pendente.

## Próximo passo
Revisar os três editores contextuais juntos (Características, Atributos/Perícias e Inventário), corrigir inconsistências estáticas e então avançar para integração do fluxo de rascunho com persistência no servidor local, conforme o plano local-first.
