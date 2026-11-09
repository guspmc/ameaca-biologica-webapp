# Checkpoint — auditoria integral da Ficha Offline
**Data:** 09/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD de referência antes deste checkpoint:** `21e560a768556a034a25aaf9df3344441b426c36`  
**Escopo:** auditoria estrutural da Ficha inteira, antes de iniciar a próxima implementação funcional.

## 1. Decisão de escopo confirmada
O objeto de trabalho é a **Ficha inteira**, independente e funcional Offline: criação/identidade, Características, Atributos, Perícias, Habilidades, Progressão, Recursos, Condições, Bio-Infecção, Descanso, Reanimação, Morte, Combate, persistência e backup. Não basta completar Combate isoladamente.

Sequência confirmada pelo Gus:
1. Completar e integrar a Ficha inteira Offline.
2. Executar auditorias e testes automatizados.
3. Gus realiza uma única bateria humana integrada; corrigir os problemas encontrados.
4. Implementar Inventário Offline completo, com catálogo e gestão funcional.
5. Implementar Inventário LAN com controle do Mestre sobre o que os Jogadores podem acessar.
6. Implementar Baú LAN compartilhado.
7. Depois, adaptar e validar variações de plataforma Linux/Android.

Combate completo é pré-requisito para o Inventário ativo. O Planejamento v2.6 continua como guia, mas decisões posteriores do Gus prevalecem. Progressão pertence à Ficha; não criar configuração de método de Progressão na Mesa. O Hub/Mesa não deve controlar Progressão.

## 2. Evidência inspecionada nesta rodada

### Estado do repositório
- HEAD confirmado: `21e560a768556a034a25aaf9df3344441b426c36`.
- Árvore restaurada: 505 entradas, incluindo `src/`, `tests/`, `server/`, configurações e documentação.
- Branch: `feat/offline-first-ficha`.
- Status do commit de referência: nenhum status/check observado; workflow runs retornaram lista vazia. **CI não comprovada como aprovada.**
- Nenhum código foi alterado nesta rodada. Nenhum teste foi executado localmente ou declarado aprovado.
- Nenhum merge para `main`, deploy ou alteração de produção/Supabase.

### Criação, identidade e atributos/perícias
- `src/FichaLocal.tsx` integra editores de Características, Identidade, Atributos/Perícias, Planejamento de Habilidades e revisão/ativação.
- `src/EditorCaracteristicasLocal.tsx` edita Classe, Origem, arma da Origem Operário e Habilidade Básica.
- `src/EditorAtributosPericiasLocal.tsx` ainda usa limites de criação: Atributos 0–3 e distribuição inicial de Perícias conforme pontos da Classe. Isso é adequado ao fluxo de criação, mas não substitui o futuro editor de ganhos por Progressão (Atributos até 5, graus de Perícia e benefícios de níveis 4/8).
- Na Ficha ativa, os editores de criação ficam bloqueados; a própria interface declara que aumentos e novas Perícias aguardam Progressão.
- A apresentação da identidade ainda contém texto e objeto de revisão com Nível 1 fixo. Deve passar a refletir o Nível persistido da Personagem após integrar Progressão; não pode continuar mostrando Nível 1 para personagens evoluídos.

### Progressão e Morte
- `src/progressaoHabilidades.ts`: catálogo e funções puras de elegibilidade, pré-requisitos e ganhos por nível.
- `src/progressaoPersistente.ts`: contrato versionado e validação de histórico de benefícios; atualização isolada do contador de Missões.
- `src/progressaoMorte.ts`: plano de reversão exata, sem mutar a Ficha.
- `src/validacaoPersonagemLocal.ts` valida o campo `progressao` quando presente.
- **PENDENTE:** interface e fluxos reais de Progressão não estão integrados em `FichaLocal.tsx`; não há fluxo completo de concessão de nível, escolha de benefícios, registro por nível, aplicação atômica após Descanso Completo ou reversão por Morte.
- **PENDENTE:** reconciliar o estado de elegibilidade de `avaliarDisponibilidadeProgressao` (que recebe `descansoCompletoEmSalaDescanso`) com o contrato persistente e com a confirmação real do Descanso. Não persistir um booleano temporário como se fosse prova de Descanso válido.
- **PENDENTE:** integrar o nível máximo da campanha sem deslocar a propriedade da Progressão para a Mesa; a Mesa pode fornecer limite de campanha, enquanto o estado e as escolhas continuam na Ficha.
- Os testes existentes cobrem validadores e planejadores puros, não a experiência integrada nem a mutação atômica na Ficha.

