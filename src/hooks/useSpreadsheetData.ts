import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Column, Row } from '../types';
import {
  loadColumns as loadRemoteColumns,
  saveColumns as saveRemoteColumns,
  loadMonthRows as loadRemoteMonthRows,
  saveMonthRows as saveRemoteMonthRows,
  ensureMonthTable,
  migrateLocalStorageToSupabase,
} from '../lib/dataAccess';
import { useRealtime } from './useRealtime';
import { debounce } from '../utils/debounce';
import {
  loadColumns as loadLocalColumns,
  saveColumns as saveLocalColumns,
  loadMonthRows as loadLocalMonthRows,
  saveMonthRows as saveLocalMonthRows,
} from '../utils/storage';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

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

  const lastLocalUpdate = useRef<number>(0);
  const isLocalChange = useRef<boolean>(false);

  const fetchAndSet = useCallback(async (uid: string, m: string) => {
    const remoteRows = await loadRemoteMonthRows(uid, m);
    if (remoteRows) {
      setRows(remoteRows);
      saveLocalMonthRows(m, remoteRows);
    } else {
      setRows([]);
    }
  }, []);

  const onRealtimeChange = useCallback(() => {
    if (!userId) return;
    if (isLocalChange.current) {
      isLocalChange.current = false;
      return;
    }
    if (Date.now() - lastLocalUpdate.current < 1000) return;
    fetchAndSet(userId, month);
  }, [userId, month, fetchAndSet]);

  useRealtime({ userId, month, onRowsChange: onRealtimeChange });

  const debouncedSave = useMemo(
    () => debounce(async (uid: string, m: string, cols: Column[], r: Row[]) => {
      try {
        await saveRemoteColumns(uid, cols);
        await saveRemoteMonthRows(uid, m, r);
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch {
        setSyncStatus('offline');
        try {
          const raw = localStorage.getItem('pending_sync');
          const pending = raw ? JSON.parse(raw) : {};
          pending[`${uid}:${m}`] = { columns: cols, rows: r, ts: Date.now() };
          localStorage.setItem('pending_sync', JSON.stringify(pending));
        } catch {
          /* storage full or corrupted — discard pending */
        }
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
      isLocalChange.current = true;
      lastLocalUpdate.current = Date.now();
      saveLocalColumns(newCols);
      saveLocalMonthRows(month, newRows);
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
        await migrateLocalStorageToSupabase(userId);

        const remoteColumns = await loadRemoteColumns(userId);
        if (remoteColumns && remoteColumns.length > 0) {
          setColumns(remoteColumns);
          saveLocalColumns(remoteColumns);
        } else {
          setColumns([]);
        }

        await ensureMonthTable(month);
        await fetchAndSet(userId, month);

        if (remoteColumns && remoteColumns.length === 0) {
          // columns will be set by the parent via setColumns after init
        }
      } catch {
        const localCols = loadLocalColumns();
        if (localCols) setColumns(localCols);
        const localRows = loadLocalMonthRows(month);
        setRows(localRows ?? []);
      } finally {
        setDataLoaded(true);
      }
    };

    init();
  }, [userId]);

  useEffect(() => {
    if (!dataLoaded || !userId) return;
    ensureMonthTable(month).then(() => fetchAndSet(userId, month));
  }, [month, dataLoaded, userId, fetchAndSet]);

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
