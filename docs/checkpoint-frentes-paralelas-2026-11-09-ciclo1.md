# Checkpoint técnico — frentes paralelas da Ficha e catálogos

**Data:** 09/11/2026  
**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Branch:** `feat/offline-first-ficha`  
**HEAD atualizado neste ciclo:** `2a0f8d1eb7ac38a5727a519a522f82b0c2ce5fbb`  
**Protocolo:** `docs/protocolo-eficiencia-e-continuidade.md`  
**Escopo:** avanço simultâneo de Progressão, procedimentos de armas, auditoria de catálogos e cobertura de persistência.

## 1. Estado do repositório e segurança

- **HEAD confirmado:** `32853ab96c0b14340bf4b1e54d8c03e089f40743`.
- Nenhum merge para `main`, deploy ou alteração em produção.
- Nenhum teste humano integrado foi realizado; permanece adiado até a Ficha estar completa.
- Inventário ativo de Personagem continua bloqueado.
- Escritas foram feitas após conferência do HEAD e dos SHAs dos arquivos alterados.

## 2. Progressão persistente

### Implementado nesta rodada

Commits:
- `27691928c5ad0f5ba626b8bd13c9f69e9cb30885` — validação local da Progressão opcional e sincronização entre `progressao.nivelAtual` e `dados.nivel`; validação equivalente no servidor LAN; testes locais e LAN.
- `bc9c372058a96e2e5f430570026c653b230e9b08` — proteção no PUT genérico: o jogador só pode alterar diretamente `missoesCompletadas`; método, Marcos, Nível, benefícios e histórico de Morte ficam protegidos. Criação/remoção do estado exige fluxo próprio da Mesa.
- `f2a8f866f3afd719cf09c9e57c0eb8cc7e38e62f` — servidor valida também o estado de Progressão já persistido, rejeita estado corrompido/dessincronizado e compara campos protegidos sem depender da ordem das chaves JSON.
- `8d8ddb6a00c6e0687a8d932f1f9eaa18e67e1429` — testes de round-trip do estado de Progressão no backup JSON e no IndexedDB, incluindo rejeição de estado malformado.
- `32853ab96c0b14340bf4b1e54d8c03e089f40743` — endurecimento do servidor LAN: Classe e Nível também não podem ser alterados pelo PUT genérico quando a Progressão está ativa; testes tentam elevar `nivel` e `progressao.nivelAtual` juntos e trocar Classe.

### O que isso significa

- **IMPLEMENTADO:** `validacaoPersonagemLocal.ts` valida o estado de Progressão quando presente.
- **IMPLEMENTADO:** `backupFicha.ts` e `persistenciaFicha.ts` já usam essa validação comum; foram acrescentados testes específicos para Progressão.
- **IMPLEMENTADO:** servidor LAN aceita alteração do contador de Missões e impede que o salvamento genérico altere método, Marcos, Nível, benefícios ou registros de Morte.
- **PENDENTE:** estado ainda não é criado automaticamente na Ficha nem integrado à interface de Descanso Completo.
- **PENDENTE:** rota/ação administrativa própria para concessão de Marco Narrativo e fluxo próprio para aplicação de nível/Morte.

### Dependência de produto preservada

O Arquivo do Jogador v1.0, p. 101, define Marco Narrativo como método preferencial e Missões como método opcional. O checkpoint anterior registra que o Planejamento v2.5 descreve o método como adotado pela Mesa, mas o modelo atual de Mesa não tem campo correspondente e não foi recuperada decisão explícita sobre padrão para Mesas novas/existentes. Não inventar padrão. A inicialização da Progressão deve aguardar a configuração do método pela Mesa ou decisão explícita sobre seu padrão/local de configuração.

## 3. Catálogos e procedimentos de armas

### Correções feitas após auditoria das regras

Commits:
- `7fe58c24b2d52d38a3ffc0aff0b584dd49542569` — procedimentos de Spark Shot e Lança-Chamas Químico completados: reposição de Cargas ao trocar/recarregar bateria (7 ou 10 com peça) e reabastecimento por Movimento.
- `45940671c07a3aff79d0d8cc723a75db53c1eee0` — procedimento do GM 79 explicita que qualquer disparo deixa a arma vazia e exige recarga por Movimento; Besta passa a incluir geometria do Engate Triplo e trajetórias.
- `df4abbd57014ce16fa8e58661c462b865a458745` — procedimentos gerais de armas passam a consolidar faixas de alcance, exceções de Escopetas/Rifles de Precisão e regra de Durabilidade.

### Auditoria de conteúdo

- **Primeira passada concluída:** 28 itens de exploração e 15 receitas comparados às pp. 67–73 do Arquivo do Jogador v1.0; nenhuma divergência material identificada nesta rodada.
- **Parcial:** habilidades de Agente, Autodidata e Operador examinadas nas pp. 28–38; descrições verificadas não mostraram divergência material.
- **Parcial:** procedimentos de armas especiais e regras gerais das pp. 48–61 foram comparados; lacunas encontradas no guia operacional foram corrigidas nos commits acima.
- **PENDENTE:** auditoria final página a página das armas pp. 48–61, inclusive cobertura exaustiva dos procedimentos e testes de cada exceção.
- **PENDENTE:** auditoria completa de peças, munições e proteções pp. 62–66. Conferências anteriores de peças/munições não apontaram divergência material, mas não substituem o fechamento desta auditoria.

