# Linha de trabalho e continuidade — Ameaça Biológica WebApp

**Atualizado em:** 12/11/2026  
**Branch de trabalho:** `feat/offline-first-ficha`  
**HEAD observado no início desta atualização:** `bc211a1d1f9d880fa7806dd7b358e5f115659eea`  
**Repositório:** `guspmc/ameaca-biologica-webapp`

Este documento é a referência operacional para retomar o trabalho em novas conversas. Ele registra o escopo acordado, a ordem das atividades, as restrições e o ponto de continuidade. Não substitui as regras oficiais nem os checkpoints técnicos específicos.

## 1. Objetivo imediato

Concluir a auditoria funcional e normativa do Laboratório e da Ficha Offline, corrigir defeitos comprovados, remover somente código realmente descartado/sem uso após análise de dependências e atualizar a documentação necessária. O resultado esperado é uma versão coerente e preparada para a bateria de testes humanos progressivos, sem declarar homologação antes desses testes.

A maioria da estrutura já existe. O trabalho é **inspecionar, comprovar, corrigir e consolidar**, não reconstruir por suposição.

## 2. Fontes e precedência

1. **Arquivo do Jogador v1.0** e **Arquivo do Mestre v1.0**: cânone de regras, fórmulas, termos e limites.
2. **Documento Mestre de Planejamento do WebApp v2.5**: decisões funcionais e navegação aprovadas. Versões posteriores em rascunho, inclusive v2.6, não substituem a versão aprovada sem validação expressa.
3. Checkpoints técnicos deste repositório: evidências históricas e estado das implementações; sempre reconferir o código da branch atual.
4. Código efetivamente presente na branch: fonte do que está implementado, não prova isolada de funcionamento.

Diante de conflito entre cânone, planejamento e código, registrar a divergência. Não inventar regra, não alterar o cânone e não resolver silenciosamente uma decisão de produto.

## 3. Escopo atual — antes dos testes humanos

### 3.1 Laboratório, Hub e autonomia de uso

Auditar o fluxo completo de entrada e instalação, preservando o servidor LAN já funcional:

- Hub inicial com primeira escolha clara: **Conectar ao Laboratório LAN** ou **Continuar Offline**.
- PWA: manifesto, Service Worker, instalação pelo navegador e abertura adequada.
- Inicialização no computador anfitrião: scripts por sistema operacional, dependências, servidor e abertura do navegador, com o mínimo de intervenção manual.
- LAN: criação/entrada em Mesa, sessão, QR Code e Código da Mesa.
- Segundo dispositivo: QR/link deve abrir o Laboratório no navegador; opção de instalar como aplicativo; funcionamento Offline após instalação.
- Configuração e persistência do endereço do servidor no dispositivo cliente.
- Não refatorar o servidor LAN comprovadamente funcional durante esta auditoria. Registrar defeitos específicos e só corrigir se forem bloqueadores e após delimitar o impacto.

### 3.2 Ficha Offline

Auditar todas as regras e mecânicas aplicáveis do Arquivo do Jogador v1.0, não apenas a existência de telas. Conferir cálculos, limites, validações, efeitos contextuais, estados, transições, persistência, recuperação, modos Automático/Misto/Manual e Dados Físicos/Virtuais/Mistos.

O escopo inclui criação, Identidade, Características, Atributos, Perícias, Origens, Habilidades, Progressão, Recursos, Bio-Infecção, Condições, Descanso, Reanimação, rolagens, Ataques, Dano e Reações, respeitando os limites de responsabilidade da Ficha. Confirmações que dependem da narrativa/Mesa permanecem manuais quando assim definido.

**Inventário ativo não faz parte da entrega atual da Ficha.** Não presumir arma equipada, munição, Peças instaladas ou Durabilidade. Dependências que exigem esses estados devem permanecer bloqueadas ou explicitamente condicionadas.

### 3.3 Importação e exportação

