# Checkpoint — Escopo funcional de Combate e Arsenal (09/11/2026)

## Estado técnico observado
- Repositório: `guspmc/ameaca-biologica-webapp`
- Branch: `feat/offline-first-ficha`
- HEAD confirmado antes deste registro: `7910cce6348937fa23811a7606a961aae5027622`.
- Catálogo corpo a corpo: `src/catalogoArmas.ts`, 15 perfis canônicos; o mesmo arquivo contém ainda 3 registros antigos de pistolas que duplicam IDs do catálogo completo e não devem ser somados à lista final.
- Catálogo de armas de fogo e especiais: `src/catalogoArmasFogo.ts`, 34 perfis, IDs únicos.
- Total canônico: 49 armas (15 corpo a corpo + 34 armas de fogo/especiais).
- Procedimentos individuais: `src/catalogoProcedimentosArmas.ts`, gerados para os perfis de ambos os catálogos.
- Ataques universais: `src/catalogoProcedimentosAtaquesUniversais.ts`, Arma Improvisada e Ataque Desarmado.
- Peças: `src/catalogoPecas.ts`, 31 Peças Extras (21 genéricas e 10 específicas).
- Habilidades: `src/habilidades.ts` e módulos de Progressão; efeitos precisam ser ligados aos cálculos conforme regras.
- UI atual: `src/FichaLocal.tsx` declara Ataques e Dano “A integrar”; `src/CalculadoraTesteLocal.tsx` ainda inclui Ataque junto com Testes genéricos e pede Defesa/DT.
- Cálculo legado: `src/catalogoArmas.ts` contém `resolverAtaqueArma`, que compara total com Defesa e decide sucesso; esse comportamento não deve ser usado pela Ficha.
- CI para HEAD `7910cce6348937fa23811a7606a961aae5027622`: status e workflows consultados, sem verificações retornadas. Registrar como **PENDENTE / não observado**, não como aprovado.
- Nenhuma alteração de código neste checkpoint. Nenhum merge, deploy, alteração de produção ou teste humano.

## Fontes normativas consultadas
Arquivo do Jogador v1.0:
- pp. 48–49: fórmulas gerais de Ataque/Dano, crítico, alcance, distância, durabilidade, recarga, Coice, ciclo manual, Disparo Cadenciado, Rajada, Perfuração, Decepamento e Carnificina.
- pp. 50–51: 15 armas corpo a corpo e propriedades individuais.
- p. 52: Arma Improvisada, Ataque Desarmado e Coronhada.
- pp. 53–61: 34 armas de fogo e especiais, incluindo propriedades e exceções individuais.
- pp. 62–64: Peças Extras genéricas e específicas e seus efeitos.
- pp. 80–81: procedimentos de Ataque, Reações, Crítico e Falha Crítica.
- Classes, Origens e Habilidades relevantes: benefícios de proficiência, Operário, Armeiro, Armamento Especial, Ambidestria, Lutador e demais interações identificadas nas fontes oficiais.

## Correções e decisões aprovadas pelo Gus
1. A Ficha calcula e apresenta rolagens, fórmulas, modificadores e resultados; **não compara o Ataque com a Defesa do alvo nem declara acerto/erro**. Essa decisão cabe ao Mestre.
2. O fluxo de Falha Crítica/Exposto permanece conforme decisão anterior: ativação automática apenas em Ataque no modo Automático; Testes comuns não ativam Exposto automaticamente; Misto/Manual dependem de lembrança e decisão da Mesa.
3. **Todo o arsenal e todos os cálculos de Combate precisam estar implementados antes do Inventário ativo.** A Matilda foi apenas exemplo; a obrigação vale para todas as 49 armas e ataques universais, sem exceção.
4. A ausência de Inventário ativo não bloqueia catálogo, fórmulas ou cálculos. A Ficha pode permitir selecionar um perfil apenas para calcular e consultar, deixando explícito que seleção não representa posse nem arma equipada.
5. O Inventário futuro será responsável por determinar posse, equipar/desequipar, munição efetivamente carregada e Peças efetivamente instaladas. Não presumir esses estados agora.
6. Ataque Desarmado e Arma Improvisada precisam funcionar sem depender de item equipado.
7. A Ficha continua sendo caderno/calculadora, não motor de jogo: sem gestão de turnos/rodadas, comparação de Defesa, decisão de acerto, reações automáticas, aplicação de dano em alvos, RD, BI ou PV, nem resolução narrativa.
8. A Ficha deve calcular resultados e modificadores quando os dados de entrada forem explicitamente informados. Efeitos que dependam de estado não existente (ex.: arma equipada, peça instalada, munição carregada) precisam ser apresentados como opções/entradas explícitas de cálculo, não presumidos nem persistidos como equipamento.

