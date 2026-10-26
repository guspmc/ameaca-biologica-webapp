# Prévia estática para celular — 26/10/2026

## IMPLEMENTADO

Priorizada a preparação de acesso físico ao celular para remover a lacuna de interface, sem integrar a ficha ativa remotamente. Conferido o checkpoint `6ab53e1`, os commits anteriores e a árvore antes de continuar as alterações ainda não salvas desta preparação. T14/T15 permanecem encerrados e aprovados.

`scripts/preparar-previa-celular.mjs` gera somente cinco entradas fictícias: página inicial, ficha de compras, contexto, fluxo e ativação/resumo. Usa os componentes do projeto e dados em memória. A saída fica fora do Git, em `../output/previa-celular`. Não inclui pasta pública, fontes, mapas de código ou aplicação conectada; o empacotamento recusa módulos App/main/conexao e o SDK Supabase. Apenas o prefixo de ambiente de QA é exposto. Um manifesto lista os arquivos autorizados e seus hashes.

`scripts/servir-previa-celular.mjs` serve somente arquivos desse manifesto, com verificação de hash e caminho real contido na pasta estática. Aceita GET/HEAD, sem listagem, APIs ou upload. Bloqueia fontes, `.env`, manifesto, caminhos não listados e travessia. Restringe a escuta a IPv4 privado/loopback; não aceita wildcard nem IP público. A política do navegador bloqueia conexões de dados (`connect-src 'none'`) e formulários. O acesso LAN não autentica visitantes: outros aparelhos alcançáveis na rede podem abrir as mesmas simulações fictícias. Nenhum dado humano acompanha o pacote.

As interfaces de fluxo e ativação receberam um gerador sequencial de identificadores exclusivamente fictícios, injetado nas dependências. Isso evita depender de `crypto.randomUUID` em HTTP de rede privada. A interface de revisão aceita o gerador opcional; o padrão de operações reais permanece UUID criptográfico. Não usar o gerador de QA em operação real ou entre dispositivos.

Nenhum firewall, roteador, Auth, banco ou publicação externa foi alterado. A prévia anterior em loopback permanece separada. O servidor LAN é temporário e encerra com Ctrl+C ou reinício do PC.

## TESTADO

- **178 testes automatizados aprovados**, dois novos testes de resolução fechada de caminhos e limitação de host. Os 176 anteriores continuam passando.
- TypeScript da aplicação e QA, compilação normal no modo teste, empacotamento estático de QA e diff aprovados. Sem novas dependências.
- HTTP no endereço privado do PC: entrada/ficha retornam 200; `.env`, fonte de conexão, manifesto e travessia retornam 404; cabeçalho bloqueia conexões de dados. O pacote gerado não apresentou padrões de URL/chaves Supabase na busca realizada, além da verificação de módulos durante o build.
- Navegador no PC usando o endereço LAN: página inicial, navegação para ficha, abertura do modal, alteração fictícia do nome e retorno à lista, confirmação do fluxo e resumo operacional funcionaram. As confirmações fictícias não dependeram do gerador de UUID do contexto seguro. Console sem erros nos painéis verificados.
- Evidência: `../output/qa_celular_2026-10-26/entrada.png`, fora do Git. Não certifica acesso de outro aparelho, toque, teclado móvel, rotação ou navegador de celular. Acesso via próprio PC não prova liberação no firewall nem comunicação Wi-Fi/cabo.

## PENDENTE DE TESTE HUMANO

**MC1–MC4**, separados da fila comum, que permanece 0/10. [Roteiro do aparelho físico](teste-celular.md). Primeiro confirmar o acesso direto no navegador do celular, na mesma rede. Não repetir T14/T15 como nova rodada lógica.

## BLOQUEADO

Conectividade entre o telefone e o PC ainda não confirmada. Se firewall/isolamento de rede impedir, registrar o bloqueio e preparar uma alternativa revisável antes de pedir autorização indispensável. Sem abertura de firewall ou hospedagem externa nesta etapa. Integração remota continua dependendo de checkpoint próprio.

## PRÓXIMO PASSO

Receber MC1–MC4 e corrigir problemas de interface encontrados. Trabalho de reconciliação segura de pedidos pode continuar independentemente dos testes físicos, dentro dos limites já aprovados.

## Reproduzir e encerrar

Na pasta do repositório, com Node e dependências disponíveis:

```powershell
node scripts/preparar-previa-celular.mjs
node scripts/servir-previa-celular.mjs ../output/previa-celular ENDERECO_IPV4_PRIVADO 4175
```

Substituir ENDERECO_IPV4_PRIVADO pelo endereço atual do PC; não usar `0.0.0.0`. Abrir `http://ENDERECO_IPV4_PRIVADO:4175/` no telefone da mesma rede. Ctrl+C encerra o servidor. A geração é separada do build da aplicação e não publica nada. Antes de regenerar arquivos de um servidor ativo, encerrá-lo; reiniciar para carregar o novo manifesto.
