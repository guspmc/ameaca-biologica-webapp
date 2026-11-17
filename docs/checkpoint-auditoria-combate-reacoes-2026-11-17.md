# Checkpoint — auditoria de combate, economia de ações e reações — 17/11/2026

## Identificação
- Frente: Ficha Offline PWA — Fases 0 e 1.
- Repositório: `guspmc/ameaca-biologica-webapp`.
- Branch: `feat/offline-first-ficha`.
- HEAD documental após este ciclo: `7a934326bef44d2942f10cc260c7f06e89395ca0`.
- Código de produção auditado: `a98bdc324df32d5e23708a2c8c88f4b471fde92e`.

## Objetivo
Continuar auditorias e corrigir, no mesmo ciclo, falhas comprovadas, sem antecipar fases nem inventar alterações de código.

## Auditoria executada
Inspecionados módulos e testes relacionados a:
- Economia de ações, janela de 3 SA, transições de turno e persistência dos marcadores.
- Mirar, Disparada/Fuga, Ataque, Combate com Duas Armas e Ataque adicional.
- Cálculos de Ataque, Crítico, Dano e penalidades contextuais de Condições.
- Janela defensiva, Aparar, Esquiva, Contra-Ataque, Contra-Ataque Instintivo, Retaliação, Ataque de Oportunidade, Não Vai Escapar, Na Minha Mira e resposta do Mercenário.

## Resultado
- Os contratos examinados de economia de ações, ataques, Mirar, Duas Armas e reações estão coerentes com o cânone no recorte inspecionado.
- Não foi comprovado defeito reproduzível adicional que justificasse alteração de produção/teste neste ciclo.
- **Lacuna confirmada:** Aparar é universal para Personagens no Arquivo do Jogador v1.0, pp. 80–81. A interface atualmente só permite operacionalizar Aparar com a Habilidade Socador de Pedras; para os demais, reconhece o gatilho, mas bloqueia o registro por falta de estado confiável de arma empunhada, elegibilidade e Durabilidade.
- A lacuna não será contornada com uma confirmação genérica que ignore Durabilidade ou com estado duplicado do Inventário. A próxima ação é verificar se já existe fonte local persistida desses dados na Fase 1. Se não existir, pedir decisão a Gus sobre alternativa mínima e canônica, sem antecipar Inventário ativo.

## Arquivos alterados
- `docs/matriz-auditoria-funcional-ficha.md`: detalhamento da auditoria e lacuna de Aparar.
- `docs/linha-de-trabalho-e-continuidade-2026-11-12.md`: continuidade atualizada.
- Este checkpoint.

## Testes e CI
- Testes existentes foram inspecionados, mas não executados neste incremento.
- Nenhum build executado neste incremento.
- Última CI aprovada permanece vinculada ao código `a98bdc3`: build/TypeScript e 154 arquivos de teste aprovados nos runs `44133790936` e `44133791005`.
- Não declarar CI para os commits documentais atuais.
- Validação humana permanece PENDENTE.

## Estado das fases
- Fase 0 — Preparação Offline: EM ANDAMENTO; faltam evidências de execução real, IndexedDB, Service Worker e modo offline em navegador.
- Fase 1 — Ficha Offline: EM ANDAMENTO; auditoria funcional continua, com lacuna de Aparar a investigar.
- Fase 2 — Testes humanos: PENDENTE; depende da execução do roteiro por Gus.
- Fases 3–9: NÃO INICIADAS.

## Próxima ação exata
Inspecionar o modelo e a persistência local de personagem para localizar eventual fonte já existente de equipamento empunhado e Durabilidade, sem iniciar Inventário ativo. Depois, continuar auditoria das Condições que restringem Ataques e efeitos de Reações. Se não houver fonte confiável para Aparar, apresentar a Gus a menor alternativa segura antes de alterar o comportamento. Em qualquer defeito comprovado, implementar correção mínima, adicionar teste, executar CI e atualizar matriz/continuidade/checkpoint.


## Decisão posterior de Gus — Aparar — 17/11/2026

A implementação operacional de Aparar universal fica vinculada ao ciclo do **Inventário ativo e das armas efetivamente equipadas pelos jogadores**. Nesse momento, o fluxo deverá validar elegibilidade da arma e Durabilidade e registrar o desgaste conforme o cânone. Até lá, manter o bloqueio seguro para personagens que dependam de arma equipada; não antecipar Inventário na Fase 1 nem criar estado duplicado. O caso de Socador de Pedras com punhos Indestrutíveis permanece distinto.

**Próxima ação:** continuar a auditoria de Condições e efeitos de Reações. Ao iniciar o Inventário ativo, incluir Aparar no escopo e na bateria de testes.


## Auditoria incremental — restrições de Condições no painel — 17/11/2026

- Referências canônicas: Arquivo do Jogador v1.0, pp. 81–83.
- Inspecionados `src/condicoesCalculadora.ts`, `src/condicoesFicha.ts`, `src/PainelAcoesLocal.tsx` e os testes `tests/condicoes-calculadora.test.mjs`, `tests/reacoes-combate.test.mjs` e `tests/reacao-defensiva-ficha.test.mjs`.
- As penalidades próprias de Ataques e Testes são calculadas em contextos aplicáveis: Caído, Cego, Imobilizado, Intoxicado, Enfraquecido, Infectado Especial, Desorientado e Reflexos sob Imobilizado, conforme o tipo de rolagem. Vantagem e Desvantagem se cancelam normalmente.
- **Ponto de decisão funcional:** Desorientado, Desacordado, Atordoado, Incapacitado e Surpreendido geram avisos no painel, mas os controles de Ações/Reações e gasto de SA continuam habilitados. Os testes existentes confirmam explicitamente que esses avisos não desabilitam nem resolvem ações.
- O cânone define proibições/restrições para essas Condições (Desorientado não pode Atacar; Desacordado e Incapacitado não realizam Ações/Reações; Atordoado não realiza Ações/Reações/Movimento; Surpreendido restringe Ações, Reações e SA conforme o primeiro turno/duração). A interface atualmente depende da conferência do jogador/Mesa.
- **Não alterado:** nenhum código ou teste foi modificado neste incremento; testes foram inspecionados, não executados; nenhum build/CI foi executado. Não classificar como defeito definitivo antes de decidir se a Ficha deve apenas alertar ou também bloquear controles incompatíveis, considerando exceções e a responsabilidade da Mesa.
- **Decisão necessária de Gus:** manter avisos informativos ou introduzir bloqueios operacionais condicionados às Condições, com tratamento explícito de duração/exceções. Não implementar bloqueio parcial improvisado.


## Estado de validação da Fase 0

Os componentes técnicos de entrada offline, IndexedDB, Service Worker e inicializador Windows foram rechecados no commit `8516f54`. A inspeção confirma a arquitetura prevista, mas não substitui execução no navegador. Permanecem pendentes a inicialização real, persistência após recarga, conflito entre abas, backup/recuperação e recarga em modo Offline conforme `docs/roteiro-humano-ficha-offline-local.md`. A Fase 0 não pode ser encerrada sem evidência desses testes humanos.
