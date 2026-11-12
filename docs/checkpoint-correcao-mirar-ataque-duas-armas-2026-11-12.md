# Checkpoint — correção da integração de Mirar e Ataque normal

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD de código após as alterações:** `84d74e0d126852535cd73ee75aa36fd75cd64156`  
**Escopo:** corrigir o registro de Ataque normal independente de Mirar e conectar Mirar à calculadora, sem alterar regras, visual identity, Inventário ou LAN.

## 1. Fontes canônicas conferidas

Arquivo do Jogador v1.0:
- p. 78: Mirar custa 1 SA; deve ser declarado antes do Ataque; concede +2 no Teste de Ataque e permite escolher uma região específica do alvo. Não aumenta Dano, não remove Desvantagem e não torna possível um Ataque impossível.
- p. 77: Combate com Duas Armas custa Ação Bônus, uma vez por turno; exige que a Ação Atacar tenha sido usada para um Ataque com arma Corpo a Corpo de Grau Comum e Mãos 1 empunhada em uma mão; permite Ataque adicional com outra arma que cumpra os mesmos requisitos, empunhada na outra mão. O Ataque adicional não adiciona FOR ao Dano, salvo regra específica.
- p. 77: Atacar consome Ação.

## 2. Alterações realizadas

### 2.1 Registro de Ataque normal — `src/PainelAcoesLocal.tsx`

- O controle de registro de Ataque deixou de depender de `mirarPreparado`.
- O botão fica disponível durante o turno quando a Ação normal ainda está disponível.
- O texto distingue “Registrar Ataque · Ação” e “Registrar Ataque · consome Mirar”.
- A chamada continua usando `registrarAtaque()`, que consome Ação, define `ataqueNormalRealizado` e consome o marcador de Mirar caso esteja preparado.
- Com isso, o Ataque normal sem Mirar também registra o pré-requisito para Combate com Duas Armas.
- O registro continua sendo uma confirmação manual posterior à resolução do Ataque pelo jogador; a Ficha não realiza a rolagem por conta própria.

### 2.2 Estado persistido de Mirar — `src/FichaLocal.tsx`

- A Ficha carrega o estado composto por `carregarEstadoTurnoCombate()`.
- Só repassa `mirarPreparado=true` à calculadora quando o estado carregado é válido.
- O carregador existente preserva compatibilidade com formatos históricos reconhecidos; registros inválidos não ativam o bônus.

### 2.3 Aplicação do bônus e região — `src/CalculadoraTesteLocal.tsx`

- Nova prop opcional `mirarPreparado`, alimentada pelo estado salvo.
- O bônus +2 entra no valor do Teste de Ataque apenas quando o escopo é Ataques e a resolução não é uma opção de Área sem Teste de Ataque.
- O bônus não é incorporado ao cálculo de Dano.
- A lógica de Vantagem/Desvantagem permanece separada; Mirar não cancela Desvantagem.
- Quando Mirar está preparado, a calculadora apresenta campo textual para a região específica escolhida. Não foi criado catálogo de regiões porque o cânone consultado não fornece uma lista fechada.
- A confirmação da rolagem fica indisponível até que a região seja informada.
- A alteração do marcador de Mirar limpa os dados da rolagem e o campo de região, evitando reutilizar um resultado de outro estado.

### 2.4 Testes adicionados — `tests/ataques-calculadora.test.mjs`

Foram acrescentadas verificações estruturais para:
- aplicação de +2 somente no Teste de Ataque;
- preservação da lógica de Desvantagem;
- não aplicação de bônus no Dano e não remoção de impossibilidade;
- exigência de região antes da confirmação da rolagem;
- disponibilidade do registro de Ataque sem Mirar;
- passagem do marcador persistido para a calculadora.

O teste de domínio `tests/manobras-operacionais.test.mjs` já exercita `registrarAtaque()` sem Mirar e a pré-condição de Combate com Duas Armas; ele foi inspecionado, mas não alterado neste ciclo.

## 3. Classificação após a alteração

| Item | Estado |
|---|---|
| Registrar Atacar sem Mirar | **IMPLEMENTADO NO CÓDIGO** |
| Atualizar marcador de Ataque inicial | **IMPLEMENTADO NO CÓDIGO** via `registrarAtaque()` |
| Liberar pré-condição para Combate com Duas Armas | **IMPLEMENTADO NO FLUXO**; elegibilidade das armas segue confirmação manual |
| Aplicar +2 de Mirar ao Teste de Ataque | **IMPLEMENTADO NO CÓDIGO** |
| Escolher região específica | **IMPLEMENTADO NO CÓDIGO** como campo textual obrigatório antes da rolagem |
| Não aumentar Dano / não remover Desvantagem | **PRESERVADO NA IMPLEMENTAÇÃO** |
| Testes automatizados | **ADICIONADOS, NÃO EXECUTADOS NESTA SESSÃO** |
| Build TypeScript/Vite | **NÃO EXECUTADO NESTA SESSÃO** |
| Teste humano em navegador | **PENDENTE** |

## 4. Roteiro de verificação dirigido

1. Ataque normal sem Mirar: registrar Atacar; conferir consumo da Ação e marcador `ataqueNormalRealizado`.
2. Com Duas Armas: após o Ataque inicial, confirmar requisitos das duas armas; registrar Ação Bônus; conferir autorização do Ataque adicional.
3. Mirar: gastar 1 SA; conferir marcador persistido e exibição do bônus +2.
4. Tentar rolar sem informar região: botão deve permanecer indisponível.
5. Informar região e rolar com dados físicos, virtuais e mistos conforme preferência configurada.
6. Confirmar que o total do Ataque recebe +2, mas o Dano não.
7. Aplicar Desvantagem por Condição ou BI e confirmar que Mirar não a remove.
8. Registrar o Ataque após resolvê-lo; conferir consumo da Ação e do marcador Mirar.
9. Reabrir a Ficha e conferir que não há bônus residual após consumo; se a preparação ainda estiver salva, o bônus deve reaparecer.
10. Confirmar que ataques em Área sem Teste de Ataque não recebem o bônus.

## 5. Limites e segurança do escopo

- Nenhuma regra canônica foi alterada.
- Não houve redesign visual; foi adicionado somente o campo funcional necessário para informar a região.
- Nenhuma mudança no servidor LAN, IndexedDB, banco, Supabase, `main`, merge, deploy ou publicação.
- Nenhuma branch nova foi criada.
- Inventário ativo permanece bloqueado até a validação humana da Ficha Offline e aprovação expressa.
- Nenhum teste, build ou validação humana foi executado pela assistente nesta sessão.

## 6. Próximas ações

1. Conferir a CI/workflows do commit e solicitar/acompanhar execução de `pnpm test` e `pnpm build` pelo fluxo já usado no projeto, sem afirmar aprovação antecipada.
2. Executar a bateria humana dirigida acima, especialmente a persistência do marcador e o ciclo Mirar → Ataque → consumo.
3. Se os resultados forem aprovados, prosseguir para a integração mínima de Desengajar e Usar Objeto; depois decidir as Manobras restantes com base no cânone e no escopo.
4. Atualizar matriz e continuidade no próximo ciclo.