Auditar os botões e o fluxo de backup para transporte entre dispositivos: integridade e completude dos dados, versão/formato, validação, IDs e gerações, cópias versus substituição, atomicidade, concorrência, erros e confirmação de gravação. Não afirmar que a portabilidade está homologada apenas porque o JSON é gerado e aceito.

### 3.4 Documentação, scripts e limpeza

Atualizar somente documentos, scripts e configurações necessários para refletir o fluxo real. Remover dependências/arquivos apenas após comprovar que estão descartados ou sem uso e mapear suas referências. Supabase é legado fora do escopo ativo; qualquer limpeza exige prova de que não há dependência no caminho atual. Não alterar banco, histórico de migrations ou segredos.

## 4. Classificação obrigatória das evidências

Usar estes estados nos relatórios:

- **IMPLEMENTADO:** existe no código atual.
- **FUNCIONAL COMPROVADO:** há evidência de execução/teste bem-sucedido.
- **INCOMPLETO:** existe, mas faltam partes necessárias.
- **COM ERRO:** defeito reproduzido ou demonstrado pela inspeção.
- **DESCARTADO/SEM USO:** candidato à remoção, somente após mapear dependências.
- **PENDENTE DE TESTE HUMANO:** depende de navegador, instalação, rede ou dispositivo real.

Separar inspeção estática, testes automatizados, CI e testes humanos. Não transformar ausência de evidência em defeito nem existência de código em prova de funcionamento.

## 5. Restrições que não podem ser esquecidas

- Trabalhar exclusivamente na branch `feat/offline-first-ficha`; não criar outra branch.
- Não tocar em `main`, não fazer merge, deploy ou publicação.
- GitHub Pages está fora do escopo.
- Supabase e banco remoto estão fora do escopo ativo; não alterar migrations ou produção.
- Preservar integralmente a identidade visual aprovada: sem redesign, mudanças de cores, layout, componentes ou navegação antes dos testes humanos.
- Preservar o servidor LAN funcional; não fazer refatoração ampla.
- Não iniciar o módulo Inventário ativo antes de concluir e validar a Ficha Offline e obter aprovação do Gus.
- Não iniciar Painel do Mestre nem versão Linux nesta etapa.
- Não reabrir decisões aprovadas sem evidência concreta.
- Não declarar testes locais executados: esta sessão trabalha pelo conector GitHub, sem clone/runtime local.
- `pnpm test` e `pnpm build` já foram relatados pelo Gus como aprovados em ciclos anteriores. Não os transformar em tarefa repetitiva. Reavaliar somente quando uma alteração real justificar nova execução, deixando claro quem executou e qual evidência existe.
- Nunca expor tokens, senhas, service_role ou segredos.

## 6. Ordem de trabalho acordada

### Etapa A — auditoria e preparação para testes humanos
1. Confirmar branch e HEAD reais.
2. Auditar Hub, PWA, scripts de inicialização, LAN/QR/código e configuração de endereço.
3. Auditar importação/exportação e persistência Offline.
4. Cruzar integralmente as regras da Ficha com o Arquivo do Jogador v1.0, em ordem temática, conferindo código e testes.
5. Corrigir defeitos comprovados em alterações pequenas e localizadas.
6. Limpar somente itens comprovadamente descartados/sem uso.
7. Atualizar documentação, scripts/configuração e matriz de auditoria.
8. Preparar a bateria humana progressiva com ação, resultado esperado e campo de registro.

### Etapa B — testes humanos progressivos, conduzidos pelo Gus
1. Baixar o projeto do GitHub no sistema operacional suportado.
2. Executar o script de preparação: dependências, servidor e abertura do navegador.
3. Confirmar Hub e escolha LAN/Offline.
4. Criar/iniciar Mesa e conectar o anfitrião LAN.
5. Entrar pelo QR Code ou Código da Mesa em um segundo dispositivo.
6. Instalar como PWA pelo navegador.
7. Confirmar operação Offline e configuração do endereço do servidor.
8. Testar importação/exportação entre dispositivos.
9. Testar a Ficha seção por seção: regras, mecânicas, gravação, recuperação e integridade.

