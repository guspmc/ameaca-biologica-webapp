# Checkpoint — auditoria das Manobras Universais restantes

**Data:** 12/11/2026  
**Branch:** feat/offline-first-ficha  
**HEAD de código/testes:** c8118631ee9e6699a97b8dfdedbf96e42d60e029  
**HEAD documental consultado:** 61d7d8535854150ad1f447abe24948f925bc48a7  
**Escopo:** avaliar Adiar Ação, Agarrar, Empurrar/Derrubar e Esconder-se contra o cânone e os limites da Ficha. Nenhum código alterado neste incremento.

## 1. Fonte canônica

Arquivo do Jogador v1.0, p. 77–78:
- Adiar Ação: sem SA; abre mão da posição atual na Iniciativa e desloca o turno para depois do turno de um aliado ou depois que todos agirem na rodada. Preparar Ação não existe.
- Agarrar: substitui um Ataque; exige mão livre e alvo de no máximo uma categoria maior; disputa Atletismo contra Atletismo ou Reflexos do alvo. Sucesso aplica Agarrado. Escapar exige Ação e novo Teste contra DT do resultado original.
- Empurrar/Derrubar: substitui um Ataque; usa a mesma disputa de Agarrar. Sucesso permite empurrar 1,5 m ou deixar Caído; não causa Dano.
- Esconder-se: custa Ação; exige estar fora dos sentidos do inimigo e ter onde se ocultar; Teste de Furtividade contra Percepção Passiva ou ativa, conforme a situação.

## 2. Evidências no código consultado

- src/manobrasUniversais.ts contém as quatro descrições no catálogo de consulta, com custos/requisitos/procedimentos e referência ao Arquivo do Jogador.
- O catálogo declara expressamente que não executa ações, Testes, deslocamentos ou efeitos.
- tests/manobras-universais.test.mjs verifica catálogo, custos e conteúdo canônico textual, mas não testa execução operacional dessas quatro manobras.
- src/manobrasOperacionais.ts não contém helpers específicos para Adiar Ação, Agarrar, Empurrar/Derrubar ou Esconder-se.
- src/PainelAcoesLocal.tsx não apresenta controles específicos para essas quatro manobras. O painel não administra ordem de Iniciativa, posições, sentidos dos inimigos ou estado de Condições em alvos.

## 3. Classificação e decisão técnica provisória

| Manobra | Estado | Motivo / limite |
|---|---|---|
| Adiar Ação | CONSULTA CANÔNICA; sem integração na Ficha | Altera a ordem de Iniciativa/rodada, cuja gestão pertence à Mesa/Painel do Mestre. Não criar estado paralelo de iniciativa no painel do Jogador. |
| Agarrar | CONSULTA CANÔNICA; integração operacional pendente | A disputa pode ser resolvida manualmente, mas o custo “substitui um Ataque” não está mapeado com segurança à economia atual, que representa uma Ação normal e um Ataque inicial para Duas Armas. Não consumir Ação nem marcar Ataque elegível por inferência. |
| Empurrar/Derrubar | CONSULTA CANÔNICA; integração operacional pendente | Mesma ambiguidade de custo de Agarrar; exige ainda registrar resultado escolhido (deslocar 1,5 m ou Caído) sem gerir posições/Condições de outra personagem. |
| Esconder-se | CONSULTA CANÔNICA; integração operacional pendente | Custo Ação é claro, mas requisitos ambientais e escolha entre Percepção Passiva/ativa dependem da Mesa. Um controle exigiria confirmação contextual e não poderia declarar ocultação automática. |

## 4. O que não fazer

- Não criar Adiar Ação no painel do Jogador enquanto a Ficha não gerencia Iniciativa/rodadas.
- Não mapear “substitui um Ataque” para consumir Ação ou liberar Combate com Duas Armas sem uma decisão normativa/funcional explícita.
- Não aplicar Agarrado/Caído a fichas de terceiros, mover alvos ou determinar sentidos, cobertura, alcance ou Percepção por conta própria.
- Não declarar a personagem oculta automaticamente após Esconder-se; o resultado depende do Teste e da situação.
- Não criar motor de turnos nem substituir a resolução da Mesa.

## 5. Validação

- Auditoria estática de catálogo, helper, painel e testes realizada por leitura do repositório.
- Nenhum teste automatizado, build ou teste humano executado nesta sessão.
- Status checks do commit documental 61d7d8535854150ad1f447abe24948f925bc48a7 retornaram lista vazia; isso não representa aprovação de CI.
- Nenhuma alteração de código neste incremento.

## 6. Próxima etapa

1. Preparar bateria humana consolidada para a Ficha Offline, incorporando Ataque/Mirar/Duas Armas, Desengajar/Usar Objeto, persistência e falhas de salvamento.
2. Solicitar execução real de pnpm test e pnpm build no ambiente habitual do projeto.
3. Não iniciar Inventário ativo antes da validação humana da Ficha Offline e aprovação expressa.
4. Manter as quatro manobras deste checkpoint em consulta/manual até que a ambiguidade de custo e a fronteira de responsabilidade com a Mesa sejam decididas.
