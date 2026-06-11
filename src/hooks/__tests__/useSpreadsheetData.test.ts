import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSpreadsheetData } from '../useSpreadsheetData';
import type { Column, Row } from '../../types';
import * as dataAccess from '../../lib/dataAccess';

vi.mock('../../lib/dataAccess', () => ({
  loadColumns: vi.fn(),
  saveColumns: vi.fn(),
  loadMonthRows: vi.fn(),
  saveMonthRows: vi.fn(),
  ensureMonthTable: vi.fn(),
}));

vi.mock('../useRealtime', () => ({
  subscribeToMonth: vi.fn(() => () => {}),
}));

vi.mock('../../utils/debounce', () => ({
  debounce: vi.fn((fn: (...args: unknown[]) => unknown) => {
    const d = (...args: unknown[]) => fn(...args);
    d.cancel = vi.fn();
    return d;
  }),
}));

const mockColumn: Column = { id: 'c1', name: 'Valor', type: 'number' };
const mockRow: Row = { id: 'r1', month: '2026-06', data: { c1: 100 } };

describe('useSpreadsheetData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dataAccess.loadColumns).mockResolvedValue([mockColumn]);
    vi.mocked(dataAccess.loadMonthRows).mockResolvedValue([mockRow]);
    vi.mocked(dataAccess.ensureMonthTable).mockResolvedValue(undefined);
    vi.mocked(dataAccess.saveColumns).mockResolvedValue(undefined);
    vi.mocked(dataAccess.saveMonthRows).mockResolvedValue(undefined);
  });

  it('returns initial state when userId is undefined', () => {
    const { result } = renderHook(() => useSpreadsheetData(undefined, '2026-06'));

    expect(result.current.columns).toEqual([]);
    expect(result.current.rows).toEqual([]);
    expect(result.current.dataLoaded).toBe(false);
    expect(result.current.syncStatus).toBe('idle');
  });

  it('loads existing columns from remote without re-adding defaults', async () => {
    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    expect(result.current.columns.length).toBe(1);
    expect(result.current.columns[0]).toEqual(mockColumn);
    expect(result.current.rows).toEqual([mockRow]);
  });

  it('adds default columns for new users when remote returns null', async () => {
    vi.mocked(dataAccess.loadColumns).mockResolvedValue(null);

    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    expect(result.current.columns.length).toBe(5);
    expect(result.current.columns.map((c) => c.id)).toEqual(['date', 'desc', 'type', 'amount', 'status']);
  });

  it('sets empty arrays when remote calls fail', async () => {
    vi.mocked(dataAccess.loadColumns).mockRejectedValue(new Error('network'));
    vi.mocked(dataAccess.loadMonthRows).mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    expect(result.current.columns).toEqual([]);
    expect(result.current.rows).toEqual([]);
  });

  it('setColumns triggers remote save', async () => {
    const newColumn: Column = { id: 'c2', name: 'Novo', type: 'text' };

    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    act(() => {
      result.current.setColumns([newColumn]);
    });

    expect(result.current.columns).toEqual([newColumn]);
    expect(vi.mocked(dataAccess.saveColumns)).toHaveBeenCalledWith('user1', [newColumn]);
  });

  it('setRows triggers remote save', async () => {
    const newRow: Row = { id: 'r2', month: '2026-06', data: { c1: 200 } };

    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    act(() => {
      result.current.setRows([newRow]);
    });

    expect(result.current.rows).toEqual([newRow]);
    await waitFor(() => {
      expect(vi.mocked(dataAccess.saveMonthRows)).toHaveBeenCalledWith('user1', '2026-06', [newRow]);
    });
  });

  it('sets syncStatus to offline when save fails', async () => {
    vi.mocked(dataAccess.saveColumns).mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    act(() => {
      result.current.setColumns([{ id: 'c2', name: 'Novo', type: 'text' }]);
    });

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('offline');
    });
  });
});
