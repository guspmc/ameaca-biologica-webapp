# Matriz de implementação, auditoria e testes — 09/11/2026

**Projeto:** Ameaça Biológica RPG — WebApp/PWA  
**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Branch:** `feat/offline-first-ficha`  
**HEAD-base inspecionado:** `6bd0805ea4183043e0c8314f40e5a5459b8ec446`  
**Finalidade:** inventário rastreável do que falta implementar, auditar e validar, evitando redescoberta entre ciclos.

## 1. Como interpretar esta matriz

- **IMPLEMENTADO:** há código identificável na branch.
- **TESTADO AUTOMATICAMENTE:** há testes correspondentes; a CI do HEAD-base passou.
- **AUDITORIA PARCIAL:** houve comparação com fonte oficial, mas não fechamento exaustivo.
- **PENDENTE DE INTEGRAÇÃO:** módulos existem isoladamente, mas ainda não compõem o fluxo funcional completo.
- **PENDENTE HUMANO:** depende de navegador, aparelho, rede ou observação humana. A bateria integrada está deliberadamente adiada até a Ficha estar completa.
- **DECISÃO PENDENTE:** não implementar por suposição.

A hierarquia normativa é: Arquivo do Jogador v1.0 e Arquivo do Mestre v1.0; decisões funcionais expressamente aprovadas; Planejamento v2.6 como guia de implementação aprovado para orientar o trabalho, com palavra final por deliberação conjunta; protótipos congelados apenas como referência visual; código e checkpoints como evidência técnica. Livro oficial prevalece sobre protótipo e código.

## 2. Ficha do Jogador — implementação restante

### 2.1 Criação e identidade

**Já existe**
- Ficha contínua com seções Características, Atributos e Perícias, Combate e Inventário.
- Editores de Classe, Origem, Habilidade Básica, Identidade, Atributos, distribuição de Perícias e equipamento inicial.
- Revisão da criação, validação local e conferência/ativação LAN.
- Planejamento de criação em nível superior, separado do fluxo de criação de nível 1.
- Validação de Origem Operário e arma exigida; regra do Amnésico e Perícia adicional foram corrigidas em ciclos anteriores.

**Falta**
- Auditoria mecânica integral da criação de nível 1 contra todas as opções, exceções e fórmulas do Arquivo do Jogador.
- Conferir que todos os benefícios de Origem e Classe repercutem nos valores derivados e nos módulos consumidores, sem duplicar bônus.
- Fechar a distinção entre planejamento de criação em nível superior e Progressão real de uma Personagem ativa.
- Revisar consistência entre criação local, validação de servidor, revisão de ativação e inventário inicial materializado.

**Testes**
- Automatizar combinações e casos-limite de Classe × Origem × Atributos × Perícias × Habilidade × equipamento.
- Cobrir migração e compatibilidade de rascunhos antigos.
- Teste humano de criação completa será feito somente na bateria integrada final.

### 2.2 Atributos, Perícias e Habilidades

**Já existe**
- Distribuição inicial de Atributos e Pontos de Perícia.
- Cálculo de Perícias e valores passivos.
- Catálogo de Habilidades Básicas e catálogo de progressão para Básicas, Avançadas, Superiores e Avassaladoras.
- Avaliadores de pré-requisitos, ramo, Classe e grau.
- Planejador de escolhas de Habilidades para rascunhos de criação em nível superior.

**Falta**
- Completar auditoria de todas as Habilidades e suas interações.
- Completar a integração de efeitos de Habilidades nos módulos que os consomem: testes, ações, combate, recursos, descanso e equipamentos.
- Separar claramente efeito informativo de efeito mecânico já aplicado; não exibir como ativo um efeito ainda não integrado.
- Integrar ganhos de Atributo e Perícia por Progressão, com histórico exato de valores anteriores.
- Conferir se bônus de fontes distintas acumulam ou não conforme cada regra, sem generalização indevida.

**Testes**
- Cobertura de pré-requisitos, incompatibilidades, escolhas repetidas, limites de Atributo e Perícia, e efeitos de cada Habilidade.
- Testes de regressão de todas as Classes e Origens após integrar efeitos.
- Não solicitar reteste humano isolado de Classes/Habilidades antes da bateria final.

### 2.3 Recursos, Bio-Infecção, Condições, Reanimação e Descanso

**Já existe**
- Módulos de PV, SA, BI, Defesa derivada e fase de Bio-Infecção.
- Painel unificado de Condições com confirmação, fonte/causa, duração/critério e histórico.
- Reanimação com avaliadores e interface.
- Descanso Parcial e Completo; renovação de usos limitados.
- Validação de Condições e estados relacionados.

**Falta**
- Integrar efeitos de Habilidades, equipamentos e combate nos recursos derivados sem duplicação.
- Fechar integração de Reanimação com estados de combate e consequências de Morte.
- Integrar Progressão ao Descanso Completo válido na Sala de Descanso.
- Garantir encerramento de Condições somente nos critérios e momentos previstos; BI/infecções não são limpas genericamente por descanso.
- Revisar todos os casos de alteração de PV/SA/BI por ataques, itens, descanso, reanimação e habilidades.

