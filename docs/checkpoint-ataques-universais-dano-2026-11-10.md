# Checkpoint — ataques universais e dados adicionais de Dano na Ficha

**Data:** 10/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** integração de Arma Improvisada/Ataque Desarmado à calculadora e suporte explícito a dados de Dano adicionais já rolados.

## Implementado

- `src/catalogoArmas.ts` agora exporta `consultarPerfilAtaqueUniversal()`, derivando o perfil de cálculo diretamente do catálogo canônico de procedimentos universais.
- A calculadora de Ataque Corpo a Corpo oferece Arma Improvisada e Ataque Desarmado além dos perfis do catálogo de armas.
- Os dois ataques universais usam as fórmulas e multiplicadores previstos no catálogo: Arma Improvisada (1d6 + FOR, crítico ×2) e Ataque Desarmado (1d4 + FOR, crítico ×3).
- Ataque Desarmado aplica Desvantagem padrão na rolagem. Uma Vantagem válida cancela essa Desvantagem, conforme a regra geral. A calculadora exibe o motivo.
- A etapa manual de Dano agora aceita uma soma opcional de Dados adicionais já rolados, útil quando a mesa confirmou uma Peça, Habilidade ou modo de disparo que conceda dados extras.
- A entrada adicional é manual; a Ficha não presume posse, instalação, compatibilidade ou ativação de Peças/Habilidades. Não sorteia esses dados nem altera PV.
- A troca de perfil limpa também o valor de dados adicionais para evitar reaproveitamento acidental.

## Não implementado neste ciclo

- Coronhada como modalidade de Ataque: depende de validar a autorização da ficha específica da arma e a condição de coronha resistente; não foi presumida.
- Automatização de Peças instaladas, compatibilidade, efeitos de Peças e Habilidades: depende do Inventário/equipamento ativo e de seus dados persistentes.
- Fórmulas especiais e regras de armas que alteram dados por condição (Motosserra, Lança-Chamas Químico, Spark Shot, RPG-7 etc.) continuam exigindo procedimento específico; não são aproximadas pelo cálculo genérico.
- Não há resolução automática de acerto, Defesa do alvo, Reações, Dano Massivo, RD, BI ou PV.

## Testes e evidências

- Adicionados testes de perfil sintético e Dano Crítico para ataques universais em `tests/catalogo-armas.test.mjs`.
- Adicionados testes de integração da calculadora e entrada de dados adicionais em `tests/ataques-calculadora.test.mjs`.
- **Execução local:** não realizada nesta sessão.
- **CI:** workflows do GitHub Actions foram disparados em commits deste ciclo; consultar os resultados do HEAD final antes de declarar aprovação.
- **Teste humano:** pendente.
- **Merge/publicação:** não realizados.

## Commits do ciclo

- `b7c4628` — perfil de cálculo para ataques universais.
- `6b06037` — integração dos ataques universais na calculadora.
- `0764e09` — testes dos perfis universais.
- `3de68cc` — testes de integração da calculadora.
- `7323bfb` — entrada manual de dados adicionais de Dano.
- `5ea7730` — reset dos dados adicionais ao trocar perfil.
- `205768f` — teste da entrada de dados adicionais.

## Próximas frentes

1. Auditar fórmulas especiais e modos de disparo por família de arma, sem aproximar efeitos.
2. Integrar os efeitos passivos de Habilidades/Origem apenas quando houver dados persistentes e gatilhos explícitos.
3. Continuar os quesitos restantes da Ficha Offline em paralelo: Progressão, Recursos, Condições e Combate, com cobertura de persistência.
