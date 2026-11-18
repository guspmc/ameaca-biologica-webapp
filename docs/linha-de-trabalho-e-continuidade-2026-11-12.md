# Linha de trabalho e continuidade — Ameaça Biológica WebApp

**Atualizado em:** 12/11/2026  
**Branch de trabalho:** `feat/offline-first-ficha`  
**HEAD observado na atualização anterior:** `bc211a1d1f9d880fa7806dd7b358e5f115659eea`  
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


## Complemento de auditoria — Manobras Universais restantes (12/11/2026)

- **Base de código/testes:** c8118631ee9e6699a97b8dfdedbf96e42d60e029.
- **Auditoria:** catálogo src/manobrasUniversais.ts, testes tests/manobras-universais.test.mjs, helpers src/manobrasOperacionais.ts, painel src/PainelAcoesLocal.tsx e Arquivo do Jogador v1.0, p. 77–78.
- **Adiar Ação:** mantida como consulta/manual porque altera ordem de Iniciativa/rodada, não gerida pela Ficha do Jogador.
- **Agarrar e Empurrar/Derrubar:** sem integração operacional por enquanto. “Substitui um Ataque” não será convertido silenciosamente em consumo de Ação ou marcador de Ataque elegível a Duas Armas. Testes e efeitos continuam sob resolução da Mesa.
- **Esconder-se:** sem integração operacional por enquanto; custo Ação é claro, mas requisitos ambientais e Percepção Passiva/ativa dependem do contexto da Mesa. Não declarar ocultação automaticamente.
- **Código:** nenhum arquivo alterado neste complemento.
- **Checkpoint:** docs/checkpoint-auditoria-manobras-restantes-2026-11-12.md — commit 4c33720f8a1bb3693835005ae3b6ca88ce8ec5e4.
- **Matriz:** docs/matriz-auditoria-funcional-ficha.md — commit a559c052aa4694afe31d76c4447ec3e61c888ef9.
- **Validação:** nenhum teste automatizado, build ou teste humano executado nesta sessão. A consulta de status checks não retornou entradas; não representa aprovação.
- **Próxima etapa:** consolidar a bateria humana da Ficha Offline e obter resultados reais de pnpm test/pnpm build. Inventário ativo continua bloqueado até validação humana e aprovação expressa.



## Ciclo de auditoria da Bio-Infecção — 12/11/2026

- **Escopo:** confronto das regras de PV/BI e condições com src/recursosFicha.ts, src/bioInfeccao.ts, src/condicoesFicha.ts, src/condicoesCalculadora.ts, src/RecursosFichaLocal.tsx, src/FichaLocal.tsx, src/CalculadoraTesteLocal.tsx e testes relacionados.
- **Fonte canônica:** Arquivo do Jogador v1.0, pp. 81–83 (PV Temporários/Condições), p. 90 (Bio-Infecção/Fases/Colapso), pp. 96–97 (Descanso).
- **Revisão estática:** cálculo dos quintos da BI, efeitos acumulados nas fases 2–4, perda dos benefícios na fase 5, Colapso ao atingir/ultrapassar máximo, PV Temporários absorvendo Dano e não acumulando, Vulnerável derivada por 1/5 dos PV e limites de descanso foram conferidos e não motivaram alteração neste ciclo.
- **Achado concreto:** o +1d4 de Dano Corpo a Corpo da 4ª Fase era exibido no resumo, mas não chegava como lembrete à calculadora de Dano. O bônus de +3 no Teste de Ataque já era repassado.
- **Correção:** src/FichaLocal.tsx agora repassa o dado adicional à src/CalculadoraTesteLocal.tsx; a calculadora lembra o jogador de rolar +1d4 somente em Ataques Corpo a Corpo e somar no campo de Dados adicionais. Sem rolagem ou aplicação automática.
- **Teste:** tests/ataques-calculadora.test.mjs recebeu teste estrutural; não executado nesta sessão.
- **Checkpoint:** docs/checkpoint-dano-biofase4-2026-11-12.md — commit bad30a2464095884c914a5941fe133d5759ebcd9.
- **Matriz:** docs/matriz-auditoria-funcional-ficha.md — commit 6df23363e137452a84d1b39a2b37bc319508baee.
- **Testes/build:** não executados nesta sessão. Não transformar isso em nova tarefa para o Gus sem necessidade; a auditoria prossegue por inspeção do código e correções pontuais.
- **Restrições:** sem redesign, LAN, Supabase, banco, main, merge, deploy ou publicação. Inventário ativo continua bloqueado.

### Próxima frente de auditoria

Prosseguir pelo catálogo de Condições e sua aplicação na calculadora: confrontar cada Condição e restrição com o cânone, verificando se Desvantagem, Defesa, proibição de ações, Vantagem contra alvos e lembretes por turno estão representados sem efeitos indevidos. Registrar discrepâncias comprovadas e corrigir pontualmente.


## Auditoria das Condições da Ficha — 12/11/2026

- **Escopo:** confronto do catálogo, calculadora, painel de ações, condições derivadas e integração com a Ficha contra o Arquivo do Jogador v1.0, pp. 81–83.
- **Achados corrigidos:** Imobilizado agora impõe Desvantagem em Reflexos (incluindo Esquiva); Desacordado derivado de PV 0/Colapso Viral é propagado aos lembretes; o Painel de Ações exibe restrições de atuação sem bloquear controles; limites de Movimento de Agarrado, Imobilizado, Caído e Intoxicado são lembrados no painel; Amedrontado gera lembrete contextual sem aplicação automática.
- **Limites preservados:** nenhuma inferência de Condições dos alvos; Vantagem contra alvo Caído/Cego/Atordoado permanece dependente da Mesa; sem movimentação automática, bloqueio de ações, rolagem ou aplicação de Dano.
- **Arquivos:** `src/condicoesCalculadora.ts`, `src/PainelAcoesLocal.tsx`, `src/CalculadoraTesteLocal.tsx`, `src/FichaLocal.tsx` e `tests/condicoes-calculadora.test.mjs`.
- **Checkpoint:** `docs/checkpoint-auditoria-condicoes-ficha-2026-11-12.md` — commit `d1ff43949f9b6c321a5ee29368b5df1cabaf8289`.
- **HEAD da implementação funcional após as correções de código e antes das atualizações documentais:** `d1ff43949f9b6c321a5ee29368b5df1cabaf8289`.
- **Testes/build:** não executados nesta sessão. A auditoria continua por inspeção e correções pontuais; não solicitar repetição genérica de comandos como pré-requisito.
- **Validação humana:** pendente.
- **Próxima frente:** concluir a revisão estática das Condições restantes e verificar consistência entre os efeitos descritos no catálogo e os lembretes de consulta; depois consolidar a bateria humana da Ficha. Inventário ativo segue bloqueado até validação humana e aprovação expressa.


## Auditoria de transformações e condições sensoriais — 12/11/2026

- **Fonte canônica:** Arquivo do Jogador v1.0, pp. 81–83 e 90–91.
- **Correções descritivas:** catálogo Infectado Especial/Cabeça Carmesim completado; UI deixa claro que registrar essas transformações não aplica seus efeitos mecânicos. Lembretes contextuais de Cego/Surdo adicionados à calculadora, sem inferir dependência sensorial.
- **Lacuna identificada:** fluxo mecânico completo de transformação ainda não existe. Exige módulo próprio e integração com progressão, Dados de Vida, Habilidades, armas, ataques, BI, PV, inconsciência e morte. Não implementar parcialmente como Condição comum.
- **Checkpoint:** `docs/checkpoint-auditoria-transformacoes-condicoes-2026-11-12.md`.
- **Testes estruturais:** ampliados; não executados nesta sessão. Validação humana pendente.
- **Próxima frente:** revisar se as Condições remanescentes e as consequências de Bio-Infecção estão corretamente delimitadas entre estado derivado, registro manual e fluxo mecânico; depois fechar a matriz de lacunas da Ficha antes de propor qualquer módulo novo.


## Atualização de continuidade — Transformações e Reanimação (12/11/2026)

