# Checkpoint — auditoria de Habilidades e correção de PV por Nível

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** catálogo, progressão, persistência e integração operacional das Habilidades de Classe; correção de derivação de PV na Ficha ativa.  
**Fontes canônicas:** Arquivo do Jogador v1.0, pp. 27, 29–30, 33–34 e 37–38.

## 1. Catálogo e progressão

**Implementado e conferido estaticamente:**
- Catálogo com 30 Habilidades: 9 Básicas, 9 Avançadas, 9 Superiores e 3 Avassaladoras.
- Três Classes e seus três Ramos cada; Avassaladoras exclusivas de Classe.
- Ganhos nos níveis 1, 2, 4, 6, 8 e 10; Atributos nos níveis 3, 5, 7 e 9; Pontos de Perícia nos níveis 4 e 8.
- Nível 2 exige Básica de outro Ramo; Avançada exige Básica do mesmo Ramo; Superior exige Avançada do mesmo Ramo.
- Validação impede Classe/grau incompatível, repetição, nível inesperado e histórico malformado.
- Planejamento de criação é rascunho separado da aplicação dos ganhos; não altera Nível, Atributos, Perícias ou benefícios efetivos.
- Aplicação de Progressão registra Habilidade por nível em `habilidadesAdquiridas` e no histórico persistente, validando a sequência antes de salvar.
- Progressão LAN segue indisponível, conforme a matriz; não foi ampliada neste incremento.

**Arquivos consultados:** `src/habilidades.ts`, `src/progressaoHabilidades.ts`, `src/efeitosHabilidades.ts`, `src/PlanejadorHabilidadesCriacaoLocal.tsx`, `src/progressaoCampanha.ts`, `src/progressaoPersistente.ts`, `src/validacaoPersonagemLocal.ts`, `src/ProgressaoFichaLocal.tsx`.

## 2. Integração dos efeitos — situação encontrada

A presença no catálogo não equivale a integração operacional. A Ficha preserva a regra de não executar decisões narrativas, efeitos sobre terceiros ou gatilhos que dependem da Mesa.

**Cálculos e benefícios ligados à Ficha:**
- **Parrudo:** +5 PV Máximos, +3 BI Máxima e Vantagem em Fortitude. Os bônus de PV/BI já eram derivados da Habilidade Básica; foi encontrada e corrigida a falha de PV por Nível descrita na seção 3.
- **Tentativa e Erro:** Perícia adicional escolhida e +1 nos Testes de Perícia aplicáveis.
- **Curiosa:** Vantagem contextual em Percepção/Investigação com confirmação da situação; uso 1/Descanso Completo tem registro persistente.
- **CODE VERONICA:** Vantagem em Testes de Perícia e tratamento de resultados naturais 2–9 como 10 na calculadora; 1 natural continua Falha Crítica.
- **Reflexos de Sobrevivente:** Defesa contra Ataques usa o maior entre Defesa atual e 10 + Acrobacia; o resumo informa os benefícios condicionais restantes.
- **Casca-Grossa:** elevação de categoria de Dado em Ataque Desarmado é aplicada na calculadora; usos de Cabeçada/Pisão continuam sujeitos à confirmação e não são controlados por turno.
- **Proficiências adicionais:** Arsenal Improvável e Armamento Especial aparecem no resumo de Proficiências. A validação efetiva por arma equipada depende do Inventário ativo.

**Integrações operacionais no Painel de Ações:**
- **Não Vai Escapar:** gatilho confirmado, Reação registrada; deslocamento e Ataque continuam manuais.
- **Na Minha Mira:** confirmações de uso por rodada, percepção, alcance, nova Condição e arma; Reação registrada, Ataque manual.
- **Contra-Ataque Instintivo:** permite reutilizar a Reação somente quando o estado persistido confirma que ela foi consumida na defesa.
- **Retaliação:** exibe Atordoamento após defesa bem-sucedida e Vantagem/+1 dado no Contra-Ataque; aplicação da Condição, rolagem e Dano continuam manuais.