**Testes**
- Testes de tabela para todas as fases de BI e modificadores.
- Condições duplicadas, duração independente, encerramento e preservação de histórico.
- Descanso Parcial/Completo, limites, dados físicos, modos de dados e persistência.
- Reanimação, PV 0, sucesso/falha e interações de Origem/Habilidade.
- A correção de compatibilidade de `crypto.randomUUID` possui teste automatizado; repetição em Android/WebView continua pendente para a bateria humana final.

### 2.4 Progressão de Nível — prioridade estrutural

**Já existe**
- `src/progressaoHabilidades.ts`: elegibilidade, pré-requisitos, ganhos por nível e avaliação das escolhas.
- `src/progressaoPersistente.ts`: contrato versionado v1, histórico de benefícios, contador de Missões, método e dados de Morte.
- `src/progressaoMorte.ts`: planejamento seguro da perda de nível e validação dos benefícios que precisam ser revertidos.
- Validação local da Progressão quando presente no registro da Personagem.
- Backup JSON e IndexedDB usam a validação comum; testes de round-trip foram adicionados.
- Servidor LAN protege o estado no PUT genérico: apenas `missoesCompletadas` pode ser editado diretamente pelo Jogador; Classe, Nível, método, Marcos, benefícios e histórico de Morte exigem fluxos próprios.
- O servidor rejeita Progressão persistida inválida ou dessincronizada.

**Falta**
1. Definir a configuração do método de Progressão por Mesa. O contrato atual da Mesa tem `creationMethod` e `maxLevel`, mas não o método de Progressão. Não confundir método de criação com método de Progressão.
2. Resolver a decisão para Mesas existentes e novas; o Arquivo do Mestre prefere Marco Narrativo, Missões é opcional. Não inicializar estado com um padrão técnico inventado.
3. Inicializar Progressão em Personagens elegíveis sem quebrar fichas antigas.
4. Criar fluxos próprios para concessão/reconhecimento de Marco Narrativo e edição do contador conforme a regra aprovada.
5. Integrar a elegibilidade e a aplicação atômica de nível ao Descanso Completo na Sala de Descanso.
6. Integrar escolhas de Habilidade, Atributo e Perícia e registrar exatamente o benefício aplicado em cada nível.
7. Persistir tudo em IndexedDB/backup e LAN, com revisão, autorização, concorrência e migração estrita.
8. Integrar nível máximo configurado na Mesa, respeitando o limite da campanha.
9. Preservar cronologia de Missões/Marcos após Morte para exigir progresso posterior real.

**Testes**
- Elegibilidade nos requisitos acumulados de Missões e por Marco Narrativo.
- Não subir automaticamente ao editar contador.
- Não evoluir fora de Descanso Completo válido/Sala de Descanso no método de Missões.
- Aplicação atômica: falha não deixa nível ou benefício parcialmente aplicado.
- Duas sessões concorrentes, repetição de pedido, resposta de rede ambígua e revisão antiga.
- Backup/importação e migração de fichas sem Progressão.
- Autorização entre Jogador e Mestre.

**Decisão pendente:** método de Progressão por Mesa e política de inicialização para Mesas antigas/novas.

### 2.5 Consequência de Morte

**Já existe**
- Modelo de benefício por nível e avaliador que planeja a reversão.
- Regra de penalidade -2 para Morte no nível 1.
- Validação do estado persistente e bloqueios no salvamento genérico.

**Falta**
- Fluxo de registro de Morte LAN exclusivo do Mestre.
- Fluxo de Morte Offline iniciado pelo Jogador, com confirmação e marca local/não confirmada.
- Aplicar reversão real dos benefícios do nível perdido, sem adivinhar escolhas.
- Registrar snapshot/cronologia para exigir Missão ou Marco posterior à Morte.
- Encerrar penalidade de nível 1 somente quando a recuperação for válida.
- Reconciliação Offline/LAN sem sobrescrever ou duplicar consequências.

**Testes**
- Morte em cada nível, especialmente 1, 2 e níveis com ganhos múltiplos.
- Reversão exata de Habilidade, Atributo e Perícia.
- Histórico ausente/corrompido deve bloquear reversão automática e preservar dados.
- Progresso anterior à Morte não pode satisfazer requisito posterior.
- Morte local conflitante com registro LAN e repetição de operação.

## 3. Combate — implementação restante

### Já existe
- Economia de ações, SA/Esforço e estado persistente de turno.
- Manobras operacionais: Desengajar, Disparada, Fuga, Mirar, Ataque, Ajudar, Usar Objeto e Combate com Duas Armas.
- Iniciativa com entrada manual de d20 e soma de AGI; sem rolagem automática.
- Calculadora manual para tipos de Teste já implementados.
- Reações e Ataque de Oportunidade possuem avaliadores.
- Painel de ações registra gastos e lembretes de Condições.
- Procedimentos de armas e ataques universais estão em catálogos de consulta.

