# Especificação Técnica (Specification) - Controle Financeiro Planilha

Este documento descreve as funcionalidades, regras de negócios, estrutura de dados e especificações visuais do app **Controle Financeiro Planilha** (FinanSpreadOS).

---

## 1. Visão Geral (Overview)

O **FinanSpreadOS** é uma planilha inteligente de controle financeiro pessoal interativa estilo Excel rodando inteiramente de forma client-side de alta performance. Ele combina a flexibilidade e o poder de edição inline de uma planilha com a facilidade de sumários financeiros estruturados (KPIs).

### Diferenciais Principais:
1. **Banco de Dados em Memória Separado por Mês**: Em vez de armazenar todos os lançamentos em uma única lista e filtrá-los no frontend, cada ano-mês (ex: `2026-06`, `2026-05`) é tratado como uma **tabela independente** no localStorage.
2. **Edição Coercitiva ao Mês Ativo**: Toda nova linha gerada, alteração de data ou importação de CSV é forçada a residir no mês atualmente ativo do filtro. Se o usuário digitar uma data fora do mês ativo, ela é automaticamente ajustada para o mês correto, evitando que os dados "desapareçam" da tabela atual.
3. **Colunas Dinâmicas**: O usuário pode gerenciar (adicionar ou excluir) colunas personalizadas que afetam globalmente o formato da planilha, mas os dados de cada linha do mês correspondente são preservados.

---

## 2. Requisitos de Negócio & Regras de Filtro

### A. Fluxo de Filtro de Mês Ativo
* O topo da aplicação dispõe de um seletor numérico/cronológico de Mês-Ano (Exemplo: `JUNHO / 2026`).
* O seletor de mês funciona de forma reativa: ao avançar ou retroceder o mês, a aplicação carrega dinamicamente a tabela correspondente (`rows_table_<YYYY-MM>`) do `localStorage`.
* Caso não existam dados salvos para aquele mês, a tabela inicia vazia (ou carrega o template padrão apenas para o mês inicial `2026-06`).
* Se houver uma coluna do tipo **Data** (`date`), todas as células dessa coluna para as linhas do mês correspondente devem, obrigatoriamente, coincidir com o ano e mês ativo. Caso o usuário tente preencher outra data por digitação ou importação de CSV, a aplicação automaticamente ajusta o ano e mês para o do filtro, preservando apenas o dia.

### B. Mapeamento de Colunas e Tipos de Dados
As colunas suportam os seguintes tipos:
1. **Texto (`text`)**: Edição de campos de texto livre (ex: Descrição, Categoria).
2. **Moeda (`number`)**: Formatação numérica e somatório financeiro com duas casas decimais. Receitas são deduzidas pelo campo de seleção `tipo` (Entrada/Saída), ou valores positivos/negativos.
3. **Seletor de Opções (`select`)**: Lista suspensa inline para seleção rápida (ex: Tipo ("Entrada" / "Saída")).
4. **Data (`date`)**: Campo de seleção de data integrado reativo e coerente com o mês logado.

---

## 3. UI / UX & Estrutura de Componentes

A interface é construída utilizando **React, Tailwind CSS e Lucide-react**, oferecendo um visual monocromático sofisticado focado em dados e dashboards robustos.

### Componentes Principais:
1. **App.tsx (Raiz)**: 
   * Mantém o estado global de colunas (`columns`) e linhas (`rows`) em exibição.
   * Coordena a mudança de meses e gerencia a pilha de histórico histórico de ações (Undo/Redo) com profundidade máxima de 50 ações para preservação de heap.
   * Calcula a agregação das receitas, despesas e saldo líquido por meio do helper `/src/utils/financeHelper.ts`.
2. **KPICard.tsx**:
   * Exibe informações consolidadas: **Entradas**, **Saídas** e **Saldo líquido**.
   * Estilização reativa (variantes 'green', 'red' e 'mixed') com ícones direcionais.
3. **Spreadsheet.tsx**:
   * Renderiza a tabela do Excel interativa.
   * Permite adição de colunas dinâmicas via modal dedicado.
   * Oferece remoção de colunas através de um gerenciador moderno (com confirmação inline não-bloqueante no lugar de `window.confirm` tradicionais).
   * Incorpora busca textual instantânea que filtra os registros visuais sem alterá-los de volta no localStorage.
   * Permite reordenação de colunas, duplicação e exclusão de linhas individualmente.

---

## 4. Persistência de Dados e Chaves no LocalStorage

Nenhum dado é misturado. As chaves de persistência são divididas cirurgicamente:

| Chave | Conteúdo | Escopo |
| :--- | :--- | :--- |
| `columns_config` | Vetor JSON descritivo da estrutura de colunas atual da tabela. | Global (comum para todos os meses) |
| `theme` | Versão de estilo de cor preferida do usuário ("dark" ou "light"). | Global |
| `rows_table_<YYYY-MM>` | Vetor de objetos do tipo `Row` contendo ID e dicionário de dados específico daquele período. | Local ao Mês-Ano |

---

## 5. Histórico e Controle de Transações (Undo / Redo)

* A cada alteração realizada em células, adição/remoção de linhas ou configuração de colunas, um novo estado é inserido na pilha histórica.
* Os botões "Desfazer" e "Refazer" operam de forma isolada e local para o respectivo mês sob edição, garantindo consistência operacional sem cross-contamination.
