# Checkpoint — fórmulas manuais de modos especiais — 10/11/2026

## Objetivo
Permitir que a calculadora manual de Dano represente modos especiais explicitamente documentados no Arquivo do Jogador v1.0, sem passar a controlar munição, turnos, efeitos ou estado de combate.

## Implementado
- Novo módulo `src/variantesDanoArmas.ts` resolve apenas a fórmula escolhida para Spark Shot (normal 1d4; carregado 4d4) e Lança-Chamas Químico (3d6 a 6d6).
- `src/CalculadoraTesteLocal.tsx` oferece seletores explícitos para os dois modos e usa a fórmula selecionada no cálculo manual existente.
- Motosserra continua usando a fórmula-base 3d6; o campo de dados adicionais agora explica que deve receber a soma de todos os dados extras gerados por cada 6, incluindo encadeamentos.
- Os seletores não afirmam que a personagem possui a arma, dispõe de Cargas/Combustível, manteve a sequência de turnos ou aplicou efeitos. Não alteram PV, munição, combustível, turnos, Atordoado ou Imobilizado.

## Testes adicionados
- Verificações estáticas da UI para modos Spark Shot/Lança-Chamas e orientação da Motosserra.
- Execução local não realizada nesta sessão; aguardar CI do novo HEAD.

## Limites e pendências
- A escolha da fórmula da Chama Contínua é informada manualmente pelo usuário, conforme o histórico real; a Ficha não administra turnos nem Movimento.
- Spark Shot continua sem aplicar Fortitude DT 15, Atordoado ou Imobilizado.
- Munição/Cargas/Combustível, Peças instaladas e Habilidades dependem de Inventário/equipamento ativo ainda não liberado.
- GM 79 e cartuchos especiais, RPG-7, Perfuração, Rajada e Disparo Cadenciado ainda precisam de integração individual da calculadora ou de procedimentos manuais mais claros.
- Nenhuma rolagem de Dano é gerada automaticamente; não compara Defesa, resolve Reações, RD, BI, PV ou consequências narrativas.

Sem merge para `main`, publicação, alterações de produção ou teste humano.