- Achado: a Reanimação comum por 0 PV era iniciada sem verificar se Infectado Especial ou Cabeça Carmesim estavam ativos.
- Correção inicial (SUPERSEDIDA): a Ficha bloqueava Reanimação e controles em conflito. Essa restrição foi removida na retificação posterior; o comportamento atual permite registrar a decisão da Mesa e preserva os controles dos registros existentes.
- Se duas Transformações estiverem ativas, ou se 0 PV coincidir com BI Máxima, a Ficha não escolhe a prioridade narrativa; a Mesa resolve.
- Teste estrutural adicionado em `tests/reanimacao-integracao-ficha.test.mjs`; não executado nesta sessão. Sem validação humana.
- A correção não implementa cronômetros, transições, Dados de Vida, restrições da Transformação, reversão da Cabeça Carmesim a BI 0, hora Desacordada ou registro de morte. Esses pontos permanecem pendentes.
- Checkpoint: `docs/checkpoint-interacao-transformacoes-reanimacao-2026-11-12.md`.
- Próxima ação: auditar a reversão a BI 0 e a hora Desacordada, especialmente a interação com Descanso Completo e encerramento manual da Condição, antes de decidir qualquer novo estado persistente.

- Incremento posterior: Descanso Completo agora fica bloqueado enquanto Infectado Especial estiver ativo a 0 PV ou Cabeça Carmesim permanecer ativa com BI 0 (hora de reversão/inconsciência). A UI orienta só encerrar a Condição após a Mesa confirmar o fim da hora. Não há cronômetro; Descanso Parcial não foi bloqueado porque a regra consultada não o proíbe expressamente. Testes estruturais adicionados, não executados.


## Retificação — Transformações e Reanimação: a Ficha registra, a Mesa decide (12/11/2026)

- A orientação inicial que bloqueava os controles de Reanimação durante Transformações foi substituída por registro explícito de decisão da Mesa.
- Com Transformação ativa e PV 0, a Ficha não inicia automaticamente Reanimação comum; apresenta o cânone como referência e permite registrar, após confirmação, o fluxo que a Mesa determinar. Se BI Máxima também estiver presente, oferece escolha manual entre os fluxos sem definir prioridade.
- Registros de Reanimação preexistentes não são bloqueados pela Transformação.
- A Ficha não declara morte nem executa transformação. Após três falhas, a interface apresenta o resultado mecânico registrado e deixa a decisão da Mesa pendente; a linguagem não trata morte ou transformação como desfecho já aplicado. Os identificadores internos persistidos foram mantidos por compatibilidade.
- Lacuna: ainda não existe histórico estruturado específico para decisões da Mesa sobre morte da Cabeça Carmesim ou transformação após a hora inerte do Infectado Especial. Auditar contratos de persistência/backup antes de propor esse registro.
- Descanso Completo continua bloqueado enquanto as Condições correspondentes aos períodos sem benefício estiverem ativas; a Mesa pode encerrar a Condição manualmente quando decidir que o período terminou. Sem cronômetro.
- Testes estruturais atualizados, não executados nesta sessão. Sem validação humana.

- Auditoria de persistência para futuro Registro de Decisões da Mesa: `PersonagemLocal.dados` aceita campos JSON seguros extensíveis; patches IndexedDB mesclam por chave com detecção de concorrência; backup clona/valida a personagem completa. Um campo próprio de eventos pode dispensar migração de versão do banco, mas requer validador e testes de concorrência, recarga e backup. Nenhum campo/evento novo foi criado.

## Checkpoint — Registro de Decisões da Mesa (12/11/2026)

- Criados `src/registroDecisoesMesa.ts` e `src/RegistroDecisoesMesaLocal.tsx`; painel integrado à Ficha contínua logo após Condições.
- Tipos: Morte, Transformação, Reversão de transformação, Desfecho de Reanimação, Exceção/decisão especial, Retificação e Outro acontecimento.
- Campos: descrição (até 500 caracteres), responsável informado manualmente (até 80), data/hora do acontecimento, carimbo do dispositivo e ID. O carimbo é produzido pelo relógio do dispositivo, não é timestamp confiável de servidor.
- O registro exige confirmação e salvamento confirmado. Não altera PV, BI, Condições, Reanimação, Progressão ou qualquer efeito. Histórico é append-only na UI; correções são novos registros do tipo Retificação.
- Limite de 30 registros por personagem, escolhido para respeitar o limite atual de 32 KB do corpo de gravação LAN sem alterar o servidor globalmente. Limite deve ser reavaliado se os dados da ficha crescerem.
- Validação aplicada no cliente (`validacaoPersonagemLocal.ts`) e no endpoint LAN (`server/personagens-local.mjs`). Backup já preserva campos JSON adicionais; teste explícito de exportação/importação com o novo campo foi adicionado em `tests/backup-ficha.test.mjs`, ainda não executado nesta sessão.
- Permissões: LAN continua permitindo escrita somente à conta Jogador proprietária da ficha. O nome do responsável é autodeclarado; não autentica o Mestre nem concede a ele editor da ficha. O Jogador pode registrar a decisão comunicada pela Mesa. Não houve ampliação de permissões.
- Testes estruturais e teste HTTP LAN foram adicionados/atualizados; não executados nesta sessão. Validação humana pendente.
- Não foi alterado CSS, layout geral, navegação, IndexedDB versionamento, SQLite schema, inventário, publicação ou `main`.

## Atualização de ciclo — desfechos de Reanimação sob decisão da Mesa (12/11/2026)

- **Branch:** `feat/offline-first-ficha`.
- **Código:** `src/ReanimacaoFichaLocal.tsx`; apresentação dos estados após três falhas alterada para “Três falhas — decisão da Mesa pendente”. A mensagem pós-teste informa que o resultado mecânico foi registrado, que nenhuma consequência narrativa foi executada e orienta consultar o cânone e registrar a decisão no histórico da Mesa.
- **Compatibilidade:** os identificadores internos persistidos `morte_a_registrar` e `transformacao_no_proximo_turno` foram preservados. Não houve migração nem alteração do formato de Reanimação.
- **Teste:** `tests/reanimacao-integracao-ficha.test.mjs` recebeu verificação estrutural da linguagem e da orientação para o Registro de Decisões da Mesa.
- **Checkpoint:** `docs/checkpoint-desfechos-reanimacao-decisao-mesa-2026-11-12.md`.
- **Matriz:** linha de Reanimação atualizada em `docs/matriz-auditoria-funcional-ficha.md`.
- **Validação:** testes automatizados e build não executados nesta etapa; validação humana pendente. A existência do teste não comprova aprovação.
- **Restrições preservadas:** sem mudança de regras, PV/BI, Condições, contratos de dados, CSS/layout, LAN, banco, Supabase, Inventário, `main`, merge, deploy ou publicação.


## Atualização de ciclo — vínculos estruturados entre decisões da Mesa, retificações e Reanimação (12/11/2026)

- **Branch:** `feat/offline-first-ficha`; alterações realizadas somente nesta branch.
- **Retificações:** novas Retificações exigem `retificaRegistroId`, selecionado na interface. A validação exige que o alvo exista e apareça antes da retificação na ordem append-only. Não depende da ordem dos relógios locais.
- **Compatibilidade:** registros antigos do tipo Retificação sem referência estruturada continuam válidos como legado; não recebem vínculo inventado e não são reescritos. A função de inserção exige referência em novas Retificações.
- **Reanimação:** novas instâncias recebem `id` estável, preservado nos próximos estados. Instâncias legadas sem ID continuam válidas; em desfecho pendente, a interface oferece ação explícita para gravar um ID sem alterar contadores ou recursos.
- **Decisões:** eventos podem armazenar `reanimacaoId`. O painel de Registro permite vincular decisão à instância pendente. Retificações de evento vinculado herdam o vínculo. O painel de Reanimação exibe “Decisão da Mesa registrada” e os eventos relacionados; sem vínculo, mantém “decisão pendente”.
- **Limites:** vínculo é exclusivamente referencial. Não declara morte, não transforma personagem, não aplica consequências, nem altera PV, BI ou Condições. Responsável continua autodeclarado; permissões não foram ampliadas.
- **Persistência:** sem migração IndexedDB/SQLite ou versão nova de backup. A validação de personagem e o endpoint LAN já chamam o validador comum do Registro, que agora reconhece os campos opcionais. Backup mantém os dados e rejeita retificação com referência inválida.
- **Arquivos:** `src/registroDecisoesMesa.ts`, `src/RegistroDecisoesMesaLocal.tsx`, `src/reanimacaoFicha.ts`, `src/ReanimacaoFichaLocal.tsx`; testes `registro-decisoes-mesa.test.mjs`, `reanimacao-ficha.test.mjs`, `reanimacao-integracao-ficha.test.mjs`, `backup-ficha.test.mjs`.
- **Checkpoint:** `docs/checkpoint-vinculos-decisoes-reanimacao-2026-11-12.md`; matriz funcional atualizada.
- **Testes/build:** cobertura escrita/atualizada, mas testes automatizados e build não executados nesta etapa. Nenhum resultado foi presumido. Validação humana pendente.
- **Restrições:** sem alteração de cânone, mecânicas, CSS/layout geral, navegação, permissões, banco, Supabase, Inventário ativo, `main`, merge, deploy ou publicação.

