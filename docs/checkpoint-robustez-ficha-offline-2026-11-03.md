# Checkpoint — salvamento serializado e robustez do backup offline

Data: 03/11/2026

Branch: `feat/offline-first-ficha`

## Alterações registradas

- `6d87cd86b54eb0d5368287eb3db6295562b37c22`: salvamentos da ficha passam por uma fila serializada. Cada patch parte do último personagem confirmado no IndexedDB; uma edição rápida não é descartada apenas porque outra gravação está em andamento.
- `976ae87cc46681a63965c46fc58c1e43e2395426`: importação como cópia evita colisões de nomes também entre personagens do próprio backup; a importação não abre automaticamente uma ficha; exportação anexa o link temporariamente ao documento e revoga a URL após iniciar o download.
- `366036a233c499c9287bddf0d621ab5b7a33b856`: se uma abertura IndexedDB for bloqueada e posteriormente liberada, a conexão tardia é fechada em vez de ficar sem referência no módulo.

## CI e evidências

- Commits anteriores `a9096026b6b3d8d0a9c811c8fc6c937c0a88e70d` e `6a7a155f6d3df0f9b0f856b1ef82afb67741385f`: workflow completo passou, incluindo `pnpm test`, build Vite/TypeScript e verificação de tipos isolados.
- Para os três commits deste checkpoint, execuções 41750368378, 41750385649 e 41750397472 foram iniciadas. Na última consulta, instalação de dependências havia passado e a etapa `pnpm test` estava em andamento; build e checagem de tipos aguardavam. Não declarar aprovação até conclusão.
- Ainda não existe teste de IndexedDB em navegador real nesta etapa. A CI atual não substitui os testes manuais de navegador.

## Riscos e pendências

- Validar fila de salvamento com edições consecutivas reais, inclusive alterações em seções diferentes.
- Executar testes de IndexedDB real: criar, listar, editar, excluir, recarregar, importar e restaurar.
- Conferir exportação e importação em navegador e em dispositivo móvel.
- Comparar regras da ficha com o Arquivo do Jogador v1.0 antes de considerar a ficha funcional.
- Rever fluxo de fechamento/troca de personagem enquanto houver gravações enfileiradas.
- Não publicar, congelar ou integrar à `main` sem aprovação expressa.

## Estimativa de testes manuais do usuário

Quando a ficha estiver pronta para homologação, reservar aproximadamente 30–45 minutos para a rodada principal:
- 10–15 min: criar personagem, editar seções, fechar e reabrir para confirmar persistência.
- 10–15 min: exportar backup, importar como cópia, restaurar por substituição e verificar duplicatas.
- 5–10 min: recarregar e testar abertura offline após o primeiro carregamento.
- 5 min: conferir comportamento visual básico em celular/desktop e relatar problemas.

Uma rodada curta de regressão após correções deve levar cerca de 10–15 minutos. Essas estimativas são para execução pelo usuário; testes automatizados e inspeções técnicas serão feitos antes para reduzir o tempo manual.

## Situação

Implementação em desenvolvimento. CI dos commits mais recentes pendente no momento da gravação deste checkpoint. Nenhuma publicação ou congelamento realizado.
