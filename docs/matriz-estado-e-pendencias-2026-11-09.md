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


## Atualização — Lote A, fundação da Progressão Offline (09/11/2026)

- **IMPLEMENTADO:** `criarEstadoProgressaoInicial()` em `src/progressaoPersistente.ts`; padrão Marco Narrativo, método de Missões opcional. Estado pertence à Ficha, sem configuração de Mesa.
- **IMPLEMENTADO:** `registrarMarcoNarrativo()` registra concessão expressa sem alterar Nível ou benefícios e marca Marco posterior à Morte quando aplicável.
- **TESTES ADICIONADOS:** inicialização padrão/alternativa, método inválido, registro sem concessão de nível, Marco após Morte e método incompatível.
- **PENDENTE:** execução dos testes e CI; nenhum resultado foi observado para o commit.
- **AINDA NÃO IMPLEMENTADO:** interface de Progressão, contador/registro de Missões/Marcos na UI, escolhas de benefícios, aplicação atômica após Descanso Completo, inicialização/migração de personagens existentes e integração backup/importação.
- **HEAD de código:** `51f5d56837d0f7804414e5c970853f0ace0ea29c`.
- **Checkpoint:** `docs/checkpoint-progressao-inicial-2026-11-09.md`.
- Não houve merge, deploy, alteração de produção/Supabase ou teste humano.


## Atualização — Progressão Offline, interface inicial (09/11/2026)

- **IMPLEMENTADO:** novo `src/ProgressaoFichaLocal.tsx` integrado à Ficha. Permite inicialização explícita no Nível 1, escolha entre Marco Narrativo (padrão) e Missões, edição do contador de Missões e registro de Marco Narrativo comunicado pelo Narrador.
- **SEGURANÇA DO HISTÓRICO:** personagem acima do Nível 1 sem contrato/histórico de Progressão não recebe histórico retroativo inventado; a Progressão fica bloqueada até conferência explícita.
- **IMPLEMENTADO:** `src/FichaLocal.tsx` passa a exibir o Nível persistido no cabeçalho e na revisão, e integra o painel de Progressão.
- **LIMITE:** registrar Missão/Marco não concede Nível. Escolha e aplicação de benefícios e integração atômica ao Descanso Completo continuam pendentes.
- **TESTES/CI:** nenhum teste novo foi executado nesta sessão; status checks e workflow runs não foram retornados para o commit `1f42aed224d4f9b578e52a59bcf4ce00379f2e69`. Resultado **PENDENTE**, sem declaração de build ou suíte aprovados.
- **Checkpoint:** `docs/checkpoint-progressao-ui-inicial-2026-11-09.md`.
- **Próximo:** contrato de solicitação e escolhas de benefícios; transição pura com histórico exato; patch único com Descanso Completo; testes de atomicidade e backup.
- Sem merge, deploy, produção/Supabase ou teste humano.


## Atualização — Progressão Offline: proteção LAN e correção de teste legado (09/11/2026)

- **IMPLEMENTADO:** `src/ProgressaoFichaLocal.tsx` mantém a edição habilitada somente na Ficha Offline. No contexto LAN, exibe aviso de somente leitura até existir fluxo próprio autorizado; evita enviar Progressão ao PUT genérico, que a protege por desenho.
- **IMPLEMENTADO:** registro de Missões/Marcos e inicialização explícita no Nível 1; personagem acima do Nível 1 sem histórico continua bloqueada sem criação de benefícios presumidos.
- **IMPLEMENTADO:** Nível persistido aparece dinamicamente no cabeçalho e na revisão da Ficha.
- **TESTE CORRIGIDO:** `tests/pendencias-edicao.test.mjs` tinha expectativa obsoleta de que a calculadora não realizava rolagem virtual. A calculadora já implementa rolagem física/virtual sob ação expressa; o teste agora verifica esse comportamento e a ausência de persistência genérica dos resultados.
- **EVIDÊNCIA CI:** workflow do commit ancestral `51f5d56837d0f7804414e5c970853f0ace0ea29c` falhou em 1 de 791 testes: exatamente a expectativa obsoleta acima; 790 passaram. O teste foi atualizado no commit `534ae7419951d52a449ab7c934c8cadd01111679`. Os dois workflows para o código `8c72ea0c10cf04e2290326655d31faefa818b2a1` estavam em execução no momento desta atualização; aguardar os novos workflows disparados pelo commit de teste antes de declarar CI aprovada.
- **PENDENTE:** seleção/aplicação de benefícios, solicitação persistida, aplicação atômica com Descanso Completo, integração de Morte, testes específicos da UI e round-trip de backup/importação.
- **HEAD de código/testes:** `534ae7419951d52a449ab7c934c8cadd01111679`.
- **Checkpoint:** `docs/checkpoint-progressao-ui-inicial-2026-11-09.md`.
- Sem merge para `main`, deploy, alteração de produção/Supabase ou teste humano.