### Recursos, Condições, Descanso, Bio-Infecção e Reanimação
- `src/RecursosFichaLocal.tsx` permite ajuste explícito de PV, SA e BI e persiste por callback; Vulnerável é derivada de PV.
- `src/CondicoesFichaLocal.tsx` registra, encerra e preserva histórico de Condições. O texto ainda diferencia LAN/Offline e diz que o Mestre acompanha duração na aba Combate; revisar para manter a Ficha independente e evitar dependência de Painel/Mesa.
- `src/bioInfeccao.ts` calcula fases e identifica Colapso Viral, mas a integração visual/persistente de Colapso como Condição especial ainda precisa ser fechada.
- `src/DescansoFichaLocal.tsx` está integrado a PV/SA/BI e usos limitados, mas o modo de dados Virtual ainda bloqueia Descanso Parcial por ausência de rolagem virtual. Não inventar resultados nem aceitar resultados incompatíveis com `modoDados`.
- Descanso Completo restaura PV/SA, encerra PV Temporários e renova usos limitados; a integração com Progressão ainda não existe.
- `src/ReanimacaoFichaLocal.tsx` usa resultados inseridos manualmente e bloqueia modo Virtual. A integração de Morte com o histórico de Progressão ainda não existe. Não assumir que registrar morte no Painel automaticamente altera a Ficha.
- A cobertura atual de Reanimação inclui testes de domínio e testes estruturais da interface; falta fluxo integrado com Progressão/Morte e auditoria de todas as interações de modos.

### Combate
- A seção atual da Ficha declara Ataques e Dano “A integrar”.
- Roladores básicos e calculadora de Perícia/Atributo estão integrados parcialmente ao modo Automático.
- A calculadora de Ataque ainda precisa ser separada dos Testes comuns e não pode comparar o resultado com Defesa de alvo.
- O escopo inclui os 49 perfis de armas, Ataque Desarmado, Arma Improvisada, coronhada, dano, críticos, margens, BI, modificadores, Habilidades, Peças, propriedades e exceções.
- A Ficha apresenta cálculos e resultados; não decide acerto, não controla turnos/rodadas, não resolve narrativa ou efeitos que pertencem ao Jogador/Mestre.
- Selecionar perfil para cálculo não significa posse/equipamento. A Ficha deve calcular ataques universais mesmo sem Inventário ativo.

### Inventário
- `EditorInventarioLocal` é usado no rascunho para escolher Equipamento Inicial e planejar compras. Isso faz parte da criação e não equivale ao Inventário ativo.
- A Ficha ativa apenas exibe a projeção do equipamento inicial e informa que gestão contínua será liberada depois.
- Não iniciar Inventário ativo nesta fase. A primeira etapa futura será Offline, com catálogo completo e operações funcionais; depois LAN com controle de acesso pelo Mestre; por último Baú compartilhado.

### Persistência Offline e backup
- `FichaOfflineApp.tsx` usa IndexedDB por `persistenciaFicha`, fila serializada e patches para salvar a Ficha. O fluxo atual mantém gravações serializadas e proteção contra concorrência entre abas.
- Há módulos de backup JSON e validação central de dados.
- A auditoria integral deve conferir se todos os novos campos de Progressão/Morte/Combate entram no backup, importação, migração e validação sem perda ou sobrescrita.
- Preferências de posição e abertura de editores em `FichaLocal.tsx` usam `localStorage`; são preferências de interface, não dados mecânicos.

