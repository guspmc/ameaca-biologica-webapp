# Checkpoint — Roladores básicos da Ficha, 09/11/2026

## Estado técnico
- Repositório: `guspmc/ameaca-biologica-webapp`
- Branch: `feat/offline-first-ficha`
- HEAD observado: `69b4839cae01f9a1fc7730f34bd45a53b3cc03de`
- Ciclo focado em roladores integrados iniciais, sem tocar na `main`.
- Nenhum merge, deploy ou alteração de produção.
- Nenhum teste humano solicitado ou executado.

## Objetivo e alterações

### Implementado
- `src/rolagemDados.ts`: motor virtual baseado em `crypto.getRandomValues`, com rejeição de valores acima do limite uniforme para evitar viés de módulo, validação da quantidade/tipo de dado e validador de resultados físicos.
- `src/RoladoresBasicosLocal.tsx`: rolador pontual de Iniciativa (`1d20 + AGI`) e Rolador Livre (quantidade e tipo de dado).
- Preferência Física: o jogador registra os resultados que obteve nos dados físicos.
- Preferência Virtual: o aplicativo gera os resultados.
- Preferência Mista: o jogador escolhe o método em cada rolagem.
- O componente sincroniza o método selecionado quando a preferência de dados muda.
- `src/FichaLocal.tsx`: os roladores básicos e a calculadora existente de Testes só aparecem no modo Automático. Misto e Manual não reservam espaço para eles; os valores e modificadores calculados continuam na Ficha.
- A rolagem de Iniciativa é individual e não administra ordem de turnos ou Encontros.
- Os resultados não alteram dados da personagem e não são persistidos em histórico.
- Em Ficha Offline, mesmo com visibilidade configurada como Pública, os resultados permanecem no dispositivo e não são transmitidos.

### Testes adicionados/atualizados
- `tests/roladores-ficha.test.mjs`: fonte aleatória injetável, resultados, rejeição de faixa para distribuição sem viés, validação de entrada física, quantidade e tipo de dado; verifica que o componente não grava resultados na ficha.
- `tests/iniciativa-ficha.test.mjs`: atualizado para a decisão aprovada de Iniciativa pontual na Ficha, exclusiva do modo Automático, sem gerenciamento de Encontros.
- A cobertura anterior de `tests/ataques-calculadora.test.mjs` foi preservada.

## Regras e decisões preservadas
- Planejamento v2.6, §§ 7.2–7.5: modo da Ficha, preferência de dados e visibilidade são independentes; roladores só no Automático; comando explícito; resultados não resolvem consequências nem alteram estado da personagem.
- Arquivo do Jogador v1.0, p. 76: Iniciativa = `1d20 + AGI`.
- Arquivo do Jogador v1.0, p. 81: um 1 natural em um Teste causa falha automática e Falha Crítica, aplicando Exposto salvo regra específica. Essa fonte confirma o gatilho geral; a integração automática de Exposto ainda não foi implementada.
- A decisão histórica do ciclo 2, que mantinha apenas o modificador de Iniciativa na Ficha, foi superada pela aprovação posterior dos roladores em modo Automático. A ordem do Encontro continua pertencendo ao Painel do Mestre.
- Não foram presumidos modificadores de arma, dano, acerto, reação ou efeitos.

## Estado por categoria
- **IMPLEMENTADO:** motor de dados, entrada física/virtual/mista, Iniciativa pontual e Rolador Livre.
- **TESTADO AUTOMATICAMENTE:** testes criados/atualizados; execução da CI vinculada ao HEAD atual ainda pendente.
- **VALIDADO HUMANAMENTE:** nada neste ciclo.
- **PENDENTE:** Ataque, Dano, Testes de Perícia e Atributo com rolagem integrada; integração dos modificadores/efeitos oficiais; persistência e enforcement de visibilidade no contexto LAN; integração automática da Condição Exposto; reteste humano somente na bateria integrada ao final da Ficha.

## CI vinculada ao HEAD
- Build [42662020524](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42662020524): em execução no momento do checkpoint.
- Verificação Offline [42662020701](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42662020701): em execução no momento do checkpoint.
- As execuções anteriores disparadas em commits intermediários não substituem a validação do HEAD atual.

## Próxima etapa
Completar os roladores de Perícia e Atributo com os modificadores e regras oficiais, sem adicionar estado de jogo. Em paralelo, auditar os contratos necessários para Ataque e Dano; não implementar seleção de arma fictícia enquanto o Inventário ativo não estiver liberado. A privacidade LAN deve ser tratada no armazenamento e nas leituras, não apenas na interface.

## Instrução obrigatória para a próxima sessão
Ler primeiro este checkpoint e `docs/matriz-estado-e-pendencias-2026-11-09.md`; confirmar branch e HEAD atual; conferir CI associada ao SHA; inspecionar contratos e dependências antes de alterar arquivos. Não repetir auditorias concluídas, não reabrir decisões aprovadas sem evidência e não iniciar novo ciclo até o Gus validar este checkpoint.

## Limites
Inventário ativo e Baú permanecem adiados até a conclusão do Painel do Mestre. Não alterar `main`, não publicar e não tocar em produção sem autorização expressa.