Os testes são sequenciais. Não avançar para o próximo passo sem o resultado/validação do Gus. Não alterar identidade visual durante essa etapa sem decisão expressa.

### Etapa C — módulos e entregas posteriores, nesta ordem
1. **Inventário Offline.**
2. **Inventário LAN.**
3. **Painel do Mestre.**
4. **Versão Linux.**

A ordem é deliberada. Não antecipar módulos posteriores nem misturar suas dependências à auditoria atual. O Baú e transferências compartilhadas permanecem sujeitos às regras de autorização e ao escopo LAN aprovado; nunca habilitar mutações compartilhadas offline por inferência.

## 7. Estado observado nesta retomada — 12/11/2026

### Repositório
- Branch `feat/offline-first-ficha` encontrada.
- HEAD resolvido pela árvore GitHub no início desta rodada: `bc211a1d1f9d880fa7806dd7b358e5f115659eea`.
- Há checkpoints mais recentes no histórico documental que citam SHAs diferentes. Portanto, **não presumir que um SHA citado em checkpoint antigo seja o HEAD atual**; reconfirmar branch/HEAD a cada ciclo.

### Achados da auditoria inicial desta rodada
- `src/main.tsx` encaminha para `FichaOfflineApp` como entrada padrão.
- `src/App.tsx` escolhe LAN por `?servidor=local`, Laboratório fictício por `?laboratorio=local` e, no caminho padrão, abre a aplicação online legada.
- `src/LaboratorioLocal.tsx` é identificado como laboratório fictício/isolado; não equivale ao Hub integrado de LAN e Offline.
- `public/manifest.webmanifest` e `public/sw.js` existem. A existência dos arquivos não comprova instalação e operação PWA em dispositivos reais.
- `src/ConexaoServidorLocal.tsx` contém configuração e persistência do endereço LAN, geração de QR Code para endereços LAN e entrada por código de convite. O fluxo completo do convite/QR entre dispositivos ainda precisa ser verificado.
- `src/backupFicha.ts` implementa formato JSON versionado, validação de personagem, rejeição de IDs duplicados e geração de backup.
- `src/FichaOfflineApp.tsx` oferece importação como cópias ou substituição, prévia/validação e exportação por download. A integridade e os cenários de falha ainda precisam ser confrontados com persistência e testes.
- O README ainda contém instruções e descrições históricas da Alfa/Supabase que não representam o foco atual. Deve ser atualizado com referência explícita a esta linha de trabalho, sem apagar histórico técnico que ainda tenha valor.

### Situação funcional
- A documentação anterior registra uma Ficha Offline sem Inventário com ampla cobertura de criação, Progressão, Recursos, BI, Condições e Reações. Isso é evidência documental, não substitui a conferência do código no HEAD atual.
- Checkpoints anteriores identificam dependências do Inventário para Aparar, efeitos que exigem arma em mãos/Durabilidade e benefício do Chef.
- Existem documentos específicos para auditoria normativa, persistência, backup, PWA, LAN e matriz de regras. Reutilizar e atualizar esses documentos; evitar duplicar relatórios sem necessidade.
- Nenhum arquivo de código foi alterado nesta rodada de retomada.
- Nenhum teste local ou humano foi executado por esta sessão.
- Não houve merge, publicação, deploy ou alteração de banco.

## 8. Próxima ação ao retomar

1. Confirmar novamente branch e HEAD.
2. Ler este documento e os checkpoints mais recentes da Ficha, especialmente:
   - `docs/checkpoint-ficha-offline-sem-inventario-2026-11-11.md`
   - `docs/matriz-auditoria-funcional-ficha.md`
   - `docs/checkpoint-importacao-backup-offline-2026-11-03.md`
   - `docs/checkpoint-laboratorio-local-2026-10-31.md`
3. Continuar a inspeção do fluxo de importação/exportação e da persistência no HEAD real.
4. Auditar o Hub/PWA/bootstrap com foco na entrada unificada, sem mexer no servidor LAN.
5. Continuar o confronto canônico da Ficha e registrar cada achado com arquivo, função/trecho, regra oficial, estado e teste relacionado.
6. Fazer correções pequenas apenas quando houver defeito demonstrado.