### Validação humana deste incremento

1. Levar uma Reanimação a três falhas e conferir que o resultado mecânico permanece intacto.
2. Registrar uma decisão vinculada àquela instância e verificar a mudança de apresentação sem efeitos mecânicos.
3. Retificar o evento e conferir preservação do original, vínculo propagado e exibição de ambos.
4. Atualizar a página e exportar/restaurar backup, conferindo os IDs e referências.
5. Abrir histórico antigo com Retificação sem vínculo, confirmar compatibilidade e criar uma nova Retificação vinculada.


## Retificação de continuidade — 13/11/2026

Esta retificação prevalece sobre instruções anteriores deste documento que contrariem os pontos abaixo. O conteúdo histórico foi preservado para rastreabilidade.

### 1. Validação LAN encerrada

- **A validação humana do fluxo LAN já foi realizada e aprovada por Gus.**
- Não solicitar repetição de testes LAN, QR Code, conexão entre dispositivos, sessão ou criação/ingresso em Mesa como pré-requisito da etapa atual.
- Não misturar a validação LAN aprovada com a bateria pendente da Ficha Offline.
- O servidor LAN permanece preservado como funcionalidade aprovada. Só reabrir essa frente diante de defeito concreto novo ou de uma alteração que efetivamente a afete.

### 2. Scripts existentes — não reconstruir inicialização manualmente

O repositório já contém inicializadores para os ambientes:
- `scripts/windows/Menu_Testes.bat`: menu rápido para abrir Ficha Offline, Mesa LAN, ambos ou verificar o ambiente.
- `scripts/windows/Iniciar_Ficha_Offline.bat`: prepara dependências, valida TypeScript, gera a prévia de teste, inicia o servidor local e abre o navegador.
- `scripts/windows/Iniciar_Mesa_LAN.bat`: inicializa API SQLite e interface LAN.
- `scripts/windows/Preparar_Dependencias.bat` e `Verificar_Ambiente.bat`: apoio à preparação e verificação.

A bateria atual da Ficha deve usar o inicializador existente compatível com o ambiente do responsável. Não orientar instalação/configuração manual de dependências ou comandos avulsos quando o script do projeto já cobre esse fluxo. Não presumir sistema operacional: confirmar o ambiente apenas se isso for necessário para escolher o inicializador correto.

### 3. Escopo da bateria humana ainda pendente

A única bateria humana que permanece como bloqueio imediato é a **Ficha Offline local**, conforme `docs/roteiro-humano-ficha-offline-local.md`.

- Testar somente a Ficha Offline e seus dados locais: criação, ficha contínua, salvamento, recarga, conflito entre abas, backup/restauração, exclusão e funcionamento sem internet/PWA conforme o roteiro.
- Não incluir inicialização, criação de Mesa, conexão LAN, QR Code, segundo dispositivo ou testes de sessão LAN.
- T13, T14 e T15 são simulações anteriores já aprovadas; não solicitar repetição sem mudança concreta que justifique regressão.
- O resultado da bateria Offline deve ser registrado por caso como aprovado, falhou ou não executado. Não declarar homologação antes do retorno de Gus.

### 4. Ordem aprovada dos módulos posteriores

A decisão registrada em `docs/decisao-ordem-modulos-pos-ficha-2026-11-13.md` substitui a ordem anterior da Etapa C:

1. Inventário Offline completo, integrado à Ficha e com operações e persistência de ponta a ponta.
2. Painel do Mestre completo, com Mesa, Encontros, Arquivos e resumo operacional integrados.
3. Inventário LAN completo, com autorização, persistência transacional, concorrência e recibos idempotentes.

A validação humana da Ficha Offline continua sendo pré-requisito para iniciar o Inventário Offline. Cada módulo deve ser concluído funcionalmente antes de começar o seguinte; documentação, contratos ou telas isoladas não contam como entrega.

### 5. Registro da correção de processo

A orientação anterior para executar testes LAN novamente e preparar manualmente o ambiente foi incorreta. A partir desta retificação, considerar a aprovação LAN como fato estabelecido e usar os scripts já existentes. Nenhuma alteração de código, servidor, banco, Supabase, publicação ou permissões é autorizada por esta retificação.


## Continuidade de implementação — correções de Habilidades não dependentes do Inventário (13/11/2026)

A auditoria da Ficha foi retomada antes da bateria humana. Foram concluídos dois incrementos de código na branch `feat/offline-first-ficha`:

1. **Luta Livre:** o registro de Finalização agora possui fluxo próprio. Exige confirmação de alvo Atordoado e confirmação da Mesa sobre o resultado. Cobra 3 SA se o alvo não for derrotado pela Manobra e 0 SA quando a Mesa confirma que foi derrotado. O botão genérico de 3 SA deixa de ser usado por personagens com a Habilidade. Testes de domínio e de integração estrutural foram adicionados.
2. **SOCADOR DE PEDRAS:** o perfil Ataque Desarmado passa a usar 3d10 como Dano base quando a Habilidade está ativa; a progressão de categoria existente é aplicada depois. A calculadora também lembra a onda de choque de 1d10 às criaturas adjacentes e a opção de usar o resultado do Ataque como DT de Fortitude para Derrubar, sem aplicar efeitos a terceiros.

Arquivos de código: `src/manobrasOperacionais.ts`, `src/PainelAcoesLocal.tsx`, `src/CalculadoraTesteLocal.tsx`.
Testes adicionados/atualizados: `tests/manobras-operacionais.test.mjs`, `tests/ataque-oportunidade-ficha.test.mjs`, `tests/ataques-calculadora.test.mjs`.
Checkpoint: `docs/checkpoint-integracoes-luta-livre-socador-pedras-2026-11-13.md`.
Matriz: `docs/matriz-auditoria-funcional-ficha.md`.

**Validação:** testes automatizados e build ainda não foram executados; nenhuma homologação humana foi declarada. O Inventário permanece fora do escopo desta etapa. A próxima auditoria deve continuar nas Habilidades e integrações não dependentes do Inventário, depois fechar persistência/funcionamento Offline da Ficha e consolidar a bateria humana. A ordem posterior de módulos permanece inalterada.


### Complemento — SOCADOR DE PEDRAS (13/11/2026)
A auditoria da Habilidade foi aprofundada no cânone da p. 38. Além do Dano base 3d10 e dos lembretes de onda de choque/Derrubar, foi identificado que o Inventário não pode bloquear Aparar com os punhos Indestrutíveis. O Painel agora oferece declaração de Aparar com os punhos na janela válida e lembra o Contra-Ataque desarmado sem largar arma de duas mãos. A confirmação de sucesso continua com a Mesa; nenhum Ataque ou Dano é automatizado. Cobertura estrutural adicionada. Testes/build ainda não executados.


