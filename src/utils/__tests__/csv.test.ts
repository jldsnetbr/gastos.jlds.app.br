import { describe, it, expect } from 'vitest';
import { parseCSV, toCSV } from '../csv';
import { Column } from '../../types';

describe('parseCSV', () => {
  it('parses CSV with headers and rows', () => {
    const csv = '"Data";"Descrição";"Tipo";"Valor"\n"2026-06-01";"Salário";"Entrada";"5000"\n"2026-06-03";"Aluguel";"Saída";"1500"';
    const result = parseCSV(csv, '2026-06');
    expect(result.columns).toHaveLength(4);
    expect(result.rows).toHaveLength(2);
    expect(result.columns[0].name).toBe('Data');
    expect(result.columns[0].type).toBe('date');
    expect(result.columns[2].type).toBe('select');
  });

  it('returns empty result for empty CSV', () => {
    const result = parseCSV('', '2026-06');
    expect(result.columns).toHaveLength(0);
    expect(result.rows).toHaveLength(0);
  });

  it('detects number columns from header names', () => {
    const csv = '"Valor Total";"Preço"\n"100";"200"';
    const result = parseCSV(csv, '2026-06');
    expect(result.columns[0].type).toBe('number');
    expect(result.columns[1].type).toBe('number');
  });

  it('coerces dates to selected month', () => {
    const csv = '"Data";"Valor"\n"2025-01-15";"100"';
    const result = parseCSV(csv, '2026-06');
    expect(result.rows[0].data[result.columns[0].id]).toBe('2026-06-15');
  });
});

describe('toCSV', () => {
  it('exports CSV with semicolon separator', () => {
    const columns: Column[] = [
      { id: 'desc', name: 'Descrição', type: 'text' },
      { id: 'valor', name: 'Valor', type: 'number' },
    ];
    const rows = [
      { id: '1', month: '2026-06', data: { desc: 'Salário', valor: 5000 } },
    ];
    const csv = toCSV(columns, rows);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('"Descrição";"Valor"');
    expect(lines[1]).toBe('"Salário";5000');
  });

  it('formats number values with comma', () => {
    const columns: Column[] = [{ id: 'val', name: 'Valor', type: 'number' }];
    const rows = [{ id: '1', month: '2026-06', data: { val: 1500.50 } }];
    const csv = toCSV(columns, rows);
    expect(csv).toContain('1500,5');
  });
});
