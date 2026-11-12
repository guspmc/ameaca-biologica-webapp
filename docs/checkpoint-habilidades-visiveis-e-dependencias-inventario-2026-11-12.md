# Checkpoint — consulta de Habilidades adquiridas e dependências do Inventário

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Fontes canônicas:** Arquivo do Jogador v1.0, pp. 33–34 e 37–38; regras de itens e fabricação, pp. 68–72.

## 1. Consulta das Habilidades na Ficha — correção implementada

**Problema encontrado:** a Ficha ativa exibia somente a Habilidade Básica na área “Habilidade e equipamento”. As Habilidades dos níveis posteriores eram persistidas e utilizadas para efeitos/validações, mas não havia uma consulta consolidada visível de todas as Habilidades adquiridas.

**Correção mínima em `src/FichaLocal.tsx`:**
- Importa o catálogo de Habilidades da Progressão e o resolvedor de descrições.
- Monta a lista a partir dos IDs ativos já derivados do registro da Habilidade Básica e de `habilidadesAdquiridas`.
- Exibe nome, Nível de aquisição, grau e descrição do efeito para cada Habilidade conhecida.
- Se o Nível não puder ser identificado a partir do histórico, não inventa um Nível: exibe “Nível não identificado”.
- Mantém a indicação de armamento como “Não equipado”; seleção de equipamento inicial não equivale a equipamento empunhado.
- Não altera escolhas, histórico, progressão, efeitos, recursos nem persistência.

**Regressão:** `tests/progressao-habilidades.test.mjs` verifica que a Ficha ativa utiliza o catálogo, a descrição e a lista com Nível/grau.

## 2. Auditoria do Inventário e das Habilidades dependentes dele

**Implementado:**
- Planejamento e materialização do equipamento inicial na ativação.
- Modelo de consulta por exemplar com campos tipados para arma de fogo, arma corpo a corpo, munição, colete, peça, consumível, ferramenta e itens característicos.
- Validação do snapshot consultado, incluindo personagem, revisão, IDs únicos, capacidade, posições sem sobreposição, quantidades e estados dos exemplares.
- `PainelInventarioLocal.tsx` é explicitamente somente leitura: consulta, busca, filtro e detalhe. A interface declara que não usa, equipa, recarrega ou transfere itens.
- `EditorInventarioLocal.tsx` edita apenas planejamento da criação; não modifica inventário ativo.
- A seção Inventário da Ficha ativa informa que movimentação e gerenciamento contínuo ainda serão liberados no módulo próprio; não há integração operacional de equipamento.

**Pendente — dependência real, não falha de regra:**
- Equipar/desequipar, empunhar/guardar, consumo e uso de itens.
- Recarga, munição, durabilidade, aparar e estado confiável de arma empunhada.
- Instalação/remoção de Peças Extras e vínculo a uma arma específica.
- Fluxo de fabricação/combinação de Ervas, receitas, ingredientes, ferramentas, tempo, Medicina e resultado.
- Aplicação e duração de PV Temporários, cura em aliados e efeitos de Primeiros Socorros.
- Registro de origem/produtor/usuário de Misturas, necessário para Herbalista e CODE VERONICA.
- Usos por turno/rodada, posição e eventos necessários a diversas Habilidades de combate.

**Decisão técnica nesta etapa:** não ligar esses efeitos a campos de consulta somente leitura nem simular operações. Isso poderia declarar uma arma empunhada sem que o Inventário tenha autorizado o estado, consumir item sem transação ou aplicar cura/PV temporários sem registro verificável. A integração deve esperar pelo fluxo transacional de Inventário ativo e suas regras de autorização/concorrência.

## 3. Limites e validação

- **Revisão estática:** arquivos de Ficha, catálogo, Progressão, modelo/consulta de Inventário e painéis consultados.
- **Testes:** teste estrutural adicionado; testes automatizados não executados nesta sessão.
- **Build/CI:** não executados/não confirmados.
- **Validação humana:** pendente, especialmente Ficha de Nível 1 e personagem com várias Habilidades adquiridas; conferir descrições, Níveis e graus em celular e desktop.
- **Sem alteração:** cânone, schema, modelo de inventário, fluxo LAN, Supabase, cálculos de combate, recursos, CSS global, navegação, merge, publicação ou deploy.

## 4. Próxima frente

Auditar o fluxo de ataques e reações que já existe, confrontando os lembretes de Habilidades com as regras de Aparar, Esquivar, Finalizar e Ataque de Oportunidade. Manter o Inventário como dependência bloqueadora para qualquer operação que exija equipamento real.
