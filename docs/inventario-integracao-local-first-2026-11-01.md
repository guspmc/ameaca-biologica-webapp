# Inventário de integração local-first — 01/11/2026

**Branch examinada:** `fix/lab-criacao-feedback-2026-10-31`  
**HEAD examinado:** `ea9be6cf41cfb74d17af7c71cb16668ef664d636`  
**Escopo:** inventário estático do repositório para integrar o trabalho existente sem depender do Supabase. Não houve execução de testes/build nesta inspeção, alteração de banco remoto, merge ou publicação.

## Resumo

O repositório já contém uma quantidade significativa de regras, componentes e fluxos de criação/revisão, além de um protótipo de servidor local. O principal problema não é ausência de implementação, mas a separação entre três conjuntos que ainda não formam um produto único:

1. a aplicação online antiga, ligada ao Supabase;
2. módulos de domínio e interfaces construídos para o fluxo antigo;
3. o laboratório local e o servidor LAN, que ainda não compartilham o ciclo de dados da ficha.

A integração deve reaproveitar os módulos puros e os contratos já desenvolvidos, mas não transportar automaticamente chamadas Supabase, migrations ou premissas de segurança do backend antigo.

## Inventário por conjunto

| Conjunto | O que existe no código | Situação para o produto local |
|---|---|---|
| Interface online | `src/App.tsx`, `src/FichasJogador.tsx`, componentes de Mesa/participantes e conexão | **Supabase-dependente**; referência de comportamento e UI, não deve ser o ponto de entrada do produto local |
| Laboratório local | `src/LaboratorioLocal.tsx`, `src/persistenciaLaboratorio.ts` | **Implementado isoladamente**; cria Mesa/personagem fictícias e retoma/edita rascunhos em localStorage; ainda não usa o servidor LAN |
| Regras de criação | `atributosCriacao.ts`, `classesFicha.ts`, `origens.ts`, `armaOperario.ts`, `periciasCriacao.ts`, `pericias.ts`, `habilidades.ts`, `equipamento.ts`, `inventarioCriacao.ts` | **Reaproveitáveis**, sujeitos à conferência contra os livros oficiais e aos testes existentes |
| Compras e funcionamento | `comprasIniciais.ts`, `EquipamentoRascunho.tsx`, `PreviaCompras.tsx`, `DisponibilidadeInicial.tsx`, `FuncionamentoPrevio.tsx` e serviços relacionados | **Parcialmente desenvolvidos**; separar regras/validações de persistência Supabase e conectar ao armazenamento local somente após definir os contratos |
| Revisão e pré-ativação | `conferenciaCriacao.ts`, `preAtivacao.ts`, `RevisaoCriacao.tsx`, `RevisaoAtivacao.tsx` | **Lógica e telas existentes**, mas o ciclo de ativação depende de contratos/RPCs do backend antigo; não equivale a uma ficha local ativa |
| Inventário e organização | `inventarioConsulta.ts`, `consultaInventarioLocal.ts`, `organizacaoInventario.ts`, `PainelInventarioLocal.tsx`, `PainelOrganizacaoLocal.tsx`, `PainelResumoLocal.tsx` | **Peças locais já preparadas**, com contratos e testes próprios; ainda precisam ser ligadas ao ciclo unificado de ficha e ao servidor |
| Notas pessoais e recuperação | `AnotacoesPessoais.tsx`, `notasPessoais.ts`, `sessaoRecuperacao.ts`, `recuperacaoAtivacao.ts` | **Partes locais reutilizáveis**; conferir escopo, persistência e privacidade na arquitetura de contas/Mesas locais |
| Servidor LAN | `server/index.mjs`, `server/auth-local.mjs`, `server/index.html` | **Protótipo existente**: SQLite, contas/sessões locais, criação/listagem/consulta básica de Mesas e WebSocket demonstrativo. Ainda não persiste personagens nem os módulos da ficha |
| PWA | `public/manifest.webmanifest`, `public/sw.js` e testes do shell | **Shell estático implementado**; não significa que os dados da campanha já funcionem offline ou pela LAN |
| Supabase | `src/conexao.ts`, serviços que recebem cliente Supabase, `supabase/migrations/` e `supabase/proposals/` | **Fora do backend-alvo local**. Preservar como histórico/referência; não executar migrations, RPCs ou operações remotas nesta integração |

