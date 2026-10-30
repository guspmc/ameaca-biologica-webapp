# Checkpoint — laboratório local isolado
**Data:** 30/10/2026  
**Branch de trabalho:** `fix/lan-websocket-reconnect-2026-10-29`  
**HEAD validado:** `7a02309e16f7f069325b2987025ab1348f54945f`  
**Escopo:** primeira camada de persistência local e rascunho inicial de personagem. Não é publicação de produto.

## Objetivo
Permitir desenvolver e testar a ficha do Jogador e o Painel do Mestre em ambiente local, com dados fictícios persistentes, sem escrever no Supabase nem liberar edição do cache offline real.

## Evidência de estado anterior
- `src/offlineCache.ts` guarda cópias de dados associados a usuários autenticados; a ficha usa modo offline somente de leitura.
- `src/FichasJogador.tsx` ainda utiliza RPCs do Supabase para etapas da criação.
- `server/index.mjs` é um protótipo LAN e não oferece persistência/API completa de fichas.
- `package.json` usa testes Node e possui script de build TypeScript + Vite.
- Não há execução no computador local do usuário. A validação automatizada é feita pelo GitHub Actions.

## Implementado nesta etapa
- Criado `src/laboratorioLocal.ts`, módulo independente que não importa Supabase.
- Chave de armazenamento separada: `ameaca-biologica:laboratorio-local:v1`.
- Estado identificado como `laboratorio-local`, com versão de esquema, timestamp e registros tipados como Mesa ou personagem.
- Leitura, gravação, atualização por ID, remoção individual e limpeza limitada à chave própria do laboratório.
- Validação de JSON, versão e IDs duplicados. Dados corrompidos/desconhecidos provocam erro; não são sobrescritos automaticamente.
- Criada `src/LaboratorioLocal.tsx`, com interface inicial de Mesa fictícia e rascunho de personagem, usando somente `localStorage` e `laboratorioLocal.ts`.
- `src/App.tsx` encaminha `?laboratorio=local` para o componente isolado antes de montar a aplicação online. O componente online (e a inicialização do cliente Supabase dentro dele) não é montado nesse caminho. O pacote Supabase continua sendo dependência/import do projeto; portanto, a afirmação correta é que o fluxo local não inicializa o cliente nem chama os serviços online.
- A interface avisa que os dados são fictícios, locais e não sincronizados. Registra identidade, Mesa, Classe, Origem, arma obrigatória do Operário quando aplicável, Atributos e distribuição inicial de Perícias. Ainda é um rascunho, não a ficha oficial completa.
- `src/styles.css` recebeu estilos específicos para a interface local.
- `.github/workflows/pr-build.yml` executa também em push para a branch de desenvolvimento, permitindo validar TypeScript/Vite sem abrir PR ou publicar.
- Criados testes automatizados em `tests/laboratorio-local.test.mjs` para inicialização, persistência, atualização, corrupção, versão inválida, remoção, falha de gravação, arma do Operário, Atributos e Perícias.
- Criado `src/atributosCriacao.ts` com validação pura dos Atributos iniciais; a interface local permite distribuir os pontos e salva os quatro valores no rascunho.
- Criado `src/periciasCriacao.ts` para validar Treinamento gratuito da Origem, opção extra de Origem, pontos da Classe, limites de grau e distribuição. A interface local permite escolher a Perícia Treinada e distribuir pontos.
- `Amnésico` tem tratamento específico para escolher duas Perícias distintas, conforme o fluxo existente de criação.

## Decisões e compatibilidade de regras
- A validação local de pontos de Classe aceita gastar **até** o limite da Classe, sem obrigar o jogador a consumir todos os pontos. Isso foi alinhado ao comportamento observado na RPC/migration online, que rejeita apenas o total acima do limite.
- O teste que considerava inválido investir pontos na segunda Perícia da Origem foi corrigido: essa Perícia também pode integrar a lista da Classe e, portanto, pode receber pontos. O teste de limite agora usa a Perícia já treinada gratuitamente, cujo grau não pode ultrapassar Mestre.
- Nenhuma regra canônica foi alterada; os ajustes alinham o laboratório ao comportamento online existente.

## Estado dos testes — confirmado em 30/10/2026
- <badge>APROVADO</badge> **Build, testes de regras/permissões e verificação de tipos:** GitHub Actions run `41133937803`, commit `7a02309e16f7f069325b2987025ab1348f54945f`. Todas as etapas concluídas com sucesso: instalação, testes em PostgreSQL local, compilação TypeScript/Vite e verificação de tipos dos cenários isolados.
- <badge>APROVADO</badge> **Protótipo LAN:** GitHub Actions run `41133937656`, mesmo commit. Testes automatizados do servidor e compilação do frontend concluídos com sucesso.
- Os workflows do commit anterior `061a54b8...` falharam; o commit seguinte corrigiu o caso de teste e alinhou a validação de pontos não utilizados. O resultado aprovado é o do HEAD acima.
- Os testes aprovados são automatizados. **Não comprovam ainda o comportamento no navegador/dispositivo do Gus**, nem persistência após recarga em uso real.
- **Teste humano:** pendente. Aguardar o usuário estar no PC; executar roteiro guiado, um passo por vez.
- **Produção/Supabase:** nenhuma alteração executada; sem migration, mudança de RLS ou publicação.

## Limites conhecidos
- A interface local cria Mesas fictícias e rascunhos com Classe, Origem, arma obrigatória do Operário quando aplicável, Atributos e Perícias. Ainda não integra `FichasJogador.tsx` nem reproduz a ficha oficial completa.
- Ainda não há escolha de Habilidade, revisão/ativação da ficha, cálculo completo de recursos, Combate ou Inventário.
- A lista de arma do Operário está validada na interface local, mas ainda não foi incorporada à persistência online/RPCs nem protegida por validação SQL; não tratar como concluída na ficha oficial.
- O acesso é feito manualmente pela query `?laboratorio=local`; ainda não existe botão de entrada no portal principal.
- O modo local não sincroniza com outros dispositivos e depende do armazenamento disponível no navegador.
- Não migrar dados reais para o laboratório e não habilitar edição offline da campanha.

## Próximo passo após a pausa
1. Quando Gus estiver no PC, abrir o laboratório local e validar criação de Mesa/personagem e persistência após recarga.
2. Se o teste confirmar a gravação, registrar o resultado e avançar para Habilidade Básica, revisando primeiro a implementação online e o cânone antes de alterar o laboratório.
3. Prosseguir com revisão/ativação, recursos, Combate e Inventário em pequenas etapas.
4. Depois de validar a ficha e consolidar o Painel do Mestre no laboratório, planejar a integração LAN entre ambos.
5. Só então avaliar integração online/server-side, sempre separada de qualquer publicação ou mudança no Supabase, que dependerá de autorização expressa.

## Roteiro humano — pendente
Nenhum teste precisa ser feito agora. Quando Gus estiver no PC, a orientação será enviada **uma etapa por vez**, começando por abrir `https://guspmc.github.io/ameaca-biologica-webapp/?laboratorio=local` somente se essa versão publicada contiver a rota; como não houve publicação deste branch, a validação deve usar o ambiente local do repositório/servidor de desenvolvimento. Não presumir que a URL pública já contém as alterações.
