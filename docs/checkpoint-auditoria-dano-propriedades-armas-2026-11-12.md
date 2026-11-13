# Checkpoint — auditoria de Dano e propriedades especiais das armas

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD auditado:** `a2a39ab9b5c4a8bd91ab840768235fd8f4327988`  
**Fonte canônica:** Arquivo do Jogador v1.0, Capítulo 3 — Arsenal e Equipamentos, especialmente pp. 48–61; regras gerais de Acerto Crítico e Dano consultadas em p. 81.

## 1. Catálogos e perfis

**Revisão estática: sem divergência de valores identificada nos perfis consultados.**

- `src/catalogoArmas.ts`: 15 armas corpo a corpo, com dano, multiplicador crítico, mãos, espaços, peças, durabilidade, alcance e propriedades.
- `src/catalogoArmasFogo.ts`: 34 perfis em sete categorias: Pistolas 9 mm, Escopetas, Submetralhadoras, Rifles, Rifles de Precisão, Magnums e Armas Especiais.
- Os dados conferidos incluem os perfis de armas corpo a corpo das pp. 50–52 e os modelos de armas de fogo/especiais das pp. 53–61.
- O catálogo distingue propriedades individuais importantes: Punisher e Perfuração, Matilda e Coronha específica, modos automáticos de Gal/Chicago Sweeper/Clatter Carbine, escopetas de bombeamento ou semiautomáticas, Magnums, Besta, GM 79, Lança-Chamas, Redemption, RPG-7 e Spark Shot.
- RPG-7 permanece sem fórmula numérica genérica de Dano, como no livro. Não foi inventado um dado para esse perfil.

Os testes existentes `tests/catalogo-armas.test.mjs` e `tests/catalogo-armas-fogo.test.mjs` cobrem quantidade, categorias, dados de amostra, propriedades e proteção contra mutação externa dos catálogos. A existência desses testes não comprova sua execução neste checkpoint.

## 2. Cálculo de Dano e Crítico

Em `src/catalogoArmas.ts` e `src/CalculadoraTesteLocal.tsx`:

- Ataque Corpo a Corpo usa FOR no Dano; Ataque à distância usa AGI, conforme a regra geral da p. 48.
- O cálculo recebe somas de dados já rolados e Atributo; não gera dados por conta própria.
- O Acerto Crítico multiplica o Dano total pelo multiplicador da arma. O 20 natural é crítico automático; margem ampliada 19–20 exige que o 19 alcance a Defesa e não fecha, por si só, a janela defensiva.
- A exceção da Origem Operário mantém o FOR adicional fora do multiplicador crítico.
- Dados adicionais informados manualmente permitem registrar dados de Disparo Cadenciado, habilidades ou modificações sem presumir Peças instaladas.
- A Ficha não compara o Ataque com a Defesa nem decide acerto comum; a Mesa mantém essa resolução.

## 3. Modos de disparo e propriedades especiais

**Implementado como consulta/lembrete, sem consumo de recursos:**

- Disparo Cadenciado: Ataque normal, 5 cartuchos e +2 Dados de Dano; Matilda com Coronha específica consome 3.
- Rajada: Manobra de Ação Completa, 10 cartuchos, cone de 4,5 m, Reflexos DT 12; não apresenta rolagem de Ataque nem Crítico para a área.
- Gal e Clatter Carbine não oferecem Disparo Único; Chicago Sweeper é Rajada Exclusiva. A seleção de modo respeita as propriedades cadastradas.
- Matilda só habilita Cadenciado após confirmação manual da Coronha específica.
- Punisher preserva a exceção de Perfuração; demais armas com Perfuração usam a regra universal.
- Bear Commander separa o rifle do lançador integrado, com capacidade e reserva próprias e procedimento de Cartucho GM 79.
- GM 79 distingue Ácido, Explosivo e Incendiário, além de disparo direto/área quando aplicável.
- Besta, Lança-Chamas Químico, Redemption, RPG-7 e Spark Shot apresentam seus procedimentos específicos; a calculadora não aplica Condições nem decide resultados dos alvos.
- Motosserra orienta informar manualmente os dados extras gerados por resultados 6, inclusive encadeamentos.

## 4. Armas modificadas e dependência do Inventário

- **Armeiro:** lembrete de +1 no Teste de Ataque por Peça Extra instalada; o Jogador informa o modificador manualmente.
- **Armeira Autodidata:** lembrete de +1d4 de Dano por Peça Extra instalada em Arma de Fogo; os dados são informados manualmente.
- A calculadora deixa claro que selecionar um perfil não confirma posse, arma empunhada, munição, proficiência, Coronha ou Peças instaladas.
- Não há consumo persistente de munição, recarga, controle de bateria/combustível, equipamento ativo ou estado de Peças integrado à Ficha ativa. Esses controles dependem do módulo de Inventário ativo e de suas operações transacionais.
- O lembrete de propriedades não substitui a validação operacional de alcance, mãos, proficiência, munição ou custo de ação.

## 5. Conclusão

Não foi encontrada, nesta revisão estática, divergência mecânica que justifique alterar fórmulas ou dados dos perfis. Por isso, **nenhum código de cálculo ou catálogo foi modificado neste incremento**. A cobertura consultiva já é significativa; a lacuna remanescente está principalmente em conectar os dados ao estado real do Inventário e em controlar consumo/recarga/Peças de forma persistente e autorizada.

## 6. Validação e pendências

- **Revisão estática:** `catalogoArmas.ts`, `catalogoArmasFogo.ts`, `variantesDanoArmas.ts`, `procedimentosDisparoArmas.ts`, `procedimentosArmasEspeciais.ts`, `procedimentosGM79.ts`, `catalogoProcedimentosArmas.ts`, `CalculadoraTesteLocal.tsx` e testes relacionados.
- **Testes identificados:** `ataques-calculadora.test.mjs`, `catalogo-armas.test.mjs`, `catalogo-armas-fogo.test.mjs`.
- **Testes/build/CI:** não executados/confirmados nesta sessão. O HEAD consultado não apresentou status checks nem workflow runs associados.
- **Validação humana:** pendente, inclusive seleção de perfis, modos de disparo e dados de Dano em Automático, Misto e Manual.
- **PENDENTE:** integração transacional do Inventário ativo para munição, recarga, equipamento, Peças, Coronha, bateria e combustível; controle de uso por turno e verificação de proficiência/equipamento.
- **Sem alterações:** regras, fórmulas, catálogos, estado persistido, esquema, servidor LAN, interface visual, branch padrão, merge, publicação ou deploy.
