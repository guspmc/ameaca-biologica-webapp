# Checkpoint — retomada PWA e auditoria de criação/Perícias

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD efetivamente confirmado nesta inspeção:** `268a49be6ea2c59928cfe139b50ef5daff5d4225`  
**Escopo:** diagnóstico de origem segura para PWA e inspeção estática do núcleo de criação, Atributos, Perícias e valores derivados.  
**Execução:** leitura de arquivos pela API do GitHub; nenhum teste foi executado nesta sessão.

## 1. PWA em segundo dispositivo — diagnóstico refinado

### Evidências no código atual

- `vite.config.ts` inicia o Vite LAN em `0.0.0.0:4174`, com proxy HTTP para API em `127.0.0.1:4175` e proxy WebSocket para `ws://127.0.0.1:4175`.
- `src/ConexaoServidorLocal.tsx` usa `window.location.origin` como endereço inicial no modo LAN. Portanto, o cliente acessa o mesmo host HTTP do Vite e as rotas de API/WebSocket são relativas a essa origem.
- `src/main.tsx` registra o Service Worker somente em build de produção ou prévia de teste explicitamente habilitada. O modo LAN de desenvolvimento não registra o worker.
- `public/manifest.webmanifest` declara `start_url: "./"`, `scope: "./"` e `display: "standalone"`.
- `public/sw.js` guarda somente o shell estático e assets locais; não intercepta API LAN nem recursos cross-origin.
- `tests/pwa-shell.test.mjs` verifica o comportamento do worker em ambiente simulado e a política de registro; não testa contexto seguro nem instalação em dispositivo real.

### Conclusão técnica

O acesso HTTP por IP privado em outro dispositivo não é uma origem segura para Service Worker nos navegadores modernos. A exceção usual de HTTP confiável para desenvolvimento é `localhost`/loopback, que no segundo dispositivo aponta para o próprio aparelho, não para o computador anfitrião. Logo, habilitar o worker no modo LAN, isoladamente, não resolve o problema.

### Alternativas a avaliar — nenhuma aprovada ou implementada

1. **HTTPS na LAN com autoridade/certificado confiável:** exige servir a interface sob HTTPS e instalar/confiar na autoridade certificadora nos dispositivos clientes. Um certificado autoassinado sem confiança instalada tende a gerar alertas e não resolve a experiência de instalação.
2. **Túnel HTTPS:** oferece origem segura, mas altera a arquitetura de rede, pode depender de serviço externo e exige avaliar como o tráfego de API/WebSocket e a privacidade da Mesa seriam preservados.
3. **Manter HTTP LAN:** preserva a simplicidade atual, mas não oferece instalação PWA com Service Worker no segundo dispositivo. Pode ser mantido como acesso web, deixando explícita a limitação Offline/PWA.

Não foi feita alteração no servidor LAN, proxy, portas, TLS, scripts ou endereço de conexão. A decisão exige comparar esforço de configuração, segurança, dependência externa e experiência do segundo dispositivo com o Gus.

## 2. Entrada e dependências legadas

- `src/main.tsx` importa diretamente `FichaOfflineApp` e `ConexaoServidorLocal`; o seletor ativo escolhe LAN quando `?servidor=local`, caso contrário abre Ficha Offline.
- `src/App.tsx` não é importado pelo ponto de entrada ativo observado e contém dependências da arquitetura antiga Supabase.
- `src/LaboratorioLocal.tsx` é um laboratório fictício baseado em `persistenciaLaboratorio`, não a aplicação LAN integrada.
- `package.json` ainda declara `@supabase/supabase-js` e separa chunk Supabase no build. Isso é evidência de dependência declarada, não prova suficiente de que possa ser removida.
- Não foi executado um mapeamento completo de importações transitivas nem busca exaustiva de referências em scripts/testes/documentação. `App.tsx`, `LaboratorioLocal.tsx` e dependência Supabase continuam **candidatos a legado**, sem classificação final de DESCARTADO/SEM USO. Nada foi removido.

## 3. Auditoria estática — Atributos e Perícias na criação

### Regras oficiais confrontadas

Arquivo do Jogador v1.0:
- p. 21–22: quatro Atributos começam em 1; distribuem-se +3; é permitido reduzir um único Atributo de 1 para 0 e receber +1 ponto; máximo 3 na criação; máximo absoluto 5 na campanha.
- p. 21 e 26: PV por Nível de Classe — Agente 10 + VIG, Autodidata 8 + VIG, Operador 12 + VIG; BI Base 8, 10 e 6, respectivamente; SA base AGI + AST; Pontos de Perícia 4, 5 e 3.
- p. 23–25: Origem concede Treinamento gratuito em uma Perícia; a outra amplia as opções permitidas da Classe. Amnésico escolhe duas Perícias distintas.
- p. 26: cada ponto eleva Não Treinada→Treinada ou Treinada→Mestre; Mestre é o limite; Pontos de Perícia da criação só podem ser distribuídos nas opções permitidas pela Classe, acrescidas da Perícia extra da Origem conforme a regra.
- p. 42: valor da Perícia = Atributo associado + modificador de Treinamento; Não Treinada +0, Treinada +2, Mestre +3. Teste de Perícia = 1d20 + Perícia + modificadores.
- p. 43: Teste Passivo = 10 + valor da Perícia.