## Atualização — correção de regressão no teste de Descanso (09/11/2026)

- **TESTE CORRIGIDO:** `tests/descanso-ficha.test.mjs` ainda esperava a expressão antiga que passava o Nível diretamente do campo opcional `ficha.nivel`. A Ficha agora normaliza o Nível persistido em `nivelAtual`, validando faixa 1–10, e passa esse valor ao Descanso; o teste foi atualizado para verificar essa fonte dinâmica.
- **TESTES CORRIGIDOS NESTA RODADA:** expectativa obsoleta da calculadora virtual em `tests/pendencias-edicao.test.mjs`; expectativa do Nível do Descanso em `tests/descanso-ficha.test.mjs`.
- **CI:** para o commit `534ae7419951d52a449ab7c934c8cadd01111679`, a verificação Offline falhou apenas no teste antigo de Descanso; a compilação ainda estava em execução. A correção foi enviada no commit `76f7b03670b593b4943d904806cac685b6725adc`. Os dois workflows desse HEAD estavam em execução quando este checkpoint foi atualizado. **Não declarar CI aprovada até observar ambos os resultados.**
- **HEAD de código/testes:** `76f7b03670b593b4943d904806cac685b6725adc`.
- Sem merge, deploy, produção/Supabase ou teste humano.


## Atualização — validação de ficha evoluída pela Progressão (09/11/2026)

- **IMPLEMENTADO:** `src/validacaoPersonagemLocal.ts` reconstrói os Atributos originais revertendo, em ordem inversa, cada benefício registrado; confere se o valor atual corresponde exatamente ao `valorDepois` antes de reverter e só então aplica as regras da criação (4 atributos, soma inicial 7, teto inicial 3).
- **IMPLEMENTADO:** reconstrói a distribuição original de Perícias revertendo somente os pontos documentados no histórico, respeitando o Treinamento gratuito da Origem; valida novamente o orçamento e as Perícias permitidas na criação.
- **IMPLEMENTADO:** a lista `habilidadesAdquiridas` precisa corresponder exatamente à Habilidade básica do Nível 1 e às Habilidades registradas por nível no histórico de Progressão.
- **TESTES ADICIONADOS:** fichas evoluídas em Nível 3 (Atributo acima do teto de criação) e Nível 4 (Perícia com ponto de Progressão) são aceitas somente quando o histórico reconstrói uma criação válida; divergências de valor atual ou histórico são rejeitadas.
- **CI APROVADA:** commit de código `fc187b9c9b3a3d7f42d39d409c76ace912d475f8` — Verificação Offline: 793/793 testes e build aprovados; pipeline principal: 793/793 testes, build Vite e verificação TypeScript aprovados. Ambos os workflows concluíram com sucesso.
- **PENDENTE:** solicitação de avanço persistida, escolhas de benefícios, aplicação atômica com Descanso Completo e integração da reversão por Morte à ficha evoluída.
- Sem merge, deploy, produção/Supabase ou teste humano.


## Atualização — auditoria de Reanimação, Recursos, Descanso e Perícias de Origem (09/11/2026)

