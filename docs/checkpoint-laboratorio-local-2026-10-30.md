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
- Não foi confirmada execução local do build/testes nesta etapa.

## Implementado nesta etapa
- Criado `src/laboratorioLocal.ts`, módulo independente que não importa Supabase.
- Chave de armazenamento separada: `ameaca-biologica:laboratorio-local:v1`.
- Estado identificado como `laboratorio-local`, com versão de esquema, timestamp e registros tipados como Mesa ou personagem.
- Leitura, gravação, atualização por ID, remoção individual e limpeza limitada à chave própria do laboratório.
- Validação de JSON, versão e IDs duplicados. Dados corrompidos/desconhecidos provocam erro; não são sobrescritos automaticamente.
- O módulo não é ainda conectado à interface. A chave do laboratório não é o cache offline real.
- Criados testes automatizados em `tests/laboratorio-local.test.mjs` para inicialização, persistência, atualização, corrupção, versão inválida, remoção e falha de gravação.

## Estado dos testes
- **Preparados:** 7 testes de unidade.
- **Executados:** nenhum confirmado nesta etapa; não declarar aprovação até obter resultado de execução.
- **Teste humano:** ainda não iniciado.
- **Build:** ainda não executado nesta etapa.
- **Produção/Supabase:** nenhuma alteração solicitada ou executada; sem migration, mudança de RLS ou publicação.

## Limites conhecidos
- A primeira camada usa a interface de armazenamento injetada; a integração com `localStorage` do navegador e a interface de laboratório virão depois.
- Ainda não há fluxo visual para criar/editar personagens fictícios, nem integração com a ficha atual.
- A gravação é local ao navegador/dispositivo e não é sincronização entre dispositivos.
- Não migrar dados reais para o laboratório e não habilitar edição offline da campanha.

## Próximo passo
1. Verificar a compatibilidade do módulo e dos testes com a configuração atual do projeto.
2. Executar testes e build em ambiente de desenvolvimento disponível; registrar os resultados reais.
3. Só então integrar uma entrada explícita “Laboratório local (dados fictícios)” e testar persistência no navegador.
4. Continuar a ficha do Jogador; revisar a seleção obrigatória de arma do Operário contra a lista aprovada antes de integrar esse fluxo.

## Roteiro humano
Nenhum teste humano é solicitado neste checkpoint, pois a camada ainda não está ligada à interface. Quando a interface estiver pronta, os passos serão enviados um por vez, e o trabalho aguardará a aprovação ou reprovação do Gus antes de prosseguir para o próximo grupo.
