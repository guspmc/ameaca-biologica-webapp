# Organização local do inventário — 26/10/2026

## IMPLEMENTADO
T17.1–T17.10 e MC6.1–MC6.10 encerrados conforme confirmação escrita de Gus. Checkpoint de partida 962bfd2f49104c5c71aee091cd895534192fa8ff, árvore limpa e suíte anterior de 204 testes/Actions #41 conferidos antes do avanço.

Preparação isolada para mover um exemplar a espaço livre ou trocar dois exemplares. Plano puro preserva identidades, quantidades, munição, durabilidade, estado equipado e Característicos. Incrementa somente a revisão e muda posições. Tela separa estado registrado de prévia, permite cancelar e exige consentimento explícito antes de enviar ao servidor fictício.

Pedido e recibo têm contrato fechado. A conferência exige resultado integral igual ao plano esperado. Falha incerta conserva o mesmo pedido; consultar recupera recibo sem reenviar, ou permite repetição explícita somente com estado anterior idêntico. Revisões divergentes exigem reconciliação. Respostas de outra seleção são descartadas; retorno à ficha recupera seu pedido durante a mesma página.

Referência: Planejamento v2.0 consultado sem edição. Este passo organiza somente posições de exemplares que já ocupam um espaço cada; não introduz quebra-cabeça de rotação, fusão, divisão de pilhas ou regras novas de economia. Característicos ficam fora do seletor e excesso de capacidade impede mudança sem remover itens.

Prévia física ampliada de sete para oito entradas fictícias; 26 arquivos no pacote fechado. Página inicial inclui Organizar espaços. Aplicação conectada, propostas SQL, documentos oficiais e dados existentes preservados.

## TESTADO
- 222/222 testes automatizados locais, execução sequencial; 18 novos de organização. Log preservado fora do repositório em output/testes-organizacao-2026-10-26.log.
- TypeScript da aplicação e páginas QA, compilação modo teste e empacotamento estático aprovados. git diff --check sem erros.
- Navegador no PC: prévia não altera lista; movimento livre preserva estado; perda da resposta recupera por consulta; falha anterior permite repetição explícita (dois envios/uma alteração); resposta atrasada de A não contamina B e A recupera por consulta (um envio/uma alteração). Console sem avisos/erros. Evidência local: output/organizacao-recuperada-2026-10-26.png.
- HTTP 200 na nova página em loopback 4174 e LAN 192.168.1.2:4175. Arquivos .env, src/conexao.ts e site-manifest.json retornam 404 na LAN; política connect-src 'none' presente.

Os testes automatizados cobrem troca, pilhas/estados gastos, limites, recusa, capacidade excedida, repetição idempotente, recibos inválidos, reconciliação, cópias imutáveis e seleção encerrada. Validação de simulação não certifica autorização remota nem concorrência entre conexões.

## PENDENTE DE TESTE HUMANO
Fila PC 10/10: [T18.1–T18.10](rodada-organizacao-pc-2026-10-26.md). Fila física independente 10/10: [MC7.1–MC7.10](rodada-organizacao-celular-2026-10-26.md). Ambiente de referência: Windows 11/Edge e Galaxy S24 FE/Samsung Browser. Nenhum caso novo foi declarado aprovado pelo usuário.

## BLOQUEADO
Integração remota, Auth/RLS e alterações de banco continuam condicionadas a checkpoint específico. Reconciliação definitiva, retenção de pedidos e trava entre abas permanecem futuras. Nesta simulação pedidos ficam somente em memória: F5, trocar cenário ou Reiniciar apaga tudo. Isso é declarado no banner e não equivale à recuperação persistente de T13. Nenhum teste exige contornar bloqueios ou apagar dados reais.

## PRÓXIMO PASSO
Aguardar as duas filas no limite de dez cada antes de ampliar. Corrigir eventual falha reportada e depois preparar o próximo incremento independente. Prévia permanece temporária, exige PC ligado e mesma rede; nenhuma publicação externa, merge na principal ou mudança de firewall foi feita.