- **IMPLEMENTADO — commit `6022062ebdc9721b0d41755824f445b15504195d`:** corrigida a mensagem de Falha Crítica em Reanimação. Um 1 natural continua sendo Falha Crítica no Teste, mas não ativa Exposto automaticamente porque Reanimação não é Ataque; a ativação automática de Exposto permanece restrita a Falha Crítica em Ataque no modo Automático. O resumo de Bio-Infecção da Ficha também passou a informar corretamente que o módulo Reanimação registra o Colapso Viral quando a BI confirmada alcança o máximo.
- **IMPLEMENTADO — commit `bc49736a4534c86512adcf61eba00cc3c43aa646`:** Descanso Completo agora valida o conjunto atual de Recursos contra os máximos antes de restaurá-los. Dados corrompidos ou fora dos limites não são silenciosamente sobrescritos. Testes cobrem PV acima do máximo, SA acima do máximo e PV fracionário.
- **IMPLEMENTADO — commit `97942492bab00ea1eb0ac651bfe83e986a370d8e`:** corrigida a graduação exibida na lista de Perícias. A segunda Perícia escolhida pela Origem Amnésico amplia as opções permitidas na criação, mas não concede Treinamento gratuito; somente a primeira Perícia escolhida recebe o Treinamento da Origem. A função de domínio já respeitava essa regra; a divergência estava no rótulo apresentado pela Ficha.
- **TESTES AUTOMÁTICOS:** adicionadas/ajustadas verificações para a Falha Crítica em Reanimação sem Exposto, a informação de início automático do Colapso, a validação dos Recursos no Descanso Completo e a segunda Perícia do Amnésico sem Treinamento gratuito.
- **CI:** commit `6022062...` — ambos os workflows concluídos com sucesso. Para `bc49736...`, os workflows `42731760948` (Offline) e `42731760652` (compilação) estavam em execução na última consulta. Para HEAD `9794249...`, os workflows `42732027064` (Offline) e `42732027068` (compilação) também estavam em execução na última consulta. **Não declarar CI aprovada para o HEAD atual até ambos concluírem com sucesso.**
- **HEAD do código/testes:** `97942492bab00ea1eb0ac651bfe83e986a370d8e`.
- **PENDENTE:** auditoria final integrada de Condições, Recursos, Descanso e Reanimação; auditoria completa da Criação; integração de Combate; backup/importação e testes de round-trip. Nenhum teste humano foi solicitado nesta etapa.
- Sem merge para `main`, deploy, produção/Supabase ou alteração de permissões.


## Atualização — benefício de BI da Origem Desgarrado (09/11/2026)

- **IMPLEMENTADO — commit `3a81c7bb223db4f183aea13fa55d1301cf0f3691`:** o aumento de BI pelo painel de Recursos agora considera a Origem Desgarrado. Após o aumento, concede PV Temporários iguais à metade da BI atual, arredondada para baixo. A regra geral de PV Temporários continua aplicada: não soma valores; conserva o maior valor existente.
- **TESTES ADICIONADOS:** aumento de BI com Desgarrado, manutenção de PV Temporários maiores, ausência do benefício em outras Origens e ausência de concessão ao reduzir BI.
- **CI:** ambos os workflows do commit `66b33b065e513a5f3e3819c4134882de4b055784` concluíram com sucesso. Para o HEAD de código `3a81c7b...`, workflows `42732336629` (Offline) e `42732336648` (compilação) permanecem em execução na última consulta. **CI do HEAD atual pendente.**
- **HEAD de código/testes:** `3a81c7bb223db4f183aea13fa55d1301cf0f3691`.
- Sem teste humano, merge, deploy ou alteração de produção/Supabase.


## Atualização — separação da rolagem de Ataque e Testes comuns (10/11/2026)

- **IMPLEMENTADO:** `src/testes.ts` agora oferece `calcularRolagemAtaqueManual()`, que valida os dados, aplica Normal/Vantagem/Desvantagem e apresenta dado natural + total sem DT, comparação com Defesa ou classificação de acerto/erro do alvo.
- **IMPLEMENTADO:** `src/CalculadoraTesteLocal.tsx` usa o avaliador separado quando o escopo é Ataques; a seção não solicita Defesa nem apresenta controle “Impossível — sem Teste”. A comparação com Defesa fica expressamente a cargo da mesa.
- **IMPLEMENTADO:** resultado 20 natural continua marcado como Acerto Crítico automático. Perfis com margem 19–20 exibem orientação para conferir na mesa se o total alcança a Defesa antes de aplicar o Crítico; a Ficha não tenta resolver essa condição sem conhecer a Defesa.
- **IMPLEMENTADO:** o texto genérico de Falha Crítica em `calcularTesteManual()` não associa Exposto automaticamente. O callback existente de Exposto continua limitado à Falha Crítica em Ataque e à guarda do modo Automático na Ficha.
- **TESTES ADICIONADOS/ATUALIZADOS:** `tests/roladores-ficha.test.mjs` cobre cálculo de Ataque sem Defesa e a ausência de Exposto no texto genérico; `tests/ataques-calculadora.test.mjs` verifica a separação e a ausência do campo de Defesa.
- **PENDENTE:** execução dos workflows CI associados ao novo HEAD; revisão de todas as exceções de armas, integração de modificadores explicitamente informados e fluxo completo de Dano.
- **VALIDADO HUMANAMENTE:** pendente, reservado à bateria integrada da Ficha completa.
- Sem merge para `main`, deploy, alteração de produção ou testes humanos isolados.


## Atualização — integração parcial das Condições na Ficha Offline (10/11/2026)

