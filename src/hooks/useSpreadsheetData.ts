import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Column, Row } from '../types';
import {
  loadColumns as loadRemoteColumns,
  saveColumns as saveRemoteColumns,
  loadMonthRows as loadRemoteMonthRows,
  saveMonthRows as saveRemoteMonthRows,
} from '../lib/dataAccess';
import { debounce } from '../utils/debounce';
import { subscribeToMonth, type RealtimeEventType } from './useRealtime';

const DEFAULT_COLUMNS: Column[] = [
  { id: 'date', name: 'Data', type: 'date' },
  { id: 'desc', name: 'Descrição', type: 'text' },
  { id: 'type', name: 'Tipo', type: 'select', options: ['Entrada', 'Saída'] },
  { id: 'amount', name: 'Valor', type: 'number' },
  { id: 'status', name: 'Status', type: 'select', options: ['Pendente', 'Pago'] },
];

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
  const initializedUsersRef = useRef<Set<string>>(new Set());
  const skipNextColumnsRef = useRef(false);

  // ── Refs para evitar stale closures ──
  const columnsRef = useRef<Column[]>(columns);
  const rowsRef = useRef<Row[]>(rows);
  useEffect(() => { columnsRef.current = columns; }, [columns]);
  useEffect(() => { rowsRef.current = rows; }, [rows]);

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
      skipNextColumnsRef.current = true;
      setSyncStatus('saving');
      debouncedSave(userId, month, newCols, newRows);
    },
    [userId, month, debouncedSave]
  );

  // ── Init ──
  useEffect(() => {
    if (!userId) return;

    const init = async () => {
      try {
        const remoteColumns = await loadRemoteColumns(userId);

        if (remoteColumns === null) {
          if (!initializedUsersRef.current.has(userId)) {
            setColumns(DEFAULT_COLUMNS);
            await saveRemoteColumns(userId, DEFAULT_COLUMNS);
            initializedUsersRef.current.add(userId);
          }
        } else if (remoteColumns.length === 0 && !initializedUsersRef.current.has(userId)) {
          setColumns(DEFAULT_COLUMNS);
          await saveRemoteColumns(userId, DEFAULT_COLUMNS);
          initializedUsersRef.current.add(userId);
        } else {
          setColumns(remoteColumns);
          initializedUsersRef.current.add(userId);
        }

        // rows table is always available — no ensureMonthTable needed
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

  // ── Realtime ──
  useEffect(() => {
    if (!dataLoaded || !userId) return;

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
      skipNextColumnsRef,
    });

    return () => unsubscribe();
  }, [month, dataLoaded, userId]);

  const refresh = useCallback(async () => {
    if (userId) await fetchAndSet(userId, month);
  }, [userId, month, fetchAndSet]);

  // ── Setters sem stale closure (lêem dos refs) ──
  const setColumnsAndSync = useCallback((cols: Column[]) => {
    setColumns(cols);
    columnsRef.current = cols;
    updateRemote(cols, rowsRef.current);
  }, [updateRemote]);

  const setRowsAndSync = useCallback((r: Row[]) => {
    setRows(r);
    rowsRef.current = r;
    updateRemote(columnsRef.current, r);
  }, [updateRemote]);

  return {
    columns,
    rows,
    dataLoaded,
    syncStatus,
    setColumns: setColumnsAndSync,
    setRows: setRowsAndSync,
    refresh,
  };
}