### Código inspecionado

- `src/atributosCriacao.ts`: valida inteiros entre 0 e 3, no máximo um zero e soma total 7. A soma representa os quatro pontos iniciais mais três pontos de distribuição, inclusive a troca opcional de um atributo para 0. **Coerente na inspeção estática.**
- `src/pericias.ts`: associa as 12 Perícias aos Atributos previstos; modificadores de Treinamento são 0/2/3; valor passivo é 10 + valor-base. **Coerente na inspeção estática.**
- `src/periciasCriacao.ts`: usa limites por Classe, combina lista da Classe com a Perícia secundária da Origem e trata Amnésico como escolha de duas Perícias distintas. Restringe graus e orçamento de pontos. **Coerente nos casos inspecionados.**
- `src/derivadosCriacao.ts`: calcula PV por Classe e Nível, SA = AGI + AST com bônus da Universitária, BI = Base da Classe + AST com bônus de Cobaia/Parrudo, Defesa = 10 + AGI com Policial, Inventário pela capacidade baseada em FOR/Origem e Movimento 9 m. Aplica Parrudo como +5 PV e +3 BI. **Coerente com os trechos oficiais consultados.**
- `src/EditorAtributosPericiasLocal.tsx`: mantém escolhas incompatíveis visíveis para revisão, não apaga distribuição automaticamente quando Classe/Origem mudam e oferece prévia dos valores derivados. **Comportamento estrutural identificado; não houve teste de navegador.**

### Testes existentes identificados

- `tests/pericias-criacao.test.mjs`
- `tests/derivados-criacao.test.mjs`
- `tests/integridade-criacao.test.mjs`

Os testes cobrem orçamento, escolhas de Origem, Amnésico, progressão de grau, fórmulas derivadas, bônus numéricos e preservação de escolhas incompatíveis. A presença dos arquivos não comprova execução no HEAD atual. Não foi observado resultado de CI nesta inspeção.

### Limites desta conclusão

- Esta rodada não conclui a auditoria integral de criação: ainda é necessário confrontar seleção de Classe, Habilidades, progressão, validação final/ativação, benefícios completos das Origens e integração dos valores de Perícia em todos os tipos de Teste.
- A implementação de `Tentativa e Erro` e o uso do bônus +1 em Testes não Treinados exigem rastreamento até os pontos de cálculo/rolagem, além da existência do helper.
- Nenhuma correção de código foi justificada ou aplicada nesta rodada.

## 4. Próximas ações

1. Rastrear a aplicação de `Tentativa e Erro` desde a seleção da Perícia adicional até Testes de Perícia e rolagens, verificando se o +1 é aplicado somente quando Não Treinada.
2. Auditar criação/ativação e progressão contra as páginas oficiais 26–27 e demais regras correspondentes.
3. Continuar o confronto por módulos da Ficha (recursos, BI, Condições, Descanso, Reanimação, Combate e Reações), reutilizando a matriz e os checkpoints recentes.
4. Fechar o mapa de dependências legadas antes de qualquer remoção.
5. Apresentar ao Gus as opções PWA com impactos concretos antes de escolher uma arquitetura HTTPS/túnel.
6. Ao concluir a auditoria, consolidar a bateria humana progressiva. Não iniciar Inventário ativo antes da validação humana da Ficha Offline e aprovação expressa.

**Restrições preservadas:** sem alteração visual; sem mudança no servidor LAN; sem Supabase/banco remoto; sem branch nova, merge, deploy ou publicação; sem limpeza especulativa.


## 5. Complemento — Habilidade Tentativa e Erro rastreada até a calculadora

A pendência indicada na seção 3 foi investigada nesta mesma sequência:

- `src/FichaLocal.tsx` passa `periciaTentativaErroTreinada` e `temTentativaEErro` à `CalculadoraTesteLocal`; também usa a Perícia adicional no cálculo do grau, valor-base e passivo exibidos.
- `src/pericias.ts` define `bonusTentativaErro()`: concede +1 somente quando o grau efetivo da Perícia é 0 (Não Treinada).
- `src/CalculadoraTesteLocal.tsx` soma esse bônus ao valor-base do Teste de Perícia, mas não ao Teste puro de Atributo; apresenta o bônus como circunstancial e informa que a permissão de usos normalmente restritos a Treinamento depende de requisito adicional expresso.
- A Perícia adicional escolhida é tratada como Treinada pelo cálculo de grau, e portanto não recebe o +1 de Perícia Não Treinada.