### Falta integrar
1. Fluxo completo de Iniciativa da Mesa: participantes, desempates, re-rolagem quando aplicável, ordem e persistência.
2. Ataque contra Defesa de alvo e registro da origem do ataque.
3. Janela de Reação após resultado conhecido e antes de Dano/BI/Condições.
4. Defesa ativa: Aparar, Esquiva quando habilitada, Contra-Ataque e Ataque de Oportunidade integrados ao turno.
5. Cálculo/registro de Dano, crítico, multiplicadores, Dano Massivo, RD, BI e PV.
6. Munição carregada, recarga e consumo por modo de disparo, respeitando as exceções de cada arma.
7. Durabilidade por Aparar e manutenção, incluindo Hatchet Indestrutível.
8. Efeitos de Habilidades, Peças, Condições e propriedades de armas no cálculo.
9. Duração de Condições por turnos/rodadas com administração manual do Mestre, sem expiração automática indevida.
10. Estado de combate compartilhado na LAN e consistência com a Ficha do Jogador e Painel do Mestre.

### Testes
- Testes unitários de cada etapa e sequência válida/inválida.
- Crítico natural 20 e margens ampliadas por 19, sem confundir os efeitos.
- Reação em ataque que erra e fechamento da janela em 20 natural.
- Dano Massivo e Decepamento sem morte/amputação inventada.
- Defesa, RD, BI, PV, munição, Durabilidade e custos de ação.
- Combate com Duas Armas e exceções de Habilidades.
- Persistência e concorrência em duas sessões.
- Teste integrado automatizado de um encontro completo, com entradas manuais e sem rolagens ou efeitos não autorizados.

**Limite:** não implementar automação narrativa, rolagem presumida ou aplicação automática de efeitos que pertencem ao Jogador/Mestre.

## 4. Catálogos e auditoria contra os livros

### 4.1 Armas — Arquivo do Jogador pp. 48–61

**Já existe**
- 15 perfis de armas corpo a corpo e 34 perfis de armas de fogo/especiais.
- Procedimentos para armas, regras gerais, recarga, Coice, modos de disparo, exceções e regras especiais.
- Catálogo separado para Arma Improvisada e Ataque Desarmado, conforme p. 52.
- Testes de cobertura estrutural e exceções identificadas.

**Auditoria**
- Regras gerais pp. 48–52: primeira passada e correções recentes; continuar conferência exaustiva de alcance, Durabilidade, saque/guarda, Recarga, Coice, ciclo manual, Disparo Cadenciado, Rajada, Perfuração, Decepamento, Carnificina, coronhada e ataques universais.
- Armas corpo a corpo pp. 50–51: conferir linha a linha valores de dano, crítico, mãos, Espaços, Peças, Durabilidade, alcance, aquisição e propriedades individuais.
- Pistolas pp. 53–54; Escopetas p. 55; Submetralhadoras p. 56; Rifles/Rifles de Precisão pp. 57–58; Magnums pp. 59–60; Armas Especiais pp. 60–61: conferir cada perfil e exceção individual, inclusive recarga, munição, modo de disparo, mãos, coronha, Coice e propriedade especial.
- Confirmar testes para toda exceção real; não criar testes redundantes para texto sem comportamento mecânico.

### 4.2 Peças, munições, coletes e lanternas — pp. 62–67

**Já existe**
- 31 Peças Extras, 13 tipos de munição, 8 configurações de colete e 28 itens de exploração.
- Procedimentos de instalação/troca, munição de reserva, proteções e uso de itens.

**Auditoria**
- A comparação de peças, munições, coletes e lanternas foi registrada como primeira passada sem divergência material no checkpoint de 09/11.
- Falta fechamento final cruzado com todas as compatibilidades e exceções, verificando se os procedimentos não conflitam com o catálogo principal.
- Itens de exploração precisam de auditoria final integrada com suas regras de uso e ausência de custos não especificados.

### 4.3 Receitas e fabricação — pp. 71–73

**Já existe**
- 15 receitas e regras gerais de fabricação medicinal e de armamento.
- Testes de ingredientes, DT, tempo, requisitos e efeitos catalogados.

**Auditoria/testes pendentes**
- Fechar revisão linha a linha de cada receita e requisito.
- Verificar falha, consumo/preservação de ingredientes, tempo, exceções por Habilidade e requisitos de local/ferramenta.
- Confirmar que o catálogo não executa fabricação nem consome materiais.

### Limite dos catálogos
Catálogo é referência. Não significa posse, quantidade no Inventário, arma equipada, munição carregada, consumo, transferência, fabricação ativa ou efeito já aplicado na ficha.

## 5. Inventário ativo e Baú — bloqueados por dependência

**Já existe**
- Planejamento de equipamento inicial e compras no rascunho.
- Cálculo de capacidade e ocupação na prévia de criação.
- Materialização transacional do Inventário inicial durante ativação LAN.
- Catálogos e procedimentos necessários como referência.
- Módulos de domínio/consulta/organização foram identificados no repositório, mas não equivalem ao fluxo ativo integrado.

