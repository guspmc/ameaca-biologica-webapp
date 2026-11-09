# Protocolo de Eficiência e Continuidade do Desenvolvimento

Versão 1.0 — 09/11/2026

## Objetivo

Reduzir retrabalho, preservar o tempo do usuário e garantir continuidade entre conversas no desenvolvimento do Ameaça Biológica RPG WebApp. Este protocolo complementa as diretrizes gerais do projeto e deve ser consultado junto ao checkpoint técnico mais recente.

## Princípios de execução

1. **Priorizar por impacto e dependência.** Resolver primeiro bloqueios que destravam várias funcionalidades. Evitar polimento prematuro de módulos que dependem de contratos ainda incompletos.
2. **Agrupar trabalho coerente.** Preferir ciclos com objetivo claro e alterações relacionadas, sem fragmentar tarefas em etapas artificiais ou repetir validações sem mudança relevante.
3. **Auditar com rastreabilidade.** Registrar fonte oficial, páginas/trechos, arquivos examinados, testes e conclusão. Não reabrir auditoria encerrada sem nova evidência, mudança de código ou conflito identificado.
4. **Automatizar o repetível.** Usar testes automatizados, validações, verificações de regressão e compatibilidade sempre que possível. Reservar testes humanos para fluxos que dependam de dispositivo, percepção ou decisão humana.
5. **Documentar para retomar, não por burocracia.** Manter checkpoints frequentes, concisos e completos o bastante para outra conversa continuar sem redescobrir decisões ou repetir trabalho.
6. **Separar estados de evidência.** Identificar cada item como PLANEJADO, IMPLEMENTADO, TESTADO AUTOMATICAMENTE, VALIDADO HUMANAMENTE ou PENDENTE. Não declarar conclusão sem evidência correspondente.
7. **Não refazer trabalho concluído.** Consultar checkpoints, código, testes e auditorias existentes antes de iniciar. Retomar do próximo passo real e atualizar somente o que mudou.
8. **Evitar perfeccionismo improdutivo.** Considerar concluído o que estiver fiel ao cânone, integrado ao escopo necessário e coberto por testes adequados. Registrar lacunas não definidas; não inventar regras para preenchê-las.
9. **Proteger o tempo do usuário.** Executar autonomamente tarefas técnicas seguras e reversíveis. Solicitar decisões apenas diante de ambiguidade real de cânone/produto ou risco relevante.
10. **Não antecipar testes humanos.** A bateria humana integrada da Ficha deve ocorrer somente quando a implementação estiver completa, imediatamente antes da ativação do Inventário ativo de Personagem. Não convocar o usuário para ciclos intermediários repetitivos.

## Conteúdo mínimo de cada checkpoint

- Data e objetivo do ciclo.
- Repositório, branch e HEAD confirmado.
- Commits e arquivos alterados.
- Decisões de cânone/produto relevantes e fontes consultadas.
- O que foi implementado e o que não foi.
- Testes executados, IDs dos workflows e resultados observados.
- Auditorias concluídas e referências que evitem repetição.
- Pendências, riscos, limitações e regressões conhecidas.
- Próxima ação técnica exata, incluindo arquivos/contratos a inspecionar.
- Declaração explícita de que não houve merge, deploy ou alteração em produção, quando aplicável.

## Protocolo obrigatório de retomada entre conversas

1. Ler o checkpoint mais recente e este protocolo antes de propor trabalho.
2. Confirmar a branch ativa e seu HEAD remoto; não presumir que o estado descrito em conversa antiga continua atual.
3. Conferir CI/workflows mais recentes associados ao HEAD e registrar sucesso, falha ou execução pendente.
4. Comparar o estado real do repositório com o checkpoint. Se houver divergência, reconciliar antes de editar.
5. Identificar o último item efetivamente concluído e iniciar pelo próximo passo pendente, sem repetir etapas comprovadas.
6. Antes de cada escrita no GitHub, confirmar novamente o HEAD e obter SHA atual de todos os arquivos existentes que serão alterados. Abortar se houver divergência.
7. Atualizar o checkpoint ao final do ciclo e antes de uma possível troca de conversa.

## Prioridade funcional mantida

- Fechar a Ficha completa e integrada antes do Inventário ativo.
- Concluir progressão, habilidades, Combate, recursos, Descanso e Morte conforme o cânone.
- Auditar catálogos/procedimentos contra os arquivos oficiais sem duplicar auditorias já encerradas.
- Executar suíte automatizada e auditorias completas.
- Fazer uma única bateria humana integrada final, corrigir regressões e validar novamente.
- Somente então iniciar a ativação do Inventário ativo de Personagem.

## Restrições

Este protocolo não autoriza merge para `main`, deploy, alterações em produção, mudanças de stack ou alteração silenciosa do cânone. Permanecem válidas todas as regras de segurança, persistência, autorização e controle de concorrência do projeto.

## Execução paralela por frentes independentes

A execução deve avançar simultaneamente em todas as frentes que não dependam do mesmo contrato ou arquivo:

1. Manter frentes explícitas (por exemplo: Progressão, Criação da Ficha, Habilidades, Combate, Descanso, Catálogos e Qualidade).
2. Não bloquear uma frente por outra quando a tarefa puder ser implementada, auditada ou testada isoladamente.
3. Identificar dependências reais antes de editar. Quando duas frentes precisarem alterar o mesmo arquivo ou contrato, coordenar a alteração em um lote integrado, sem sobrescritas concorrentes.
4. Consolidar alterações em commits coerentes por frente ou por integração; evitar commits artificiais e testes repetidos sem mudança relevante.
5. Executar CI no HEAD integrado mais recente e registrar separadamente resultados de cada commit ainda em execução.
6. Atualizar o checkpoint com o estado de todas as frentes, incluindo o que avançou em paralelo, dependências, bloqueios e próxima ação de cada frente.

A paralelização não autoriza mudanças de cânone, merge, deploy ou alteração de produção. A ordem final de integração continua subordinada às dependências reais e às validações de segurança.
