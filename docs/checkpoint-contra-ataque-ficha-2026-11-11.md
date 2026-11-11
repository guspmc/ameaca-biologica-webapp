# Checkpoint — Integração de Contra-Ataque na Ficha
**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`

## Fonte canônica
Arquivo do Jogador v1.0, p. 81:
- Depois de Aparar ou Esquivar com sucesso, a personagem pode gastar 1 SA e usar uma Reação para realizar Ataque normal contra a Defesa do agressor.
- O SA entra na janela de 3 SA.
- Se a Reação normal já foi usada, pode ser necessário comprar uma Reação adicional por Esforço.
- Por padrão, Contra-Ataque responde apenas a Ataques Corpo a Corpo; Habilidades podem criar exceções.
- Contra-Ataque Instintivo permite aproveitar a mesma Reação já usada na defesa.
- Retaliação, após defesa bem-sucedida, atordoa o agressor; o Contra-Ataque recebe Vantagem e +1 dado de Dano se acertar.

## Implementação
- `src/PainelAcoesLocal.tsx` recebeu seção de Contra-Ataque com confirmação manual de defesa bem-sucedida e Ataque originário Corpo a Corpo.
- Integração com `prepararContraAtaque()` e `aplicarReacaoCombate()`; persistência pelo fluxo já existente da Economia de Ações.
- Custo normal: Reação + 1 SA.
- Se Reação normal já usada e Contra-Ataque Instintivo não for aplicado: compra Reação adicional por 1 SA + 1 SA da Manobra, respeitando limite da janela.
- Se Contra-Ataque Instintivo estiver ativo, jogador pode confirmar que a Reação já consumida foi a usada na defesa; nesse caso, não compra outra.
- `src/FichaLocal.tsx` passa ao painel `habilidadesAtivasIds`, derivados da habilidade básica e habilidades adquiridas da personagem.
- Com Retaliação ativa e defesa bem-sucedida confirmada, a interface exibe Atordoado, Vantagem e +1 dado de Dano no acerto; resolução continua manual.

## Limites deliberados
- Defesa bem-sucedida e Ataque Corpo a Corpo são confirmações contextuais; a Ficha não verifica rolagem, alvo ou narrativa.
- Sem exceções genéricas para Contra-Ataque à distância. Uma exceção só será aceita quando uma Habilidade/regra específica for identificada e integrada.
- Não executa Ataque, não rola contra Defesa, não aplica Dano nem Atordoado.
- O painel não rastreia a origem narrativa de cada Reação consumida; reutilização por Contra-Ataque Instintivo depende de confirmação explícita do jogador.
- Não coordena resolução com outra ficha ou Encontro compartilhado.

## Testes e validação
- `tests/estado-turno-combate.test.mjs`: testes adicionados para custo padrão, persistência, reutilização por Contra-Ataque Instintivo e compra de Reação adicional.
- Novo `tests/contra-ataque-ficha.test.mjs`: controles contextuais, IDs de Habilidades ativas e limites da interface.
- Testes não executados localmente neste ambiente.
- CI do novo HEAD precisa ser consultado; não presumir aprovação.
- Nenhum teste humano solicitado.

## Escopo preservado
- Nenhuma alteração em `main`, merge, deploy, publicação, Supabase ou banco de produção.
- Inventário ativo permanece bloqueado até conclusão da Ficha, auditoria e sessão integrada de validação humana.
- Próximo passo: consultar CI e revisar outra lacuna de Reação/Combate que possa ser integrada sem inventar estado de equipamento ou contexto de Encontro.
