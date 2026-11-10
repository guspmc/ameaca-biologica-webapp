# Checkpoint — Separação da rolagem de Ataque (10/11/2026)

## Estado técnico
- Repositório: `guspmc/ameaca-biologica-webapp`
- Branch: `feat/offline-first-ficha`
- HEAD observado após os commits do ciclo: `e93393a689f201cf4395d57aaf433a09967c92e6` (confirmar novamente antes de novo ciclo).
- Nenhum merge para `main`, deploy ou alteração de produção.
- Nenhum teste humano executado.

## Decisão funcional aplicada
A Ficha apresenta a rolagem e o total do Ataque; não compara com a Defesa do alvo, não declara acerto/erro e não resolve a sequência de combate. A mesa faz essa interpretação. A decisão já estava registrada em `checkpoint-auditoria-ataque-dano-2026-11-09.md` e `checkpoint-combate-catalogos-2026-11-09.md`.

## Alterações implementadas
- `src/testes.ts`: novo `calcularRolagemAtaqueManual()`, independente de DT, que valida d20, Normal/Vantagem/Desvantagem e retorna dado escolhido, total e classificação apenas do resultado natural (20 natural, 1 natural ou rolagem comum). Para rolagem comum, informa que o total deve ser comparado com a Defesa na mesa.
- `src/CalculadoraTesteLocal.tsx`: quando `escopo === 'ataques'`, utiliza o avaliador separado; remove o campo de Defesa e o controle de “Impossível — sem Teste” do fluxo de Ataque; preserva a entrada de DT apenas para Testes comuns.
- 20 natural permanece Acerto Crítico automático. Para perfis com margem 19–20, a UI orienta a mesa a conferir se 19 natural alcança a Defesa antes de aplicar o Crítico. Não há comparação automática porque a Ficha não recebe a Defesa.
- O resultado genérico de Falha Crítica em `calcularTesteManual()` não afirma mais que Exposto é aplicado. O callback automático de Exposto continua no fluxo de Ataque e sujeito à validação do modo Automático na Ficha.
- `tests/roladores-ficha.test.mjs`: importa e testa o novo avaliador; verifica total sem DT, resultados naturais e ausência de Exposto na descrição genérica.
- `tests/ataques-calculadora.test.mjs`: atualizado para verificar fórmula de Ataque sem Defesa, ausência do campo e separação de cálculo.

## Limites e pendências
- O perfil selecionado continua sendo consulta; não confirma posse, equipamento, munição, proficiência ou Peças instaladas.
- A margem 19–20 depende de confirmar na mesa que o total alcança a Defesa; a Ficha não faz essa comparação.
- Modificadores que dependam de arma realmente equipada, Peças instaladas ou munição carregada não podem ser presumidos.
- O cálculo de Dano ainda não está completo para os 49 perfis e ataques universais; fórmulas especiais e propriedades individuais continuam pendentes.
- A Ficha não controla Reações, turnos, Dano em alvos, RD, BI ou PV.

## CI e validação
- Workflows disparados nos commits do ciclo estão em fila na última consulta; o último par observado foi para o commit `e93393a`: Offline run `42832084114` e build run `42832084015`, ambos `queued`.
- **CI PENDENTE:** não declarar build nem suíte aprovadas até os workflows do HEAD final concluírem com sucesso.
- **TESTES AUTOMATIZADOS:** testes escritos/atualizados; execução local não realizada nesta sessão.
- **VALIDADO HUMANAMENTE:** pendente, reservado à bateria integrada final.

## Próximo ciclo
1. Verificar branch, HEAD e workflows CI.
2. Inspecionar os testes atualizados e corrigir eventuais expectativas legadas.
3. Prosseguir para um módulo puro de Dano e sua matriz de fórmulas, sem presumir estado do Inventário.
4. Auditar 49 armas, Ataque Desarmado, Arma Improvisada, Coronhada, Peças e Habilidades; registrar exceções individualmente.

Não alterar `main`, não fazer merge, não publicar e não tocar em produção sem autorização expressa.
