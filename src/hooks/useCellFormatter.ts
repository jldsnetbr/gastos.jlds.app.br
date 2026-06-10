import { useMemo } from 'react';
import { Column, Row } from '../types';

const SAIDA_LABELS = ['saída', 'saida', 'despesa'];
const ENTRADA_LABELS = ['entrada', 'receita', 'ganho'];

function isEntrada(val: string): boolean {
  const lower = val.toLowerCase();
  return ENTRADA_LABELS.some((l) => lower.includes(l));
}

function isSaida(val: string): boolean {
  const lower = val.toLowerCase();
  return SAIDA_LABELS.some((l) => lower.includes(l));
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function getTipoColumnId(columns: Column[]): string | null {
  const tipoCol = columns.find(
    (c) => c.type === 'select' && (c.name.toLowerCase().includes('tipo') || c.id === 'tipo')
  );
  return tipoCol?.id ?? null;
}

export interface CellFormatResult {
  text: string;
  color: 'emerald' | 'rose' | 'slate' | 'placeholder';
}

export interface CellFormatter {
  formatNumber: (value: string | number, row: Row) => CellFormatResult;
  formatSelect: (value: string | number) => CellFormatResult;
  formatText: (value: string | number) => CellFormatResult;
}

export function useCellFormatter(columns: Column[]): CellFormatter {
  return useMemo(() => {
    const tipoColId = getTipoColumnId(columns);

    return {
      formatNumber(value, row) {
        const num = Number(value);
        const tipoVal = tipoColId ? String(row.data[tipoColId] || '').toLowerCase() : '';
        const isExpense = isSaida(tipoVal);
        const color: CellFormatResult['color'] = isExpense ? 'rose' : num >= 0 ? 'emerald' : 'rose';
        const sign = num < 0 ? '-' : '';
        return { text: `${sign}${currencyFormatter.format(Math.abs(num))}`, color };
      },

      formatSelect(value) {
        const strVal = String(value);
        if (isEntrada(strVal)) return { text: strVal, color: 'emerald' };
        if (isSaida(strVal)) return { text: strVal, color: 'rose' };
        return { text: strVal || '-', color: 'slate' };
      },

      formatText(value) {
        const text = String(value);
        return text ? { text, color: 'slate' } : { text: 'vazio', color: 'placeholder' };
      },
    };
  }, [columns]);
}
