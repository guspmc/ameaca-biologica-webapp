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
