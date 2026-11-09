# Continuação após aprovação T13 — 25/10/2026

## IMPLEMENTADO

Base conferida: `7fbfc8c`, com as sete alterações locais já descritas na rodada ampliada. Elas foram preservadas, sem reaplicar operações anteriores. T13.1–T13.10 encerrados por confirmação explícita de Gus; 33 capturas copiadas sem modificação para a pasta de evidências fora do Git, com índice de hashes.

`src/sessaoRecuperacao.ts` compõe o controlador de recuperação existente em um ciclo de seleção/encerramento. Toda seleção invalida o controlador anterior, mesmo com os mesmos IDs. Seleção inválida encerra o contexto anterior antes de falhar. Contexto e dependências são copiados. Encerrar não apaga o pedido: ele permanece disponível à recuperação autorizada futura.

O módulo não importa SDK, não lê sessão global, não recebe credenciais e não inicia consultas ou envios ao selecionar/encerrar. Não está importado na aplicação conectada. Os IDs separam referências locais; não concedem autorização. A integração futura deverá chamá-lo nos eventos reais de troca de conta/Mesa/ficha, encerramento e perda de vínculo. Renovação de credenciais e retenção após encerramento ainda exigem desenho explícito do adaptador.

Uma requisição já enviada pode concluir no servidor após encerramento. A preparação descarta sua resposta antiga e conserva a referência, sem prometer cancelar ou reverter a transação. Ela também não cria trava entre abas.

## TESTADO

Quatro novos testes exercitam a composição: seleção inerte/cópias/seleção inválida; isolamento por conta/Mesa/ficha e recuperação ao voltar; encerramento durante consulta sem reenvio; nova seleção com os mesmos IDs enquanto um envio aguarda resposta. Os pedidos preservados não são apagados nem reenviados automaticamente.

Suíte completa **145/145 aprovada**; os quatro testes do módulo foram novamente aprovados após copiar as dependências. TypeScript da aplicação, TypeScript de testes de interface e compilação Vite em modo teste aprovados. Nenhum novo ensaio de navegador é atribuído a este módulo sem interface. A aprovação humana T13 pertence à simulação anterior. Nenhum CI remoto novo executado.

## PENDENTE DE TESTE HUMANO

Nenhum caso novo executável nesta etapa sem interface. T13 encerrado. T10–T12 e celular físico continuam condicionados à integração/acesso, sem pedido de repetição dos casos aprovados.

## BLOQUEADO

Aplicação remota continua condicionada a checkpoint específico. Não foram alterados banco, RLS, Auth, dados existentes, documentos oficiais ou o Planejamento. Não houve publicação, merge ou sincronização remota. Mudanças continuam locais sobre `7fbfc8c`.

## PRÓXIMO PASSO

Preparar e revisar localmente a conferência e o gateway SQL de ativação, códigos de erro e privilégios mínimos, antes de apresentar um pacote concreto para aprovação de aplicação no ambiente TESTE. O controlador de sessão é preparação, não substitui esse gateway, autorização no servidor ou ensaio real de conexões concorrentes. A integração não está liberada por esta aprovação de interface.
