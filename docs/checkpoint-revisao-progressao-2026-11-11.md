# Checkpoint — revisão de conformidade da Progressão após decisão de produto

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Commit de documentação:** `945900ed86c97fc4e6c1083ec2f7dccdcc5ad3b1`  
**HEAD de código inspecionado:** `77cfc696f61b603fb20cef41c06cddd1976f7c0a`

## Objetivo do ciclo

Evitar retrabalho após a decisão expressa de que a escolha entre Marco Narrativo e Missões é pessoal do grupo e não precisa ser configurada ou registrada no WebApp.

## Evidências verificadas

- `src/ProgressaoFichaLocal.tsx` ainda exige que o jogador selecione um método ao inicializar a Progressão de personagem de Nível 1.
- A UI atual condiciona o registro do requisito de avanço a um único método armazenado: contador de Missões ou Marco Narrativo.
- A UI exibe o método persistido e calcula elegibilidade com base em `estado.metodo`.
- `src/progressaoPersistente.ts` exige o campo `metodo` no contrato versionado v1, usa Marco Narrativo como padrão técnico e rejeita estado sem o campo.
- `src/FichaLocal.tsx` já integra a confirmação do pedido de Progressão ao Descanso Completo na Sala de Descanso.
- Portanto, retirar somente o seletor da UI não seria suficiente: domínio, validação, elegibilidade, registro, persistência e compatibilidade histórica também dependem do método.

## Decisão e tratamento

- **DECIDIDO:** não criar configuração do método por Mesa nem obrigar o grupo a escolher/registrar método dentro do WebApp.
- **PENDENTE TÉCNICO:** desenhar uma representação neutra de Progressão que respeite a decisão do grupo.
- Não apagar o campo legado `metodo`, contratos, históricos ou registros existentes sem estratégia de compatibilidade e migração.
- Não presumir um método padrão obrigatório nem converter uma decisão pessoal do grupo em configuração administrativa do produto.
- A Progressão fica sem novas alterações até que a solução neutra possa ser especificada com segurança.
- Outras frentes da Ficha que não dependam dessa decisão podem continuar.

## Documentação corrigida

- `docs/matriz-estado-e-pendencias-2026-11-09.md`:
  - Hierarquia corrigida: Planejamento v2.5 é a versão aprovada; v2.6 permanece rascunho.
  - Pendências antigas de configuração do método por Mesa foram substituídas pela reavaliação de interface/contrato sem método obrigatório.
  - Registrada a auditoria desta divergência na seção 28.

## CI e testes

- GitHub Actions run `43061691733` — `Verificação da ficha offline` — estava `queued` para o HEAD inspecionado.
- Nenhum resultado de aprovação foi presumido.
- Testes locais não executados neste ambiente.
- Nenhuma alteração de código neste ciclo; apenas documentação e checkpoint.

## Fora do escopo

- Sem alteração em `main`, merge, deploy ou publicação.
- Sem alterações no banco de produção ou Supabase.
- Sem teste humano solicitado.
- Inventário ativo continua bloqueado até a conclusão e validação integrada da Ficha.

## Próximo passo

Continuar auditoria/implementação das lacunas da Ficha que não dependam da decisão de arquitetura da Progressão. Reabrir a Progressão somente com proposta compatível com a decisão do grupo e com preservação dos dados históricos.