## Diagnóstico funcional
### Já implementado como dados/referência
- 15 perfis corpo a corpo e 34 perfis de armas de fogo/especiais.
- Procedimentos de combate e fora de combate para todos os perfis.
- Dois ataques universais.
- Catálogo de 31 Peças Extras e verificações estruturais de compatibilidade.
- Testes de auditoria que comparam tabelas de 15 + 34 perfis com os valores oficiais.
- Procedimentos individuais para recarga, Coice, modos de disparo, propriedades especiais e exceções.

### Ainda não significa funcionalidade integrada
- Os catálogos não estão conectados a uma calculadora de Ataque/Dano na seção Combate.
- O componente atual de Testes não pode continuar decidindo Ataque por comparação com Defesa.
- O cálculo de Dano legado recebe soma numérica de dados já rolados, não oferece fluxo completo de fórmula/rolagem para todos os perfis e não cobre o tipo distinto do catálogo de armas de fogo.
- Margens críticas, dados adicionais, Operário, BI, Habilidades e Peças ainda precisam de integração calculada e testada.
- Modos de disparo e regras especiais estão em texto de procedimento; falta interface que apresente entradas e resultados de cálculo adequados sem executar decisões do Mestre.
- Armas especiais com fórmulas alternativas/condicionais (Lança-Chamas, Spark Shot, RPG-7, GM 79, Besta e outras) exigem fluxos próprios ou opções explícitas, sem inventar dano onde o livro não fornece.
- Munição, durabilidade e custos de ação devem ser apresentados conforme a regra; consumo/posse/equipamento só podem ser efetivados quando o respectivo módulo e estado forem aprovados.

## Próxima implementação — lote de Combate pré-Inventário
1. Separar calculadora de Perícia/Atributo da calculadora de Ataque. Remover da primeira a comparação com Defesa e qualquer classificação de acerto/erro de alvo.
2. Criar um catálogo unificado sem duplicar os três registros antigos de pistolas existentes em `catalogoArmas.ts`; garantir seleção dos 49 perfis e dos dois ataques universais.
3. Criar parser/avaliador de fórmulas de Dano e rolagem de dados, com suporte a expressões de dados e atributos, críticos e exceções expressas. Não inventar dano para RPG-7.
4. Integrar as regras gerais de Ataque e Dano, incluindo Luta/Pontaria, FOR/AGI, modificadores de BI, Origem, Classe, Habilidades e Peças, somente quando a entrada correspondente estiver disponível/confirmada.
5. Integrar propriedades e exceções individuais de cada arma, inclusive margens críticas ampliadas, modos de disparo, dados adicionais, recarga, Coice, ciclo manual, Perfuração, Decepamento e efeitos especiais. A Ficha calcula/apresenta; o Mestre decide consequências.
6. Integrar Arma Improvisada, Ataque Desarmado e Coronhada com fórmulas próprias e modificadores pertinentes.
7. Exibir em todos os modos fórmulas, dados de referência e modificadores; renderizar roladores somente no modo Automático, respeitando Dados Físicos/Virtuais/Mistos. Em Misto/Manual não deixar espaços vazios de roladores.
8. Criar testes unitários de cada fórmula, perfil, exceção e combinação relevante; corrigir ou complementar os testes de integração da UI.
9. Atualizar o Planejamento v2.6 em revisão documental pequena, registrando que catálogo/cálculos completos antecedem Inventário ativo e preservando a decisão de que a Ficha não é motor de combate.
10. Só depois de toda a área de Combate estar implementada, auditada e automatizada, seguir para a bateria humana integrada final e, após aprovação, iniciar Inventário ativo.

## Continuidade obrigatória
Próxima sessão: ler este checkpoint e a matriz primeiro; confirmar branch/HEAD; obter SHA exato de cada arquivo antes de qualquer escrita; inspecionar dependências e contratos; não tocar em `main`, não fazer merge/deploy/produção sem autorização; distinguir IMPLEMENTADO, TESTADO AUTOMATICAMENTE, TESTADO HUMANAMENTE e PENDENTE. Ao fim de cada ciclo, atualizar matriz e checkpoint e apresentar ao Gus para validação antes do próximo ciclo.
