# Checkpoint — Estabilização da Ficha e correções de compatibilidade, 09/11/2026 (ciclo 4)

## Estado técnico
- Repositório: `guspmc/ameaca-biologica-webapp`
- Branch: `feat/offline-first-ficha`
- HEAD observado antes deste checkpoint: `22b70d9572c0567a2b9de8fa7f944602b5b20bef`
- Sem merge para `main`, deploy ou alteração em produção.
- Os workflows associados ao SHA `22b70d9572c0567a2b9de8fa7f944602b5b20bef` foram disparados; resultado ainda pendente no momento do registro.
- A CI anterior no SHA `65bd853e5a7fc07a14408adcfa2c36b038de1da8` falhou em um teste de catálogo por regex escapada em excesso. A compilação e os demais testes passaram; o erro foi localizado em `tests/catalogo-procedimentos-equipamentos.test.mjs:19`.
- O teste foi simplificado para verificar a presença literal de `+2 Dados de Dano`, sem alterar o catálogo ou a regra.

## Correção de compatibilidade — registro de Condições
Arquivos:
- `src/condicoesFicha.ts`
- `src/CondicoesFichaLocal.tsx`
- `tests/condicoes-ficha.test.mjs`

O gerador de IDs foi extraído para `gerarIdCondicao`. Agora verifica `typeof randomUUID === 'function'` antes de invocar a API nativa e utiliza fallback UUID quando a API está ausente ou não é funcional.

O painel de Condições utiliza o helper compartilhado. O teste cobre provedor nulo, propriedade não funcional e função nativa funcional.

Relação com incidente anterior: em 08/11, o teste humano relatou `crypto.randomUUID is not a function` ao adicionar Queimadura. A alteração aborda a causa compatível com o erro relatado, mas **não está validada em dispositivo Android/WebView** até a repetição do teste humano.

## Estado da Ficha — pendências funcionais conhecidas
### Progressão
- `progressaoPersistente.ts` valida um contrato versionado e histórico de benefícios.
- Ainda não integrado ao modelo persistido da Ficha, backup JSON, IndexedDB, Descanso Completo, fluxo de Morte ou LAN.
- O nível atual segue campo isolado; a interface não permite ainda concluir progressão com registro completo de escolhas e benefícios.
- A reversão por Morte só planeja; não executa alterações na ficha.

### Combate
- Há estado persistente integrado para economia de ações/manobras e algumas ações já são registradas na interface.
- Iniciativa, Ataques, Dano, Reações defensivas, Contra-Ataque, Ataque de Oportunidade, propriedades de armas e Condições ainda não formam um fluxo completo de combate na ficha.
- Calculadora manual resolve apenas os tipos implementados; não automatiza dano ou efeitos.
- Condições são registradas/encerradas manualmente; o painel oferece lembretes, não resolve testes, dano ou duração automaticamente.

### Identidade e interface
- O editor de Identidade persiste campos narrativos, mas houve relato humano de problema de foco/teclado em Android. Causa ainda não localizada; não declarar corrigido.
- Outros relatos humanos pendentes de reteste: expansão de Atributos, Classes/Habilidades Básicas/Perícias, e fluxos de dano/equipamento.
- Nenhum teste humano foi executado neste ciclo.

## Prioridade seguinte
1. Confirmar CI no SHA do ciclo e corrigir somente falhas comprovadas.
2. Fechar progressão persistente integrada: contrato, validação local/servidor, backup, IndexedDB, Descanso Completo, seleção/registro exato de benefícios e Morte, com migrações estritas.
3. Fechar o fluxo de Combate na Ficha: iniciativa, economia, ações/manobras, Ataque, janela de Reação, defesa ativa, Contra-Ataque, Dano, RD/BI, condições e persistência; respeitar os modos de funcionamento e não presumir rolagens.
4. Concluir regras de habilidades e efeitos aplicáveis à ficha.
5. Auditar todos os catálogos e procedimentos contra o Arquivo do Jogador.
6. Executar a suíte automatizada completa e auditorias antes da bateria humana integrada.
7. Só após validação humana, iniciar o Inventário ativo de Personagem.

## Limite explícito de escopo
Catálogos de armas, peças, munições, proteções, itens e receitas são referência de regras. Não representam posse, equipamento ativo, carregadores, consumo ou transferências. O Inventário ativo continua bloqueado.