**Falta**
- Inventário ativo contínuo da Personagem: grade, ocupação, itens, equipamentos, munição, uso, combinação, fabricação e transferência conforme regras.
- Integrar Habilidades, capacidade, expansões, peças, coletes e estados de equipamento.
- Operações atômicas e idempotentes para ações que movem/consomem múltiplos itens.
- Morte/perda/recuperação de itens.
- Baú compartilhado da Mesa, permissões e transferências LAN.
- Política final de mutações do Inventário próprio em Offline; não permitir operações compartilhadas offline.

**Bloqueio:** não ativar nem iniciar a implementação funcional do Inventário ativo antes da Ficha completa, auditorias, suíte automatizada e uma única bateria humana integrada final. O Baú e transferências compartilhadas são etapa posterior.

## 6. Painel do Mestre, Missões, Arquivos e Encontros

**Já existe**
- Navegação Mesa/Encontros/Arquivos.
- Administração de Mesa, convites, solicitações, aprovação/recusa e remoção de participante.
- Resumo operacional da Personagem.
- Esqueleto do painel com áreas para encontros, criaturas, documentos, diário e narração.

**Falta**
- Painel operacional integrado ao mesmo registro das Fichas ativas, sem editor universal.
- Resumo limitado a Nível, Classe, PV, SA, Defesa, BI, Condições e Habilidades passivas relevantes.
- Modelos e contratos de Missões, Cinemáticas, objetivos, conclusão e vínculo com Progressão.
- Arquivos privados/compartilhados, revelação/revogação, leitura e permissões sem vazamento por cache/consulta.
- Diário e notas secretas privadas do Mestre.
- Catálogo canônico completo de criaturas a partir do Arquivo do Mestre; protótipos com dados fictícios não são canônicos.
- Encontros preparados/ativos, iniciativa, turnos, rodadas, criaturas e contadores operacionais.
- Preservação de contexto ao consultar arquivos/regras e retornar ao encontro/ficha.

**Testes**
- Isolamento Jogador/Mestre e entre Mesas.
- Arquivo privado não pode vazar por rota, cache, busca ou resposta do servidor.
- Revelar/desfazer compartilhamento com atualização entre clientes.
- Painel lê o mesmo estado persistido da Ficha.
- Encontro não aplica dano/efeitos ao avançar turno.
- Ações administrativas autorizadas e auditadas.

## 7. LAN, Laboratório, persistência e segurança

### Já existe
- Conta/sessão local, Mesas, convites, pedidos de ingresso, participantes e rascunhos.
- Servidor Node.js/SQLite e canal WebSocket.
- Sessão persistente por cookie HttpOnly e testes automatizados.
- Autorização por vínculo/conta/papel em rotas de Personagem.
- Revisões, transações, idempotência e recibo de ativação.
- QR/endereço LAN e módulos de Laboratório/configuração.
- IndexedDB Offline e backup JSON versionado.

### Falta
- Transporte seguro LAN; HTTP permanece limitação de segurança e o servidor é experimental.
- Fechar política de nickname, nomes reservados, colisões e recuperação de conta sem e-mail.
- Fechar retenção/arquivamento/reabertura/exclusão de Mesas e Personagens.
- Definir reconciliação Offline/LAN por tipo de dado; não mesclar automaticamente estado compartilhado.
- Definir dados locais mínimos após remoção/revogação de acesso à Mesa.
- Completar Laboratório como entrada unificada: testar endereço configurado, disponibilidade real do servidor (não apenas `navigator.onLine`), LAN ou fallback Offline, QR e preservação do legado.
- Garantir isolamento de dados no cache/service worker, logs e armazenamento.
- Validar reconexão WebSocket e respostas tardias após troca de contexto.
- Portabilidade: Windows primeiro; Linux Mint depois; Android/DeX somente após o núcleo Windows estabilizado.

### Testes
- Duas contas reais distintas, duas Mesas, papéis diferentes, remoção e sessão expirada.
- Recarga/reabertura de navegador e persistência de cookie.
- QR entre dispositivos na mesma rede, endereço correto e aprovação explícita.
- Queda/retorno de Wi-Fi, reinício do servidor, suspensão Android, internet indisponível com LAN ativa.
- Salvamento concorrente, revisão antiga, resposta ambígua, repetição de operações.
- Backup completo: exportar, prévia, IDs duplicados, importar, falha atômica e versões desconhecidas.
- Instalação PWA, abrir sem rede, atualização do shell e persistência IndexedDB.

## 8. Bateria humana integrada — ainda não solicitar

Somente depois de fechar a implementação da Ficha e passar pelas auditorias/testes automatizados, executar uma única bateria integrada imediatamente antes de liberar Inventário ativo. Ela deve cobrir, em roteiro agrupado:

1. criação completa, revisão e ativação;
2. navegação contínua e edição de Identidade em Windows e Android;
3. persistência Offline, fechar/reabrir, F5 e backup/importação;
4. recursos, Condições, descanso, BI e Reanimação;
5. Progressão e Morte, quando implementadas;
6. Combate completo com entradas manuais;
7. modo de dados e preferências Automático/Misto/Manual;
8. LAN: duas contas, permissões, isolamento, sessão, QR e reconexão;
9. sincronização Ficha/Painel e preservação de contexto;
10. regressões dos fluxos anteriores.

