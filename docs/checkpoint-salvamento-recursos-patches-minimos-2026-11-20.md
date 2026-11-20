# Checkpoint — salvamento atômico de recursos e patches mínimos — 20/11/2026

## Identificação
- Projeto: Ameaça Biológica RPG — Ficha Offline PWA.
- Repositório: `guspmc/ameaca-biologica-webapp`.
- Branch: `feat/offline-first-ficha`.
- HEAD remoto após este checkpoint: será informado pelo commit de documentação.
- Fase: 1 — Ficha Offline; bateria humana/Missão 06 em andamento (Fase 2).
- Escopo restrito: persistência de PV, SA e BI; sem avanço de fase.

## Objetivo
Corrigir o conflito indevido entre alterações independentes de recursos e fazer cada operação aplicada ser salva imediatamente, sem considerar a operação concluída antes da confirmação do armazenamento.

## Arquivos alterados
- `src/recursosFicha.ts`: `RecursosPatch` passou a ser `Partial<RecursosAtuais>`, permitindo patches que contenham somente as chaves efetivamente alteradas.
- `src/RecursosFichaLocal.tsx`:
  - operações de recursos constroem patch mínimo comparando estado anterior e posterior;
  - PV direto fica em rascunho de campo e só é enviado ao salvar pelo botão **Aplicar**;
  - cura, dano, PV Temporários e BI são operações aplicadas e enviam patch imediatamente;
  - dano envia PV Atuais e PV Temporários juntos quando ambos mudam;
  - BI da Origem Desgarrado inclui PV Temporários no mesmo patch quando a regra altera ambos;
  - falha/conflito mantém a alteração pendente, informa que não houve confirmação e oferece nova tentativa;
  - o desfazer também é persistido como patch mínimo.
- `src/FichaOfflineApp.tsx`: o salvamento de SA rápido deriva a revisão-base do saldo atual salvo quando o chamador não fornece explicitamente `economiaAcoesSaldoBase`, preservando as verificações de sincronização com Economia de Ações e estado do turno.
- `tests/recursos-ficha.test.mjs`: verificações estruturais atualizadas para o contrato de patches mínimos, aplicação explícita de PV, retentativa e base de SA.

## Comportamento acordado
- PV: digitar não salva; botão **Aplicar** confirma o valor e inicia a gravação.
- SA: cada botão +1/-1 aplica e salva imediatamente pelo controle rápido do topo da Ficha.
- BI: cada botão +1/-1 aplica e salva imediatamente.
- Operação só é confirmada após retorno positivo do salvamento. Falha não é apresentada como sucesso.
- Alterações em chaves distintas podem ser mescladas; alterações concorrentes na mesma chave continuam bloqueadas pela persistência.

## Testes e build
- Teste de recursos atualizado, mas **não executado nesta sessão**.
- Build/TypeScript **não executado nesta sessão**.
- CI do GitHub: nenhuma execução/status de workflow foi encontrada para os commits deste ciclo.
- Testes humanos da nova implementação: **PENDENTES**.
- Não classificar o ajuste como TESTADO AUTOMATICAMENTE ou VALIDADO HUMANAMENTE.

## Estado
- Código: **IMPLEMENTADO** no branch remoto.
- Teste automatizado: **PENDENTE DE EXECUÇÃO**.
- Build: **PENDENTE DE EXECUÇÃO**.
- Validação humana: **PENDENTE**.
- Missão 06 continua em andamento; Fase 2 não concluída; Inventário ativo/Fase 3 permanece bloqueado.

## Riscos e limites
- O conector GitHub não executa a aplicação no ambiente local de Gus e não revela alterações não publicadas na cópia local.
- A interface remota foi ajustada com base no contrato funcional confirmado por Gus; a cópia local precisa receber os commits desta branch antes dos testes.
- A persistência segura continua dependendo de patches realmente mínimos; não ampliar o patch com valores antigos de outras chaves.
- Nenhuma alteração foi feita em `main`, nenhuma branch foi criada/trocada, nenhum merge, publicação ou deploy foi realizado.

## Próxima ação exata
1. Gus atualizar a cópia de teste com a branch `feat/offline-first-ficha`.
2. Executar `pnpm test` e `pnpm build`; informar resultados antes de qualquer avanço.
3. Repetir a Missão 06, seção 3, item 5: Aba A altera SA e Aba B altera PV (ou vice-versa); ambas devem conseguir salvar alterações independentes e o estado final deve preservar as duas.
4. Revalidar conflito na mesma chave e recuperação após recarga.
5. Testar PV pelo botão Aplicar, SA +1/-1, BI +1/-1, BI Desgarrado com PV Temporários, dano que consome PV Temporários/PV Atuais e falha de salvamento.
6. Continuar a bateria humana somente após registrar cada resultado de Gus. Não avançar para Fase 3.