**Lembretes/integrações parciais na calculadora ou no resumo:**
- Anatomia de Combate, Quanto Mais Melhor, Armeiro, Armeira Autodidata, Armamento Especial, Controle de Fogo, Ambidestria, GOLPE SUJO e Parede Humana exibem instruções ou exigem modificador/confirmação manual em situações específicas.
- Rolamento e a Esquiva gratuita de Reflexos de Sobrevivente não têm controle persistente completo de reposicionamento, uso por rodada e compromisso da Ação Bônus.
- Arsenal Improvável e CODE VERONICA ampliam as armas permitidas para Ambidestria, mas a validação de armas empunhadas e o controle operacional dependem do Inventário.
- Não foi localizada integração específica no Painel para Finalização à Distância, Luta Livre, Brecha Tática, Briga de Gente Grande e SOCADOR DE PEDRAS. Seus efeitos constam do catálogo, mas não devem ser tratados como executados pela Ficha.

**Dependências do Inventário ativo ainda pendentes:**
- Herbalista, Farmácia de Campo e Primeiros Socorros dependem de uso/fabricação/consumo de itens e de resolução de cura.
- VOCÊ APAROU UM MÍSSIL!? depende de Aparar, arma empunhada e Durabilidade; Aparar permanece deliberadamente bloqueado até existir estado confiável de equipamento.
- Armeiro, Armeira Autodidata, Armamento Especial, Ambidestria e as extensões de Arsenal Improvável/CODE VERONICA também precisam de estado operacional de armas, Peças, munição e mãos ocupadas.
- Nenhum desses efeitos foi simulado ou automatizado nesta auditoria.

## 3. Defeito encontrado e correção aplicada

**Defeito:** `FichaLocal.tsx` calculava os derivados sem fornecer `nivelAtual` a `calcularDerivadosCriacao()`. Como o parâmetro assume Nível 1 quando omitido, PV Máximos permaneciam na fórmula de Nível 1 após a Progressão, embora a função de domínio já calculasse corretamente PV por Nível.

**Cânone:** PV por Nível é (PV da Classe + VIG) por Nível; Parrudo acrescenta +5 PV Máximos. SA, BI, Defesa, Inventário e Movimento seguem suas fórmulas próprias e não são multiplicados por Nível.

**Correção mínima:** a chamada em `src/FichaLocal.tsx` agora passa `nivel: nivelAtual`. Nenhuma fórmula de domínio, recurso atual, regra de Progressão ou dado salvo foi alterado.

**Regressão:** `tests/derivados-criacao.test.mjs` agora verifica estruturalmente que a Ficha ativa repassa `nivelAtual` ao cálculo. A suíte de derivados já cobre PV por Nível de 1 a 10 e os bônus numéricos de Parrudo.

## 4. Estado de validação

- **Revisão estática:** realizada nos arquivos listados; a alteração foi relida no branch após o commit.
- **Testes automatizados:** existem testes de catálogo, pré-requisitos, progressão, criação e derivados. Não foram executados nesta sessão.
- **Build/CI:** nenhum status de CI foi retornado para o HEAD consultado; não declarar aprovação.
- **Validação humana:** pendente. Deve conferir PV Máximos nos níveis 1, 2, 4, 6, 8 e 10, incluindo Operador com Parrudo; verificar que SA/BI não escalam indevidamente; revisar os lembretes das Habilidades nos modos Automático, Misto e Manual.
- **Não houve:** alteração de cânone, redesign, mudança de esquema/persistência, integração LAN, Supabase, merge, publicação ou deploy.

## 5. Próximo foco da auditoria

Conferir as integrações de Habilidades que dependem de Combate/Inventário e revisar se a ficha ativa oferece uma consulta clara às Habilidades adquiridas além da Básica. Manter separadas as regras implementadas, os lembretes manuais e as dependências do Inventário ativo.