## Evidências importantes

- O caminho `?laboratorio=local` monta o laboratório antes da aplicação online, mas o laboratório grava em uma chave própria do localStorage; não chama a API do servidor.
- O servidor local já tem autenticação por conta local e endpoints básicos de Mesa. O WebSocket atual é demonstrativo e não representa ainda sincronização de personagens, ficha ou estado de campanha.
- O README ainda descreve a aplicação Alfa 0.4 como Supabase-first e contém instruções históricas dessa versão. A direção LAN-first aprovada em 29/10/2026 prevalece.
- Os testes automatizados estão distribuídos em `tests/*.test.mjs`, incluindo testes de domínio, UI isolada, laboratório, autenticação local e servidor. Os resultados descritos em checkpoints são históricos e não comprovam o estado do HEAD atual sem nova execução.
- Os arquivos SQL em `supabase/migrations/` e `supabase/proposals/` não são migrations do SQLite e não devem ser aplicados nem convertidos mecanicamente.

## Ordem segura de integração

### Etapa 1 — base local única
- Definir a aplicação local como caminho de entrada próprio, sem inicializar o cliente Supabase.
- Manter laboratório/dados fictícios claramente identificados enquanto o servidor não estiver pronto.
- Definir contratos tipados de conta, Mesa, participante, personagem e resposta de sincronização que serão compartilhados entre frontend e servidor.
- Preservar as telas e protótipos existentes; evitar uma reescrita visual.

### Etapa 2 — Mesa e sessão no servidor
- Consolidar cadastro, login, logout, consulta de sessão e criação/listagem de Mesa no servidor local.
- Validar papel por Mesa no servidor; hospedar o servidor não concede papel de Mestre.
- Completar ingresso/convites e administração de participantes antes de expor a Mesa a uso real.
- Testar isolamento com duas contas distintas.

### Etapa 3 — personagem e ficha
- Criar persistência local transacional de rascunhos/personagens no SQLite.
- Adaptar o laboratório para usar a API local, preservando os rascunhos existentes no navegador por uma importação explícita e validada; nunca apagar nem substituir dados silenciosamente.
- Reaproveitar regras e componentes de criação já existentes.
- Integrar a ficha contínua aprovada, sem ressuscitar as quatro abas antigas como navegação principal.

### Etapa 4 — módulos já desenvolvidos
- Integrar em sequência: Origem/Perícias/Habilidades; equipamento e compras; revisão; funcionamento; inventário e organização; notas pessoais e resumo operacional do Mestre.
- Em cada módulo, distinguir regra de domínio, interface e persistência. Substituir apenas o transporte Supabase; não reescrever fórmulas ou regras sem necessidade.
- Preservar limites, privacidade e permissões por Mesa. O Mestre não recebe editor universal nem acesso irrestrito à ficha completa.

### Etapa 5 — sincronização e recuperação
- Associar eventos WebSocket a alterações persistidas e autorizadas.
- Implementar reconexão, revalidação da sessão e recuperação de histórico/estado.
- Testar concorrência e falhas sem sobrescrita silenciosa.
- Só depois avaliar exportação/importação e execução móvel do servidor.

## Primeiro incremento recomendado

Antes de ligar todos os módulos, criar uma camada de acesso à API local e ligar a experiência de Mesa do laboratório ao servidor. Isso comprova o caminho completo **conta local → Mesa local → atualização em tempo real**, sem misturar ainda criação de personagem ou estado compartilhado da ficha. Em seguida, persistir personagens no servidor e migrar os rascunhos do laboratório por uma ação explícita.

## Fora do escopo desta rodada

- Não tocar em Supabase de produção ou teste, migrations remotas, Auth/RLS remotos ou segredos.
- Não publicar GitHub Pages nem alterar `main`.
- Não ativar fichas ou declarar módulos concluídos apenas porque existem arquivos/telas.
- Não remover protótipos, documentos, testes ou serviços antigos antes de comprovar que seus comportamentos foram reaproveitados.
- Não considerar a integração validada sem executar a suíte, build e testes humanos previstos.

**Estado deste inventário:** documentação criada a partir da inspeção do HEAD indicado. Implementação integrada e validação automatizada continuam pendentes.