Os resultados devem registrar dispositivo/navegador, versão/build, cenário, passos, esperado, observado, evidência e classificação (aprovado/parcial/reprovado/inconclusivo). Não pedir testes intermediários repetitivos ao responsável.

## 9. Ordem de trabalho recomendada

1. Continuar auditoria individual das armas pp. 48–61 e fechar testes apenas para divergências/lacunas reais.
2. Consolidar a matriz de auditoria de catálogos pp. 62–73 e fechar pendências residuais.
3. Resolver a decisão de método de Progressão por Mesa antes de inicializar dados.
4. Integrar Progressão à Ficha, Descanso Completo, backup/IndexedDB e LAN.
5. Implementar Consequência de Morte integrada.
6. Fechar efeitos de Habilidades e suas integrações.
7. Completar Combate na Ficha e contratos do Painel/Encontros.
8. Fechar persistência, Laboratório, permissões e segurança LAN.
9. Executar suíte automatizada completa e auditoria cruzada.
10. Executar a bateria humana integrada uma única vez.
11. Somente após aprovação, liberar Inventário ativo; depois Baú e transferências compartilhadas.

Frentes podem avançar em paralelo quando não disputarem os mesmos arquivos/contratos. A ordem acima não autoriza ignorar dependências.

## 10. Evidência e situação do HEAD-base

- HEAD-base: `6bd0805ea4183043e0c8314f40e5a5459b8ec446`.
- Build GitHub Actions [42627445025](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42627445025): **success**.
- Verificação Offline [42627444941](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42627444941): **success**.
- Inspeção do código confirmou os módulos e limites descritos neste documento.
- Não houve merge para `main`, deploy ou alteração de produção.
- Nenhuma bateria humana integrada foi solicitada ou executada.


## 11. Atualização da auditoria de armas — 09/11/2026

### Comparação manual com a fonte

Foi feita conferência direta das tabelas e descrições individuais do Arquivo do Jogador v1.0:
- Armas corpo a corpo: pp. 50–51 — 15 modelos.
- Pistolas 9 mm: pp. 53–54 — 10 modelos.
- Escopetas: p. 55 — 4 modelos.
- Submetralhadoras: p. 56 — 4 modelos.
- Rifles: p. 57 — 3 modelos.
- Rifles de Precisão: p. 58 — 2 modelos.
- Magnums: pp. 59–60 — 5 modelos.
- Armas Especiais: pp. 60–61 — 6 modelos.
- Regras gerais e ataques universais: pp. 48–52, conferidos em rodada anterior e complementados por procedimentos/testes específicos.

Nos campos de tabela e exceções individuais examinados nesta passada, não foi identificada divergência material entre o livro e os perfis atuais. Isso é conclusão da comparação realizada, não declaração de que o sistema de Combate esteja integrado.

### Cobertura automatizada adicionada

Novo arquivo: `tests/catalogo-armas-auditoria-completa.test.mjs`.

- Compara explicitamente os valores dos 15 perfis corpo a corpo: Grau, Dano, Crítico, Mãos, Espaços, Peças, Durabilidade e Aquisição.
- Compara explicitamente os 34 perfis de armas de fogo/especiais: categoria, Grau quando aplicável, Dano, Crítico, capacidade, alcance, mãos, Espaços, Peças, Durabilidade, Recarga e Aquisição.
- Mantém exceções como Requiem (Espaços variáveis) e RPG-7 (Dano/Crítico não definidos) explícitas.
- Não altera os catálogos nem executa efeitos.

**CI no HEAD `6fabb33c484cf696d2f24cd1e3a2ee9b472bc129`:**
- Verificação Offline [42630134785](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42630134785) — **success**.
- Build [42630134878](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42630134878) — **success**; incluiu testes PostgreSQL locais, compilação e verificação de tipos.

### Estado da auditoria após esta rodada

- **Concluído nesta passada:** conferência dos valores das tabelas de armas pp. 50–61 e cobertura automatizada exata dos 49 perfis.
- **Ainda pendente:** fechar matriz de cobertura das propriedades/procedimentos individuais e cruzamentos de compatibilidade com Peças Extras, munições e Habilidades; ampliar testes apenas onde essa matriz revelar lacunas.
- **Não concluído:** sistema de Combate integrado, dano automático, consumo de munição ou equipamento ativo. Os catálogos continuam sendo referência.



## Atualização — Ciclo 2: Iniciativa na Ficha (09/11/2026)

