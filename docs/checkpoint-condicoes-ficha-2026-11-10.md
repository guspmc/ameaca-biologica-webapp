# Checkpoint — integração parcial das Condições na Ficha Offline

**Data:** 10/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** modificadores de Condições próprias em rolagens e Defesa.

## Implementado

- Criado `src/condicoesCalculadora.ts` para derivar Desvantagens expressamente descritas no Arquivo do Jogador v1.0:
  - Ataques próprios: Caído, Cego, Imobilizado e Intoxicado.
  - Ataque Corpo a Corpo baseado em FOR: também Enfraquecido.
  - Ataque com arma de fogo durante Infectado Especial: Desvantagem.
  - Testes de Perícia: Desorientado e Intoxicado.
  - Testes baseados em FOR e Fortitude: Enfraquecido.
  - Testes de Atributo não recebem Desvantagem por Intoxicado.
- `CalculadoraTesteLocal` recebe as Condições ativas da própria Ficha e incorpora as Desvantagens ao estado da rolagem. Uma Vantagem e uma Desvantagem se anulam normalmente; múltiplas fontes iguais não acrescentam d20 adicionais.
- Defesa apresentada pela Ficha agora considera:
  - Exposto: −2 Defesa.
  - Desorientado: remove somente a contribuição de AGI da Defesa.
- A lista de Condições ativas é validada antes de alimentar os cálculos.
- Atualizada a explicação da seção Combate para distinguir o que a Ficha aplica e o que permanece sob controle da mesa.
- Criado `tests/condicoes-calculadora.test.mjs`, cobrindo os modificadores e a integração com a Ficha.

## Limites preservados — não automatizados neste ciclo

- Vantagens/Desvantagens do alvo (por exemplo, alvo Caído, Cego ou Atordoado) não são inferidas pela Ficha do atacante.
- Amedrontado depende de perceber a fonte; isso não é inferido.
- Cego/Surdo podem tornar impossível um Teste que dependa exclusivamente de visão/audição; a Ficha não classifica automaticamente o contexto do Teste.
- Desorientado impede a Ação Atacar; Atordoado, Incapacitado, Desacordado e Surpreendido podem restringir Ações/Reações. A Ficha ainda não controla a economia de turnos nem bloqueia esses comandos por duração.
- Movimento, duração por turno, Dano contínuo, testes de remoção e consequências narrativas continuam sem aplicação automática.
- Não se alterou o cânone, o Inventário, a posse/equipamento de armas ou o estado compartilhado da Mesa.

## Evidência e validação

- Código e testes foram registrados na branch isolada.
- **Testes locais:** não executados nesta sessão.
- **CI:** aguardando os workflows do HEAD final; execuções anteriores foram disparadas em vários commits intermediários deste ciclo e permanecem em fila na última consulta. O resultado do HEAD final deve ser consultado antes de declarar aprovação.
- **Teste humano no navegador/aparelho:** pendente, reservado à bateria integrada da Ficha completa.
- **Merge, publicação e produção:** não realizados.

## Commits do ciclo

- `1fb20ea` — helper de modificadores de Condições.
- `c885f51` — integração na calculadora.
- `b8a54e5` — passagem das Condições ativas pela Ficha.
- `2e2de5a` — testes de modificadores.
- `3c97ce1` — cálculo de Defesa com Condições.
- `7b6321b` — Defesa atual integrada à Ficha.
- `60e8aca` — testes de Defesa.
- `fbacf22` — assertions de integração.
- `6b2c0a6` — texto de limites e funcionamento.

## Próximos ciclos independentes

1. Completar a cobertura de fórmulas e procedimentos de Dano de todos os perfis de armas e ataques universais, sem assumir posse ou equipamento.
2. Fechar as restrições de Ações/turnos e os efeitos restantes de Condições somente onde a duração/contexto estiverem explícitos.
3. Prosseguir com os demais quesitos da Ficha Offline e seus testes de persistência/backup.
