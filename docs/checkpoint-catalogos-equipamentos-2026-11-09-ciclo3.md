# Checkpoint — Catálogos e procedimentos de armamento, 09/11/2026 (ciclo 3)

## Estado técnico
- Repositório: `guspmc/ameaca-biologica-webapp`
- Branch: `feat/offline-first-ficha`
- HEAD observado antes deste checkpoint: `d87218734a0e4171d2f08c6056fcd83c56986a08`
- Não houve merge para `main`, deploy ou alteração de produção.
- CI dos commits anteriores da correção de progressão: ambos aprovados no SHA `741dff955296fa222263e07ee4deccd2c1ee2abd` (build/TypeScript/Vite e verificação da ficha offline).
- CI dos novos procedimentos de armamento/equipamentos: pendente de conclusão no momento deste checkpoint. Não declarar aprovação até verificar os workflows associados ao HEAD mais recente.

## Implementado neste ciclo

### Procedimentos de armas
Arquivos:
- `src/catalogoProcedimentosArmas.ts`
- `tests/catalogo-procedimentos-armas.test.mjs`

A fonte consolida procedimentos de combate e fora de combate para todas as armas atualmente listadas em `catalogoArmas.ts` e `catalogoArmasFogo.ts`, sem duplicar nem substituir os perfis de catálogo. Reúne regras de Disparo Cadenciado, Rajada, Coice, bombeamento/ferrolho, Perfuração, Decepamento e Carnificina, além de regras especiais identificadas para Motosserra, Spark Shot, Lança-Chamas, Besta, GM 79 e RPG-7.

O procedimento fora de combate explicita que o Arquivo do Jogador não fixa custo ou duração para sacar, guardar, inspecionar ou manter a arma. Nenhuma ação, rolagem ou consumo é executado pelo catálogo.

### Procedimentos de peças, munições e proteções
Arquivos:
- `src/catalogoProcedimentosEquipamentos.ts`
- `tests/catalogo-procedimentos-equipamentos.test.mjs`

A fonte reúne:
- regras de instalação, remoção e troca de Peças Extras (30 minutos, bancada, sem Teste, Kit de Ferramentas quando permitido, exclusividade e compatibilidade);
- regras de munição como reserva abstrata, incluindo retorno da munição restante à reserva durante recarga, salvo regra específica;
- efeitos próprios de munições especiais, conforme perfis do catálogo;
- Defesa, RD, contribuição de AGI e interação da RD com fontes infectantes para cada colete.

Foi removida uma formulação que poderia sugerir proibição de instalar peças em combate. O texto agora registra somente que o livro não define custo de ação para isso.

## Correção anterior de progressão
A revisão anterior corrigiu a validação do snapshot histórico de Missões após Morte, permitindo edição do contador atual sem invalidar o histórico. O teste cobre redução do contador e preservação do snapshot. A disponibilidade de progressão continua exigindo superar o marco histórico da última Morte.

Arquivos alterados naquela etapa:
- `src/progressaoPersistente.ts`
- `src/progressaoHabilidades.ts`
- `tests/progressao-persistente.test.mjs`
- `tests/progressao-habilidades.test.mjs`

A progressão persistente ainda não está integrada à ficha, backup, IndexedDB, Descanso Completo, servidor LAN ou fluxo real de Morte.

## Limites e pendências
- Catálogos e procedimentos são referências; não representam posse, equipamento, munição carregada, rolagem, consumo, fabricação ou alterações automáticas da ficha.
- A consolidação de receitas e itens de exploração continua separada e requer auditoria integral de conteúdo.
- A auditoria das descrições individuais das armas ainda precisa ser comparada linha a linha com o Arquivo do Jogador.
- A implementação dos procedimentos não fecha os sistemas de Combate, dano, condições, habilidades ou persistência.
- Não houve teste humano neste ciclo.
- Inventário de Personagem permanece fora do escopo até a conclusão da implementação e dos testes humanos integrados.

## Próximos passos
1. Confirmar CI dos novos arquivos e corrigir falhas reais sem enfraquecer testes.
2. Auditar todas as descrições de armas e exceções contra as páginas 48–61.
3. Auditar integralmente munições, peças e proteções contra as páginas 62–67.
4. Auditar receitas e regras gerais de fabricação contra as páginas 71–73.
5. Integrar a progressão persistente à validação local, backup, IndexedDB, Descanso Completo e servidor LAN, com migração estrita.
6. Prosseguir com os módulos faltantes da ficha e combate.
7. Só então executar a bateria de testes humanos integrada; Inventário ativo continua bloqueado até essa validação.

## Regra de continuidade
Este documento registra implementação parcial, não aprovação funcional global. Distinguir sempre PLANEJADO, IMPLEMENTADO, TESTADO AUTOMATICAMENTE, TESTADO POR PESSOA e PENDENTE.
