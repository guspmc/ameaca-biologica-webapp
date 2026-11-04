# Auditoria do esquema local da ficha — 04/11/2026

**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** documentação do formato efetivamente observado; não altera dados, regras ou validações.

> Este documento descreve o código inspecionado. Não constitui um novo cânone de RPG nem autoriza migração, ativação de personagem ou sincronização com servidor.

## 1. Registro persistido

O IndexedDB usa o banco `ameaca-biologica-ficha`, store `personagens`, versão 1.

Cada registro `PersonagemLocal` possui:

| Campo | Tipo observado | Validação atual |
|---|---|---|
| `id` | string | não vazio após trim |
| `nome` | string | 2 a 80 caracteres após trim |
| `criadoEm` | string | precisa ser interpretável por `Date.parse` |
| `atualizadoEm` | string | precisa ser interpretável por `Date.parse` |
| `dados` | objeto não-array | não há validação interna completa |

A validação estrutural é aplicada ao salvar, listar, obter, substituir e validar backups. A listagem rejeita o conjunto inteiro se algum registro não passar pela validação estrutural; não remove registros inválidos automaticamente.

## 2. Estado inicial observado

A criação local grava inicialmente:

- `dados.versaoModelo = 1`
- `dados.estadoFicha = 'rascunho'`

A interface identifica a ficha como rascunho/não ativa. O código inspecionado não demonstra que a ficha offline seja ativada automaticamente nem que os módulos operacionais de combate estejam implementados.

## 3. Chaves internas observadas

As chaves abaixo são lidas ou gravadas pelos editores da ficha offline.

| Chave em `dados` | Uso observado | Presença no rascunho inicial |
|---|---|---|
| `versaoModelo` | versão do modelo de dados | sim, valor 1 |
| `estadoFicha` | estado inicial do registro | sim, `rascunho` |
| `classe` | Classe escolhida | não |
| `origem` | Origem escolhida | não |
| `armaOperario` | escolha de arma quando aplicável | não |
| `habilidadeBasica` | identificador da Habilidade Básica | não |
| `equipamentoInicial` | identificador do conjunto inicial | não |
| `atributos` | objeto com FOR, AGI, VIG e AST | não |
| `periciaOrigemTreinada` | Perícia concedida pela Origem | não |
| `periciaOrigemExtra` | segunda Perícia, usada no caso Amnésico | não |
| `distribuicaoPericias` | mapa de Perícia para pontos distribuídos | não |
| `identidade` | campos narrativos da personagem | não |
| `comprasIniciais` | mapa de identificador de item para quantidade de compras | não |
| `revisaoCompras` | número de revisão do plano personalizado | não |

As seções são salvas separadamente por patches. O objeto `dados` é mesclado com as chaves do patch, preservando as chaves que não pertencem à seção salva.

## 4. Campos de Identificação observados

O editor de Identificação lê e grava estas chaves dentro de `dados.identidade`:

| Campo | Limite atual no editor |
|---|---:|
| `idade` | 40 |
| `genero` | 40 |
| `ocupacao` | 120 |
| `apelido` | 120 |
| `afiliacao` | 120 |
| `aparencia` | 1.000 |
| `personalidade` | 1.000 |
| `objetivo` | 1.000 |
| `medo` | 1.000 |
| `lacos` | 1.000 |
| `historia` | 4.000 |

O editor trata esses campos narrativos como opcionais. O nome principal da personagem continua sendo o campo externo `PersonagemLocal.nome`.

## 5. Regras de integridade já verificadas no código

- O nome externo deve ter entre 2 e 80 caracteres.
- Os quatro atributos são FOR, AGI, VIG e AST; o editor usa as funções de validação da criação.
- A distribuição de Perícias usa o catálogo de Perícias, Origem e limite de pontos da Classe.
- A validação da seção Características confere Origem contra `ORIGENS`, Habilidade Básica contra a Classe, conjunto inicial contra as opções da Classe e arma quando a Origem é Operário.
- O inventário personalizado exige prévia aplicada e válida antes de salvar o planejamento.
- Alterações posteriores na prévia invalidam a aplicação anterior.
- O planejamento inicial não equipa itens, não consome recursos e não ativa a personagem.

## 6. Limites conhecidos da validação

1. `versaoModelo` não é validada independentemente pela persistência ou pelo backup.
2. `estadoFicha` não tem enumeração validada no armazenamento local.
3. O formato interno de `atributos`, `identidade`, `distribuicaoPericias` e `comprasIniciais` não é validado de ponta a ponta na fronteira IndexedDB/backup.
4. O backup verifica a estrutura externa do registro, mas não valida integralmente o conteúdo interno de `dados`.
5. Campos desconhecidos em `dados` são preservados pela mesclagem e pelo backup; não devem ser descartados sem política explícita de migração.
6. O estado de rascunho é incremental. Exigir todas as chaves da ficha no armazenamento impediria a persistência legítima de um rascunho recém-criado.

## 7. Proposta técnica — ainda não implementada

Antes de endurecer a validação, definir um contrato versionado para os dados internos que:

- aceite o conjunto mínimo de um rascunho recém-criado;
- valide cada seção quando suas chaves estiverem presentes;
- diferencie ausência legítima de valor inválido;
- preserve chaves desconhecidas até existir uma migração aprovada;
- trate `versaoModelo` e futuras migrações explicitamente;
- seja compartilhado por persistência e backup, evitando validadores divergentes;
- tenha testes para rascunho vazio, cada seção isolada, ficha com todas as seções, dados antigos e campos futuros desconhecidos.

**Nenhuma validação nova foi introduzida por este documento.** A proposta depende de revisão e testes antes de qualquer implementação.