- **IMPLEMENTADO:** criado `src/condicoesCalculadora.ts` para calcular Desvantagens da própria personagem em Ataques e Testes de acordo com o Arquivo do Jogador v1.0: Caído, Cego, Imobilizado, Intoxicado, Desorientado, Enfraquecido e Infectado Especial nos contextos aplicáveis.
- **IMPLEMENTADO:** a calculadora combina as Desvantagens de Condições com a 5ª Fase da BI e com a escolha manual de Vantagem/Desvantagem; uma Vantagem e uma Desvantagem se anulam normalmente, e fontes iguais não acrescentam dados.
- **IMPLEMENTADO:** Defesa atual da Ficha considera Exposto (−2) e Desorientado (retira a contribuição de AGI), preservando a Defesa base derivada.
- **TESTES ADICIONADOS:** `tests/condicoes-calculadora.test.mjs` cobre regras por tipo de Ataque/Teste, exceções de Intoxicado/Enfraquecido, cancelamento e Defesa ajustada. **Execução local não realizada.**
- **LIMITES:** Condições do alvo, percepção de Amedrontado, testes exclusivamente visuais/auditivos, bloqueio de Ações/Reações, duração por turno, Movimento e Dano contínuo não foram automatizados; dependem de contexto/controle da mesa ou de módulos ainda não implementados.
- **CI:** workflows associados ao ciclo estavam em fila na última consulta. Aguardar resultado para o HEAD final; não declarar aprovação antecipada.
- **Checkpoint:** `docs/checkpoint-condicoes-ficha-2026-11-10.md`.
- Sem merge para `main`, deploy, alteração de produção ou teste humano.


## Atualização — ataques universais e dados adicionais de Dano (10/11/2026)

- **IMPLEMENTADO:** `consultarPerfilAtaqueUniversal()` deriva perfis de cálculo de Arma Improvisada e Ataque Desarmado diretamente do catálogo de procedimentos canônicos.
- **IMPLEMENTADO:** calculadora de Ataques oferece os dois ataques universais; fórmulas 1d6 + FOR (×2) e 1d4 + FOR (×3) respeitadas.
- **IMPLEMENTADO:** Ataque Desarmado aplica Desvantagem padrão e permite cancelamento por Vantagem válida.
- **IMPLEMENTADO:** cálculo manual de Dano aceita soma de Dados adicionais já rolados; nenhuma Peça/Habilidade é presumida como instalada/ativa.
- **TESTES ADICIONADOS:** testes de perfil universal, Dano Crítico e integração da interface; execução local não realizada.
- **PENDENTE:** Coronhada depende de elegibilidade validada da arma; Peças/Habilidades instaladas dependem de Inventário/equipamento ativo; armas com fórmulas especiais e modos de disparo exigem tratamento individual; não se automatiza acerto/Defesa/Reações/Dano Massivo/RD/BI/PV.
- **CI:** verificar workflows do HEAD final antes de declarar sucesso.
- **Checkpoint:** `docs/checkpoint-ataques-universais-dano-2026-11-10.md`.
- Sem merge, publicação, alteração da `main` ou produção.

## Atualização — fórmulas manuais de modos especiais (10/11/2026)

- **IMPLEMENTADO:** `src/variantesDanoArmas.ts` fornece fórmulas manuais da Spark Shot (normal 1d4; carregado 4d4) e do Lança-Chamas Químico (3d6 a 6d6).
- **IMPLEMENTADO:** a calculadora permite selecionar o modo/fórmula, sem consumir Cargas/Combustível nem controlar sequência de turnos ou Movimento.
- **IMPLEMENTADO:** orientação específica para a Motosserra: informar no campo de Dados adicionais a soma de todos os dados extras gerados por cada 6, incluindo encadeamentos.
- **TESTES ADICIONADOS:** verificações estáticas dos seletores e instruções; execução local não realizada.
- **PENDENTE:** efeitos da Spark Shot, gestão de Cargas/Combustível, resolução dos cartuchos GM 79, RPG-7 e gestão automática de munição/estados.
- **CI:** pendente para o novo HEAD. Sem teste humano, merge, publicação ou alteração de produção.
- **Checkpoint:** `docs/checkpoint-modos-especiais-dano-2026-11-10.md`.

## Atualização — procedimentos manuais GM 79 (10/11/2026)

