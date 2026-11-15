# Checkpoint — Rolagem virtual de Dano na Ficha

**Data:** 15/11/2026  
**Frente:** Ficha Offline PWA  
**Fase:** 1 — Ficha Offline (em andamento)  
**Branch:** `feat/offline-first-ficha`  
**HEAD de implementação:** `66294564e82183d707c9575a66963e02d18b944b`

## Objetivo

Adicionar rolagem virtual explícita de Dados de Dano à calculadora já restrita ao Modo de Funcionamento Automático, respeitando o Modo de Dados e mantendo a entrada manual para dados físicos.

## Arquivos alterados

- `src/CalculadoraTesteLocal.tsx`
- `src/rolagemDano.ts` (novo)
- `tests/rolagem-dano-virtual.test.mjs` (novo)
- `tests/ataques-calculadora.test.mjs`

## Implementações

- **IMPLEMENTADO:** botão explícito de rolagem virtual de Dano, disponível dentro da calculadora exibida somente no Modo Automático.
- **IMPLEMENTADO:** Modo de Dados Virtuais oferece a rolagem virtual; Modo Físicos mantém os campos de soma dos resultados físicos; Modo Mistos respeita o método escolhido para a rolagem.
- **IMPLEMENTADO:** a fórmula virtual inclui os dados base, os +2 dados do Disparo Cadenciado quando selecionado e o dado adicional da 4ª Fase da BI em Ataques Corpo a Corpo.
- **IMPLEMENTADO:** Motosserra gera um dado adicional para cada resultado 6 e permite encadeamentos sucessivos, com limite técnico de segurança de 1.000 dados para impedir execução descontrolada.
- **IMPLEMENTADO:** a rolagem exibe as faces obtidas e a soma, mas não altera PV, Inventário, munição ou outros dados persistentes.
- **IMPLEMENTADO:** resultados de Dano são invalidados quando a fórmula ou o método muda.
- **PRESERVADO:** entrada física e campo para dados adicionais confirmados manualmente; a calculadora não presume posse de Peças ou Habilidades.
- **PRESERVADO:** o cálculo crítico, o atributo de Dano e a exceção de FOR adicional do Operário continuam sob as regras existentes.

## Testes e verificações

- **IMPLEMENTADO:** testes determinísticos para fórmulas com grupos diferentes de dados, encadeamento da Motosserra e rejeição de fórmulas inválidas.
- **IMPLEMENTADO:** testes de integração por inspeção de fonte para visibilidade no Modo Automático, escolha de método e inclusão de fórmulas adicionais.
- **PENDENTE:** execução local dos testes e build; este ciclo foi realizado diretamente no repositório remoto.
- **PENDENTE:** GitHub Actions. No momento do checkpoint, as execuções mais recentes permaneciam na fila:
  - Build: `43663602944`
  - Verificação da Ficha Offline: `43663602903`
- **PENDENTE:** validação humana por Gus. Nenhuma validação humana foi declarada.

## Riscos e observações

- A execução do build e da suíte automatizada ainda é necessária para detectar incompatibilidades de TypeScript, runtime ou expectativas de testes.
- Fórmulas especiais que não possuem fórmula convencional continuam fora do cálculo genérico e mantêm seus procedimentos próprios.
- Dados adicionais de Peças/Habilidades não são inferidos do Inventário, que permanece fora do escopo ativo desta fase.
- Nenhuma alteração foi feita em `main`, branches adicionais ou outras frentes do projeto.

## Próxima ação exata

Aguardar a fila do GitHub Actions para o HEAD `66294564e82183d707c9575a66963e02d18b944b`. Corrigir eventuais falhas, executar novamente as verificações pertinentes e só então preparar a próxima lacuna da Fase 1. Após aprovação técnica, preparar o roteiro de testes humanos da Fase 2, sem declarar validação antes da execução por Gus.


## Ajuste de clareza após a implementação — 14/11/2026

- **IMPLEMENTADO:** o aviso genérico de Ataque foi atualizado para não afirmar que o cálculo de Dano permanece manual, pois a calculadora agora oferece rolagem virtual explícita quando o Modo de Dados permite.
- **PRESERVADO:** a Ficha não decide acerto/erro, não aplica Dano aos PV e não substitui a confirmação da Mesa.
- **TESTE ADICIONADO:** a verificação estrutural da calculadora rejeita o texto antigo e evita regressão na orientação exibida.
- **EXECUÇÃO:** teste e build ainda aguardam GitHub Actions; nenhum resultado foi presumido.
