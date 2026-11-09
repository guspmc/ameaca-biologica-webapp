# Checkpoint — Auditoria de Ataque e Dano (09/11/2026)

## Estado técnico
- Repositório: `guspmc/ameaca-biologica-webapp`
- Branch: `feat/offline-first-ficha`
- HEAD de código inspecionado: `88c5f0a96ba5492a26ee6fb145f708680f67d56b`.
- Arquivos de código lidos nesta auditoria: `src/CalculadoraTesteLocal.tsx`, `src/FichaLocal.tsx`, `src/testes.ts`, `src/rolagemDados.ts`, `src/pericias.ts`, `src/efeitosOrigens.ts`, `src/armaOperario.ts`, `src/equipamento.ts`, `src/habilidades.ts`, `src/funcionamentoFicha.ts`, `src/condicoesFicha.ts`.
- Testes lidos: `tests/ataques-calculadora.test.mjs`, `tests/roladores-ficha.test.mjs`.
- Nenhum arquivo de código foi alterado neste ciclo.
- CI do código de Exposto (`411a78efc1b16b85639c72c90d3c053b44e0c63a`): consulta de status e workflows não retornou verificações; permanece **PENDENTE / não observado**.
- Sem merge para `main`, deploy, alteração de produção ou testes humanos.

## Fonte normativa consultada
Arquivo do Jogador v1.0:
- p. 48: Ataque Corpo a Corpo = `1d20 + Luta + modificadores`; dano normalmente = dados da arma + FOR. Ataque à distância = `1d20 + Pontaria + modificadores`; dano normalmente = dados da arma + AGI. Regra específica da arma prevalece. Armas informam multiplicador e podem alterar margem crítica.
- pp. 50–51: catálogo de armas corpo a corpo e propriedades individuais.
- p. 52: Arma Improvisada, Ataque Desarmado e Coronhada; Ataque Desarmado padrão sofre Desvantagem; danos e multiplicadores próprios.
- pp. 53–61: tabelas e perfis de armas de fogo e especiais.
- pp. 43–45: Luta (FOR) e Pontaria (AGI), com Ataque contra Defesa.
- pp. 80–81: Reações são declaradas após conhecer o resultado do Ataque e antes do Dano/BI/Condições; 20 natural fecha a janela de Reações defensivas normais; Falha Crítica é 1 natural, falha automática e Exposto salvo regra específica; Acerto Crítico padrão 20 natural, sucesso automático em Ataque, fecha Reações defensivas normais e aplica multiplicador do dano total da arma; margens ampliadas 19–20 exigem que 19 ainda alcance Defesa e não fecham a janela de Reação.
- p. 81: progressão de categorias de dados de Dano.

## Achados técnicos
1. `valorBasePericia` já soma Atributo associado e Treinamento. Luta usa FOR; Pontaria usa AGI. Não somar Atributo uma segunda vez.
2. `CalculadoraTesteLocal` atualmente oferece Ataque Corpo a Corpo e à distância dentro da calculadora genérica de Perícia/Atributo, pede uma DT/Defesa do alvo e compara o total com ela. Isso precisa ser revisto frente à decisão de produto: a Ficha apresenta a rolagem e o total; não decide acerto/erro contra a Defesa de uma criatura nem resolve o combate. O Jogador/Mestre fazem essa interpretação na mesa.
3. A interface atual descreve 20 natural como crítico e fechamento das Reações; isso é compatível com a regra geral. Ainda falta suportar margens específicas de armas (ex.: 19–20), e não é seguro fazê-lo sem perfil de arma realmente equipado e seus efeitos.
4. `calcularTesteManual` classifica 1 natural como Falha Crítica, mas seu texto genérico inclui Exposto como consequência. Isso conflita com a decisão expressa do Gus: Exposto automático somente em Falha Crítica de Ataque no modo Automático; em Testes comuns de Perícia/Atributo e nos modos Misto/Manual a ativação é manual. A classificação da Falha Crítica deve permanecer; a consequência de Exposto deve ser desacoplada do texto genérico.
5. `src/armaOperario.ts` contém somente a lista de armas elegíveis à escolha da Origem Operário; não é um catálogo mecânico nem indica arma equipada.
6. `src/equipamento.ts` contém projeção do equipamento inicial para criação, não Inventário ativo. Os itens são explicitamente guardados/não equipados; não podem alimentar Ataques ou Dano como se estivessem equipados.
7. `src/habilidades.ts` contém descrições de Habilidades Básicas, mas seus efeitos de armas/Peças não estão integrados ao cálculo de Ataque/Dano. Ex.: Armeiro concede +1 no Teste de Ataque por Peça Extra instalada; a aplicação depende de arma modificada efetivamente identificada.
8. A seção Combate de `FichaLocal` ainda declara Ataques e Dano “A integrar”; o texto também afirma que equipamento inicial não significa arma equipada.
9. Roladores integrados existentes cobrem Iniciativa e Rolador Livre; a calculadora genérica cobre Perícia/Atributo e ainda tem caminhos de Ataque. Não existe módulo isolado de cálculo de Dano identificado nesta auditoria.
10. Os testes de Ataque existentes são principalmente verificações de estrutura/texto; não foi observada cobertura runtime para uma sequência de Ataque, nem motor isolado de Dano.

