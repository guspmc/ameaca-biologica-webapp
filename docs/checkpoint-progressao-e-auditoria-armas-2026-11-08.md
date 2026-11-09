# Checkpoint técnico — auditoria de armas e preparação da Progressão — 08/11/2026

**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Branch:** `feat/offline-first-ficha`  
**HEAD conferido antes deste registro:** `53b48bda7cd0d924a8d22c42f1a627d2a131e046`  
**Escopo deste ciclo:** revalidar CI da migração de Combate, auditar armas de fogo/especiais pp. 55–61 do Arquivo do Jogador v1.0 e mapear a lacuna entre avaliadores de Progressão e sua aplicação persistente na Ficha.

## 1. CI — migração de estados legados de Combate

Os dois workflows executados no commit de referência concluíram com sucesso:

- Compilação do WebApp: run [42530391971](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42530391971) — `success`.
- Verificação da ficha offline: run [42530392033](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42530392033) — `success`.

O commit `53b48bda7cd0d924a8d22c42f1a627d2a131e046` é o HEAD confirmado da branch neste checkpoint. A migração tem cobertura automatizada para formatos legados reconhecidos e preservação do estado legado na validação LAN. Isso não substitui reteste humano integrado.

## 2. Auditoria do catálogo de armas de fogo e especiais

Arquivos inspecionados:
- `src/catalogoArmasFogo.ts`
- `tests/catalogo-armas-fogo.test.mjs`

Fonte conferida: Arquivo do Jogador v1.0, Capítulo 3, pp. 55–61.

### Resultado

A comparação das tabelas e descrições das páginas 55–61 com os 34 perfis do catálogo não revelou divergência material nesta rodada.

Pontos conferidos:
- Escopetas: dano, crítico, capacidade, alcance, mãos, espaços, peças, durabilidade, bombeamento, coronha, Coronhada e custos de Coice.
- Submetralhadoras: TMP e Gal com empunhadura 1/2; MP5 e Chicago Sweeper com 2 mãos; modos de disparo e exceções.
- Rifles: dados de dano, capacidade, alcance, modos de disparo e lançador integrado do Bear Commander.
- Rifles de Precisão: alcance Muito Longo, Mira Telescópica, Coice e Manejar Ferrolho.
- Magnums: capacidades, mãos, espaços, recargas, Coice, propriedades especiais e modularidade da Requiem.
- Armas Especiais: Besta, GM 79, Lança-Chamas Químico, Redemption, RPG-7 e Spark Shot, incluindo suas regras próprias.

Os testes existentes verificam contagem, categorias e exemplos representativos. A auditoria manual não equivale a uma bateria exaustiva de testes de cada campo dos 34 perfis.

**Limite funcional:** o catálogo continua sendo referência. Não administra posse, arma equipada, munição carregada/consumida, instalação de peças, recarga ou resolução de ataques. Esses comportamentos pertencem à futura integração do Combate e do Inventário.

## 3. Progressão — situação real encontrada

Arquivos inspecionados:
- `src/progressaoHabilidades.ts`
- `src/progressaoCriacao.ts`
- `src/progressaoMorte.ts`
- `src/DescansoFichaLocal.tsx`
- `src/descansoFicha.ts`
- `src/FichaLocal.tsx`
- `src/validacaoPersonagemLocal.ts`
- testes de Progressão, Morte e Descanso.

### Implementado

- Avaliadores de requisito por Missões ou Marco Narrativo.
- Requisitos cumulativos de Missões para níveis 1–10.
- Verificação da exigência de Descanso Completo em Sala de Descanso.
- Seleção/validação de Habilidades por grau, Classe, Ramo e pré-requisitos.
- Validadores e aplicadores puros de ganhos de Atributo e Perícia.
- Planejamento de criação em nível superior, separado da progressão de campanha.
- Planejamento da perda de nível por Morte a partir de benefícios exatos fornecidos; penalidade especial de Morte no nível 1.

### Pendente

- Estado de Progressão da campanha integrado ao modelo persistido da personagem.
- Interface para método de progressão, contador editável de Missões e concessão de Marco Narrativo.
- Seleção dos ganhos no momento da subida de nível.
- Aplicação atômica de Nível, Habilidade, Atributo e Perícia durante Descanso Completo em Sala de Descanso.
- Histórico durável, validado e imutável dos benefícios adquiridos em cada nível.
- Registro de Morte e reversão exata dos benefícios do último nível, sem adivinhação.
- Registro da nova Missão/Marco posterior à Morte para impedir recuperação imediata com progresso anterior.
- Validação e compatibilidade desses novos campos no backup JSON, IndexedDB e servidor LAN.

O componente atual `DescansoFichaLocal.tsx` restaura PV/SA, encerra PV Temporários e renova usos limitados após confirmação do salvamento. Ele não aplica Progressão e informa que progressões temporais ainda não são atualizadas automaticamente.

## 4. Base canônica para o próximo incremento

O Arquivo do Jogador v1.0, p. 101, determina que:
- o método preferencial é Marco Narrativo concedido pelo Narrador;
- a contagem de Missões é opcional;
- a subida só é aplicada no próximo Descanso Completo em Sala de Descanso;
- após perder nível por Morte, o progresso anterior permanece, mas é necessária ao menos uma nova Missão ou um novo Marco após a Morte para recuperar o nível.

A implementação deverá preservar a distinção entre requisito alcançado e benefício efetivamente aplicado. O contador de Missões não pode subir nível automaticamente nem aplicar ganhos fora do Descanso válido.

## 5. Próximo ciclo de implementação

1. Definir e testar o contrato versionado do estado de Progressão e do histórico de benefícios por nível.
2. Integrar o contrato à validação de personagem e ao backup sem reinterpretar registros legados.
3. Implementar a aplicação transacional de um único nível no Descanso Completo válido.
4. Adicionar interface de escolhas de Habilidade, Atributo e Perícia, sem rolagens presumidas.
5. Implementar registro/reversão por Morte usando exclusivamente o histórico exato.
6. Auditar o resultado e atualizar este checkpoint antes de avançar para outra categoria.

## 6. Segurança e limites

- Nenhuma alteração em `main`, merge ou publicação.
- Nenhuma alteração no cânone.
- Nenhuma validação humana integrada declarada.
- Inventário ativo continua bloqueado até fechamento das dependências de ficha/Combate, auditorias, testes automáticos e validação humana integrada.