- **IMPLEMENTADO:** `src/procedimentosGM79.ts` e seletor de cartucho/modo na calculadora.
- **COBERTURA:** Ácido direto/área; Explosivo área; Incendiário direto/área. Exibe raios, DTs, consequências e ausência de Crítico em área.
- **LIMITES:** não resolve Testes dos alvos, metade/integral, Queimadura, munição, recarga ou PV. Dano-base 4d6 é informado manualmente.
- **RPG-7:** permanece como Morte Instantânea com exceções por tipo de criatura; sem fórmula inventada.
- **PENDENTE:** Bear Commander/lançador integrado.
- **TESTES:** adicionados; execução local não realizada. CI pendente.
- **Checkpoint:** `docs/checkpoint-gm79-2026-11-10.md`.

- **Revisão adicional GM 79:** disparo em Área limpa resultados antigos, não oferece rolagem de Ataque e não permite multiplicador crítico; testes estáticos adicionados.


## Atualização — procedimentos de disparo e Perfuração (10/11/2026)
- **IMPLEMENTADO:** seletor manual de Disparo Cadenciado, Rajada e orientação de Perfuração; Matilda exige confirmação da Coronha específica.
- **LIMITAÇÃO:** sem consumo de munição, rolagens de Reflexos, rastreamento de alvos/linha/cobertura ou aplicação automática de Dano.
- **PENDENTE:** testes CI e validação humana.
- **Checkpoint:** `docs/checkpoint-disparo-e-perfuracao-2026-11-10.md`.


## Atualização — Bear Commander e lançador integrado (10/11/2026)
- FONTE CANÔNICA: Arquivo do Jogador v1.0, p. 57 (perfil do Bear Commander) e p. 60 (procedimentos dos Cartuchos GM 79).
- IMPLEMENTADO: seleção explícita entre rifle Bear Commander (1d10) e lançador integrado (4d6, regras do Cartucho GM 79).
- IMPLEMENTADO: lançador usa reserva independente, capacidade de 1 cartucho, alcance Médio e recarga por Ação Bônus; seleção de Ácido, Explosivo ou Incendiário reaproveita src/procedimentosGM79.ts.
- IMPLEMENTADO: o lançador usa multiplicador crítico x4 em ataque direto, sem Crítico nos disparos em Área.
- LIMITES: seleção não confirma posse/equipamento nem disponibilidade real de cartucho; não consome munição, recarrega estados, resolve Testes dos alvos ou aplica Queimadura/respingo.
- TESTES ADICIONADOS: verificação estática em tests/ataques-calculadora.test.mjs; execução local não realizada.
- PENDENTE: CI e validação humana.
- Checkpoint: docs/checkpoint-bear-commander-2026-11-10.md.


## 10. Atualização de auditoria — armas especiais (11/11/2026)

### RPG-7 e Spark Shot

**IMPLEMENTADO NA BRANCH**
- `src/procedimentosArmasEspeciais.ts` centraliza lembretes canônicos do RPG-7 e da Spark Shot.
- `CalculadoraTesteLocal.tsx` exibe a exceção de Morte Instantânea do RPG-7: Perseguidores, Chefes e criaturas com regra própria podem avançar de fase ou sofrer o efeito indicado em sua ficha.
- A interface lembra que o RPG-7 fica vazio após o disparo e exige recarga por Movimento; esses estados continuam manuais.
- A Spark Shot exibe Fortitude DT 15 para o alvo atingido e criaturas a até 1,5 m; falha causa Atordoado até o fim do próximo turno e Imobilizado por 1d4 rodadas.
- Teste estático acrescentado em `tests/ataques-calculadora.test.mjs`.

**LIMITES PRESERVADOS**
- Nenhuma morte, avanço de fase, condição, teste de resistência, consumo de munição/cargas ou alteração de PV é aplicada automaticamente.
- A regra da Spark Shot foi transcrita como está no livro; não se pressupõe carga disponível.

### PENDÊNCIA CANÔNICA — Besta / Engate Triplo

- O texto da Besta na p. 60 descreve Engate Triplo como procedimento da arma.
- A tabela de Peças Específicas na p. 64 também lista Engate Triplo como Peça compatível com a Besta, que consome 3 virotes e permite disparos simultâneos.
- A branch atualmente lista Engate Triplo como propriedade do perfil da Besta. Não foi alterado, pois as duas passagens do livro não esclarecem se o texto da p. 60 pressupõe a Peça instalada ou concede o procedimento à arma por padrão.
- Decisão necessária antes de alterar a disponibilidade do procedimento ou representar a instalação da Peça.

**VALIDAÇÃO**
- Testes adicionados, mas ainda não executados localmente.
- CI do novo HEAD precisa concluir; não houve validação humana, merge ou publicação.


## 11. Atualização — restrições de Ataque por Condições (11/11/2026)

