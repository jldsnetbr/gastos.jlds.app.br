import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Column, Row } from '../types';
import {
  loadColumns as loadRemoteColumns,
  saveColumns as saveRemoteColumns,
  loadMonthRows as loadRemoteMonthRows,
  saveMonthRows as saveRemoteMonthRows,
  ensureMonthTable,
} from '../lib/dataAccess';
import { debounce } from '../utils/debounce';
import { subscribeToMonth, RealtimeEventType } from './useRealtime';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'offline';

interface UseSpreadsheetDataReturn {
  columns: Column[];
  rows: Row[];
  dataLoaded: boolean;
  syncStatus: SyncStatus;
  setColumns: (cols: Column[]) => void;
  setRows: (rows: Row[]) => void;
  refresh: () => Promise<void>;
}

const SAVE_DEBOUNCE_MS = 500;

export function useSpreadsheetData(
  userId: string | undefined,
  month: string
): UseSpreadsheetDataReturn {
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const monthRef = useRef(month);

  const fetchAndSet = useCallback(async (uid: string, m: string) => {
    try {
      const remoteRows = await loadRemoteMonthRows(uid, m);
      setRows(remoteRows ?? []);
    } catch (err) {
      console.warn('fetchRows failed:', err);
      /* silencioso: estado anterior preservado */
    }
  }, []);

  const debouncedSave = useMemo(
    () => debounce(async (uid: string, m: string, cols: Column[], r: Row[]) => {
      try {
        await saveRemoteColumns(uid, cols);
        await saveRemoteMonthRows(uid, m, r);
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (err) {
        console.warn('save failed:', err);
        setSyncStatus('offline');
      }
    }, SAVE_DEBOUNCE_MS),
    []
  );

  useEffect(() => {
    return () => debouncedSave.cancel?.();
  }, [debouncedSave]);

  const updateRemote = useCallback(
    (newCols: Column[], newRows: Row[]) => {
      if (!userId) return;
      setSyncStatus('saving');
      debouncedSave(userId, month, newCols, newRows);
    },
    [userId, month, debouncedSave]
  );

  useEffect(() => {
    if (!userId) {
      setDataLoaded(false);
      return;
    }

    const init = async () => {
      try {
        const remoteColumns = await loadRemoteColumns(userId);
        const existing = remoteColumns ?? [];

        const DEFAULT_COLUMNS: Column[] = [
          { id: 'date', name: 'Data', type: 'date' },
          { id: 'desc', name: 'Descrição', type: 'text' },
          { id: 'type', name: 'Tipo', type: 'select', options: ['Entrada', 'Saída'] },
          { id: 'amount', name: 'Valor', type: 'number' },
          { id: 'status', name: 'Status', type: 'select', options: ['Pendente', 'Pago'] },
        ];

        const existingIds = new Set(existing.map((c) => c.id));
        const missing = DEFAULT_COLUMNS.filter((c) => !existingIds.has(c.id));

        if (missing.length > 0) {
          const merged = [...existing, ...missing];
          setColumns(merged);
          await saveRemoteColumns(userId, merged);
        } else {
          setColumns(existing);
        }

        await ensureMonthTable(month);
        await fetchAndSet(userId, month);
      } catch (err) {
        console.warn('init failed:', err);
        setColumns([]);
        setRows([]);
      } finally {
        setDataLoaded(true);
      }
    };

    init();
  }, [userId, month, fetchAndSet]);

  useEffect(() => {
    if (!dataLoaded || !userId) return;

    monthRef.current = month;

    const handleRowEvent = (type: RealtimeEventType, row: Row) => {
      setRows((prev) => {
        if (type === 'INSERT') {
          if (prev.some((r) => r.id === row.id)) return prev;
          return [...prev, row];
        }
        if (type === 'UPDATE') {
          return prev.map((r) => (r.id === row.id ? row : r));
        }
        if (type === 'DELETE') {
          return prev.filter((r) => r.id !== row.id);
        }
        return prev;
      });
    };

    const unsubscribe = subscribeToMonth(userId, month, {
      onRowEvent: handleRowEvent,
      onColumnsChange: setColumns,
    });

    return () => {
      unsubscribe();
    };
  }, [month, dataLoaded, userId]);

  const refresh = useCallback(async () => {
    if (userId) await fetchAndSet(userId, month);
  }, [userId, month, fetchAndSet]);

  return {
    columns,
    rows,
    dataLoaded,
    syncStatus,
    setColumns: (cols) => { setColumns(cols); updateRemote(cols, rows); },
    setRows: (r) => { setRows(r); updateRemote(columns, r); },
    refresh,
  };
}
