# Checkpoint técnico — frentes paralelas da Ficha e catálogos

**Data:** 09/11/2026  
**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Branch:** `feat/offline-first-ficha`  
**HEAD no início deste checkpoint:** `8d8ddb6a00c6e0687a8d932f1f9eaa18e67e1429`  
**Protocolo:** `docs/protocolo-eficiencia-e-continuidade.md`  
**Escopo:** avanço simultâneo de Progressão, procedimentos de armas, auditoria de catálogos e cobertura de persistência.

## 1. Estado do repositório e segurança

- **HEAD confirmado:** `8d8ddb6a00c6e0687a8d932f1f9eaa18e67e1429`.
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

Para o HEAD atual `8d8ddb6a00c6e0687a8d932f1f9eaa18e67e1429`:
- Compilação do WebApp: run [42558502719](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42558502719) — **in progress**.
- Verificação da Ficha offline: run [42558502649](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42558502649) — **in progress**.

Também havia runs dos commits anteriores `df4abbd` e `f2a8f86` em execução no momento da consulta. Não declarar o HEAD atual aprovado até os dois workflows dele concluírem com sucesso.

## 5. Frentes seguintes — avançar em paralelo

1. **Progressão:** após CI, inspecionar o modelo e persistência de Mesa para implementar a configuração explícita do método; depois integrar criação do estado, contador de Missões, concessão de Marco, aplicação atômica no Descanso Completo e Morte.
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