Os catálogos continuam sendo referências. Não controlam posse, munição carregada/consumida, equipamento, efeitos, rolagens ou fabricação ativa.

## 4. CI — resultados observados

### Sucesso confirmado

No commit `27691928c5ad0f5ba626b8bd13c9f69e9cb30885`:
- Verificação da Ficha offline: run [42557721250](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42557721250) — **success**.
- Compilação do WebApp: run [42557721365](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42557721365) — **success**.

No commit `45940671c07a3aff79d0d8cc723a75db53c1eee0`:
- Verificação da Ficha offline: run [42558182995](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42558182995) — **success**.
- Compilação do WebApp: run [42558182922](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42558182922) — **success**.

### Pendentes no momento deste checkpoint

Para o HEAD atual `32853ab96c0b14340bf4b1e54d8c03e089f40743`:
- Compilação do WebApp: run [42559057513](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42559057513) — **in progress** no momento da atualização.
- Verificação da Ficha offline: run [42559057480](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42559057480) — **in progress** no momento da atualização.

No commit anterior `e7094faece0a501aaf4fcc31ac48257d2a0b3aba`, os dois workflows concluíram com **success**: build [42558573130](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42558573130) e verificação offline [42558573076](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42558573076).

Também havia runs dos commits anteriores `df4abbd` e `f2a8f86` em execução no momento da consulta. Não declarar o HEAD atual aprovado até os dois workflows dele concluírem com sucesso.

## 5. Frentes seguintes — avançar em paralelo

1. **Progressão:** proteger Classe e Nível no salvamento genérico está concluído no servidor. Próximo: inspecionar organização/persistência de Mesa para desenhar a configuração explícita do método; não inicializar Progressão até essa escolha estar definida. Depois integrar concessão de Marco, aplicação atômica no Descanso Completo e Morte.
2. **Criação da Ficha:** continuar Origem, Classe, Perícias e Treinamento sem duplicar os catálogos existentes.
3. **Habilidades:** completar a auditoria das descrições e integrar efeitos à Ficha/Combate; o catálogo atual já possui as habilidades por Classe e avaliadores de pré-requisitos.
4. **Combate:** integrar ataques, dano, crítico, RD, BI, condições, durabilidade e estados de turno; preservar rolagens sob controle do jogador e modos de funcionamento.
5. **Descanso/recuperação:** integrar progressão e efeitos temporais apenas quando os contratos de Mesa e Progressão estiverem definidos.
6. **Catálogos:** concluir auditoria de armas e equipamentos e ampliar testes automatizados apenas onde houver lacuna real.
7. **Qualidade:** acompanhar CI por HEAD integrado; evitar testes humanos intermediários repetitivos.

A execução deve manter as frentes independentes em paralelo e sincronizar apenas alterações que compartilhem arquivos ou contratos.

## 6. Limites

- Nenhuma alteração em `main`, merge, deploy ou produção.
- Nenhuma alteração de cânone.
- Nenhum teste humano integrado declarado.
- Inventário ativo permanece bloqueado até conclusão da Ficha, auditorias, testes automatizados e uma única validação humana integrada final.


---

## 7. Aditivo — ciclo de correções e auditoria (09/11/2026)

**HEAD confirmado:** `2a0f8d1eb7ac38a5727a519a522f82b0c2ce5fbb`  
**Branch:** `feat/offline-first-ficha`

### 7.1 Correção de autorização no servidor LAN

Commit `1eea99f48db1cd6268cde1d397adcf16adf8131f`:
- Em `server/personagens-local.mjs`, a proteção contra alteração genérica de `classe` e `nivel` foi movida para antes da validação de coerência do novo estado de Progressão.
- Resultado: tentativas não autorizadas são recusadas com 403 antes de qualquer erro de coerência (422), mantendo a semântica de autorização.
- CI deste commit: build [42602700131](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42602700131) e offline [42602700133](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42602700133) — **success**.

### 7.2 Correção da segunda Perícia do Amnésico

Commit `530a2bcaeac66eab6224d823a464cad78b7c724f`:
- Fonte: Arquivo do Jogador v1.0, p. 23. A segunda Perícia escolhida pelo Amnésico amplia as opções de Perícia permitidas pela Classe, mas não recebe Treinamento gratuito.
- `src/pericias.ts`: removido o bônus de Treinamento decorrente de `periciaOrigemExtra`; parâmetro mantido por compatibilidade da API.
- `src/periciasCriacao.ts`: a segunda Perícia pode receber até 2 pontos da Classe, permitindo alcançar Mestre.
- `src/EditorAtributosPericiasLocal.tsx`: limite e exibição ajustados para não conceder Treinamento gratuito à segunda Perícia.
- `tests/pericias-criacao.test.mjs`: cobre ausência de Treinamento gratuito e progressão até Mestre.
- Commit `b9107eb0d2a3fb6990668153c837c59f1dfe8859` atualizou `tests/pericias.test.mjs`, que ainda esperava a regra antiga. O CI confirmou o alinhamento.

