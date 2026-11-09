# Checkpoint — Progressão Offline, interface inicial e registro de avanço
**Data:** 09/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD de código:** `1f42aed224d4f9b578e52a59bcf4ce00379f2e69`

## Escopo
Primeira integração visível do estado de Progressão na Ficha. Este ciclo não aplica ganho de Nível nem benefícios; prepara o registro seguro de avanço e elimina a apresentação fixa de Nível 1 na identidade/revisão.

## Implementado
- Novo `src/ProgressaoFichaLocal.tsx`:
  - Inicialização explícita da Progressão somente para personagem no Nível 1 sem histórico.
  - Método inicial padrão Marco Narrativo, com Missões como alternativa.
  - Edição do contador de Missões por ações explícitas do Jogador.
  - Registro de Marco Narrativo após comunicação do Narrador.
  - Validação do estado e da correspondência entre `progressao.nivelAtual` e `dados.nivel`.
  - Personagem acima do Nível 1 sem histórico fica bloqueada para Progressão; nenhum benefício retroativo é inventado.
  - Exibe elegibilidade e informa quando o requisito foi cumprido, sem conceder Nível.
- `src/FichaLocal.tsx`:
  - Integra o painel de Progressão.
  - Usa o Nível persistido no cabeçalho e na revisão, em vez de fixar Nível 1.
  - Passa o Nível vigente ao módulo de Descanso.
- Mensagens de salvamento distinguem confirmação local e confirmação do servidor.

## Limites preservados
- A edição do contador não concede Nível.
- Marco Narrativo registrado não concede Nível.
- Ainda não há seleção/aplicação de benefícios por Nível.
- Ainda não há solicitação persistida de avanço nem aplicação atômica vinculada ao Descanso Completo.
- O estado de Progressão pertence à Ficha; nenhuma configuração foi criada na Mesa.
- Personagens acima do Nível 1 sem histórico permanecem bloqueadas até recuperação/conferência explícita.
- Não foi implementada migração automática de fichas antigas.

## Arquivos
- `src/ProgressaoFichaLocal.tsx` — criado neste ciclo.
- `src/FichaLocal.tsx` — integração do painel e Nível dinâmico.

## Testes e CI
- Testes de domínio existentes em `tests/progressao-persistente.test.mjs` e `tests/progressao-habilidades.test.mjs` foram inspecionados, não executados nesta sessão.
- Nenhum teste automatizado novo foi adicionado neste ciclo.
- Para o commit de código `1f42aed224d4f9b578e52a59bcf4ce00379f2e69`, GitHub não retornou status checks nem workflow runs. **CI não comprovada; resultado PENDENTE.**
- Build/TypeScript não executados localmente.

## Próximo passo
1. Completar o contrato de solicitação de avanço e escolha dos benefícios por Nível.
2. Implementar transição pura e validada para aplicar Habilidade, Atributo e Perícia com histórico exato.
3. Integrar a transição e a restauração de recursos em um único patch de Descanso Completo, após confirmação do armazenamento.
4. Testar atomicidade, falha de salvamento, repetição e backup/importação.
5. Depois, integrar consequência de Morte e reversão exata.

## Fora do escopo deste ciclo
- Nenhum teste humano solicitado.
- Nenhum merge para `main`.
- Nenhum deploy.
- Nenhuma alteração de produção ou Supabase.
