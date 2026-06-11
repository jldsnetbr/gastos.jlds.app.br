import { describe, it, expect } from 'vitest';
import { calculateSummary } from '../financeHelper';
import type { Column, Row } from '../../types';
import { formatCurrency } from '../format';

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

  it('handles NaN values gracefully', () => {
    const rows: Row[] = [
      { id: '1', month: '2026-06', data: { tipo: 'Entrada', valor: NaN } },
      { id: '2', month: '2026-06', data: { tipo: 'Saída', valor: 300 } },
    ];
    const result = calculateSummary(columns, rows);
    expect(result.entradas).toBe(0);
    expect(result.saidas).toBe(300);
    expect(result.saldo).toBe(-300);
  });

  it('handles undefined and null values', () => {
    const rows: Row[] = [
      { id: '1', month: '2026-06', data: { tipo: 'Entrada', valor: undefined } },
      { id: '2', month: '2026-06', data: { tipo: 'Saída', valor: null } },
    ] as unknown as Row[];
    const result = calculateSummary(columns, rows);
    expect(result.entradas).toBe(0);
    expect(result.saidas).toBe(0);
    expect(result.saldo).toBe(0);
  });

  it('recognizes different outflow labels', () => {
    const rows: Row[] = [
      { id: '1', month: '2026-06', data: { tipo: 'despesa', valor: 200 } },
      { id: '2', month: '2026-06', data: { tipo: 'gasto', valor: 150 } },
      { id: '3', month: '2026-06', data: { tipo: 'saída', valor: 100 } },
      { id: '4', month: '2026-06', data: { tipo: 'outflow', valor: 50 } },
    ];
    const result = calculateSummary(columns, rows);
    expect(result.entradas).toBe(0);
    expect(result.saidas).toBe(500);
  });

  it('recognizes different inflow labels', () => {
    const rows: Row[] = [
      { id: '1', month: '2026-06', data: { tipo: 'receita', valor: 5000 } },
      { id: '2', month: '2026-06', data: { tipo: 'ganho', valor: 300 } },
      { id: '3', month: '2026-06', data: { tipo: 'inflow', valor: 200 } },
    ];
    const result = calculateSummary(columns, rows);
    expect(result.entradas).toBe(5500);
    expect(result.saidas).toBe(0);
  });

  it('handles large numbers without precision loss', () => {
    const rows: Row[] = [
      { id: '1', month: '2026-06', data: { tipo: 'Entrada', valor: 9999999.99 } },
      { id: '2', month: '2026-06', data: { tipo: 'Saída', valor: 0.01 } },
    ];
    const result = calculateSummary(columns, rows);
    expect(result.entradas).toBe(9999999.99);
    expect(result.saidas).toBe(0.01);
    expect(result.saldo).toBe(9999999.98);
  });

  it('uses the first valor column when multiple number columns exist', () => {
    const cols: Column[] = [
      { id: 'tipo', name: 'Tipo', type: 'select', options: ['Entrada', 'Saída'] },
      { id: 'valor', name: 'Valor', type: 'number' },
      { id: 'desconto', name: 'Desconto', type: 'number' },
    ];
    const rows: Row[] = [
      { id: '1', month: '2026-06', data: { tipo: 'Entrada', valor: 3000, desconto: 100 } },
    ];
    const result = calculateSummary(cols, rows);
    expect(result.entradas).toBe(3000);
    expect(result.saidas).toBe(0);
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

  it('formats negative values', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('-');
  });

  it('formats large values with thousands separator', () => {
    const result = formatCurrency(1234567.89);
    expect(result).toContain('.');
  });
});
