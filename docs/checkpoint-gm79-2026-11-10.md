# Checkpoint — procedimentos manuais GM 79 — 10/11/2026

## Fonte canônica
Arquivo do Jogador v1.0, Capítulo 3 — Arsenal e Equipamentos, pp. 60 e 65. Cartuchos GM 79 são de tiro único; após qualquer disparo a arma fica vazia e recarrega com Movimento.

## Implementado
- Novo módulo `src/procedimentosGM79.ts` descreve os três cartuchos e suas opções de disparo direto/área conforme o cânone.
- A UI permite selecionar cartucho e modo, exibe alcance, raio, DT e consequências previstas.
- Disparo em Área oculta o controle de Acerto Crítico e limpa o estado crítico ao selecionar área.
- A calculadora não rola Testes dos alvos, não consome munição, não esvazia a arma, não aplica Queimadura, não altera PV nem decide efeitos.

## Testes adicionados
- Testes unitários para Ácido direto/área, Explosivo área e Incendiário direto/área.
- Testes estáticos de integração da UI.
- Execução local não realizada nesta sessão; CI pendente.

## Limites
- Dano-base GM 79 é 4d6; o usuário informa a soma rolada no cálculo manual.
- Para área, a interface informa metade/integral, mas não divide nem aplica Dano automaticamente.
- RPG-7 mantém Morte Instantânea e exceções descritas no perfil; não se inventa fórmula de Dano.
- Bear Commander com lançador integrado, modos Rajada/Disparo Cadenciado e Perfuração seguem pendentes de integração.
- Sem merge, publicação, teste humano ou alteração de produção.