### Complemento — Briga de Gente Grande e lembretes de Manobras (13/11/2026)
A auditoria confirmou que GOLPE SUJO e Casca-Grossa já possuíam lembretes contextuais na calculadora. Foi acrescentado lembrete de Briga de Gente Grande em Ataques Corpo a Corpo: compatibilidade anatômica/humanoide para criaturas maiores e Vantagem em Derrubar/Cabeçada contra criatura maior. A Ficha não aplica Vantagem automaticamente nem executa Manobras. Teste estrutural adicionado; testes/build ainda não executados.


## Lacuna prioritária — Progressão da Ficha indisponível na LAN — 13/11/2026

- **PENDENTE / BLOQUEIA FECHAMENTO OFFLINE/ONLINE:** `src/ProgressaoFichaLocal.tsx` retorna uma tela somente de leitura sempre que `origemDados === 'servidor'`. Isso bloqueia inicialização da Progressão, autorização de avanço pelo grupo, registro de Marco, contador de Missões, solicitação/cancelamento de avanço, confirmação de Descanso, escolha/aplicação de benefícios e registro de Morte.
- **Servidor atual:** `server/personagens-local.mjs` protege o salvamento genérico. Quando Progressão existe, só permite alterar `missoesCompletadas`; criação/remoção do estado, mudanças de Nível, método, Marcos e histórico de Morte são bloqueados e exigem fluxo próprio. `tests/personagens-local.test.mjs` comprova essa proteção.
- **Contrato de domínio já existente:** `src/progressaoPersistente.ts` contém validações e transições para estado inicial, autorização neutra, contador, Marco, pedido de avanço, confirmação após Descanso e registro de Morte. `src/progressaoCampanha.ts` aplica benefícios e perda de Nível com base no histórico.
- **Conclusão da auditoria:** não basta remover a tela somente leitura nem liberar o PUT genérico. É necessário fluxo LAN dedicado, com revisão esperada, validação da transição em relação ao estado anterior, gravação atômica de `progressao`, `pedidoProgressao`, `nivel` e benefícios de ficha, e autorização atual da conta/personagem/Mesa. O registro de Morte precisa preservar o caráter de autodeclaração não confirmada pelo Mestre.
- **Próximo incremento proposto:** implementar a operação dedicada e o cliente correspondente, integrar `ProgressaoFichaLocal` sem alterar o comportamento Offline e adicionar testes de servidor para cada transição permitida, revisão conflitante, estado inválido, repetição/duplicidade e isolamento de conta. Não usar o PUT genérico como atalho.
- **Sem alteração de código nesta descoberta:** não houve alteração do cânone, Inventário, LAN já aprovada em seus fluxos existentes, `main`, publicação ou banco fora do servidor local de desenvolvimento.


## Validação de integridade dos estados da Ficha no servidor LAN — 13/11/2026

- **IMPLEMENTADO:** `server/personagens-local.mjs` agora valida no salvamento genérico os estados de Reanimação, Condições, usos por Descanso Completo, benefícios Amnésico/Militar, configuração de funcionamento e inteiros não negativos de PV, PV Temporários, SA e BI.
- **Motivo:** esses dados já tinham validadores de domínio usados pela persistência/backup Offline, mas o endpoint LAN não aplicava todos eles antes de gravar. A UI não substitui validação do servidor.
- **Cobertura adicionada:** `tests/personagens-local.test.mjs` envia estados inválidos e verifica HTTP 422, revisão inalterada e ausência de persistência do campo inválido.
- **Limite:** testes automatizados e build não foram executados; não declarar a validação executada. O teste humano LAN aprovado não foi repetido. A mudança afeta o código LAN e fica sujeita à cobertura automatizada e à verificação posterior se houver regressão concreta.


---

## Retificação de continuidade — instruções v2.1 e auditoria Offline (14/11/2026)

As instruções do projeto **AMEAÇA BIOLÓGICA RPG — versão 2.1, de 14/11/2026**, e o Documento Mestre de Planejamento v3.0 fornecido por Gus nesta retomada prevalecem sobre a ordem, o escopo e as decisões antigas registradas acima. Os trechos históricos permanecem preservados como histórico, mas não devem orientar o próximo passo quando divergirem das instruções v2.1.

### Ordem vigente

1. Fase 0 — Preparação Offline.
2. Fase 1 — Ficha Offline.
3. Fase 2 — testes humanos da Ficha, usando exclusivamente `docs/roteiro-humano-ficha-offline-local.md`.
4. Fase 3 — Inventário Offline.
5. Fase 4 — Painel do Mestre Offline PWA.
6. Fase 5 — Laboratório Node.js/SQLite.
7. Fase 6 — Integração LAN.
8. Fase 7 — empacotamento e plataformas.
9. Fase 8 — homologação integrada.
10. Fase 9 — temas e personalização, somente depois da homologação.

Inventário ativo, Painel do Mestre e Laboratório não devem ser iniciados antes dos critérios das fases anteriores.

### Restrições e validações confirmadas por Gus

- O fluxo LAN/Hub e os scripts de inicialização já foram testados por Gus em Windows 11/Edge e em celular via QR Code/Samsung Browser. Essa validação humana está aprovada e não deve ser repetida sem regressão concreta introduzida por uma alteração.
- Os scripts existentes devem ser preservados: `Menu_Testes.bat`, `Iniciar_Ficha_Offline.bat`, `Iniciar_Mesa_LAN.bat`, `Preparar_Dependencias.bat` e `Verificar_Ambiente.bat`.
- O próximo roteiro humano pendente é somente a Ficha Offline local; não misturar testes LAN/QR/sessão.
- Não pedir a Gus para clonar repositório, executar Git, instalar ferramentas ou rodar comandos locais. O desenvolvimento continua diretamente pelo GitHub; intervenção humana somente para decisões ou testes reais de navegador/dispositivo.
- Não alterar branches, não tocar em `main`, não fazer merge, deploy ou publicação sem autorização expressa.
- Preservar o limite de 10 jogadores e 10 personagens ativos por Mesa, o isolamento entre Mesas e as permissões existentes.

### Auditoria de isolamento Offline/Supabase — 14/11/2026

- Branch de trabalho: `feat/offline-first-ficha`.
- HEAD documental atual: `5bd93699542f36477d02ade4fc5bb0179cd6244a`; HEAD de código/teste do ciclo: `1091f354b610ed913afeb7521fa082b19ffd0f59`. Os commits seguintes deste ciclo foram apenas documentais.
- `src/main.tsx` importa diretamente `FichaOfflineApp` e `ConexaoServidorLocal`; sem `?servidor=local`, abre a Ficha Offline; com o parâmetro, abre a Mesa LAN.
- A inspeção estática dos módulos percorridos não encontrou import do SDK Supabase no caminho de entrada Offline/LAN.
- O legado Supabase continua nos arquivos `App.tsx`, `Convites.tsx`, `Participantes.tsx` e `FichasJogador.tsx`, fora do grafo de entrada atual.
- `@supabase/supabase-js` ainda está no `package.json` e no `pnpm-lock.yaml`; `tsconfig.json` inclui todo `src`, portanto o pacote ainda é necessário para compilar os arquivos legados. Não remover a dependência sem decisão e alteração delimitada que preserve a compilação.
- Criado `tests/entradas-offline-sem-supabase.test.mjs` para proteger o grafo de imports ativo. **Implementado, ainda não executado.**
- Status CI dos commits de código/teste `6eccc983f5e1f8a15e10d0ef4492677850f4c06a` e `1091f354b610ed913afeb7521fa082b19ffd0f59` retornou lista vazia na consulta; testes e build não foram confirmados nesta sessão.
- Checkpoint: `docs/checkpoint-isolamento-offline-supabase-2026-11-14.md` (atualizado no commit `5bd93699542f36477d02ade4fc5bb0179cd6244a`).
- Auditoria estática adicional confirmou IndexedDB v3, gravações aguardando `transaction.oncomplete`, rejeição de abortamentos/conflitos, testes dedicados de persistência/migração/backup e testes do Service Worker para fallback offline e não interceptação de API. Nada disso foi executado nesta sessão.
- O script `Iniciar_Ficha_Offline.bat` foi inspecionado: configura PWA de teste, valida TypeScript, gera build e inicia `vite preview`; não foi executado nesta sessão.
- `index.html` e manifesto ainda contêm metadados históricos que mencionam Mesas online; registrado como inconsistência textual, sem chamada online comprovada no caminho ativo.
- O teste `tests/service-worker-shell.test.mjs` foi ampliado para cobrir `/api/mesas` e `/ws` LAN e POST à API, assegurando que o Service Worker não intercepte essas requisições. Alteração de teste ainda não executada.

