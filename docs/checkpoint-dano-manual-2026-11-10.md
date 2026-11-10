# Checkpoint — cálculo manual de Dano e Ataques — 10/11/2026

**Projeto:** Ameaça Biológica RPG — WebApp/PWA  
**Branch:** `feat/offline-first-ficha`  
**HEAD registrado antes deste documento:** `754421e439896ec2383d592a2afc3a187f53f08d`

## Escopo deste ciclo

Corrigir e fortalecer a etapa de cálculo manual de Dano da Ficha, sem transformar a Ficha em resolvedor automático de combate.

## Alterações implementadas

- Adicionada a função pura `possuiFormulaDanoConvencional()`, que reconhece apenas fórmulas simples no padrão `XdY`.
- A calculadora da Ficha passou a usar essa função para decidir quando pode oferecer a soma manual dos Dados de Dano.
- Corrigido o reconhecimento de fórmulas convencionais; antes, a expressão regular da interface estava escapada de forma que não reconhecia corretamente padrões comuns como `1d8`.
- `calcularDanoArma()` agora exige resultados inteiros não negativos para soma dos dados, Atributo e dados adicionais.
- O multiplicador crítico do perfil agora precisa ser inteiro positivo.
- Mantida a exceção da Origem Operário: o FOR normal é multiplicado no crítico e o FOR adicional não é multiplicado.
- Adicionados testes para fórmulas convencionais/especiais e rejeição de valores fracionários ou multiplicador inválido.

## Limites preservados

- A Ficha não rola os Dados de Dano automaticamente.
- A etapa não confirma que a arma selecionada está no Inventário, equipada, carregada ou que o personagem é proficiente.
- Perfis com fórmula ou condição especial continuam fora do cálculo genérico; exemplos como Motosserra e ataques universais precisam de procedimentos próprios.
- O cálculo não aplica RD, efeitos, BI, PV, Dano Massivo, Decepamento ou consequências narrativas.
- Não foi alterado o estado da personagem nem o fluxo de Inventário.

## Estado de validação

- **IMPLEMENTADO:** helper de reconhecimento de fórmula e validação do cálculo puro.
- **TESTES ADICIONADOS:** `tests/catalogo-armas.test.mjs`.
- **CI PENDENTE:** os workflows de compilação e verificação da Ficha foram disparados para os commits do ciclo, mas estavam em fila na última consulta. Não há confirmação de aprovação neste checkpoint.
- **TESTE HUMANO PENDENTE:** nenhuma validação em navegador, desktop ou Android foi realizada neste ciclo.
- **NÃO PUBLICADO:** sem merge para `main` e sem deploy.

## Próximos passos

1. Aguardar CI e corrigir qualquer regressão reportada.
2. Auditar todas as fórmulas e exceções de Dano do Arquivo do Jogador contra os 15 perfis corpo a corpo, 34 perfis de armas de fogo/especiais e os dois ataques universais.
3. Completar os procedimentos que dependem de rolagens múltiplas ou dados adicionais sem presumir resultados.
4. Só depois integrar a resolução de Dano ao fluxo de Combate, com a Janela de Reação, RD, BI e PV em etapas explícitas e autorizadas.
5. Manter Inventário ativo bloqueado até a conclusão da Ficha, conforme a sequência registrada na matriz de implementação.
