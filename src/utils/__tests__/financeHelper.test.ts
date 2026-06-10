import { describe, it, expect } from 'vitest';
import { calculateSummary } from '../financeHelper';
import { Column, Row } from '../../types';
import { formatCurrency } from '../../hooks/useCellFormatter';

describe('calculateSummary', () => {
  const columns: Column[] = [
    { id: 'tipo', name: 'Tipo', type: 'select', options: ['Entrada', 'Saída'] },
    { id: 'valor', name: 'Valor', type: 'number' },
  ];

  it('calculates entradas and saidas correctly', () => {
    const rows: Row[] = [
      { id: '1', month: '2026-06', data: { tipo: 'Entrada', valor: 5000 } },
      { id: '2', month: '2026-06', data: { tipo: 'Saída', valor: 1500 } },
      { id: '3', month: '2026-06', data: { tipo: 'Entrada', valor: 750 } },
    ];
    const result = calculateSummary(columns, rows);
    expect(result.entradas).toBe(5750);
    expect(result.saidas).toBe(1500);
    expect(result.saldo).toBe(4250);
  });

  it('returns zeros when no rows', () => {
    const result = calculateSummary(columns, []);
    expect(result.entradas).toBe(0);
    expect(result.saidas).toBe(0);
    expect(result.saldo).toBe(0);
  });

  it('returns zeros when no number columns', () => {
    const cols: Column[] = [{ id: 'desc', name: 'Descrição', type: 'text' }];
    const rows: Row[] = [{ id: '1', month: '2026-06', data: { desc: 'test' } }];
    const result = calculateSummary(cols, rows);
    expect(result.entradas).toBe(0);
    expect(result.saidas).toBe(0);
    expect(result.saldo).toBe(0);
  });

  it('handles string number values', () => {
    const rows: Row[] = [
      { id: '1', month: '2026-06', data: { tipo: 'Entrada', valor: '3000' } },
      { id: '2', month: '2026-06', data: { tipo: 'Saída', valor: '800.50' } },
    ];
    const result = calculateSummary(columns, rows);
    expect(result.entradas).toBe(3000);
    expect(result.saidas).toBeCloseTo(800.50);
    expect(result.saldo).toBeCloseTo(2199.50);
  });

  it('falls back to sign when no type column matches', () => {
    const cols: Column[] = [{ id: 'valor', name: 'Valor', type: 'number' }];
    const rows: Row[] = [
      { id: '1', month: '2026-06', data: { valor: 1000 } },
      { id: '2', month: '2026-06', data: { valor: -500 } },
    ];
    const result = calculateSummary(cols, rows);
    expect(result.entradas).toBe(1000);
    expect(result.saidas).toBe(500);
    expect(result.saldo).toBe(500);
  });
});

describe('formatCurrency', () => {
  it('formats BRL correctly', () => {
    const result = formatCurrency(1500.50);
    expect(result).toContain('1.500');
    expect(result).toContain('50');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });
});