### Próxima ação

Consultar o status de CI do HEAD atual e, quando houver evidência, registrar o resultado do novo teste e do build. Depois continuar a Fase 0 verificando inicialização e persistência IndexedDB da Ficha. Não refazer a validação LAN aprovada e não avançar de fase sem checkpoint.


## Atualização documental — README, metadados e roteiro humano (14/11/2026)

- **Branch:** `feat/offline-first-ficha`.
- **HEAD após o ciclo:** `9ac570378e0d3db746129cfd16af29bbc26da642`.
- **Objetivo:** alinhar a documentação de entrada à arquitetura offline aprovada e evitar que o roteiro humano misture Ficha Offline com Mesa LAN.
- **Arquivos alterados:** `README.md`, `index.html`, `public/manifest.webmanifest`, `docs/roteiro-humano-ficha-offline-local.md`.
- **README:** atualizada a apresentação vigente, a ordem de fases e a instrução para iniciar somente a Ficha Offline. O conteúdo antigo de Alfa/Supabase foi preservado no próprio arquivo sob aviso explícito de histórico, não vigente. O antigo título do contrato Local > LAN foi marcado como histórico.
- **Metadados:** corrigidas somente as descrições textuais de HTML e manifesto; identidade visual, título e navegação não foram alterados.
- **Roteiro humano:** opção 3 removida da orientação; a bateria manda escolher somente opção 1. Numeração sequencial corrigida na preparação.
- **Código funcional:** nenhum arquivo de produção ou regra de negócio alterado.
- **Testes/build:** não executados nesta sessão. Os workflows disparados pelos commits documentais estão pendentes no GitHub Actions; não declarar aprovação.
- **Validação humana:** não realizada. O roteiro permanece preparado e a execução humana depende de checkpoint técnico aprovado.
- **Riscos/limites:** README preserva instruções antigas para rastreabilidade, mas ficam explicitamente marcadas como históricas. Revisar links internos e a coerência de todo o arquivo em ciclo documental futuro se necessário.
- **Próxima ação:** obter resultados de CI do HEAD atual; tratar falhas antes de qualquer avanço. Continuar a Fase 0, sem iniciar Inventário, Painel ou Laboratório.


## Atualização de continuidade — isolamento do SDK Supabase — 15/11/2026

- **Branch:** `feat/offline-first-ficha`.
- **HEAD de origem:** `9f8cc31cbfd1030f1eacd2cde4e05fa3ee37e70a`.
- **Checkpoint:** `docs/checkpoint-isolamento-supabase-producao-2026-11-15.md`.
- **Decisão técnica:** preservar o legado e a verificação TypeScript; mover `@supabase/supabase-js` de dependência de produção para dependência de desenvolvimento.
- **Motivo:** a entrada ativa Offline/LAN não importa o legado Supabase, mas a fixture isolada de Perícias ainda importa `FichasJogador`, que referencia o tipo `SupabaseClient`. A dependência de desenvolvimento mantém essa compilação sem compor as dependências de produção.
- **Configuração:** removida regra de chunk dedicada ao Supabase e variáveis Supabase do workflow de build.
- **Proteção:** teste existente do grafo ativo ampliado com verificação do manifesto.
- **Legado:** `App.tsx`, `Convites.tsx`, `Participantes.tsx` e `FichasJogador.tsx` preservados.
- **Validação:** testes, build, instalação frozen-lockfile e GitHub Actions pendentes após o commit; nenhuma validação humana declarada.
- **Limites:** sem alteração de `main`, branch adicional, merge, deploy, publicação, schema, regras, UI ou serviço LAN.

### Próxima ação
Verificar os resultados dos workflows no HEAD criado. Resolver falhas comprovadas e, se tudo passar, continuar a Fase 0 com a auditoria de inicialização/persistência Offline. Não avançar para Inventário nem para fases posteriores.


## Atualização de ciclo — auditoria da entrada e persistência Offline — 15/11/2026

- **Branch:** `feat/offline-first-ficha`.
- **HEAD auditado:** `d77ad7164c8f4b89ccdda5d24c87cbc568c8fae1`.
- **Checkpoint:** `docs/checkpoint-auditoria-entrada-persistencia-offline-2026-11-15.md`.
- **Entrada:** `src/main.tsx` mantém a Ficha Offline como padrão e exige `?servidor=local` para a entrada LAN.
- **Persistência:** inspeção de `src/persistenciaFicha.ts` e `src/validacaoPersonagemLocal.ts` confirmou IndexedDB v3, migrações v1→v3/v2→v3, gravações aguardando transação, patches com comparação por chave e geração e rejeição de conflitos.
- **Service Worker:** `public/sw.js` limita cache ao shell/estáticos no escopo, considera apenas GET e não intercepta APIs, outros domínios nem métodos de escrita; teste correspondente existe.
- **Backup/vínculos:** restauração substitui o store de personagens, mas não altera `vinculosLan`; registrado como risco a avaliar no contrato de backup/restauração, sem classificar como defeito nem alterar comportamento.
- **CI:** runs `43675716417` e `43675716423` permaneciam `queued`, sem runner atribuído (`runner_id=0`) e sem etapas iniciadas. Instalação frozen-lockfile, testes, TypeScript e build continuam sem resultado confirmado.
- **Testes:** arquivos de teste de migração, operações, concorrência e Service Worker foram inspecionados; não foram executados nesta sessão. Testes simulados não substituem IndexedDB real.
- **Código de produção/testes:** nenhum arquivo alterado neste incremento.
- **Validação humana:** pendente; o roteiro `docs/roteiro-humano-ficha-offline-local.md` permanece não executado.
- **Fase 0:** permanece em andamento. Inventário, Painel e Laboratório não foram iniciados.
- **Limites:** sem alteração de regras, identidade visual, schema, serviço LAN, `main`, branches, merge, deploy ou publicação.

### Próxima ação

Acompanhar a fila da CI e obter resultado real. Se os jobs não receberem runner, registrar o bloqueio sem presumir aprovação. Em seguida, continuar a verificação dos scripts de inicialização/build de teste e preparar a validação humana somente quando houver evidência técnica suficiente.


## Atualização de continuidade — otimização das fixtures PostgreSQL/PGlite — 15/11/2026

- **Branch:** `feat/offline-first-ficha`.
- **HEAD de origem:** `958efd18f53e56ddde949a7db5e1a5f1b27dd6ca`.
- **Checkpoint:** `docs/checkpoint-otimizacao-fixtures-pglite-2026-11-15.md`.
- **Diagnóstico:** nas quatro suítes analisadas havia 52 testes e 50 preparações independentes de PGlite, repetindo 16 migrações SQL e fixtures.
- **Implementação:** adotadas bases-modelo e `.clone()` para fornecer um banco independente por teste. Variantes com/sem migração de privacidade e propostas de ativação local/integrada continuam separadas.
- **Cobertura:** nenhum teste existente foi removido; foi acrescentado um teste para demonstrar que a alteração em um clone não contamina outro.
- **Estimativa:** preparações completas/migrações nessas suítes passam de 50 para 6 (redução estimada de 88% da repetição de migrações). O ganho no tempo total ainda precisa ser medido.
- **Arquivos:** `tests/database.test.mjs`, `tests/funcionamento-database.test.mjs`, `tests/ativacao-local.test.mjs`, `tests/helpers/ciclo-fixture.mjs`.
- **Validação:** implementação registrada; testes, build, TypeScript e medição de duração pendentes no GitHub Actions. Não houve execução local.
- **Limites:** sem alteração de produção, regras, migrations, schema, UI, LAN, dependências, `main`, branches adicionais, merge, deploy ou publicação.

### Próxima ação