**IMPLEMENTADO NA BRANCH**
- `src/condicoesCalculadora.ts` exporta `restricoesDeAtaquePorCondicoes()`, que identifica condições ativas que proíbem Ações ou o uso de Atacar: Desorientado, Atordoado, Incapacitado e Surpreendido.
- `src/CalculadoraTesteLocal.tsx` exibe os lembretes no escopo de Ataques, incluindo o texto da restrição.
- Os avisos não desabilitam a calculadora nem resolvem a narrativa; duração, exceções e contexto permanecem com jogador/Mestre.
- `tests/condicoes-calculadora.test.mjs` cobre o mapeamento e a apresentação.

**MOTIVAÇÃO DA AUDITORIA**
- O catálogo canônico já descrevia essas proibições, mas a integração anterior da calculadora aplicava apenas Desvantagem e Defesa. Faltava tornar visível que certas Condições impedem a própria ação, não apenas modificam a rolagem.

**VALIDAÇÃO**
- Testes adicionados; ainda sem execução local neste ambiente.
- CI do HEAD precisa concluir. Sem validação humana, merge ou publicação.


## 12. Atualização — integração de CODE VERONICA (11/11/2026)

**IMPLEMENTADO NA BRANCH**
- A Ficha passa os IDs de Habilidades ativas à Calculadora de Testes.
- Quando CODE VERONICA está ativa e o tipo é Teste de Perícia, a calculadora aplica Vantagem automaticamente.
- `src/testes.ts` aplica a regra de resultados naturais 2–9 contarem como 10, preservando 1 natural como Falha Crítica e 20 natural como sucesso automático.
- Vantagem de CODE VERONICA e fontes de Desvantagem são combinadas sem empilhar dados: se ambas existirem, cancelam-se normalmente. A conversão 2–9 para 10 permanece ativa.
- Testes unitários e de integração acrescentados em `tests/testes.test.mjs` e `tests/ataques-calculadora.test.mjs`.

**LIMITES**
- O efeito só é aplicado no modo Automático, pois apenas esse modo apresenta a Calculadora.
- CODE VERONICA não é aplicado a Testes puros de Atributo nem a Ataques.
- Conhecimento automático de senhas/códigos, chance de duplicar Ervas e uso de Submetralhadoras sem coronha com Ambidestria continuam como lembretes/efeitos não automatizados.

**VALIDAÇÃO**
- Testes adicionados; sem execução local neste ambiente.
- CI do HEAD precisa concluir; validação humana pendente; sem merge ou publicação.


## 13. Atualização — Vantagem de PARRUDO em Fortitude (11/11/2026)

**IMPLEMENTADO NA BRANCH**
- `src/CalculadoraTesteLocal.tsx` reconhece a Habilidade ativa `parrudo` somente no escopo de Testes, tipo Perícia e Perícia selecionada Fortitude.
- A fonte concede Vantagem automaticamente; a combinação com Desvantagem segue a regra geral de cancelamento, sem empilhar dados.
- A interface apresenta aviso explícito quando o efeito está ativo.
- Teste estático de integração adicionado em `tests/ataques-calculadora.test.mjs`.

**CONFERÊNCIA DE DERIVADOS**
- `src/derivadosCriacao.ts` já inclui +5 PV Máximos e +3 BI Máxima quando Parrudo é a Habilidade Básica escolhida na criação (`pvParrudo` e `biParrudo`). Nenhuma duplicação foi introduzida.
- A Vantagem de Fortitude era o efeito da Habilidade que ainda faltava na calculadora.

**VALIDAÇÃO**
- Teste adicionado; não executado localmente neste ambiente.
- CI do novo HEAD precisa concluir; validação humana pendente; sem merge ou publicação.


## 14. Atualização — lembretes de CURIOSA e auditoria de Tentativa e Erro (11/11/2026)

**IMPLEMENTADO NA BRANCH**
- `src/CalculadoraTesteLocal.tsx` apresenta lembrete contextual quando CURIOSA está ativa: Vantagem em Percepção/Investigação somente com tempo de análise e sem Pressão Imediata; não se aplica a combate, perseguições, fugas ou quando o Narrador negar tempo.
- A interface não concede Vantagem automaticamente para CURIOSA: a pessoa confirma a circunstância e seleciona Vantagem manualmente.
- O lembrete também registra a opção de 1 vez por Descanso Completo: Teste de AST DT 12 para pedir direção ou pista curta dedutível.
- Teste estático acrescentado em `tests/ataques-calculadora.test.mjs`.

