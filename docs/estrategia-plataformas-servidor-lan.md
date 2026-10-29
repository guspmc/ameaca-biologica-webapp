# Estratégia de plataformas — servidor LAN

**Decisão aprovada em 29/10/2026:** a ordem de desenvolvimento e validação do servidor LAN será Windows primeiro, Linux Mint depois e Android/Samsung DeX por último.

## Objetivo

Manter um único núcleo de servidor LAN, com responsabilidades separadas da interface do Mestre e da tela de projeção. Windows, Linux Mint e Android serão ambientes de execução diferentes para o mesmo produto, não três implementações independentes.

## Ordem de trabalho

### 1. Windows — plataforma de desenvolvimento e validação inicial

O Windows será o primeiro ambiente de referência para implementar e testar o servidor LAN.

Critérios para avançar:
- instalação reproduzível a partir do repositório;
- inicialização e encerramento previsíveis;
- persistência SQLite após reinício;
- autenticação e autorização no servidor;
- isolamento entre Mesas e participantes;
- comunicação em tempo real e reconexão;
- sincronização e tratamento de falhas de rede;
- entrega autorizada de documentos sem cache persistente indevido;
- base para histórico auditável de alterações offline;
- testes automatizados e roteiro manual documentado;
- nenhuma rota demonstrativa sem autenticação poderá transportar dados reais.

O servidor continuará experimental até que transporte seguro na LAN, autorização e demais controles necessários estejam implementados e testados.

### 2. Linux Mint — validação de portabilidade

Depois de estabilizar e validar o fluxo no Windows, adaptar e testar o mesmo núcleo no Linux Mint.

Verificar especialmente:
- instalação das dependências e versão suportada do Node.js;
- caminhos e permissões de arquivos;
- diretório persistente do banco e cópias de segurança;
- inicialização, encerramento e recuperação após reinicialização;
- firewall e descoberta/acesso pela rede local;
- comportamento equivalente ao Windows, sem bifurcar a lógica de negócio.

### 3. Android + Samsung DeX — etapa posterior

Somente depois das etapas Windows e Linux Mint, investigar o S24 FE como equipamento anfitrião do servidor e estação do Mestre via DeX.

A validação deverá cobrir:
- possibilidade de executar e manter o processo servidor ativo no Android;
- restrições de bateria, suspensão, memória e execução em segundo plano;
- persistência segura do banco e acesso a arquivos;
- conectividade Wi-Fi com os dispositivos dos jogadores;
- estabilidade durante bloqueio de tela e uso prolongado;
- uso simultâneo do servidor e da interface do Mestre no DeX;
- saída de vídeo para monitor/projetor e resolução da tela de projeção.

A compatibilidade Android/DeX não será presumida por funcionar no navegador. É uma etapa de pesquisa e teste própria.

## Separação de responsabilidades

A arquitetura deverá manter separadas:
1. **Núcleo do servidor:** autenticação, autorização, banco, sincronização, presença e entrega de arquivos.
2. **Painel do Mestre:** controle da Mesa e ferramentas administrativas permitidas.
3. **Tela de projeção:** visualização dedicada do campo de batalha, sem controles administrativos nem informações privadas.

A tela de projeção poderá ser aberta em monitor ou projetor conectado ao equipamento anfitrião, sem exigir que o servidor e a interface estejam acoplados a um único tipo de dispositivo.

## Restrições de processo

- Não criar três servidores diferentes nem introduzir outra stack sem aprovação.
- Não antecipar implementação Android enquanto os marcos Windows e Linux Mint não estiverem validados.
- Não publicar, fazer merge ou alterar o Supabase de produção sem autorização expressa.
- Distinguir sempre implementação, teste automatizado, teste manual e hipótese.
