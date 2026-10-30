# Checkpoint — laboratório local isolado
**Data:** 30/10/2026  
**Branch de trabalho:** `fix/lan-websocket-reconnect-2026-10-29`  
**Escopo:** primeira camada de persistência local para dados fictícios. Não é publicação de produto.

## Objetivo
Permitir desenvolver e testar a ficha do Jogador e o Painel do Mestre em ambiente local, com dados fictícios persistentes, sem escrever no Supabase nem liberar edição do cache offline real.

## Evidência de estado anterior
- `src/offlineCache.ts` guarda cópias de dados associados a usuários autenticados; a ficha usa modo offline somente de leitura.
- `src/FichasJogador.tsx` ainda utiliza RPCs do Supabase para etapas da criação.
- `server/index.mjs` é um protótipo LAN e não oferece persistência/API completa de fichas.
- `package.json` usa `node --experimental-sqlite --test tests/*.test.mjs` para testes e possui script `build` (TypeScript + Vite).
- Não há execução no computador local do usuário. A validação automatizada é feita pelo GitHub Actions.

## Implementado nesta etapa
- Criado `src/laboratorioLocal.ts`, módulo independente que não importa Supabase.
- Chave de armazenamento separada: `ameaca-biologica:laboratorio-local:v1`.
- Estado identificado como `laboratorio-local`, com versão de esquema, timestamp e registros tipados como Mesa ou personagem.
- Leitura, gravação, atualização por ID, remoção individual e limpeza limitada à chave própria do laboratório.
- Validação de JSON, versão e IDs duplicados. Dados corrompidos/desconhecidos provocam erro; não são sobrescritos automaticamente.
- Criada `src/LaboratorioLocal.tsx`, com interface inicial de Mesa fictícia e rascunho de personagem, usando somente `localStorage` e `laboratorioLocal.ts`.
- `src/App.tsx` passou a encaminhar `?laboratorio=local` para o componente isolado antes de montar a aplicação online. O componente online (e a criação do cliente Supabase/Auth) não é montado nesse caminho.
- A interface avisa que os dados são fictícios, locais e não sincronizados. A primeira versão do personagem registra somente nome e Mesa associada; não é a ficha oficial nem aplica regras.
- `src/styles.css` recebeu estilos específicos para a interface local.
- `.github/workflows/pr-build.yml` agora executa também em push para a branch de desenvolvimento, permitindo validar TypeScript/Vite sem abrir PR ou publicar.
- Criados testes automatizados em `tests/laboratorio-local.test.mjs` para inicialização, persistência, atualização, corrupção, versão inválida, remoção e falha de gravação.

## Estado dos testes
- **Testes de persistência:** 7 testes específicos preparados; o teste de inicialização local foi observado na execução do servidor.
- **Servidor LAN:** GitHub Actions run `41107822931`, commit `be21fdedc78c2f9c1cc88855c81865cf515e0bde`, concluído com sucesso: 288 testes aprovados, 0 falhas.
- **Ajustes de testes:** comparação de registros SQLite normalizada; origem do teste WebSocket passou a usar a origem efetiva com porta; testes de heartbeat passaram a emitir ticket autenticado; expectativas antigas para a API de eventos desativada foram removidas.
- **Build/TypeScript do WebApp:** workflow `41131176588`, commit `e69660c2c3d93cc1a34e0b02259d1984b6b56b62`, concluído com sucesso: testes 288/288, Vite build concluído e verificação `tsc --noEmit -p tsconfig.ui.json` concluída.
- **Validação das novas opções do Operário e interface atualizada:** workflows disparados após os commits `0d0fd00`, `9923077` e `e9b1985`; resultados ainda pendentes.
- **Teste humano:** ainda não iniciado; aguardar validação do build antes de solicitar.
- **Produção/Supabase:** nenhuma alteração solicitada ou executada; sem migration, mudança de RLS ou publicação.

## Limites conhecidos
- A interface inicial cria Mesas fictícias e rascunhos simples de identidade; ainda não integra `FichasJogador.tsx` nem reproduz a ficha oficial.
- Ainda não há edição/remoção visual de registros, distribuição de Atributos, seleção de Perícias/Habilidades, cálculo de recursos, Combate ou Inventário.
- A lista de arma do Operário está validada na interface local, mas ainda não foi incorporada à persistência online/RPCs nem protegida por validação SQL; não tratar como concluída na ficha oficial.
- O acesso é feito manualmente pela query `?laboratorio=local`; ainda não existe botão de entrada no portal principal.
- O modo local não sincroniza com outros dispositivos e depende do armazenamento disponível no navegador.
- A gravação é local ao navegador/dispositivo e não é sincronização entre dispositivos.
- Não migrar dados reais para o laboratório e não habilitar edição offline da campanha.

## Próximo passo
1. Confirmar os workflows dos commits recentes, especialmente a compilação após a entrada de Classe/Origem/arma do Operário.
2. Quando os workflows passarem e Gus estiver no PC, testar `?laboratorio=local`, criar Mesa/personagem e recarregar para conferir persistência.
3. Com a persistência confirmada, ampliar o rascunho local para as seis etapas oficiais da criação e reutilizar módulos puros já existentes.
4. Depois, integrar os mesmos dados e validações na ficha online com persistência server-side, incluindo validação da arma do Operário no servidor.

## Roteiro humano
Nenhum teste humano é solicitado neste checkpoint, pois a camada ainda não está ligada à interface. Quando a interface estiver pronta, os passos serão enviados um por vez, e o trabalho aguardará a aprovação ou reprovação do Gus antes de prosseguir para o próximo grupo.