**Regra de continuidade:** não recomeçar a análise do zero, não repetir tarefas já aprovadas e não confundir funcionalidade planejada/documentada com funcionalidade implementada ou testada.


## Atualização de ciclo — 12/11/2026 (após auditoria de Condições/Descanso/Combate)

- Checkpoint mais recente: `docs/checkpoint-auditoria-condicoes-descanso-combate-2026-11-12.md`.
- HEAD documental atual: `ca7473129b156e2b45fce7a90dd2ffacf924bbb4`.
- Inspeção estática adicional: Condições, Descanso Parcial/Completo, compatibilidade neutra/histórica de Progressão e estado/economia de turno.
- Nenhum defeito concreto identificado nesses fluxos na leitura desta rodada; nenhuma alteração de código.
- Condições derivadas, histórico, limites de automação e ausência de contador Offline permanecem conforme escopo.
- Descanso Parcial/Completo valida recursos e local, respeita modos de dados e confirma somente após salvamento; Descanso Completo renova usos limitados e pode confirmar Progressão elegível na mesma gravação.
- Progressão nova usa autorização neutra do grupo; contratos legados com método são aceitos para compatibilidade. Edição de Progressão na LAN continua incompleta.
- Estado de turno/Economia/Reações têm helpers e testes existentes; integração de interface permanece parcial (Aparar bloqueado por ausência de estado confiável de equipamento). Não transformar a Ficha em motor de turnos.
- Testes locais/CI e teste humano não foram executados/confirmados nesta rodada.
- Próximo foco: auditoria normativa e de integração da interface de Combate/Manobras/Reações, seguida de persistência/recuperação do estado de turno. Inventário ativo continua bloqueado.


## Atualização de ciclo — 12/11/2026 (integração de Manobras e Reações)

- **HEAD de código consultado no início do ciclo:** `bc211a1d1f9d880fa7806dd7b358e5f115659eea`.
- **Checkpoint:** `docs/checkpoint-auditoria-integracao-manobras-reacoes-2026-11-12.md`.
- **Matriz:** seção “Auditoria de integração das Manobras e Reações — 12/11/2026” em `docs/matriz-auditoria-funcional-ficha.md`.
- **Achados:** Economia de Ações e estado composto apresentam coerência estática nos limites inspecionados; persistência/recuperação real permanece pendente de teste humano.
- **Defeito de integração identificado:** Combate com Duas Armas exige marcador de Ataque inicial que a interface só registra pelo controle condicionado a Mirar. O uso genérico da Ação não satisfaz essa pré-condição.
- **Integração incompleta:** Mirar registra custo/preparação, mas o +2 no Teste de Ataque e a escolha de região específica não chegam à calculadora.
- **Lacunas de UI:** Desengajar e Usar Objeto têm helpers sem controles próprios; Adiar Ação, Agarrar, Empurrar/Derrubar e Esconder-se não possuem controles operacionais específicos no painel consultado. O catálogo de consulta não conta como integração.
- **Reações:** os fluxos consultados permanecem condicionados a confirmações contextuais; Aparar continua bloqueado até existir estado confiável de equipamento e Durabilidade.
- **Código:** nenhum arquivo de código alterado. Nenhum teste local, CI ou humano executado por esta sessão.
- **Restrições:** sem mudança visual, sem refatoração LAN, sem Supabase, sem alteração de banco, sem `main`, merge, deploy ou publicação; nenhuma branch criada; Inventário ativo continua bloqueado.
- **Commits documentais deste ciclo:** checkpoint `36cfdc448ec7c35a153dcfa14128bb46959d443b`; matriz `f00a80512bd8e87132e56ac0936e4898be2b5f0f`.
- **HEAD após a gravação do checkpoint e da matriz, imediatamente antes desta atualização de continuidade:** `f00a80512bd8e87132e56ac0936e4898be2b5f0f`.
- **Commit desta atualização de continuidade:** `4e1219440ef04b87f16f32e02372c5ba43a33d98`.

