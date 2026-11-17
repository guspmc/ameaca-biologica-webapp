# Checkpoint — auditoria incremental de rolagens e estados da Ficha — 17/11/2026

## Identificação
- Projeto: Ameaça Biológica RPG — Ficha Offline PWA.
- Repositório: `guspmc/ameaca-biologica-webapp`.
- Branch: `feat/offline-first-ficha`.
- HEAD documental após este ciclo: `93f6c82921c965f88468069765c712e8ea1feaa6`.
- HEAD de código consultado: `d182b291d3db9f3f912e0f6ae9200fbc72c3fc5d`.
- Nenhum arquivo de produção ou teste foi alterado neste ciclo.

## Objetivo
Atender à orientação de Gus de executar auditorias e, em paralelo, implementar/corrigir imediatamente qualquer defeito comprovado, mantendo a prioridade na Ficha Offline jogável para dezembro de 2026.

## Auditoria realizada
Foram inspecionados os módulos e testes de:
- Testes de Perícia/Atributo e rolagens de Ataque: `src/testes.ts`, `src/CalculadoraTesteLocal.tsx`, `tests/roladores-ficha.test.mjs`.
- Geração/validação de dados: `src/rolagemDados.ts`, `src/RoladoresBasicosLocal.tsx`.
- PV, PV Temporários, SA e BI: `src/recursosFicha.ts`, `src/RecursosFichaLocal.tsx`, `tests/recursos-ficha.test.mjs`.
- Condições e efeitos contextuais: `src/condicoesFicha.ts`, `src/condicoesCalculadora.ts`, `src/CondicoesFichaLocal.tsx`, `tests/condicoes-ficha.test.mjs`.
- Descanso: `src/descansoFicha.ts`, `src/DescansoFichaLocal.tsx`, `tests/descanso-ficha.test.mjs`.
- Reanimação: `src/reanimacaoFicha.ts`, `src/ReanimacaoFichaLocal.tsx`, `tests/reanimacao-ficha.test.mjs`.

## Resultado e decisões
- Os contratos centrais examinados estão coerentes com o Arquivo do Jogador v1.0: resultados naturais, Vantagem/Desvantagem, validação de dados, absorção por PV Temporários, limites de PV/SA, BI até/acima do máximo, Descanso Parcial por Nível/Classe, Descanso Completo e desfechos separados de Reanimação.
- A Ficha preserva os limites de não decidir acerto, não aplicar efeitos ficcionais automaticamente, não executar Dano/Condições por turno, não medir duração narrativa e não decidir Morte/Transformação pela Mesa.
- Não foi encontrado defeito reproduzível ou divergência canônica nos trechos examinados. Portanto, nenhuma alteração de produção/teste foi feita neste ciclo; não criar mudanças artificiais é preferível a introduzir regressão.
- A auditoria de integração completa de Condições e combate permanece aberta. Requisitos contextuais como percepção da fonte de Amedrontado não podem ser inferidos automaticamente.

## Arquivos alterados
- `docs/matriz-auditoria-funcional-ficha.md`: adicionada seção de auditoria incremental.
- `docs/linha-de-trabalho-e-continuidade-2026-11-12.md`: registrada a auditoria e a próxima ação.
- Este checkpoint.

## Testes e CI
- Nenhum teste ou build executado neste incremento; somente inspeção estática de código e testes existentes.
- Última CI aprovada permanece vinculada ao código `a98bdc324df32d5e23708a2c8c88f4b471fde92e`: build/TypeScript e 154 arquivos de teste aprovados nos runs `44133790936` e `44133791005`.
- Os commits `d182b29`, `fe6be6b` e `93f6c82` são documentais; não alegar que a CI foi executada para o HEAD atual.
- Validação humana da Ficha Offline: PENDENTE.

## Fases
- Fase 0 — Preparação Offline: EM ANDAMENTO; falta evidência real de inicialização, IndexedDB, Service Worker e modo offline em navegador.
- Fase 1 — Ficha Offline: EM ANDAMENTO; auditoria funcional segue aberta, com foco agora nas integrações de combate/economia de ações.
- Fase 2 — Testes humanos: PENDENTE; roteiro `docs/roteiro-humano-ficha-offline-local.md` ainda aguarda execução/relato de Gus.
- Fases 3–9: NÃO INICIADAS.

## Riscos e pendências
- Inspeção estática e testes estruturais não substituem execução real em navegador.
- Não reimplementar módulos já aprovados sem evidência de falha.
- Não antecipar Inventário ativo, Painel, Laboratório, integração LAN ampliada, temas ou redesign.

## Próxima ação exata
Continuar auditoria detalhada das integrações de combate e economia de ações (Ataques, Mira, Duas Armas, Reações e Condições aplicáveis), comparando código com o Arquivo do Jogador v1.0. Ao detectar divergência comprovada, corrigir a menor unidade necessária, adicionar teste e executar CI. Em paralelo, preparar a passagem para a validação real da Fase 0. Atualizar matriz, continuidade e checkpoint após cada ciclo relevante.