**AUDITORIA — TENTATIVA E ERRO**
- A Habilidade já está integrada: `FichaLocal.tsx` deriva `temTentativaEErro` das Habilidades de Progressão ativas e passa o estado à calculadora.
- `pericias.ts` aplica +1 somente quando a Perícia permanece não Treinada e permite a Perícia adicional escolhida ser Treinada sem duplicar o bônus.
- `tests/pericias.test.mjs` já cobre a função de bônus e as fontes distintas de Treinamento. Nenhuma alteração de regra foi necessária.

**VALIDAÇÃO**
- Teste estático novo para CURIOSA; testes de Perícias existentes auditados.
- Sem execução local; CI do HEAD pendente; validação humana pendente; sem merge ou publicação.


## 15. Atualização — lembretes de Habilidades de combate (11/11/2026)

**IMPLEMENTADO NA BRANCH**
- `FichaLocal.tsx` agora passa `habilidadesAtivasIds` também à Calculadora de Ataques (antes, a lista era passada somente à Calculadora de Testes).
- `CalculadoraTesteLocal.tsx` apresenta lembretes para QUANTO MAIS MELHOR, ARMEIRO e ARMEIRA AUTODIDATA quando as Habilidades correspondentes estão ativas.
- QUANTO MAIS MELHOR: Vantagem permanece manual; a pessoa confirma Área de Ameaça de 3 ou mais inimigos. Não há contagem de inimigos nem inferência de posicionamento.
- ARMEIRO: lembra +1 no Teste de Ataque por Peça Extra instalada na arma efetivamente empunhada; o bônus deve ser informado manualmente.
- ARMEIRA AUTODIDATA: lembra +1d4 por Peça Extra instalada em Arma de Fogo modificada; dados adicionais continuam manuais e não se aplicam a armas Corpo a Corpo.
- Teste estático de integração acrescentado em `tests/ataques-calculadora.test.mjs`.

**LIMITES**
- A seleção de perfil de arma continua sendo consulta e não confirma posse, arma empunhada, Peças instaladas ou compatibilidade efetiva.
- Nenhum bônus foi aplicado automaticamente; não existe estado operacional de Peças instaladas nesta etapa.

**VALIDAÇÃO**
- Teste adicionado, sem execução local.
- CI do HEAD pendente; validação humana pendente; sem merge ou publicação.


## 16. Atualização — lembretes adicionais de Habilidades de Operador (11/11/2026)

**IMPLEMENTADO NA BRANCH**
- `CalculadoraTesteLocal.tsx` apresenta lembretes para CASCA-GROSSA, ARMAMENTO ESPECIAL e CONTROLE DE FOGO quando cada Habilidade está ativa.
- CASCA-GROSSA: aumento de uma categoria de Dado no Dano Desarmado/Coronhada e opção de Cabeçada/Pisão com Desvantagem uma vez por turno após Ataque bem-sucedido. Uso/eligibilidade continuam manuais.
- ARMAMENTO ESPECIAL: lembrete de Proficiência com Magnums/Armas Especiais e redução de uma categoria nos custos especificados, sem reduzir abaixo de Interação Gratuita com Objeto.
- CONTROLE DE FOGO: lembrete de substituição do Cone de Rajada por até 6 espaços conectados com linha de efeito.
- Teste estático de integração acrescentado em `tests/ataques-calculadora.test.mjs`.

**LIMITES**
- Não altera fórmulas de Dano, não valida Coronhada elegível, não controla usos por turno nem custos de ação.
- Não desenha ou valida geometria, conectividade, alcance ou linha de efeito da Rajada.
- Os lembretes não substituem decisões da Mesa.

**VALIDAÇÃO**
- Teste adicionado, sem execução local.
- CI do HEAD pendente; validação humana pendente; sem merge ou publicação.

## 17. Atualização — Defesa alternativa e lembrete de Parede Humana (11/11/2026)

**IMPLEMENTADO NA BRANCH**
- `calcularDefesaComReflexosSobrevivente()` calcula, somente quando a Habilidade está ativa, o maior valor entre a Defesa atual e 10 + Acrobacia.
- `FichaLocal.tsx` calcula Acrobacia pelo valor de Perícia já composto (Atributo + Treinamento) e exibe a Defesa alternativa no resumo de Combate. A Defesa-base e a Defesa atual continuam separadas.
- A Habilidade Parede Humana agora apresenta lembrete contextual com o gatilho, bônus de VIG, RD e duração. Não ativa o efeito nem controla o gasto de Movimento.

**TESTES ADICIONADOS**
- Cobrem escolha do maior valor, ausência do benefício sem a Habilidade e integração da Ficha.

