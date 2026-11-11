# Checkpoint consolidado — Ficha Offline sem Inventário

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD verificado:** `ff1e785538d906bba220d4ab01a14bcc9453e355`

## Objetivo deste checkpoint

Consolidar o estado real para continuidade em novos chats e registrar que a Ficha do Jogador está funcionalmente completa fora do módulo Inventário. A próxima etapa funcional é Inventário ativo; os testes humanos integrados começam depois dele.

## Escopo concluído nesta sequência

### Reações e integridade de Combate
- A origem da Reação defensiva é persistida em `EstadoTurnoCombate.reacaoDefensivaRegistrada`.
- Contra-Ataque Instintivo só reutiliza a Reação quando o marcador persistido comprova que ela foi consumida na defesa.
- O marcador sobrevive a recarga e é reiniciado no próximo turno próprio; estados históricos conhecidos são migrados sem presumir defesa.
- Esquiva permanece disponível após solicitação explícita nos modos Automático, Misto e Manual; o cálculo não aplica efeitos automaticamente.
- Retaliação, Contra-Ataque e demais Reações continuam dependendo de confirmações da Mesa para os gatilhos que a Ficha não acompanha.
- Aparar permanece bloqueado até existir estado confiável de arma em mãos, elegibilidade e Durabilidade.

### Progressão Offline
- Novos registros não exigem nem armazenam método de Progressão.
- O grupo decide Marco Narrativo ou Missões fora do WebApp; a Ficha registra somente autorização explícita do grupo/Narrador.
- A subida continua exigindo solicitação, Descanso Completo na Sala de Descanso e escolhas canônicas.
- A autorização é consumida ao aplicar o Nível e removida ao registrar Morte; após Morte, exige nova autorização.
- Contratos históricos com `metodo: marco_narrativo` ou `metodo: missoes` continuam aceitos e preservados.

### Benefícios contextuais de Origem
- **Agente de Saúde:** lembrete de +1d4 aos Dados de Cura ao curar aliado; sem cura cruzada.
- **Amnésico:** estado persistente de uso 1/sessão, tentativa AST DT 10 confirmada pelo jogador, Vantagem pendente no próximo Teste relacionado de Sobrevivência quando a informação for útil; início de nova sessão é registrado manualmente e não apaga Vantagem pendente.
- **Mercenário:** gatilho manual de hostil oculto que surpreenderia, arma carregada e uso disponível; Reação normal ou adicional por 1 SA e uso 1/Descanso Completo são salvos na mesma operação. Saque e Ataque continuam manuais.
- **Militar:** registro manual de morte por arma de fogo e Vantagem pendente no primeiro Ataque com arma de fogo do próximo turno; consumo exige confirmação manual.
- Os novos estados Amnésico/Militar são validados por `validarPersonagemLocal`.
- **Chef:** continua pendente porque depende de criação/fabricação na Sala de Descanso, integrada ao Inventário.

### Escopo da Ficha
- A nota do Combate foi corrigida: ordem de Iniciativa pertence ao Painel do Mestre; a Ficha do Jogador mostra modificador e rolagem pontual quando aplicável.
- A matriz termina com a conclusão de escopo: o único módulo funcional pendente na Ficha do Jogador é Inventário ativo.
- Confirmações narrativas/contextuais permanecem manuais por princípio do produto; não são ausência de automação prometida.

## Inventário — único módulo funcional pendente

Abrange:
- organização/movimentação e capacidade;
- estado de item equipado/em mãos;
- uso, consumo e fabricação;
- munição, pente e recarga específica por arma;
- Peças Extras, compatibilidade e Durabilidade;
- Baú/transferências permanecem fora do modo Offline.

Dependências que permanecem bloqueadas até Inventário:
- Aparar e **VOCÊ APAROU UM MÍSSIL!?**, pois dependem de arma em mãos/elegibilidade/Durabilidade.
- Benefício do Chef, pois depende de criação de item em Sala de Descanso.

## Arquivos de documentação principais

- `docs/matriz-auditoria-funcional-ficha.md`
- `docs/checkpoint-origem-reacao-defensiva-2026-11-11.md`
- `docs/checkpoint-progressao-neutra-2026-11-11.md`
- `docs/checkpoint-mercenario-ficha-2026-11-11.md`
- `docs/checkpoint-beneficios-origens-contextuais-2026-11-11.md`

## Testes adicionados/atualizados nesta sequência

- `tests/estado-turno-combate.test.mjs`
- `tests/contra-ataque-ficha.test.mjs`
- `tests/reacao-defensiva-ficha.test.mjs`
- `tests/progressao-persistente.test.mjs`
- `tests/progressao-habilidades.test.mjs`
- `tests/progressao-campanha.test.mjs`
- `tests/reacoes-combate.test.mjs`
- `tests/mercenario-ficha.test.mjs`
- `tests/origem-agente-saude-ficha.test.mjs`
- `tests/beneficios-origens-contextuais.test.mjs`
- `tests/validacao-personagem-local.test.mjs`

## Validação real

- **Implementado:** código e documentação na branch indicada.
- **Testes locais:** não executados; não há clone/ambiente local do repositório nesta sessão.
- **CI no HEAD:** `43081389509` (Verificação da ficha offline) e `43081389860` (Validar compilação do WebApp) estão `queued`; nenhum resultado foi presumido.
- **Validação humana:** ainda não iniciada, conforme combinado.
- **LAN:** não alterado; considerado funcional conforme testes anteriores relatados.
- **Supabase/banco:** não alterados.
- **main/merge/deploy/publicação:** não realizados.

## Próximo ciclo

1. Aguardar/consultar os dois workflows do HEAD `ff1e7855`; corrigir somente falhas reais.
2. Se CI apontar erro, corrigir e atualizar checkpoint antes de avançar.
3. Iniciar implementação do Inventário Offline com contratos canônicos, mantendo Baú/transferências fora do offline.
4. Após Inventário concluído, realizar auditoria automatizada final e então iniciar a validação humana integrada, sem antecipar testes manuais.
