# Checkpoint — edição contextual de Características (2026-11-01)

## Estado
Implementação registrada na branch `fix/lab-criacao-feedback-2026-10-31`. Não houve merge, publicação, alteração em `main` ou operação no Supabase.

## Implementado
- Novo componente `src/EditorCaracteristicasLocal.tsx` dentro da seção Características da ficha local.
- Edição de Classe, Origem, arma obrigatória da Origem Operário, Habilidade Básica e conjunto inicial.
- As opções de Habilidade e Equipamento acompanham a Classe selecionada.
- Alterações são gravadas no mesmo registro local e preservam seu ID.
- O salvamento valida as dependências existentes: treinamento/distribuição de Perícias, Habilidade compatível com a Classe, conjunto de equipamento válido, arma do Operário e compras do conjunto C.
- Se uma mudança tornar outra escolha incompatível, o salvamento é recusado; não há descarte automático de dados.
- Editor remonta com os valores persistidos após salvar.

## Limitações conhecidas
- Mudanças de Classe/Origem que exijam também alterar Perícias ou compras podem ser recusadas. Nesse caso, permanece disponível o formulário completo de edição do laboratório para ajustar o conjunto de escolhas.
- Não foi feita migração do formato dos dados.
- O componente ainda não foi validado visualmente em desktop/celular nem por execução real.

## Verificação
- Arquivos consultados: `src/EditorCaracteristicasLocal.tsx`, `src/FichaLocal.tsx`, `src/LaboratorioLocal.tsx`, `src/origens.ts`, `src/classesFicha.ts`, `src/habilidades.ts`, `src/armaOperario.ts`, `src/equipamento.ts`, `src/periciasCriacao.ts`.
- Build, TypeScript e testes automatizados: pendentes; não há runner local nesta sessão.
- Teste manual do usuário: pendente.

## Próximo passo
Revisar e implementar edição contextual do Inventário, mantendo a distinção entre prévia do conjunto inicial e inventário efetivamente ativo.
