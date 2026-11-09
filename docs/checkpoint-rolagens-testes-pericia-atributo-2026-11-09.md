# Checkpoint — Rolagens de Testes de Perícia e Atributo, 09/11/2026

## Estado técnico
- Repositório: `guspmc/ameaca-biologica-webapp`
- Branch: `feat/offline-first-ficha`
- HEAD de código do ciclo: `4e1d67de002b04ee12707b44f71ae5e21f644a9b`
- Matriz atualizada no commit: `a1adf38871790e87106009ff610775bb882958c5`
- Ciclo realizado exclusivamente na branch de trabalho.
- Nenhum merge para `main`, deploy ou alteração de produção.
- Nenhum teste humano executado; a bateria integrada continua adiada até a Ficha estar completa.

## Objetivo
Completar a rolagem integrada de Testes de Perícia e Testes puros de Atributo no modo Automático, reutilizando o motor de dados e os cálculos já existentes, sem introduzir estado de jogo.

## Alterações

### Implementado
- `src/CalculadoraTesteLocal.tsx` agora usa `sortearDados` e `validarResultadosFisicos`.
- Preferência Física: informa os resultados obtidos e confirma expressamente.
- Preferência Virtual: gera os dados somente após clicar em “Rolar Teste”.
- Preferência Mista: escolhe Física ou Virtual em cada Teste.
- Teste Normal usa 1d20; Vantagem/Desvantagem usa 2d20 e seleciona o melhor/pior resultado.
- Teste de Perícia mantém `valorBasePericia`, que já inclui o Atributo associado e o Treinamento; continuam aplicados os modificadores existentes de Origem, Tentativa e Erro e circunstanciais.
- Teste puro de Atributo usa diretamente o Atributo selecionado.
- O resultado só é calculado após confirmação/rolagem explícita. Alterar o método, tipo de Teste ou dados físicos limpa a confirmação anterior.
- A renderização permanece condicionada ao modo Automático em `src/FichaLocal.tsx`; Misto e Manual continuam sem roladores e sem espaço reservado.
- A calculadora não persiste resultados, não altera PV/SA/BI, Inventário ou outros dados da personagem, e não executa consequências.

### Testes adicionados/atualizados
- `tests/roladores-ficha.test.mjs`: cobre 20 natural, 1 natural, Vantagem/Desvantagem e o acionamento explícito da calculadora física/virtual/mista.
- `tests/ataques-calculadora.test.mjs`: atualiza a expectativa para refletir a rolagem virtual sob comando explícito, preservando a ausência de aplicação automática de Dano.
- Os testes unitários existentes do motor de dados e do cálculo de Testes foram preservados.

## Regras e limites preservados
- Arquivo do Jogador v1.0, p. 42: fórmula do valor de Perícia, valor já inclui o Atributo associado e o Treinamento.
- Arquivo do Jogador v1.0, p. 42: Vantagem/Desvantagem usa 2d20 e seleciona o melhor/pior.
- Arquivo do Jogador v1.0, p. 81: tratamento de resultados naturais é mantido pelo avaliador existente.
- Planejamento v2.6, §§ 7.2–7.6: roladores apenas no modo Automático, ação explícita, configurações independentes, sem resolução de consequências ou alteração de estado da personagem.
- Ataques continuam sem integração completa de arma equipada, modificadores de arma/Peças, munição e Dano. Nenhum bônus foi presumido.
- O resultado de Falha Crítica é apresentado, mas a Ficha não altera automaticamente a lista de Condições. Há uma divergência a deliberar: o Arquivo do Jogador p. 81 descreve Exposto como consequência da Falha Crítica; o §7.6 da v2.6 mantém pendente a ativação automática da Condição. Não implementar a mutação até resolver o alcance dessa decisão.

## Estado por categoria
- **IMPLEMENTADO:** rolagens integradas de Perícia e Atributo com dados físicos, virtuais e mistos.
- **TESTES AUTOMATIZADOS:** testes escritos/atualizados; execução da CI deste código ainda precisa ser confirmada.
- **VALIDADO HUMANAMENTE:** não realizado.
- **PENDENTE:** CI vinculada ao SHA de código; integração completa de Ataque e Dano; deliberação sobre a automação de Exposto; auditoria integral da Ficha.

## CI
- SHA de código a validar: `4e1d67de002b04ee12707b44f71ae5e21f644a9b`.
- Estado observado nesta atualização: **PENDENTE DE CONFIRMAÇÃO**. Não declarar build ou suíte Offline como aprovados sem evidência associada a esse SHA.
- A CI de commits intermediários não substitui a validação do SHA acima.

## Próxima etapa
Auditar e integrar Ataque e Dano sem antecipar Inventário ativo: mapear os dados de arma, regras de ataque, resultados naturais, dano e modificadores que já existem; implementar apenas o que tiver contrato e regra confirmados. A seleção/equipamento de armas e consumo de munição permanecem dependentes do módulo de Inventário na ordem aprovada.

## Instrução para a próxima sessão
Ler este checkpoint e `docs/matriz-estado-e-pendencias-2026-11-09.md`; confirmar branch e HEAD atual; verificar a CI do SHA de código; inspecionar contratos e dependências antes de editar. Não repetir auditorias concluídas nem reabrir decisões aprovadas sem evidência. Apresentar o checkpoint ao Gus e aguardar validação antes de iniciar o próximo ciclo.

## Limites
Inventário ativo e Baú permanecem adiados até a conclusão do Painel do Mestre. Não alterar `main`, não publicar e não tocar em produção sem autorização expressa.
