import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCellFormatter, formatCurrency, getTipoColumnId } from '../useCellFormatter';
import { Column, Row } from '../../types';

describe('formatCurrency', () => {
  it('formats BRL correctly', () => {
    const result = formatCurrency(1500.50);
    expect(result).toContain('1.500');
    expect(result).toContain('50');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0');
  });

  it('formats negative values', () => {
    const result = formatCurrency(-100);
    expect(result).toContain('100');
  });
});

describe('getTipoColumnId', () => {
  it('finds column by id "tipo"', () => {
    const cols: Column[] = [
      { id: 'desc', name: 'Descrição', type: 'text' },
      { id: 'tipo', name: 'Tipo', type: 'select', options: [] },
    ];
    expect(getTipoColumnId(cols)).toBe('tipo');
  });

  it('finds column by name containing "tipo"', () => {
    const cols: Column[] = [
      { id: 'cat', name: 'Tipo de Lançamento', type: 'select', options: [] },
    ];
    expect(getTipoColumnId(cols)).toBe('cat');
  });

  it('returns null when no tipo column', () => {
    const cols: Column[] = [{ id: 'desc', name: 'Descrição', type: 'text' }];
    expect(getTipoColumnId(cols)).toBeNull();
  });
});

describe('useCellFormatter', () => {
  const columns: Column[] = [
    { id: 'desc', name: 'Descrição', type: 'text' },
    { id: 'tipo', name: 'Tipo', type: 'select', options: ['Entrada', 'Saída'] },
    { id: 'valor', name: 'Valor', type: 'number' },
  ];

  it('formats positive number with emerald color', () => {
    const { result } = renderHook(() => useCellFormatter(columns));
    const row: Row = { id: 'r1', month: '2026-06', data: { valor: 1000, tipo: 'Entrada' } };
    const formatted = result.current.formatNumber(1000, row);
    expect(formatted.text).toContain('1.000');
    expect(formatted.color).toBe('emerald');
  });

  it('formats negative number with rose color', () => {
    const { result } = renderHook(() => useCellFormatter(columns));
    const row: Row = { id: 'r1', month: '2026-06', data: { valor: -500, tipo: 'Saída' } };
    const formatted = result.current.formatNumber(-500, row);
    expect(formatted.text).toContain('500');
    expect(formatted.color).toBe('rose');
  });

  it('formats saida value with rose color even when number is positive', () => {
    const { result } = renderHook(() => useCellFormatter(columns));
    const row: Row = { id: 'r1', month: '2026-06', data: { valor: 100, tipo: 'Saída' } };
    const formatted = result.current.formatNumber(100, row);
    expect(formatted.color).toBe('rose');
  });

  it('formats despesa as saida', () => {
    const { result } = renderHook(() => useCellFormatter(columns));
    const row: Row = { id: 'r1', month: '2026-06', data: { valor: 200, tipo: 'Despesa' } };
    const formatted = result.current.formatNumber(200, row);
    expect(formatted.color).toBe('rose');
  });

  it('formats number with no tipo column gracefully', () => {
    const colsNoTipo: Column[] = [{ id: 'valor', name: 'Valor', type: 'number' }];
    const { result } = renderHook(() => useCellFormatter(colsNoTipo));
    const row: Row = { id: 'r1', month: '2026-06', data: { valor: 100 } };
    const formatted = result.current.formatNumber(100, row);
    expect(formatted.text).toContain('100');
    expect(formatted.color).toBe('emerald');
  });

  it('formats entrada select with emerald', () => {
    const { result } = renderHook(() => useCellFormatter(columns));
    expect(result.current.formatSelect('Entrada')).toEqual({ text: 'Entrada', color: 'emerald' });
    expect(result.current.formatSelect('Receita')).toEqual({ text: 'Receita', color: 'emerald' });
  });

  it('formats saida select with rose', () => {
    const { result } = renderHook(() => useCellFormatter(columns));
    expect(result.current.formatSelect('Saída')).toEqual({ text: 'Saída', color: 'rose' });
    expect(result.current.formatSelect('Despesa')).toEqual({ text: 'Despesa', color: 'rose' });
  });

  it('formats unknown select with slate', () => {
    const { result } = renderHook(() => useCellFormatter(columns));
    expect(result.current.formatSelect('Outro')).toEqual({ text: 'Outro', color: 'slate' });
  });

  it('formats empty select as dash', () => {
    const { result } = renderHook(() => useCellFormatter(columns));
    expect(result.current.formatSelect('')).toEqual({ text: '-', color: 'slate' });
  });

  it('formats text value', () => {
    const { result } = renderHook(() => useCellFormatter(columns));
    expect(result.current.formatText('hello')).toEqual({ text: 'hello', color: 'slate' });
  });

  it('formats empty text as placeholder', () => {
    const { result } = renderHook(() => useCellFormatter(columns));
    expect(result.current.formatText('')).toEqual({ text: 'vazio', color: 'placeholder' });
  });
});
