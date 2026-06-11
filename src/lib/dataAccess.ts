import { Column, ColumnType, Row } from '../types';
import { getMonthTableName } from './tableNames';
import {
  loadColumns as localLoadColumns,
  saveColumns as localSaveColumns,
  loadMonthRows as localLoadMonthRows,
  saveMonthRows as localSaveMonthRows,
  ensureMonthTable as localEnsureMonthTable,
} from './localDataAccess';

const isLocalMode = import.meta.env.VITE_LOCAL_MODE === 'true';

export async function loadColumns(userId: string): Promise<Column[] | null> {
  if (isLocalMode) return localLoadColumns(userId);

  const { supabase } = await import('./supabase');
  const { data, error } = await supabase
    .from('user_columns')
    .select('column_id, name, type, options, sort_order')
    .eq('user_id', userId)
    .order('sort_order');

  if (error || !data || data.length === 0) return null;
  return data.map((r: Record<string, unknown>) => ({
    id: r.column_id as string,
    name: r.name as string,
    type: r.type as ColumnType,
    options: Array.isArray(r.options) ? (r.options as string[]) : undefined,
  }));
}

export async function saveColumns(userId: string, columns: Column[]): Promise<void> {
  if (isLocalMode) return localSaveColumns(userId, columns);

  const { supabase } = await import('./supabase');
  try {
    const { data: existing } = await supabase
      .from('user_columns')
      .select('column_id')
      .eq('user_id', userId);

    const existingIds = new Set((existing ?? []).map((r: Record<string, unknown>) => r.column_id as string));
    const incomingIds = new Set(columns.map((c) => c.id));

    const toDelete = [...existingIds].filter((id): id is string => !incomingIds.has(id));
    if (toDelete.length > 0) {
      await supabase
        .from('user_columns')
        .delete()
        .eq('user_id', userId)
        .in('column_id', toDelete);
    }

    if (columns.length > 0) {
      const toUpsert = columns.map((col, i) => ({
        user_id: userId,
        column_id: col.id,
        name: col.name,
        type: col.type,
        options: col.options ?? null,
        sort_order: i,
      }));
      await supabase
        .from('user_columns')
        .upsert(toUpsert, { onConflict: 'user_id,column_id' });
    }
  } catch (err) {
    console.warn('saveColumns failed:', err);
  }
}

export async function ensureMonthTable(month: string): Promise<void> {
  if (isLocalMode) return localEnsureMonthTable(month);

  const { supabase } = await import('./supabase');
  await supabase.rpc('ensure_month_table', { month_key: month });
}

export async function loadMonthRows(userId: string, month: string): Promise<Row[] | null> {
  if (isLocalMode) return localLoadMonthRows(userId, month);

  const { supabase } = await import('./supabase');
  const tableName = getMonthTableName(month);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qb = (supabase as any).from(tableName);
  const { data, error } = await qb
    .select('row_id, data')
    .eq('user_id', userId);

  if (error) return null;
  if (!data || data.length === 0) return null;
  return data.map((r: Record<string, unknown>) => ({
    id: r.row_id as string,
    month,
    data: r.data as Row['data'],
  }));
}

export async function saveMonthRows(userId: string, month: string, rows: Row[]): Promise<void> {
  if (isLocalMode) return localSaveMonthRows(userId, month, rows);

  const { supabase } = await import('./supabase');
  const tableName = getMonthTableName(month);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qb = (supabase as any).from(tableName);

  try {
    const { data: existing } = await qb
      .select('row_id')
      .eq('user_id', userId);

    const existingRows: string[] = ((existing ?? []) as Record<string, unknown>[]).map(
      (r) => r.row_id as string,
    );
    const incomingIds = new Set(rows.map((r) => r.id));
    const toDelete = existingRows.filter((id) => !incomingIds.has(id));
    if (toDelete.length > 0) {
      await qb
        .delete()
        .eq('user_id', userId)
        .in('row_id', toDelete);
    }

    if (rows.length > 0) {
      const toUpsert = rows.map((r) => ({
        user_id: userId,
        row_id: r.id,
        data: r.data,
      }));
      await qb
        .upsert(toUpsert, { onConflict: 'user_id,row_id' });
    }
  } catch (err) {
    console.warn('saveMonthRows failed:', err);
  }
}