Acompanhar o CI do novo HEAD, verificar especialmente a compatibilidade de `.clone()` com PGlite 0.5.11 e comparar a duração real da etapa PostgreSQL. Corrigir somente falhas comprovadas. Fase 0 continua em andamento; não iniciar Inventário nem fases posteriores.


## Atualização de continuidade — contrato técnico da Progressão LAN — 15/11/2026

- **Branch:** `feat/offline-first-ficha`.
- **HEAD de referência antes do ciclo:** `8a880ac323cc36e661b64dc5e73c71eba7d6193c`.
- **Documento criado:** `docs/contrato-tecnico-progressao-lan-v1.md`.
- **Commit do contrato:** `eb1c7494b8da55a1e959dbec6f1ca5aa274a6359`.
- **Decisões consolidadas:** contador de Missões com correção controlada para cima/baixo; Morte como autodeclaração pendente de confirmação separada pelo Mestre; Descanso Completo em Sala de Descanso como declaração explícita do Jogador, validada e gravada pelo servidor sem alegação de verificação narrativa.
- **Contrato:** documenta atores/permissões, envelope de operação, inicialização, autorização neutra, contador, pedido/cancelamento, Descanso, aplicação atômica de benefícios, Morte pendente e confirmação futura pelo Mestre, revisão, idempotência, isolamento, compatibilidade legada e matriz mínima de testes.
- **Código e banco:** nenhum arquivo de produção, teste, rota, migration ou schema alterado. Nenhuma operação LAN foi implementada.
- **CI da otimização PGlite:** permanece independente deste ciclo; não foi modificado nem declarado aprovado.
- **Classificação:** contrato técnico DOCUMENTADO; implementação PENDENTE; testes PENDENTES; validação humana PENDENTE.
- **Limites:** sem mudança de branch, `main`, merge, deploy ou publicação. Fase atual da Ficha permanece inalterada.

### Próxima ação
Revisar o contrato em conjunto e resolver eventuais dúvidas semânticas antes de autorizar implementação. Antes do primeiro código, inspecionar novamente o HEAD, as migrations e o padrão atual de recibos/idempotência. Não iniciar a confirmação de Morte pelo Painel antes da fase própria desse componente.


---

## Retomada operacional — 17/11/2026

Esta seção é a referência mais recente para a retomada do trabalho. As decisões e etapas históricas anteriores permanecem preservadas, mas descrições de status e escopos antigos não devem prevalecer sobre esta atualização nem sobre o Documento Mestre de Planejamento v3.0.

### Estado do repositório
- Repositório: `guspmc/ameaca-biologica-webapp`.
- Branch confirmada: `feat/offline-first-ficha`.
- HEAD confirmado pela CI: `08bf11decfa647223bc40377a38b40619e1336b6`.
- Nenhuma mudança de branch, merge, publicação ou deploy realizada nesta atualização.

### Estado da CI no HEAD
- **Build/TypeScript:** workflow `Validar compilação do WebApp`, run `44119389268`, SUCCESS.
- **Testes offline:** workflow `Verificação da ficha offline`, run `44119389313`, FAILURE. Foram executados os 154 arquivos de teste; falharam `tests/estado-turno-combate.test.mjs` e `tests/reanimacao-registro-invalido.test.mjs`. A etapa de build deste workflow foi ignorada após a falha; o build independente passou.
- Não declarar suíte aprovada até corrigir e repetir a CI no novo HEAD.
- Validação humana da Ficha Offline: PENDENTE; não há confirmação de execução do roteiro humano nesta rodada.

### Estado atualizado das Manobras
- Ajudar, Desengajar e Usar um Objeto: **IMPLEMENTADO**, com controles operacionais e testes identificados.
- Mirar e Combate com Duas Armas: **IMPLEMENTADO**, com integração ao fluxo atual.
- Adiar Ação, Agarrar, Empurrar/Derrubar e Esconder-se: **PENDENTE de integração operacional**, mantendo consulta/manual e respeitando os limites da Ficha. Não criar motor de Iniciativa, deslocamento de alvos ou aplicação automática de Condições.
- Os checkpoints de 12/11 que descrevem as três primeiras ações como ausentes são históricos; a matriz atualizada deve ser consultada antes de propor novo trabalho.

### Fases e prioridades
- Fase 0 — Preparação Offline: auditoria parcial favorável, mas **não encerrada**. Ainda dependem de conclusão da auditoria, verificação de inicialização/persistência e testes humanos aplicáveis.
- Fase 1 — Ficha Offline: em auditoria/correção. Não declarar concluída; faltam fechar as falhas automatizadas, completar a auditoria funcional e executar a validação humana.
- Fase 2 — Testes humanos: roteiro existe em `docs/roteiro-humano-ficha-offline-local.md`; execução por Gus e registro dos resultados continuam pendentes.
- Fases posteriores permanecem bloqueadas pela ordem aprovada. Não iniciar Inventário ativo, Painel do Mestre ou Laboratório antes dos critérios das fases anteriores.

### Próxima ação exata
1. Inspecionar as duas falhas da CI no HEAD `08bf11d` contra o código atual e o cânone.
2. Corrigir somente as expectativas ou comportamentos comprovadamente incorretos, usando a autorização vigente para código/testes/workflows.
3. Reexecutar CI e registrar o novo HEAD e resultados na matriz.
4. Continuar a auditoria das quatro Manobras ainda sem integração e das demais lacunas da Ficha, sem repetir trabalho já implementado.
5. Atualizar esta linha de continuidade e a matriz ao final de cada ciclo relevante.

### Regra operacional de atualização documental

Quando uma funcionalidade mudar de estado, atualizar a matriz e a linha de continuidade no mesmo ciclo em que a evidência for confirmada. Checkpoints antigos são preservados como histórico; devem receber uma nota de superação quando seu status deixar de representar a branch atual. Não reimplementar item marcado como IMPLEMENTADO sem evidência de defeito ou regressão.


## Retomada após CI aprovada e reauditoria das Manobras — 17/11/2026

### Repositório e validação
- Branch: `feat/offline-first-ficha`.
- Código testado: `a98bdc324df32d5e23708a2c8c88f4b471fde92e`.
- Atualização documental da matriz: commit `482de4101c93039af04af2b0b41cf11c5eddecd5`.
- Workflow `Validar compilação do WebApp`: run `44133790936`, SUCCESS; build de produção e TypeScript isolado aprovados.
- Workflow `Verificação da ficha offline`: run `44133791005`, SUCCESS; 154/154 arquivos de teste percorridos, sem falhas nem timeout; build final também aprovado.
- As falhas anteriores eram fixtures/expectativas desatualizadas nos testes de Combate e Reanimação. Correções somente em testes; nenhum código de produção foi alterado nesse ciclo.
- O build emite aviso não bloqueante para chunk acima de 500 kB e avisos de depreciação no runner. Não houve refatoração de bundle.

### Manobras — reauditoria canônica
- Referência: Arquivo do Jogador v1.0, pp. 77–78; catálogo `src/manobrasUniversais.ts` e teste `tests/manobras-universais.test.mjs` preservam consulta/requisitos, mas não implementam os fluxos operacionais no painel.
- **Adiar Ação:** PENDENTE, fora do escopo atual do painel, pois depende de ordem de Iniciativa/rodada que a Ficha não controla.
- **Agarrar:** PENDENTE; precisa vincular a substituição de Ataque, mão livre, limite de categoria, escolha Atletismo/Reflexos do alvo e DT original de Escape.
- **Empurrar/Derrubar:** PENDENTE; compartilha a disputa de Agarrar e exige escolha entre deslocar 1,5 m ou aplicar Caído, sem automatizar deslocamento/Condição.
- **Esconder-se:** PENDENTE; requer confirmação contextual de sentidos/cobertura e escolha entre Percepção Passiva ou ativa.
- Não criar botões que apenas gastem Ação/Ataque sem resolver com segurança o vínculo aos requisitos. Não criar motor de turnos, mover alvos ou aplicar Condições automaticamente.