**Conclusão estática:** o caminho identificado aplica o +1 no escopo esperado e evita aplicá-lo a Teste puro de Atributo ou Perícia já Treinada. Isso não substitui conferir todas as restrições específicas de cada aplicação que exige Treinamento, nem teste de interface/rolagem em navegador. A pendência de rastreamento geral desta Habilidade fica **resolvida por inspeção estática**, com validação automatizada/CI e humana ainda não comprovadas nesta sessão.


## 6. Auditoria estática — Recursos, Fases de BI e Reanimação

### Regras oficiais confrontadas

- Arquivo do Jogador v1.0, p. 17: PV em 0 deixa a personagem Desacordada e inicia Reanimação; SA máximo básico AGI + AST; BI mede contaminação.
- p. 86: em 0 PV, no próximo turno começam Testes de Reanimação contra DT 12, sem modificador salvo regra específica; até 5 tentativas, 3 sucessos reanimam e 3 falhas causam morte. Cura durante 0 PV acumula e só desperta após o terceiro sucesso, com pelo menos 1 PV ou o total acumulado, respeitando máximo. Ajuda de Medicina DT 15 bem-sucedida concede Vantagem ao próximo Teste.
- p. 90: BI começa em 0; BI Máxima = BI Base da Classe + AST + bônus; BI só aumenta por fonte infectante com Dano final superior a 0, salvo efeitos específicos; BI não progride sozinha. Fases são calculadas por quintos e, ao alcançar/ultrapassar BI Máxima, ocorre Colapso Viral. Durante Colapso, Testes de Reanimação são imediatos, DT 12; Cobaia tem Vantagem em cada Teste.
- p. 24: Cobaia recebe +2 BI Máxima e Vantagem nos Testes de Reanimação do Colapso; Desgarrado recebe PV Temporários iguais à metade da BI atual ao aumentá-la.

### Código inspecionado

- `src/recursosFicha.ts`: PV temporários absorvem dano antes dos PV atuais; cura afeta somente PV atuais; PV temporários novos conservam o maior valor em vez de somar; SA é limitada entre 0 e máximo; BI pode alcançar ou ultrapassar máximo. Para Desgarrado, ao aumentar BI por esta operação, concede PV Temporários iguais à metade da BI atual arredondada para baixo.
- `src/bioInfeccao.ts`: calcula fase por `floor(BI atual × 5 / BI máxima) + 1`, só antes do Colapso; implementa movimento +3 m nas fases 2–4, bônus de Ataque +2 na fase 3, +3 total e +1d4 Corpo a Corpo na fase 4, e perda dos benefícios anteriores, Movimento -6 m e Desvantagem em Ataques/Testes na fase 5. Não altera BI nem aplica efeitos.
- `src/RecursosFichaLocal.tsx`: expõe ajustes explícitos e salvamento; informa que BI não aumenta sozinha e que atingir o máximo sinaliza Colapso. Edição direta de PV é bloqueada durante Reanimação por 0 PV.
- `src/ReanimacaoFichaLocal.tsx`: inicia Reanimação por 0 PV aguardando próximo turno; inicia Colapso imediatamente ao atingir BI Máxima; escolhe dados físicos/virtuais conforme modo e preferência, com escolha por rolagem em Misto; apresenta Ajuda de Medicina, acúmulo de cura durante Reanimação por 0 PV e redução de BI para encerrar o Colapso. A interface não decide morte/transformação narrativa; sinaliza o resultado para registro/ação da Mesa.

### Testes existentes identificados

- `tests/recursos-ficha.test.mjs`
- `tests/bio-infeccao.test.mjs`
- `tests/reanimacao-ficha.test.mjs`
- `tests/reanimacao-integracao-ficha.test.mjs`

Os casos inspecionados cobrem limites de recursos, dano/cura/PV temporários, bônus de Desgarrado, fronteiras das cinco Fases, Colapso, Cobaia, Ajuda de Medicina, cura acumulada, sucessos/falhas, estados terminais e validação do registro.

### Classificação e limites

- Fórmulas e transições centrais: **IMPLEMENTADAS; coerência estática com os trechos oficiais consultados**.
- Testes automatizados: **existem**, mas sua execução/CI neste HEAD não foi confirmada por esta sessão.
- Uso real com salvamento IndexedDB, recarga, perda de conexão e modo Misto em navegador: **PENDENTE DE TESTE HUMANO**.
- A Ficha mantém o aumento de BI como ação expressa do usuário/Mesa, em vez de inferir automaticamente que um ataque infectante causou Dano final positivo. Isso respeita a separação de responsabilidades descrita no produto, mas exige que o usuário registre a BI após resolver o evento na Mesa.
- Nenhuma falha concreta foi demonstrada nesta inspeção que justifique alterar estes módulos.
