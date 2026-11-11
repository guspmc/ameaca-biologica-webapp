# Checkpoint — integração da Manobra Ajudar e Origem Servidor Público

**Data:** 11/11/2026  
**Branch:** feat/offline-first-ficha  
**Fonte canônica:** Arquivo do Jogador v1.0, p. 25 (Origem Servidor Público) e p. 78 (Manobra Ajudar).

## Regra consultada
- Ajudar custa uma Ação em combate. Quando a tarefa puder receber auxílio e a personagem cumprir os requisitos de treinamento, o aliado recebe Vantagem no Teste. Alguns Testes não podem ser ajudados.
- Servidor Público: ao usar Ajudar em um Teste de Perícia no qual a personagem seja Treinada ou Mestre, o aliado recebe a Vantagem normal de Ajudar e +2 no Teste.

## Implementado
- PainelAcoesLocal.tsx agora oferece o controle **Registrar Ajudar · Ação**.
- O registro usa o helper de domínio registrarAjudar e a transição aplicarManobraCombate, consumindo a Ação no estado persistente do turno.
- O jogador precisa confirmar que a tarefa admite auxílio e que cumpre os requisitos de treinamento; o aplicativo não tenta adivinhar quais tarefas podem ser ajudadas nem os requisitos específicos.
- Quando a Origem é Servidor Público, exige confirmação adicional de que a personagem é Treinada ou Mestre na Perícia do Teste do aliado e informa a Vantagem +2.
- FichaLocal.tsx fornece a Origem ao painel. A funcionalidade usa o estado local da Ficha e também respeita o salvamento já existente quando a ficha está conectada ao servidor.

## Testes
- Criado tests/ajudar-ficha.test.mjs para verificar a integração do painel, o consumo da Ação, as confirmações contextuais e o benefício da Origem.
- O teste de domínio existente em tests/manobras-operacionais.test.mjs já verifica que registrarAjudar consome Ação sem resolver a tarefa.
- Não executados localmente neste ambiente. CI do novo HEAD ainda precisa concluir.

## Limites
- A Ficha não escolhe a Perícia do aliado, não valida se a tarefa admite auxílio nem os requisitos particulares de treinamento: são confirmações do jogador/Mesa.
- O aplicativo não aplica a Vantagem nem o +2 à rolagem de outra personagem; informa o benefício para ser aplicado na resolução do aliado.
- Não há coordenação entre fichas distintas ou Encontro compartilhado nesta etapa.

Sem validação humana isolada, merge, publicação ou alteração da main.
