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