### Estado das fases
- Fase 0 — Preparação Offline: EM ANDAMENTO; CI aprovada, mas auditoria de inicialização/persistência e validação humana aplicável continuam pendentes.
- Fase 1 — Ficha Offline: EM ANDAMENTO; suíte automatizada aprovada, auditoria funcional e lacunas continuam abertas.
- Fase 2 — Testes humanos: PENDENTE; aguarda Gus executar e relatar o roteiro `docs/roteiro-humano-ficha-offline-local.md`.
- Nenhuma fase posterior iniciada.

### Próxima ação exata
Continuar a auditoria funcional da Ficha com foco nas lacunas ainda não cobertas, sem reimplementar itens já presentes. Manter as quatro Manobras como consulta/manual até que exista desenho operacional seguro e compatível com o cânone. Em paralelo, preparar o ponto de passagem para os testes humanos, mas não declarar validação até Gus confirmar a execução.


## Auditoria incremental de rolagens e estados da Ficha — 17/11/2026

- Branch: `feat/offline-first-ficha`; HEAD de código consultado: `d182b291d3db9f3f912e0f6ae9200fbc72c3fc5d`.
- Foram inspecionados `src/testes.ts`, `src/rolagemDados.ts`, `src/RoladoresBasicosLocal.tsx`, `src/recursosFicha.ts`, `src/condicoesFicha.ts`, `src/condicoesCalculadora.ts`, `src/descansoFicha.ts`, `src/DescansoFichaLocal.tsx` e `src/reanimacaoFicha.ts`, além dos testes dedicados correspondentes.
- Resultado: os contratos centrais examinados estão coerentes com o Arquivo do Jogador v1.0; não foi comprovado defeito que justifique alteração de produção neste incremento. Não foi criado commit de código apenas para gerar atividade.
- A auditoria identificou limites intencionais: a Ficha não decide acerto/Defesa, não executa efeitos narrativos, não aplica Dano/Condições automaticamente por turno, não mede duração ficcional de Descanso/Condições e não resolve Morte/Transformação pela Mesa.
- Testes/build não foram executados nesta etapa. A CI aprovada mais recente continua vinculada ao código `a98bdc3`; os commits após ele são documentais.
- Validação humana da Ficha Offline, IndexedDB real, Service Worker e modo avião continua PENDENTE.
- A matriz `docs/matriz-auditoria-funcional-ficha.md` recebeu o detalhamento desta auditoria.

### Próxima ação
Continuar auditoria das integrações de combate/economia de ações e, em paralelo, preparar evidência de inicialização e persistência local para fechar a Fase 0. Corrigir falhas comprovadas durante a auditoria, acrescentar testes e repetir CI antes de atualizar status. Não avançar de fase nem iniciar Inventário ativo, Painel ou Laboratório.


## Auditoria incremental de combate e reações — 17/11/2026

- HEAD documental consultado: `98e942f94b9124f66630f10ff12cad22177feead`; código de produção mais recente: `a98bdc3`.
- Inspecionados: `src/economiaAcoes.ts`, `src/estadoTurnoCombate.ts`, `src/manobrasOperacionais.ts`, `src/reacoesCombate.ts`, `src/testes.ts`, `src/CalculadoraTesteLocal.tsx`, `src/PainelAcoesLocal.tsx` e testes de combate/reação.
- Os contratos de economia de ações, janela de 3 SA, Mirar, Duas Armas, Ataques, Reações, Contra-Ataque e efeitos contextuais conferidos estão coerentes no recorte auditado; não foi encontrado defeito reproduzível que justificasse correção de código neste ciclo.
- Lacuna confirmada: Aparar é universal no Arquivo do Jogador v1.0 (pp. 80–81), mas a interface só operacionaliza o caso de Socador de Pedras. Para os demais, bloqueia o registro porque não existe estado confiável de arma empunhada/elegibilidade/Durabilidade. Não liberar um fluxo genérico que ignore Durabilidade nem duplicar estado do Inventário.
- Próxima investigação: conferir se há fonte local persistida de equipamento/Durabilidade já disponível na Fase 1. Se não houver, pedir decisão a Gus sobre a menor alternativa segura, sem antecipar Inventário ativo.
- Nenhum teste/build foi executado neste incremento. Última CI aprovada continua vinculada ao código `a98bdc3`; validação humana permanece PENDENTE.
- A matriz de auditoria recebeu o detalhamento acima.

### Próxima ação
Inspecionar modelo e persistência local de equipamento/Durabilidade e continuar auditoria de Condições e efeitos de Reações. Corrigir falhas comprovadas, adicionar testes e executar CI após qualquer mudança de código. Não avançar de fase.


### Decisão de escopo — Aparar e Inventário ativo — 17/11/2026

**DECISÃO APROVADA POR GUS:** a implementação operacional de **Aparar universal** será realizada junto com o **Inventário ativo**, quando a Ficha passar a ter estado confiável dos itens e armas efetivamente equipados pelos jogadores. A integração deverá consultar a arma equipada, verificar elegibilidade e Durabilidade e aplicar o desgaste previsto pelo cânone, sem duplicar estado nem presumir equipamento.

Até essa etapa, Aparar permanece parcialmente implementado/bloqueado para personagens que dependam de arma equipada. O fluxo específico de Socador de Pedras com punhos Indestrutíveis permanece distinto. **Não antecipar Inventário ativo na Fase 1 nem criar solução provisória que ignore elegibilidade ou Durabilidade.** Ao iniciar a fase de Inventário, incluir Aparar no mesmo escopo e nos respectivos testes.


### Próxima ação ajustada
Prosseguir com a auditoria das Condições que restringem Ataques e dos efeitos de Reações. A dependência de Aparar está decidida: implementar junto com Inventário ativo e armas equipadas; não reabrir essa decisão nem antecipar Inventário na Fase 1.


## Auditoria incremental — restrições de Condições no painel — 17/11/2026

- Referências canônicas: Arquivo do Jogador v1.0, pp. 81–83.
- Inspecionados `src/condicoesCalculadora.ts`, `src/condicoesFicha.ts`, `src/PainelAcoesLocal.tsx` e os testes `tests/condicoes-calculadora.test.mjs`, `tests/reacoes-combate.test.mjs` e `tests/reacao-defensiva-ficha.test.mjs`.
- As penalidades próprias de Ataques e Testes são calculadas em contextos aplicáveis: Caído, Cego, Imobilizado, Intoxicado, Enfraquecido, Infectado Especial, Desorientado e Reflexos sob Imobilizado, conforme o tipo de rolagem. Vantagem e Desvantagem se cancelam normalmente.
- **Ponto de decisão funcional:** Desorientado, Desacordado, Atordoado, Incapacitado e Surpreendido geram avisos no painel, mas os controles de Ações/Reações e gasto de SA continuam habilitados. Os testes existentes confirmam explicitamente que esses avisos não desabilitam nem resolvem ações.
- O cânone define proibições/restrições para essas Condições (Desorientado não pode Atacar; Desacordado e Incapacitado não realizam Ações/Reações; Atordoado não realiza Ações/Reações/Movimento; Surpreendido restringe Ações, Reações e SA conforme o primeiro turno/duração). A interface atualmente depende da conferência do jogador/Mesa.
- **Não alterado:** nenhum código ou teste foi modificado neste incremento; testes foram inspecionados, não executados; nenhum build/CI foi executado. Não classificar como defeito definitivo antes de decidir se a Ficha deve apenas alertar ou também bloquear controles incompatíveis, considerando exceções e a responsabilidade da Mesa.
- **Decisão necessária de Gus:** manter avisos informativos ou introduzir bloqueios operacionais condicionados às Condições, com tratamento explícito de duração/exceções. Não implementar bloqueio parcial improvisado.

### Próxima ação ajustada
Prosseguir após decisão de Gus sobre o nível de aplicação das restrições de Condições no painel. A Fase 0 segue aguardando teste humano de navegador; não confundir essa validação com a auditoria funcional da Fase 1.


## Decisão aprovada — bloqueios por Condições e countdown — 17/11/2026

Gus aprovou a opção de bloqueios operacionais por Condições. A implementação deve respeitar a autonomia do Jogador para adicionar, encerrar e remover Condições na própria Ficha. O Mestre não edita a Ficha e não administra esse registro.

