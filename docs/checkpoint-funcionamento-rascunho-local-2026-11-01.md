# Checkpoint — preferências de funcionamento no rascunho — 01/11/2026

**Branch:** `fix/lab-criacao-feedback-2026-10-31`  
**HEAD:** `89557eeb820599836495faf44037f3b2dd5d371d`  
**Estado:** alterações registradas; sem build ou testes nesta rodada. Nenhum merge, publicação, alteração em `main` ou operação Supabase.

## Implementado

- Preferências Automático/Misto/Manual foram integradas à revisão da criação local.
- As opções do modo Misto são editáveis, preservadas ao alternar os modos e reaproveitam o módulo `funcionamentoFicha.ts`.
- Ao aplicar as preferências no componente, elas passam ao estado do formulário; o rascunho só as persiste quando o usuário salva o personagem.
- Ao reabrir um rascunho para edição, as preferências e a revisão local são recuperadas. Rascunhos antigos sem esse campo recebem a configuração inicial.
- Ao cancelar edição ou iniciar uma nova criação após cancelar, as preferências temporárias voltam ao padrão inicial.
- Mensagens dos componentes de compras e funcionamento foram corrigidas para não sugerir que o plano já foi gravado no armazenamento quando ainda está apenas no formulário.
- Texto do formulário atualizado para refletir que compras e preferências já participam da criação do rascunho.

## Limites

- As preferências ainda não controlam operações de jogo: não há consumo de munição, uso de item, duração de efeitos ou atualização automática de BI/durabilidade nesta ficha local.
- Preferência de dados físicos/virtuais/mistos é separada e ainda não foi adicionada a este formulário.
- As compras continuam limitadas ao catálogo parcial existente e não validam disponibilidade de Mesa em servidor; o laboratório é localStorage isolado.
- Aplicar preferências/compras dentro dos componentes altera o formulário em memória. É necessário salvar o personagem para persistir o rascunho.
- Nenhuma personagem é ativada por esta etapa.

## Próxima etapa

Unificar a experiência de consulta e edição: abrir a ficha contínua diretamente a partir do rascunho e permitir editar suas seções mantendo um único fluxo, sem duplicar regras nem criar uma segunda fonte de dados. Antes de ativação, ainda serão necessários catálogo completo, validação de regras, inventário operacional e integração com servidor local.

## Validação pendente

Build TypeScript/Vite, testes automatizados e testes manuais em desktop/celular: criar rascunho, aplicar compras e preferências, salvar, recarregar, reabrir edição, cancelar e conferir que escolhas persistidas e temporárias não se confundem.