### Próxima ação
Corrigir em alteração mínima a integração do Ataque normal e Combate com Duas Armas, e integrar Mirar ao Teste de Ataque sem remover Desvantagem. Antes de editar, inspecionar os testes de calculadora/combate e os contratos de salvamento relevantes. Em seguida decidir o nível de integração operacional das Manobras universais restantes. Atualizar checkpoint e continuidade novamente ao final do próximo ciclo.


## Atualização de ciclo — 12/11/2026 (correção de Mirar e Ataque normal)

- **Branch:** `feat/offline-first-ficha`; nenhuma branch nova criada.
- **HEAD de código após as alterações:** `84d74e0d126852535cd73ee75aa36fd75cd64156`.
- **Checkpoint:** `docs/checkpoint-correcao-mirar-ataque-duas-armas-2026-11-12.md`.
- **Matriz:** seção “Correção de Mirar e registro de Ataque normal — 12/11/2026” em `docs/matriz-auditoria-funcional-ficha.md`.
- **Código alterado:** `src/PainelAcoesLocal.tsx`, `src/CalculadoraTesteLocal.tsx`, `src/FichaLocal.tsx`.
- **Teste estrutural alterado:** `tests/ataques-calculadora.test.mjs`.
- **Correções:** registro de Atacar agora é independente de Mirar e atualiza `ataqueNormalRealizado`; o estado persistido válido de Mirar é passado à calculadora; +2 é aplicado ao Teste de Ataque; região específica precisa ser informada antes da rolagem; Desvantagem não é removida; Dano não recebe bônus.
- **Combate com Duas Armas:** o pré-requisito de Ataque inicial agora pode ser registrado sem Mirar. Elegibilidade das armas segue confirmação manual, sem inventar equipamento que ainda depende do Inventário.
- **Validação:** testes estruturais adicionados; testes automatizados e build **não executados nesta sessão**; nenhum teste humano executado. Status CI consultado no commit de teste não apresentou status check reportado; não interpretar isso como aprovação.
- **Restrições:** sem alteração de regras, sem redesign, sem LAN, Supabase, banco, `main`, merge, deploy ou publicação. Inventário ativo segue bloqueado até validação humana da Ficha Offline.
- **Commits de código/teste deste ciclo:** `01020ec75eb148449a27c7bf5909b2a596d00f63` (Painel), `72f901f3aa0a20828177621151cf44cbf4726be4` (calculadora), `d13661bc20c7d58c9f557f306bc54fc47c862df1` (Ficha), `84d74e0d126852535cd73ee75aa36fd75cd64156` (testes).
- **Commits documentais:** checkpoint `e7a2d366b3e7f3cb879fa223a897aa453c2756a2`; matriz `bb59090ce7d4e6482b89122d6d39f109dfbbdace`.

### Próxima ação
Verificar se o workflow/CI foi acionado para o HEAD e obter resultado real de testes/build. Depois executar a bateria humana dirigida: Ataque sem Mirar → Duas Armas; Mirar → região → Ataque +2 → consumo; preservação de Desvantagem; nenhum bônus em Dano/Área; reabertura da Ficha e persistência. Somente após isso seguir para Desengajar e Usar Objeto. Atualizar checkpoint e continuidade ao fim do próximo ciclo.


### Complemento do mesmo ciclo — cobertura de Mirar em Misto/Manual

A revisão final identificou que a calculadora de Ataques só aparece no modo Automático. Para não deixar os modos Misto/Manual sem o lembrete do bônus, o painel agora exibe +2 no Teste e a exigência de escolher região enquanto Mirar estiver preparado; nesses modos, a rolagem continua manual e o jogador aplica o bônus ao resultado externo. No modo Automático, a calculadora exige a região e a identifica no resultado.

