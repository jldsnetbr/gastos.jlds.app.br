import type { Column, Row } from '../types';

export interface FinanceSummary {
  entradas: number;
  saidas: number;
  saldo: number;
}

/**
 * Dynamically parses positive (Entradas) and negative (Saídas) sums from spreadsheet data.
 * Checks for columns of type 'number' and uses 'select' columns named "tipo" or containing "tipo"
 * to classify the cash flow when necessary, or falls back to standard positive/negative values.
 */
export function calculateSummary(columns: Column[], rows: Row[]): FinanceSummary {
  let entradas = 0;
  let saidas = 0;

  // Let's identify the primary value (number) and type (select) columns in the list
  const numberCols = columns.filter((c) => c.type === 'number');
  // Look for any select column that could represent Entry/Exit classification (e.g. named "tipo", "tipo de lançamento", "categoria")
  const typeCol = columns.find(
    (c) =>
      c.type === 'select' &&
      (c.name.toLowerCase().includes('tipo') || c.id.toLowerCase() === 'tipo')
  );

  // If no number columns exist, summary remains zero
  if (numberCols.length === 0) {
    return { entradas: 0, saidas: 0, saldo: 0 };
  }

  // We will assume the first number column found (or the one called 'valor'/'valor_total') is the primary money column.
  const valueCol = numberCols.find((c) => c.id === 'valor' || c.name.toLowerCase().includes('valor')) || numberCols[0];

  rows.forEach((row) => {
    const rawVal = row.data[valueCol.id];
    const num = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal || '0'));

    if (isNaN(num)) return;

    if (typeCol) {
      const typeVal = String(row.data[typeCol.id] || '').toLowerCase();
      
      // If the row is categorized as 'saida' or 'saída' or 'despesa'
      if (
        typeVal.includes('saida') ||
        typeVal.includes('saída') ||
        typeVal.includes('despesa') ||
        typeVal.includes('gasto') ||
        typeVal.includes('outflow')
      ) {
        saidas += Math.abs(num);
      } else if (
        typeVal.includes('entrada') ||
        typeVal.includes('receita') ||
        typeVal.includes('inflow') ||
        typeVal.includes('ganho')
      ) {
        entradas += Math.abs(num);
      } else {
        // Fallback to sign if no matched select option label
        if (num >= 0) {
          entradas += num;
        } else {
          saidas += Math.abs(num);
        }
      }
    } else {
      // No type column? Just use the sign of the primary value column
      if (num >= 0) {
        entradas += num;
      } else {
        saidas += Math.abs(num);
      }
    }
  });

  return {
    entradas,
    saidas,
    saldo: entradas - saidas,
  };
}


