# Checkpoint — integração de Desengajar e Usar um Objeto

**Data:** 12/11/2026  
**Branch:** feat/offline-first-ficha  
**HEAD de código/testes após este ciclo:** c8118631ee9e6699a97b8dfdedbf96e42d60e029  
**Escopo:** conectar duas Manobras Universais já existentes no domínio à interface da Ficha e reforçar o pré-requisito canônico de Usar um Objeto. Sem redesign, alteração de regras, Inventário ou mudanças no LAN.

## 1. Fontes canônicas conferidas

Arquivo do Jogador v1.0:
- p. 76: Interação Gratuita com Objeto é recurso paralelo, limitado a uma por turno; não integra a hierarquia de ações e não pode ser comprada por Esforço salvo regra específica.
- p. 77: Desengajar custa Movimento; consome o Movimento para deslocar-se 1,5 m sem provocar Ataque de Oportunidade por esse deslocamento.
- p. 79: Usar um Objeto custa Ação e permite interação adicional com objeto quando a Interação Gratuita com Objeto já foi usada. Regra específica de item ou Habilidade pode determinar custo diferente.

## 2. Alterações realizadas

### 2.1 src/manobrasOperacionais.ts
- registrarDesengajar() já consumia Movimento e não simulava deslocamento; foi reutilizada sem alterar sua regra.
- registrarUsarObjeto() agora exige economia.interacaoGratuitaUsada === true antes de consumir Ação.
- O helper continua sem executar o uso do item, decidir efeitos ou alterar o Inventário.

### 2.2 src/PainelAcoesLocal.tsx
- Importados os helpers de Desengajar e Usar um Objeto.
- Adicionado controle Desengajar · Movimento, disponível somente no turno próprio e enquanto o Movimento normal estiver disponível.
- Adicionado controle Usar um Objeto · Ação, disponível somente no turno próprio, depois do registro da Interação Gratuita e enquanto a Ação normal estiver disponível.
- As mensagens de confirmação explicam que o deslocamento/uso real permanece sob controle do jogador e da Mesa.
- A integração reutiliza a estrutura e classes existentes do painel; não houve redesign nem alteração de CSS.

### 2.3 tests/manobras-operacionais.test.mjs
- Separado o teste de Ajudar.
- Adicionado teste que confirma que Usar um Objeto falha antes da Interação Gratuita e consome Ação depois que ela foi usada.
- O teste de Desengajar já existente continua cobrindo consumo do Movimento sem simular deslocamento.

## 3. Classificação

| Item | Estado |
|---|---|
| Desengajar no domínio | IMPLEMENTADO |
| Desengajar na interface | IMPLEMENTADO NO CÓDIGO |
| Usar um Objeto no domínio | IMPLEMENTADO COM PRÉ-REQUISITO VALIDADO |
| Usar um Objeto na interface | IMPLEMENTADO NO CÓDIGO |
| Efeito real do deslocamento/uso de item | MANUAL, conforme escopo |
| Testes automatizados | ATUALIZADOS, NÃO EXECUTADOS NESTA SESSÃO |
| Build | NÃO EXECUTADO NESTA SESSÃO |
| Teste humano | PENDENTE |
| CI/status checks | Consulta ao commit c8118631ee9e6699a97b8dfdedbf96e42d60e029 retornou lista vazia de status; isso não comprova aprovação. |

## 4. Roteiro humano dirigido

1. Iniciar o turno e registrar Interação Gratuita; confirmar que o marcador fica usado.
2. Tentar Usar um Objeto antes de registrar a Interação Gratuita em um turno novo: o controle deve permanecer indisponível.
3. Após registrar a Interação Gratuita, usar Usar um Objeto: confirmar consumo da Ação e persistência do estado.
4. Reabrir a Ficha e conferir que os marcadores permanecem corretos.
5. Em outro turno, registrar Desengajar: confirmar consumo do Movimento e mensagem de deslocamento protegido de 1,5 m.
6. Confirmar que o painel não move token, não verifica quadrados/posições e não resolve Ataque de Oportunidade.
7. Confirmar que Usar um Objeto não altera Inventário, cargas, munição ou efeitos do item.
8. Repetir com turno encerrado, Ação/Movimento já usados e falha de salvamento; não deve haver confirmação falsa nem gasto parcial.

## 5. Restrições preservadas

- Nenhuma regra canônica foi alterada.
- Nenhum CSS, layout visual geral, componente compartilhado ou navegação foi redesenhado.
- Sem alterações em LAN/servidor, IndexedDB fora do estado de turno, Supabase, banco, main, merge, deploy ou publicação.
- Nenhuma branch nova foi criada.
- Inventário ativo permanece bloqueado até validação humana completa da Ficha Offline e aprovação expressa.

## 6. Commits e rastreabilidade

- Helper/pré-requisito: 1ef2f2d19ffa4b8770a8ceb494d80729a4239da0.
- Integração do painel: 9cbe135a67c96941b663f5e900a000d6cb056948.
- Cobertura do pré-requisito: 0d45925580c4fbffca32fbfb1f617535703568fd.
- Simplificação final da fixture: c8118631ee9e6699a97b8dfdedbf96e42d60e029.

## 7. Próxima etapa

1. Obter execução real de pnpm test e pnpm build no ambiente habitual do projeto; esta sessão não dispõe de runtime local.
2. Executar a bateria humana de Mirar/Ataque/Duas Armas e de Desengajar/Usar um Objeto.
3. Continuar a auditoria das Manobras sem controles específicos (Adiar Ação, Agarrar, Empurrar/Derrubar e Esconder-se), verificando se a regra exige apenas registro contextual ou um fluxo mais amplo.
4. Só depois da validação humana da Ficha Offline considerar o desbloqueio do Inventário ativo.