## Decisões preservadas
- Ficha é caderno/calculadora, não motor de jogo.
- Não compara Defesa de alvo nem declara acerto/erro da criatura, não abre/fecha janela de Reação, não aplica Dano/RD/BI/PV nem resolve consequências narrativas.
- Rolagem de Ataque pode apresentar resultado natural e total; o Mestre/Jogador comparam com a Defesa e resolvem a sequência.
- Exposto: decisão já aprovada no checkpoint anterior; apenas Falha Crítica em Ataque, somente no modo Automático, ativa automaticamente. Falha Crítica em Teste comum não ativa Exposto automático.
- Inventário ativo e Baú continuam adiados até depois do Painel do Mestre. Não presumir arma equipada, munição carregada, Peças instaladas ou colete vestido.
- Nenhuma regra nova foi criada neste ciclo.

## Estado por categoria
- **AUDITORIA NORMATIVA:** primeira passada de Ataque/Dano e suas referências concluída; falta fechar cruzamento exaustivo de propriedades de armas, Peças, Habilidades e exceções.
- **IMPLEMENTADO:** nada neste ciclo.
- **TESTES AUTOMATIZADOS:** arquivos existentes inspecionados; execução da suíte/build não foi realizada nesta auditoria.
- **CI:** pendente/não observada para o SHA de código citado acima.
- **VALIDADO HUMANAMENTE:** pendente, reservado à bateria integrada final.

## Próxima implementação proposta
1. Separar a rolagem de Ataque da calculadora genérica de DT: manter Luta/Pontaria, dados físicos/virtuais/mistos, Vantagem/Desvantagem e total, sem pedir Defesa nem decidir acerto/erro.
2. Manter resultado natural 1/20 para Falha Crítica/Acerto Crítico padrão e acionar Exposto somente pela regra já aprovada. Margens ampliadas ficam pendentes até existir seleção real de arma equipada.
3. Desacoplar Exposto do texto genérico de `calcularTesteManual`, para não sugerir automação em Testes comuns.
4. Implementar cálculo puro de Dano apenas quando a entrada estiver explicitamente disponível e validada (perfil de arma selecionado/identificado, dados de Dano e bônus aplicáveis). Até lá, mostrar regra de referência e estado “depende de arma equipada”; não simular arma.
5. Auditar em paralelo o catálogo de armas/Peças/Habilidades e preparar matriz de exceções sem alterar Inventário ativo.

## Continuidade
Na próxima sessão, ler este checkpoint e `docs/matriz-estado-e-pendencias-2026-11-09.md`; confirmar branch e HEAD; conferir SHA de cada arquivo antes de qualquer escrita; inspecionar dependências e testes. Não reabrir decisões aprovadas sem evidência. Não iniciar testes humanos isolados. Apresentar o checkpoint ao Gus e aguardar validação antes de avançar ao próximo ciclo.

## Segurança e publicação
Não alterar `main`, não fazer merge, não publicar e não tocar em produção sem autorização expressa.
