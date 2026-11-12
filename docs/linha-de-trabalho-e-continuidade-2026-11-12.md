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
- **HEAD após as atualizações documentais:** `f00a80512bd8e87132e56ac0936e4898be2b5f0f`.

### Próxima ação
Corrigir em alteração mínima a integração do Ataque normal e Combate com Duas Armas, e integrar Mirar ao Teste de Ataque sem remover Desvantagem. Antes de editar, inspecionar os testes de calculadora/combate e os contratos de salvamento relevantes. Em seguida decidir o nível de integração operacional das Manobras universais restantes. Atualizar checkpoint e continuidade novamente ao final do próximo ciclo.