- **IMPLEMENTADO:** a Ficha deixou de solicitar o resultado natural do d20 e passou a exibir apenas o modificador de Iniciativa derivado de AGI.
- **IMPLEMENTADO:** removida a integração com `src/IniciativaFichaLocal.tsx`; o componente e seu fluxo de entrada de rolagem foram excluídos.
- **TESTE AUTOMATIZADO ATUALIZADO:** `tests/iniciativa-ficha.test.mjs` agora verifica a exibição do modificador e a ausência de solicitação de rolagem na Ficha.
- **REGRA PRESERVADA:** Arquivo do Jogador v1.0, p. 76 — Iniciativa = 1d20 + AGI. A Ficha não rola nem organiza a ordem; o fluxo cabe ao Painel do Mestre.
- **PENDENTE:** integrar o modificador/rolagem ao futuro fluxo de Encontros do Painel do Mestre.
- **LIMPEZA:** nenhum módulo de combate adicional foi removido sem auditoria de dependências.
- **CI:** build [42655459041](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42655459041) e verificação offline [42655459252](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42655459252), ambos associados ao commit de código `b67548df116db614a047587de46a075c5ecafe67`; estavam em execução no momento do registro. Confirmar conclusão antes de considerar o ciclo validado.

**Regra permanente de processo:** cada ciclo deve atualizar esta matriz e criar checkpoint com SHA, escopo, arquivos, testes, resultados, pendências e próximo passo. O checkpoint deve instruir a próxima sessão a ler a matriz e o checkpoint, confirmar HEAD e inspecionar dependências antes de alterar código. Não avançar sem apresentar o checkpoint ao Gus e obter validação.


## Atualização — Roladores básicos da Ficha (09/11/2026)

- **IMPLEMENTADO:** motor de rolagem virtual em `src/rolagemDados.ts`, com `crypto.getRandomValues`, rejeição de valores fora do intervalo uniforme e validação de entradas.
- **IMPLEMENTADO:** `src/RoladoresBasicosLocal.tsx` oferece rolagem pontual de Iniciativa (`1d20 + AGI`) e Rolador Livre (quantidade e tipo de dado).
- **IMPLEMENTADO:** dados físicos permitem registrar faces obtidas; dados virtuais geram resultados; em modo Misto o jogador escolhe o método para cada rolagem.
- **IMPLEMENTADO:** ambos os roladores só são renderizados em modo Automático. A calculadora de Testes existente também foi restringida ao modo Automático; em Misto/Manual os valores, fórmulas e modificadores da Ficha permanecem visíveis.
- **LIMITE PRESERVADO:** os resultados são apresentados na interface e não alteram PV, SA, BI, inventário ou qualquer estado da personagem. Não há histórico persistido.
- **PRIVACIDADE:** a preferência Pública/Privada é exibida como configuração, mas a Ficha Offline mantém os resultados no próprio dispositivo e não transmite nem cria histórico compartilhado. Enforcement em leitura/compartilhamento LAN permanece pendente para a integração futura.
- **PENDENTE:** roladores integrados de Ataque, Dano, Perícia e Atributo; integração dos modificadores e efeitos específicos; enforcement de privacidade no contexto LAN. Não foi criada regra de acerto, dano ou consequência.
- **TESTES:** `tests/roladores-ficha.test.mjs` cobre fonte aleatória, distribuição sem viés de módulo, validação de resultados físicos e limites de persistência/visibilidade. CI vinculada ao HEAD abaixo ainda em execução no momento deste registro.
- **Não houve:** merge para `main`, deploy, alteração de produção, teste humano ou alteração de cânone.

- **Checkpoint deste ciclo:** `docs/checkpoint-roladores-basicos-ficha-2026-11-09.md`.
- **HEAD documental atual:** `593988f2bdab4213952bd642dc013512631a265b`; código validado pela CI deve ser conferido no SHA `69b4839cae01f9a1fc7730f34bd45a53b3cc03de`.

## Atualização — Rolagens integradas de Perícia e Atributo (09/11/2026)

- **IMPLEMENTADO:** `src/CalculadoraTesteLocal.tsx` passou a usar o motor `src/rolagemDados.ts` para Testes de Perícia e Testes puros de Atributo no modo Automático.
- **DADOS FÍSICOS:** o jogador informa a face ou as faces obtidas e confirma expressamente o resultado.
- **DADOS VIRTUAIS:** o aplicativo gera os dados somente após o comando “Rolar Teste”.
- **DADOS MISTOS:** o método pode ser escolhido em cada Teste.
- **VANTAGEM/DESVANTAGEM:** preservado o procedimento de 2d20, escolhendo o melhor/pior resultado; Teste normal usa 1d20.
- **FÓRMULAS:** Perícia usa `valorBasePericia` (Atributo associado já incluído, mais Treinamento e modificadores já existentes); Teste puro usa diretamente o Atributo escolhido. Modificadores de Origem, Tentativa e Erro e circunstanciais existentes permanecem no cálculo.
- **RESULTADOS NATURAIS:** mantidos os tratamentos existentes de 20 natural e 1 natural em `src/testes.ts`. Nenhuma rolagem aplica automaticamente dano, altera recursos ou grava histórico.
- **LIMITES:** a calculadora continua renderizada somente no modo Automático, por controle de `src/FichaLocal.tsx`. Misto/Manual não exibem o componente nem reservam espaço. Ataques continuam sem integração de arma equipada, bônus de arma/Peças ou Dano automático.
- **TESTES AUTOMATIZADOS ADICIONADOS:** `tests/roladores-ficha.test.mjs` cobre resultados naturais, Vantagem/Desvantagem e a integração explícita de dados físicos/virtuais/mistos; `tests/ataques-calculadora.test.mjs` foi atualizado para refletir a calculadora com rolagem virtual sob comando.
- **PENDENTE:** execução/resultado da CI para o código no SHA `4e1d67de002b04ee12707b44f71ae5e21f644a9b`; validação humana permanece reservada à bateria integrada final.
- **Checkpoint do ciclo:** `docs/checkpoint-rolagens-testes-pericia-atributo-2026-11-09.md` (commit `3994531d854d639542126bcdff2e803d43374b53`).