## 3. Inconsistências/risco identificados
1. Nível 1 fixo na apresentação/revisão da Ficha, apesar de o modelo admitir `nivel` entre 1 e 10.
2. Progressão e Morte possuem funções e contratos, mas não fluxo de aplicação integrado.
3. A elegibilidade de Progressão depende de um sinalizador de Descanso Completo na Sala de Descanso ainda não conectado a uma operação transacional confirmada.
4. Descanso Parcial e Reanimação não aceitam rolagem Virtual/Mista quando o modo exige resultado virtual; a interface bloqueia em vez de implementar o procedimento.
5. Condições ainda descrevem duração e acompanhamento LAN pelo Mestre, contradizendo o princípio de Ficha autônoma quando isso for interpretado como dependência funcional.
6. A seção de Combate ainda é parcial.
7. A matriz anterior contém decisões antigas incompatíveis (método de Progressão por Mesa e combate tratado como motor de encontro). Esta atualização as substitui: Progressão na Ficha; Ficha não é motor de combate; Inventário só depois da Ficha inteira.

## 4. Próximo lote de implementação proposto
Não executar mudanças simultâneas nos mesmos contratos. Priorizar lotes pequenos, mas com entregas funcionais completas:

**Lote A — Progressão Offline integrada**
- Contrato persistente e migração/inicialização de personagens existentes.
- UI de Missões/Marcos e elegibilidade na Ficha.
- Fluxo de solicitação e aplicação de nível após Descanso Completo válido na Sala de Descanso.
- Escolha de Habilidade, aumento de Atributo, ponto de Perícia nos níveis previstos e histórico exato dos benefícios.
- Atualização dos valores derivados, exibição de Nível e limite máximo de campanha.
- Testes de domínio, persistência, backup/importação, concorrência e fluxo integrado.

**Lote B — Morte e recuperação**
- Registrar evento e snapshot do histórico.
- Perda de nível e reversão somente dos benefícios exatos registrados.
- Penalidade de nível 1 e encerramento ao recuperar nível 2.
- Preservar Missões/Marcos anteriores e exigir progresso posterior à Morte.
- Testes de falha atômica, histórico incompleto e conflitos.

**Lote C — Recursos/Condições/Descanso/Reanimação**
- Fechar Colapso Viral e Condições especiais.
- Implementar rolagem conforme modo físico/virtual/misto, sempre sob ação expressa.
- Conectar Descanso Completo à Progressão sem acionar ganho antes da confirmação do salvamento.
- Integrar consequências de Reanimação com o registro de Morte sem assumir papel de Mestre.

**Lote D — Combate integral**
- Separar Ataque de Testes comuns e retirar comparação de Defesa.
- Integrar fórmulas, 49 armas, ataques universais, críticos, dano e todas as propriedades/exceções.
- Integrar Habilidades, Peças, Origem, Classe e BI.
- Testes abrangentes sem estado de encontro ou automação narrativa.

**Lote E — Auditoria final da Ficha**
- Revisar criação, todos os módulos, navegação contínua, salvamento, backup/importação, migração e acessibilidade.
- Suíte automatizada e build/CI comprovados.
- Só então solicitar a bateria humana integrada ao Gus.

## 5. Estado deste checkpoint
- **PLANEJADO:** lotes A–E acima.
- **IMPLEMENTADO:** somente os módulos isolados e integrações descritos na evidência.
- **TESTADO:** testes existentes foram inspecionados no repositório; não executados nesta rodada. CI do HEAD-base não observada.
- **PENDENTE:** implementação integrada e auditoria dinâmica.
- **Alterações de código nesta rodada:** nenhuma.
- **Merge/deploy/produção/Supabase:** nenhum.
- **Próxima ação:** validar este checkpoint com o Gus; depois iniciar o Lote A, verificando novamente HEAD e SHAs de cada arquivo antes de qualquer escrita.
