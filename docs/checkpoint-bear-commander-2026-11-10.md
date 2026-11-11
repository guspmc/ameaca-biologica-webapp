# Checkpoint — Bear Commander e lançador integrado (10/11/2026)

## Fonte canônica
Arquivo do Jogador v1.0:
- p. 57: Bear Commander, rifle 1d10, Rajada; lançador integrado com capacidade separada de 1 Cartucho GM 79, aceita Ácido/Explosivo/Incendiário, alcance Médio, reserva própria e recarga por Ação Bônus.
- p. 60: tabela de armas especiais e procedimento GM 79; GM 79 base 4d6, Crítico x4; disparo direto usa Ataque e pode critar salvo exceção do cartucho; disparo em Área não usa Ataque nem Crítico.

## Implementado
- src/CalculadoraTesteLocal.tsx: no perfil Bear Commander, seletor explícito Rifle/Lançador integrado.
- Rifle mantém perfil 1d10 e modos próprios; o lançador usa 4d6 e consulta consultarProcedimentoGM79 para cartuchos e modos.
- Lançador mostra capacidade separada de 1 cartucho, reserva independente, alcance Médio e recarga por Ação Bônus.
- Ataque direto usa multiplicador crítico x4; área desabilita rolagem de Ataque e Crítico.
- Teste estático adicionado em tests/ataques-calculadora.test.mjs.

## Limites deliberados
- Não confirma posse, equipamento, carregamento nem estoque real de cartuchos.
- Não consome munição nem controla estado vazio/recarga.
- Não resolve Reflexos, Fortitude, respingo, Queimadura, Defesa ou aplicação de PV.
- Não há integração com Inventário; o usuário seleciona manualmente o sistema de disparo.

## Validação
- Teste adicionado; não executado localmente.
- CI pendente para HEAD.
- Sem teste humano, merge ou publicação.