- **PENDENTE DE DELIBERAÇÃO:** o Arquivo do Jogador p. 81 descreve a consequência de Exposto em Falha Crítica; o §7.6 da v2.6 mantém pendente a ativação automática da Condição. A interface apresenta o resultado, mas esta etapa não altera automaticamente a lista de Condições. Resolver a redação/alcance antes de integrar essa mutação.
- **Não houve:** merge para `main`, deploy, alteração de produção ou teste humano.

## Decisão e implementação — Exposto em Falha Crítica (09/11/2026)

- **DECISÃO APROVADA PELO GUS:** Exposto ocorre quando há Falha Crítica (resultado natural 1 no d20).
- **FICHA AUTOMÁTICA:** ativa Exposto automaticamente apenas quando o resultado natural 1 ocorre em Ataque (corpo a corpo ou à distância).
- **TESTES COMUNS:** resultado natural 1 em Teste comum de Perícia ou Atributo não dispara essa automação.
- **FICHA MISTA/MANUAL:** a ativação de Exposto é manual pelo Jogador.
- **IMPLEMENTADO:** `src/CalculadoraTesteLocal.tsx` aciona callback somente quando o resultado avaliado é Falha Crítica em Ataque; `src/FichaLocal.tsx` valida o modo Automático, registra Exposto com fonte e duração, evita duplicar Condição ativa e persiste pelo fluxo de salvamento da Ficha.
- **TESTES:** `tests/roladores-ficha.test.mjs` cobre o gatilho restrito a Ataque e a guarda do modo Automático. A execução da CI ainda precisa ser confirmada para o SHA `411a78efc1b16b85639c72c90d3c053b44e0c63a`.
- **PENDENTE:** atualizar o §7.6 do Planejamento v2.6 na próxima revisão documental; confirmar build/testes no CI; validar integração real na bateria humana final.
- **Checkpoint atualizado:** `docs/checkpoint-rolagens-testes-pericia-atributo-2026-11-09.md`.
- **Checkpoint deste ciclo:** `docs/checkpoint-exposto-falha-critica-2026-11-09.md` (commit `30232785a38c461130357b87a8cea3b8e4a0bbcf`).


## Atualização — Auditoria inicial de Ataque e Dano (09/11/2026)

- **FONTE:** Arquivo do Jogador v1.0, pp. 43–45, 48, 50–52, 53–61 e 80–81. Ataque usa Luta/Pontaria com Atributo já incluído; Dano normalmente usa dados da arma + FOR em Corpo a Corpo ou + AGI à distância; a regra específica da arma prevalece.
- **ACHADO:** `CalculadoraTesteLocal` atualmente pede Defesa/DT e compara o total no caminho de Ataque. A decisão de produto é apresentar rolagem e total, deixando a comparação com Defesa e a resolução para Jogador/Mestre. Ajuste pendente.
- **ACHADO:** `calcularTesteManual` associa genericamente Exposto à descrição de toda Falha Crítica. Deve ser desacoplado da Falha Crítica comum, preservando a decisão aprovada: ativação automática apenas em Ataque no modo Automático.
- **DEPENDÊNCIA:** margens críticas ampliadas, bônus de Peças/Habilidades e cálculo de Dano dependem de arma real selecionada/equipada e dados mecânicos válidos. Equipamento inicial atual é projeção de criação, guardado/não equipado; `armaOperario.ts` é somente lista de opções. Não presumir equipamento ativo.
- **IMPLEMENTADO NESTE CICLO:** nenhum código; foi criado checkpoint documental.
- **TESTES:** testes estruturais existentes inspecionados; build/suíte não executados nesta auditoria. CI para SHA `411a78efc1b16b85639c72c90d3c053b44e0c63a` permanece pendente/não observada.
- **PRÓXIMO:** separar rolagem de Ataque da comparação com Defesa; remover menção genérica de Exposto nos Testes comuns; auditar em paralelo catálogo de armas/Peças/Habilidades; implementar cálculo puro de Dano apenas com entradas explícitas.
- **Checkpoint:** `docs/checkpoint-auditoria-ataque-dano-2026-11-09.md` (commit `755775b0524ddca6c3fd354d4aed8290285d5019`).


## Atualização superveniente — Combate completo antes do Inventário (09/11/2026)

Esta atualização prevalece sobre qualquer redação anterior incompatível nesta matriz.