- **HEAD de código/testes após todos os ajustes deste ciclo:** `087315742622a8e4e744fbe47091a7df2cb648e0`.
- **Checkpoint atualizado:** commit `14628b7ea934d6e961379b700461a0136b841d43`.
- **Matriz atualizada:** commit `94af03ab5c8c28b06d6606cd38b97d671002ef36`.
- **Teste estrutural adicional:** lembrete em Misto/Manual e identificação da região no resultado automático.
- **Validação continua não executada:** sem testes automatizados, build ou teste humano nesta sessão. A consulta de status/checks não retornou verificações associadas; isso não comprova sucesso.
- **Próxima ação inalterada:** verificar workflow real e executar testes/build; depois bateria humana dirigida antes de seguir para Desengajar e Usar Objeto.


**Rastreabilidade complementar dos últimos ajustes do ciclo:**
- Painel — lembretes de Mirar para Misto/Manual: `6a916c506999e3095bead22ad14f1a1680a07d6f`.
- Calculadora — identificação da região no resultado automático: `8726592dd1251f12c4db71323cb9e3d2c90e28dd`.
- Teste estrutural — lembrete nos modos manuais e região no resultado: `087315742622a8e4e744fbe47091a7df2cb648e0`.
- Este complemento de rastreabilidade não altera o HEAD de código/testes registrado acima.


## Atualização de ciclo — 12/11/2026 (integração de Desengajar e Usar um Objeto)

- **Branch:** feat/offline-first-ficha; nenhuma branch nova criada.
- **Base de código/testes:** sequência de commits após o HEAD anterior 087315742622a8e4e744fbe47091a7df2cb648e0; comparação GitHub confirma 8 commits à frente e nenhuma divergência atrás. HEAD de código/testes consultado: c8118631ee9e6699a97b8dfdedbf96e42d60e029.
- **Código alterado:** src/manobrasOperacionais.ts e src/PainelAcoesLocal.tsx.
- **Teste alterado:** tests/manobras-operacionais.test.mjs.
- **Desengajar:** controle específico integrado; consome Movimento e registra a instrução de deslocamento protegido de 1,5 m. Não move personagem nem verifica posições.
- **Usar um Objeto:** controle integrado; só fica disponível após a Interação Gratuita e consome Ação. O helper também valida o pré-requisito, não dependendo exclusivamente da interface.
- **Cânone:** Arquivo do Jogador v1.0, p. 76–79. Nenhuma regra alterada; uso e efeitos concretos de itens permanecem fora desta integração.
- **Testes:** cobertura de domínio atualizada. Testes automatizados e build não foram executados nesta sessão.
- **CI:** consulta de status do commit c8118631ee9e6699a97b8dfdedbf96e42d60e029 retornou lista vazia; não há evidência de aprovação ou execução bem-sucedida.
- **Validação humana:** pendente. Inclui persistência, falha de salvamento, disponibilidade de recursos e confirmação de que nenhum efeito de item/movimento é aplicado automaticamente.
- **Checkpoint:** docs/checkpoint-desengajar-usar-objeto-2026-11-12.md — commit c42532f45bf1e828d99e8e4a50bc6b0b94db1a9c.
- **Matriz:** docs/matriz-auditoria-funcional-ficha.md — commit eb9d44c6a812869ff3c63a7f5cd8ee9850e560cd.
- **Commit desta atualização de continuidade:** pendente de confirmação após gravação.
- **Restrições preservadas:** sem redesign/CSS, LAN/servidor, Supabase, banco, main, merge, deploy ou publicação. Inventário ativo segue bloqueado.

### Próxima ação

1. Inspecionar Adiar Ação, Agarrar, Empurrar/Derrubar e Esconder-se contra o Arquivo do Jogador e os helpers existentes.
2. Determinar para cada uma se cabe controle contextual de confirmação ou se depende de recursos ainda não existentes (por exemplo, resolução de Testes/posicionamento).
3. Atualizar matriz/checkpoint; não inventar rolagens ou efeitos e não transformar a Ficha em motor de turnos.
4. Solicitar/acompanhar execução real de pnpm test e pnpm build e preparar a bateria humana consolidada. Não avançar para Inventário ativo antes da validação humana da Ficha Offline.