**LIMITES**
- A Defesa alternativa é apresentada para consulta; o Mestre/jogador ainda escolhe qual valor usar contra cada Ataque.
- Parede Humana não registra estado temporário, duração, RD aplicada nem gasto de Movimento.
- Equipamentos/armaduras ainda não compõem a Defesa atual.

**VALIDAÇÃO**
- Testes adicionados; execução local não realizada neste ambiente.
- CI precisa concluir para o HEAD final. Sem validação humana, merge ou publicação.

## 18. Correção de escopo — Reflexos de Sobrevivente e Rolamento (11/11/2026)

**IMPLEMENTADO NA BRANCH**
- O lembrete de Reflexos de Sobrevivente foi completado conforme Arquivo do Jogador v1.0, p. 34: uma Esquiva gratuita por rodada sem gastar Reação, comprometendo a próxima Ação Bônus; passagem por espaços ocupados por personagens/inimigos Médios e menores sem Ataque de Oportunidade.
- Quando Rolamento está ativo, a Ficha também lembra o reposicionamento de até 3 m após Esquiva bem-sucedida, sem provocar Ataques de Oportunidade.
- A Defesa alternativa (maior entre Defesa e 10 + Acrobacia) permanece exibida separadamente.

**LIMITES**
- Os lembretes não acompanham rodada, uso da Esquiva gratuita, comprometimento da Ação Bônus, posição, tamanho de criaturas nem geometria do deslocamento.
- Não consomem Reação nem Ação Bônus automaticamente; decisão e registro continuam com a Mesa.

**VALIDAÇÃO**
- Teste estático adicionado; não executado localmente. CI pendente no HEAD final.


## 19. Procedimentos de Habilidades de Reação (11/11/2026)

**IMPLEMENTADO NA BRANCH**
- `src/reacoesCombate.ts` agora expõe helpers puros para:
  - Contra-Ataque Instintivo: autoriza reaproveitar a mesma Reação, mantendo o custo normal de 1 SA no Contra-Ataque.
  - Retaliação: após Aparar/Esquivar bem-sucedido, sinaliza Atordoado no agressor; Contra-Ataque recebe Vantagem e +1 dado de Dano se acertar.
  - Não Vai Escapar: valida gatilho de Ataque de Oportunidade em combate Corpo a Corpo para você/aliado e deslocamento prévio até 3 m, terminando adjacente.
  - Na Minha Mira: valida uso 1/rodada, alvo percebido até Alcance Médio e aquisição naquele momento de nova Condição penalizante/restritiva; retorna Ataque de Oportunidade à distância.
  - VOCÊ APAROU UM MÍSSIL!?: separa interceptação permitida pela narrativa, Aparar como Ação Livre 1/turno com Faca de Combate/Hatchet, 2d4 em Aparar Corpo a Corpo bem-sucedido, Finalizar sem custo de SA em Contra-Ataque declarado e +2d4 nos Contra-Ataques.
- Testes unitários adicionados em `tests/reacoes-combate.test.mjs`.

**LIMITES**
- Helpers ainda não conectados a uma interface de Reações na Ficha; exigem integração com o fluxo de combate e Inventário.
- Não inferem posição, tamanho, percepção, Condições do alvo, arma empunhada, gatilhos narrativos ou usos por rodada.
- Bônus de Dano são devolvidos como instruções; não alteram PV nem executam Ataques/Finalizações.
- Contra-Ataque Instintivo não gasta segunda Reação, mas preserva 1 SA.
- Execução local e validação humana pendentes; CI deve ser conferido para o HEAD final.


## 20. Auditoria de integridade das Reações — correção do Contra-Ataque Instintivo (11/11/2026)

**PROBLEMA ENCONTRADO**
- `prepararContraAtaque()` aceitava `mesmaReacaoAutorizada: true` mesmo quando nenhuma Reação havia sido registrada. Isso permitia contornar o custo de Reação por chamada direta do domínio, embora a Habilidade apenas permita reutilizar a Reação já gasta em Aparar/Esquivar.

**CORREÇÃO IMPLEMENTADA**
- Contra-Ataque Instintivo agora exige que a economia registre a Reação normal consumida ou uma Reação adicional comprada antes de reutilizá-la.
- A Habilidade continua preservando o custo normal de 1 SA do Contra-Ataque.
- Helpers de Habilidades de Reação agora validam estrutura exata, rejeitando campos ausentes, extras e tipos incorretos.
- Testes adicionados para a regressão e validação estrutural.

**VALIDAÇÃO**
- Testes adicionados, não executados localmente. CI pendente no HEAD final; sem validação humana, merge ou publicação.