- **DECISÃO EXPRESSA DO GUS:** toda a área de Combate, com todas as armas, ataques universais, fórmulas, modificadores, Peças e exceções, deve estar implementada e funcional antes do Inventário ativo. A Matilda foi apenas exemplo; o escopo inclui as 49 armas do catálogo canônico.
- **CATÁLOGOS EXISTENTES CONFIRMADOS:** 15 perfis corpo a corpo em `src/catalogoArmas.ts`; 34 perfis de armas de fogo/especiais em `src/catalogoArmasFogo.ts`; procedimentos para ambos em `src/catalogoProcedimentosArmas.ts`; Arma Improvisada e Ataque Desarmado em `src/catalogoProcedimentosAtaquesUniversais.ts`; 31 Peças Extras em `src/catalogoPecas.ts`.
- **IMPORTANTE:** catálogo e procedimentos existentes são dados/referência, não integração funcional. A seção Combate da Ficha ainda declara Ataques e Dano “A integrar”. O catálogo legado `catalogoArmas.ts` contém três registros de pistolas duplicados do catálogo completo; a integração deve usar os 15 perfis corpo a corpo e os 34 perfis de armas de fogo/especiais sem duplicar IDs.
- **FICHA NÃO É MOTOR DE COMBATE:** não comparar Ataque com Defesa, decidir acerto, administrar turnos/rodadas, resolver Reações, aplicar dano a alvos/recursos ou resolver consequências narrativas. A Ficha calcula e apresenta; o Mestre decide.
- **SEM DEPENDÊNCIA DO INVENTÁRIO:** a seleção de um perfil para cálculo não significa posse/equipamento. O futuro Inventário determinará equipar/desequipar, munição carregada e Peças instaladas. Não presumir esses estados. Ataque Desarmado e Arma Improvisada funcionam independentemente de equipamento.
- **PENDÊNCIAS DE IMPLEMENTAÇÃO:** calculadora de Ataque sem Defesa; cálculo/rolagem de Dano para todas as fórmulas; críticos e margens ampliadas com confirmação do Mestre quando necessária; BI, Origem, Classe, Habilidades e Peças; propriedades e exceções de todos os perfis; ataques universais; interface por modo e testes automatizados.
- **Ordem:** Combate completo → auditoria e suíte automatizada → bateria humana integrada única → Inventário ativo → Baú/transferências.
- **Checkpoint de referência:** `docs/checkpoint-combate-catalogos-2026-11-09.md`.


## Atualização superveniente — escopo integral da Ficha Offline (09/11/2026)

Esta atualização substitui qualquer ordem anterior incompatível nesta matriz.

- **DECISÃO EXPRESSA DO GUS:** não foi solicitado apenas o Combate. A **FICHA TODA** deve estar implementada e funcional Offline antes de Inventário ativo: criação/identidade, Características, Atributos, Perícias, Habilidades, Progressão, Recursos, Condições, Bio-Infecção, Descanso, Reanimação, Morte, Combate, persistência e backup.
- **Progressão pertence à Ficha.** Não criar configuração de método de Progressão na Mesa. A Mesa pode fornecer limite de campanha, mas não controla método, contador, benefícios ou nível da Personagem.
- **Sequência aprovada:** Ficha integral Offline → auditoria e testes automatizados → bateria humana integrada única pelo Gus → correções → Inventário Offline completo com catálogo → Inventário LAN com acesso controlado pelo Mestre → Baú LAN compartilhado → adaptações Linux/Android.
- **Combate completo é pré-requisito do Inventário ativo.** Não iniciar gestão ativa de itens enquanto a calculadora e procedimentos de combate não estiverem completos.
- **Criação inicial de Equipamento permanece parte da criação:** `EditorInventarioLocal` no rascunho é planejamento do kit/compras, não Inventário ativo. Não remover esse fluxo sem deliberação.
- **Ficha não é motor de combate nem de narrativa:** calcula/apresenta dados e registra escolhas expressas; não compara Ataque com Defesa de alvo, não decide acerto, não administra turnos/rodadas nem aplica consequências narrativas.
- **Achados da auditoria integral (checkpoint `docs/checkpoint-auditoria-ficha-integral-2026-11-09.md`):**
  - Progressão/Morte têm contratos e validadores, mas não UI/fluxo integrado de aplicação atômica.
  - Ficha ainda apresenta Nível 1 fixo em partes da interface/revisão.
  - Descanso Parcial e Reanimação ainda bloqueiam método Virtual.
  - Texto de Condições ainda descreve acompanhamento LAN pelo Mestre; revisar a autonomia Offline.
  - Combate permanece “A integrar”.
  - IndexedDB/fila serializada/backup já existem; integração dos campos novos e regressões ainda precisam ser auditadas.
- **Estado técnico:** checkpoint foi documental. Nenhuma alteração de código ou teste executado nesta rodada. HEAD-base `21e560a768556a034a25aaf9df3344441b426c36`; CI/status não observados. Sem merge, deploy ou alterações de produção.
- **Próximo lote:** Progressão Offline integrada, depois Morte, Recursos/Condições/Descanso/Reanimação, Combate integral e auditoria final da Ficha. Frentes independentes podem ser paralelizadas sem editar simultaneamente os mesmos contratos.
