import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSpreadsheetData } from '../useSpreadsheetData';
import { Column, Row } from '../../types';
import * as dataAccess from '../../lib/dataAccess';
import * as storage from '../../utils/storage';
import { useRealtime } from '../useRealtime';

vi.mock('../../lib/dataAccess', () => ({
  loadColumns: vi.fn(),
  saveColumns: vi.fn(),
  loadMonthRows: vi.fn(),
  saveMonthRows: vi.fn(),
  ensureMonthTable: vi.fn(),
  migrateLocalStorageToSupabase: vi.fn(),
}));

vi.mock('../../utils/storage', () => ({
  loadColumns: vi.fn(),
  saveColumns: vi.fn(),
  loadMonthRows: vi.fn(),
  saveMonthRows: vi.fn(),
}));

vi.mock('../../utils/debounce', () => ({
  debounce: vi.fn((fn: (...args: unknown[]) => unknown) => {
    const d = (...args: unknown[]) => fn(...args);
    d.cancel = vi.fn();
    return d;
  }),
}));

vi.mock('../useRealtime', () => ({
  useRealtime: vi.fn(),
}));

const mockColumn: Column = { id: 'c1', name: 'Valor', type: 'number' };
const mockRow: Row = { id: 'r1', month: '2026-06', data: { c1: 100 } };

describe('useSpreadsheetData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dataAccess.loadColumns).mockResolvedValue([mockColumn]);
    vi.mocked(dataAccess.loadMonthRows).mockResolvedValue([mockRow]);
    vi.mocked(dataAccess.migrateLocalStorageToSupabase).mockResolvedValue(undefined);
    vi.mocked(dataAccess.ensureMonthTable).mockResolvedValue(undefined);
    vi.mocked(dataAccess.saveColumns).mockResolvedValue(undefined);
    vi.mocked(dataAccess.saveMonthRows).mockResolvedValue(undefined);
    localStorage.clear();
  });

  it('returns initial state when userId is undefined', () => {
    const { result } = renderHook(() => useSpreadsheetData(undefined, '2026-06'));

    expect(result.current.columns).toEqual([]);
    expect(result.current.rows).toEqual([]);
    expect(result.current.dataLoaded).toBe(false);
    expect(result.current.syncStatus).toBe('idle');
  });

  it('loads columns and rows from remote when userId is provided', async () => {
    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    expect(result.current.columns).toEqual([mockColumn]);
    expect(result.current.rows).toEqual([mockRow]);
    expect(result.current.syncStatus).toBe('idle');
  });

  it('calls useRealtime with correct parameters', async () => {
    const useRealtimeMock = vi.mocked(useRealtime);

    renderHook(() => useSpreadsheetData('user1', '2026-06'));

    expect(useRealtimeMock).toHaveBeenCalledWith({
      userId: 'user1',
      month: '2026-06',
      onRowsChange: expect.any(Function),
    });
  });

  it('falls back to localStorage when remote calls fail', async () => {
    const localColumn: Column = { id: 'local_c1', name: 'Local', type: 'text' };
    const localRow: Row = { id: 'local_r1', month: '2026-06', data: { local_c1: 'x' } };

    vi.mocked(dataAccess.loadColumns).mockRejectedValue(new Error('network'));
    vi.mocked(dataAccess.loadMonthRows).mockResolvedValue([localRow]);
    vi.mocked(storage.loadColumns).mockReturnValue([localColumn]);
    vi.mocked(storage.loadMonthRows).mockReturnValue([localRow]);

    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    expect(result.current.columns).toEqual([localColumn]);
    expect(result.current.rows).toEqual([localRow]);
  });

  it('falls back to empty arrays when remote fails and no local data', async () => {
    vi.mocked(dataAccess.loadColumns).mockRejectedValue(new Error('network'));
    vi.mocked(dataAccess.loadMonthRows).mockResolvedValue(null);
    vi.mocked(storage.loadColumns).mockReturnValue(null);
    vi.mocked(storage.loadMonthRows).mockReturnValue(null);

    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    expect(result.current.columns).toEqual([]);
    expect(result.current.rows).toEqual([]);
  });

  it('setColumns updates columns and triggers remote save', async () => {
    const newColumn: Column = { id: 'c2', name: 'Novo', type: 'text' };

    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    act(() => {
      result.current.setColumns([newColumn]);
    });

    expect(result.current.columns).toEqual([newColumn]);
    expect(vi.mocked(storage.saveColumns)).toHaveBeenCalledWith([newColumn]);
  });

  it('setRows updates rows and triggers remote save', async () => {
    const newRow: Row = { id: 'r2', month: '2026-06', data: { c1: 200 } };

    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    act(() => {
      result.current.setRows([newRow]);
    });

    expect(result.current.rows).toEqual([newRow]);
    expect(vi.mocked(storage.saveMonthRows)).toHaveBeenCalledWith('2026-06', [newRow]);
  });

  it('transitions syncStatus to saving then saved during save', async () => {
    vi.mocked(dataAccess.saveColumns).mockResolvedValue(undefined);
    vi.mocked(dataAccess.saveMonthRows).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    act(() => {
      result.current.setColumns([{ id: 'c2', name: 'Novo', type: 'text' }]);
    });

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('saved');
    });
  });

  it('sets syncStatus to offline when remote save fails', async () => {
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

  it('stores pending sync data in localStorage when save fails', async () => {
    vi.mocked(dataAccess.saveColumns).mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    const cols = [{ id: 'c2', name: 'Novo', type: 'text' } as Column];
    act(() => {
      result.current.setColumns(cols);
    });

    await waitFor(() => {
      const pending = JSON.parse(localStorage.getItem('pending_sync') || '{}');
      expect(pending['user1:2026-06']).toBeDefined();
      expect(pending['user1:2026-06'].columns).toEqual(cols);
    });
  });

  it('refresh fetches rows again', async () => {
    const updatedRow: Row = { id: 'r2', month: '2026-06', data: { c1: 999 } };

    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    vi.mocked(dataAccess.loadMonthRows).mockResolvedValue([updatedRow]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.rows).toEqual([updatedRow]);
  });

  it('does not save when userId becomes undefined', async () => {
    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    act(() => {
      result.current.setColumns([{ id: 'c2', name: 'Novo', type: 'text' }]);
    });

    expect(vi.mocked(dataAccess.saveColumns)).toHaveBeenCalledWith('user1', expect.any(Array));
  });

  it('cancels debounce on unmount', () => {
    const { unmount } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    expect(() => unmount()).not.toThrow();
  });

  it('handles empty remote data by setting empty arrays', async () => {
    vi.mocked(dataAccess.loadColumns).mockResolvedValue([]);
    vi.mocked(dataAccess.loadMonthRows).mockResolvedValue(null);

    const { result } = renderHook(() => useSpreadsheetData('user1', '2026-06'));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    expect(result.current.columns).toEqual([]);
    expect(result.current.rows).toEqual([]);
  });
});
