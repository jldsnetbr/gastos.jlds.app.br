import type { Column, Row } from '../types';
import { formatCurrency } from './format';

const SAIDA_KEYWORDS = ['saida', 'saída', 'despesa', 'gasto', 'outflow'];
const ENTRADA_KEYWORDS = ['entrada', 'receita', 'ganho', 'inflow'];

function isEntrada(val: string): boolean {
  const lower = val.toLowerCase();
  return ENTRADA_KEYWORDS.some((k) => lower.includes(k));
}

function isSaida(val: string): boolean {
  const lower = val.toLowerCase();
  return SAIDA_KEYWORDS.some((k) => lower.includes(k));
}

function getTipoColumnId(columns: Column[]): string | null {
  return columns.find(
    (c) => c.type === 'select' && (c.name.toLowerCase().includes('tipo') || c.id === 'tipo'),
  )?.id ?? null;
}

export function formatNumberCell(value: string | number, row: Row, columns: Column[]): { text: string; color: 'emerald' | 'rose' } {
  const num = Number(value);
  const tipoColId = getTipoColumnId(columns);
  const tipoVal = tipoColId ? String(row.data[tipoColId] || '').toLowerCase() : '';
  const isExpense = isSaida(tipoVal);
  const color: 'emerald' | 'rose' = isExpense ? 'rose' : num >= 0 ? 'emerald' : 'rose';
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  const formatted = formatCurrency(abs);
  return { text: `${sign}${formatted}`, color };
}

export function formatSelectCell(value: string | number): { text: string; color: 'emerald' | 'rose' | 'slate' } {
  const strVal = String(value);
  if (isEntrada(strVal)) return { text: strVal, color: 'emerald' };
  if (isSaida(strVal)) return { text: strVal, color: 'rose' };
  return { text: strVal || '-', color: 'slate' };
}

export function formatTextCell(value: string | number): { text: string; isEmpty: boolean } {
  const text = String(value);
  return text ? { text, isEmpty: false } : { text: 'vazio', isEmpty: true };
}