Os bloqueios serão estritamente mecânicos; duração narrativa, percepção, gatilhos e exceções dependentes da Mesa permanecem fora da decisão automática. Condições derivadas de PV/BI preservam suas fontes de verdade.

Atenção especial a Surpreendido: Movimento e Ações são proibidos no primeiro turno; Reações e gasto de SA são proibidos enquanto durar. Como a Ficha não controla a Iniciativa do Encontro, não estender o bloqueio de Movimento/Ações a toda a duração da instância sem referência confiável ao primeiro turno.

### Countdown técnico até os testes humanos
1. Implementar bloqueios operacionais por categoria, preservando autonomia do Jogador e limites da Ficha.
2. Adicionar testes automatizados para categorias, combinações, temporalidade de Surpreendido e remoção de Condições.
3. Continuar auditoria funcional paralela e corrigir apenas divergências comprovadas.
4. Executar CI completa, TypeScript e build no código atualizado; corrigir regressões.
5. Atualizar roteiro, matriz, continuidade e checkpoint com evidências e instruções finais.

Ao concluir os cinco itens, Gus executará a bateria humana de navegador: inicialização, IndexedDB, recarga, concorrência entre abas, backup/restauração, Service Worker e modo offline. CI/build não equivalem a validação humana.

Estado: decisão aprovada; implementação e testes específicos pendentes; validação humana PENDENTE.

## Implementação inicial dos bloqueios por Condições — 17/11/2026

A função pura de avaliação operacional foi implementada em `src/condicoesCalculadora.ts` e integrada ao `src/PainelAcoesLocal.tsx` e `src/CalculadoraTesteLocal.tsx`. As categorias Ação, Movimento, Reação, gasto de SA e Ataque são distintas. Ação Bônus e Interação Gratuita não são bloqueadas por equivalência presumida com Ação.

Surpreendido bloqueia Reações e gasto de SA enquanto ativo; Ação/Movimento não são bloqueados porque a Ficha não controla a Iniciativa nem identifica o primeiro turno. Agarrado/Imobilizado/Atordoado bloqueiam Movimento; Caído e Intoxicado mantêm deslocamento com limites/penalidade.

Auditoria paralela confirmou em `src/CondicoesFichaLocal.tsx` que o Jogador pode ativar e encerrar Condições na própria Ficha, com salvamento confirmado; condições derivadas de PV/BI não são editáveis manualmente. O componente não oferece controles de edição ao Mestre. Nenhuma mudança foi feita na administração de Condições.

Testes de categorias, Surpreendido, Movimento 0 e autonomia do Jogador foram adicionados/ajustados em `tests/condicoes-calculadora.test.mjs`. As execuções CI de testes e build do HEAD mais recente ainda estavam em andamento no registro; não declarar aprovação até o término.

Countdown: (1) implementação realizada, aguardando CI; (2) testes adicionados, aguardando CI; (3) auditoria paralela em andamento, autonomia de Condições conferida; (4) CI/build em andamento; (5) documentação e roteiro final parcialmente atualizados. Validação humana PENDENTE.

### Auditoria incremental — bloqueio de Usar um Objeto — 17/11/2026

A revisão do Painel identificou que o botão Usar um Objeto consumia Ação, mas não verificava o bloqueio operacional por Condições. Corrigido em `src/PainelAcoesLocal.tsx` com `bloqueiosCondicao.acao`; adicionada asserção de regressão em `tests/condicoes-calculadora.test.mjs`. A correção está no commit `f5f1344`, e o teste adicional em `88c3475`. A CI do código-base `bbb7a6d` passou em testes e build; os workflows de `f5f1344` ainda estavam em execução e precisam ser confirmados para o HEAD atualizado.

### Testes de combinação e encerramento de Condições — 17/11/2026

Ampliada a suíte `tests/condicoes-calculadora.test.mjs` com dois casos: combinação simultânea de condições impeditivas e recálculo após remover uma condição, mantendo apenas os bloqueios ainda justificados pelas condições restantes. Ao encerrar todas, o avaliador retorna todas as categorias liberadas. Commit `16aaed95aa691750459f8946aa823034c9879963`; CI do commit ainda enfileirada no momento do registro. Esses testes unitários não substituem validação humana de interação/salvamento.

### Correção adicional na auditoria de Condições — 17/11/2026

Identificada divergência entre o bloqueio de gasto de SA do Painel e a confirmação do gasto prévio usada pelos bônus de Origem Atleta/Investigador na Calculadora. Com Surpreendido ativo, a confirmação podia continuar selecionável, apesar de o gasto não poder ser realizado no Painel. O controle agora também respeita `bloqueiosCondicao.gastarSA`; teste estrutural adicionado. Commits `e23d2a0` (código) e `adf9adc` (teste). CI pendente.



## Atualização de evidências — CI verde no HEAD — 18/11/2026

- Branch: `feat/offline-first-ficha`.
- HEAD validado: `9c4951c5f47c8a65a8a1d81eddcd4d898e1cf4fc`.
- Workflow **Verificação da ficha offline**: run `44214943091`, conclusão SUCCESS.
- Workflow **Validar compilação do WebApp**: run `44214943645`, conclusão SUCCESS.
- Os dois workflows foram executados sobre o mesmo HEAD acima. A correção de bloqueio do bônus de Origem sob Surpreendido e seus testes estruturais estão, portanto, cobertos por CI verde neste estado do código.
- **Countdown:** **4/5 pendências**. Nesta rodada foi encerrada a pendência de CI (testes, TypeScript e build no HEAD atualizado). As demais pendências permanecem abertas até serem concluídas com evidência; a implementação e os testes automatizados de bloqueios passaram pela CI.
- **Validação humana:** PENDENTE. CI verde não substitui os testes reais de navegador por Gus.
- Próxima ação: continuar auditoria funcional independente dos controles de gasto de SA, reações e manobras; registrar somente divergências comprovadas. Depois fechar o roteiro e as instruções da bateria humana.


## Auditoria funcional incremental — Ações, Movimento, Reações e SA — 18/11/2026

- Branch: `feat/offline-first-ficha`; HEAD de referência da inspeção: `58fe7a74da6dc3467b7115b90922671b2dc12ab3`.
- Revisados `src/PainelAcoesLocal.tsx`, `src/CalculadoraTesteLocal.tsx`, `src/condicoesCalculadora.ts`, `src/reacoesCombate.ts`, `src/economiaAcoes.ts`, `src/estadoTurnoCombate.ts`, `src/manobrasOperacionais.ts` e `tests/condicoes-calculadora.test.mjs`.
- Reações verificadas: Aparar com punhos (Socador de Pedras), Esquiva, Contra-Ataque, Na Minha Mira, Não Vai Escapar, resposta do Mercenário, Ataque de Oportunidade e Finalização Dupla. Os controles verificam bloqueio de Reação; caminhos que também gastam SA verificam o bloqueio de gasto de SA e limites de custo.
- Ações/Movimento verificados: Ajudar, Ação Completa, Interação Gratuita, Desengajar, Usar um Objeto, Disparada, Ataque, Combate com Duas Armas e recursos normais/comprados. Os controles correspondentes consultam as categorias de bloqueio aplicáveis.
- Manobras com SA verificadas: Mirar, Fuga, Finalizar, Luta Livre e gastos genéricos de 1/3 SA. Luta Livre dispensa o custo de 3 SA quando a Manobra derrotou o alvo; essa exceção foi preservada e não deve ser bloqueada como gasto de SA nesse ramo.
- Resultado: nenhuma divergência operacional adicional comprovada nesta amostra; nenhum código/teste foi alterado neste incremento. A revisão é estática e não substitui testes de interface nem a bateria humana.
- **Countdown:** a auditoria funcional paralela desta frente foi concluída. Restam **3 pendências técnicas** até a bateria humana. A validação humana permanece PENDENTE.
- Próxima ação: concluir a consolidação do roteiro humano de navegador e conferir a matriz de critérios da Fase 0/1; não iniciar fases posteriores antes do checkpoint e dos testes humanos exigidos.
