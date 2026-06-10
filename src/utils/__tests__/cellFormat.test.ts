import { describe, it, expect } from 'vitest';
import { Column, Row } from '../../types';
import { formatNumberCell, formatSelectCell, formatTextCell } from '../cellFormat';

const columns: Column[] = [
  { id: 'valor', name: 'Valor', type: 'number' },
  { id: 'tipo', name: 'Tipo', type: 'select', options: ['Entrada', 'Saída'] },
];

const row = (data: Record<string, string | number>): Row => ({
  id: 'r1',
  month: '2026-06',
  data,
});

describe('formatNumberCell', () => {
  it('formats positive number with emerald color', () => {
    const r = row({ valor: 100, tipo: 'Entrada' });
    const { text, color } = formatNumberCell(100, r, columns);
    expect(text).toMatch(/100/);
    expect(color).toBe('emerald');
  });

  it('formats negative number with rose color', () => {
    const r = row({ valor: -50, tipo: 'Saída' });
    const { text, color } = formatNumberCell(-50, r, columns);
    expect(text).toContain('-');
    expect(text).toMatch(/50/);
    expect(color).toBe('rose');
  });

  it('marks expense (Saída) as rose', () => {
    const r = row({ valor: 200, tipo: 'Saída' });
    const { color } = formatNumberCell(200, r, columns);
    expect(color).toBe('rose');
  });
});

describe('formatSelectCell', () => {
  it('marks Entrada as emerald', () => {
    expect(formatSelectCell('Entrada').color).toBe('emerald');
  });

  it('marks Saída as rose', () => {
    expect(formatSelectCell('Saída').color).toBe('rose');
  });

  it('returns slate for unknown values', () => {
    expect(formatSelectCell('Outro').color).toBe('slate');
  });
});

describe('formatTextCell', () => {
  it('returns text for non-empty', () => {
    expect(formatTextCell('hello')).toEqual({ text: 'hello', isEmpty: false });
  });

  it('returns vazio for empty', () => {
    expect(formatTextCell('')).toEqual({ text: 'vazio', isEmpty: true });
  });
});
