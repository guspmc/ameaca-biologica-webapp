# Checkpoint — auditoria de Condições, Recursos, Descanso e Reanimação

**Data:** 09/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD no checkpoint:** `97942492bab00ea1eb0ac651bfe83e986a370d8e`

## Alterações deste ciclo

1. Corrigida a mensagem de 1 natural em Reanimação: sinaliza Falha Crítica no próprio Teste, sem ativar Exposto automaticamente. A regra aprovada mantém Exposto automático apenas para Falha Crítica em Ataque no modo Automático.
2. Corrigido o texto de Bio-Infecção na Ficha para refletir que, ao confirmar BI igual ou superior ao máximo, o módulo Reanimação registra automaticamente o Colapso Viral. O aplicativo não avança turnos nem decide a narrativa.
3. Descanso Completo agora valida PV, PV Temporários, SA e BI atuais antes de restaurar recursos. Estado inválido bloqueia a operação, em vez de ser sobrescrito.
4. Corrigido o rótulo de grau da segunda Perícia da Origem Amnésico: ela amplia a lista permitida, mas não concede Treinamento. A função de domínio já calculava corretamente; o defeito estava na apresentação da Ficha.

## Evidências e testes

- Commit `6022062ebdc9721b0d41755824f445b15504195d`: ambos os workflows concluídos com sucesso.
- Commit `bc49736a4534c86512adcf61eba00cc3c43aa646`: workflows `42731760948` e `42731760652` em execução na última consulta.
- HEAD `97942492bab00ea1eb0ac651bfe83e986a370d8e`: workflows `42732027064` e `42732027068` em execução na última consulta.
- CI do HEAD atual permanece **PENDENTE** até os dois workflows concluírem com sucesso.
- Testes automatizados adicionados/ajustados em `tests/reanimacao-integracao-ficha.test.mjs`, `tests/reanimacao-ficha.test.mjs`, `tests/descanso-ficha.test.mjs` e `tests/pericias.test.mjs`.
- Nenhum teste humano executado; build local não foi executado nesta sessão.

## Limites preservados

- Não transforma a Ficha em motor de combate ou de turnos.
- Não ativa Exposto por Testes de Reanimação, Medicina, Perícia ou Atributo.
- Não aplica automaticamente consequências narrativas de Morte ou transformação.
- Descanso não remove condições, infecções ou BI automaticamente.
- Sem merge, deploy, alteração de produção/Supabase ou teste humano.

## Próximas etapas

1. Concluir a auditoria de Condições, Recursos, Descanso e Reanimação com os resultados da CI atual.
2. Auditar Criação e seus valores derivados, incluindo todas as Origens, Classes, distribuições e compatibilidades.
3. Completar Combate com cálculos e catálogos integrados, sem comparar Defesa nem resolver acerto pelo aplicativo.
4. Auditoria geral da Ficha, persistência, backup/importação e testes de regressão.
5. Somente após a Ficha inteira estar pronta, solicitar a bateria humana integrada; depois iniciar Inventário Offline.