### 7.3 Validação de persistência da Perícia extra

Commit `2a0f8d1eb7ac38a5727a519a522f82b0c2ce5fbb`:
- `tests/validacao-personagem-local.test.mjs` agora verifica que Amnésico com Treinamento gratuito em Investigação e segunda Perícia Vontade pode distribuir 2 pontos de Classe em Vontade e alcançar Mestre.
- Também verifica rejeição de grau acima do limite e de escolha duplicada da Perícia de Origem.

### 7.4 CI confirmado no HEAD

Para `2a0f8d1eb7ac38a5727a519a522f82b0c2ce5fbb`:
- Build [42607155605](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42607155605) — **success** (PostgreSQL local, build e verificação de tipos concluídos).
- Verificação offline [42607155590](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42607155590) — **success**.

### 7.5 Auditoria de catálogos — páginas 62–67

Comparação direta com o Arquivo do Jogador v1.0:
- Peças Extras (pp. 62–64): 31 entradas — 5 genéricas corpo a corpo, 16 genéricas de armas de fogo e especiais, 10 específicas. Compatibilidades, efeitos, custos e regras de instalação conferidos; nenhuma divergência material identificada nesta rodada.
- Munições (pp. 65–66): 13 entradas; quantidades por Espaço, preços, pilhas compartilhadas de Cartuchos GM 79, reserva abstrata, cargas da Spark Shot e efeitos dos cartuchos conferidos; nenhuma divergência material identificada.
- Proteções (pp. 66–67): quatro coletes convencionais e quatro configurações Kendo; Defesa, RD, contribuição de AGI, custos e ausência de Durabilidade conferidos; nenhuma divergência material identificada.
- Lanternas (p. 67): Simples, Grande, de Bolso, de Cabeça e Policial conferidas, incluindo a distinção da Lanterna Tática como Peça Extra; nenhuma divergência material identificada.
- Testes correspondentes existentes em `tests/catalogo-pecas.test.mjs`, `tests/catalogo-municoes.test.mjs`, `tests/catalogo-coletes.test.mjs` e `tests/catalogo-procedimentos-equipamentos.test.mjs`.

### 7.6 Auditoria de armas — primeira passada

- Leitura comparativa das regras gerais e tabelas/descritivos das pp. 48–61 iniciada.
- Primeira passada conferiu as tabelas de armas corpo a corpo, pistolas 9 mm, escopetas, submetralhadoras, rifles, rifles de precisão, Magnums e armas especiais contra `src/catalogoArmas.ts`, `src/catalogoArmasFogo.ts` e `src/catalogoProcedimentosArmas.ts`.
- Não foi identificada divergência material nas entradas conferidas nesta passada.
- **PENDENTE:** auditoria exaustiva individual de todas as armas, propriedades, custos de recarga/Coice, exceções de Perfuração, Disparo Cadenciado, Rajada, Decepamento, Morte Instantânea e peças específicas. Não considerar auditoria de armas encerrada.

### 7.7 Configuração de Progressão por Mesa

Inspeção de `src/servidorLocal.ts`, `src/ConexaoServidorLocal.tsx` e `server/auth-local.mjs`:
- O modelo atual de Mesa expõe `creationMethod` (`padrao` / `regra_da_casa`) e `maxLevel`; o banco possui `metodo_criacao` e `nivel_maximo`.
- Nenhum campo de Mesa para método de Progressão foi localizado.
- Não confundir `creationMethod` com o método de Progressão.
- **PENDENTE / decisão de produto:** definir configuração do método de Progressão por Mesa e comportamento para Mesas existentes/novas antes de inicializar o estado persistente ou integrar concessão de Marcos e avanço de Nível. A preferência pelo Marco Narrativo nos livros não autoriza presumir silenciosamente um padrão técnico sem reconciliar o Planejamento v2.5.

### 7.8 Situação e próximas ações

- Branch isolada; sem merge para `main`, deploy ou alterações em produção.
- Nenhum teste humano integrado; permanece adiado até a Ficha completa.
- Inventário ativo permanece bloqueado.
- Próximas ações paralelas:
  1. Criação: continuar auditoria e integração de Origem/Classe/Perícias/Treinamento; cobrir também validação do servidor.
  2. Habilidades: completar auditoria de descrições e mapear efeitos ainda não integrados.
  3. Combate: continuar integração de ataques/dano/defesa/condições sem rolagens automáticas.
  4. Armas: fechar auditoria individual das pp. 48–61 e reforçar testes por exceção.
  5. Progressão: não implementar escolha de método até decisão de produto e contrato da Mesa estarem definidos.
  6. Ao consolidar próximo lote, acompanhar CI pelo HEAD exato e atualizar este checkpoint.
