import { supabase } from './supabase';
import { Column, Row } from '../types';
import { getMonthTableName } from './tableNames';
import {
  saveMonthRows as saveLocalMonthRows,
  loadMonthRows as loadLocalMonthRows,
  saveColumns as saveLocalColumns,
  loadColumns as loadLocalColumns,
} from '../utils/storage';

async function withRetry<T>(
  fn: () => PromiseLike<T>,
  retries = 2,
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, (i + 1) * 300));
    }
  }
  throw new Error('unreachable');
}

async function syncRemoteCollection<T>(
  tableName: string,
  items: T[],
  userId: string,
  getId: (item: T) => string,
  toRow: (item: T, index: number) => Record<string, unknown>,
  idColumn: string,
  conflictColumns: string,
  onLocalSave: (items: T[]) => void,
): Promise<void> {
  const incoming = new Map(items.map((item) => [getId(item), item]));

  const existingResult = await withRetry(async () =>
    supabase.from(tableName).select(idColumn).eq('user_id', userId),
  ) as { data: Array<Record<string, unknown>> | null };

  const existingIds = new Set(
    (existingResult.data ?? []).map((r: any) => r[idColumn]),
  );

  const toDelete: string[] = [];
  existingIds.forEach((id) => {
    if (!incoming.has(id)) toDelete.push(id);
  });

  const toUpsert = items.map((item, i) => ({ user_id: userId, ...toRow(item, i) }));

  if (toDelete.length > 0) {
    await withRetry(async () =>
      supabase.from(tableName).delete().eq('user_id', userId).in(idColumn, toDelete),
    );
  }

  if (toUpsert.length > 0) {
    await withRetry(async () =>
      supabase.from(tableName).upsert(toUpsert, { onConflict: conflictColumns }),
    );
  }

  onLocalSave(items);
}

export async function loadColumns(userId: string): Promise<Column[] | null> {
  const result = await withRetry(async () =>
    supabase
      .from('user_columns')
      .select('column_id, name, type, options, sort_order')
      .eq('user_id', userId)
      .order('sort_order'),
  ) as { data: Array<Record<string, unknown>> | null; error: unknown };

  if (result.error || !result.data || result.data.length === 0) return null;

  return result.data.map((r: any) => ({
    id: r.column_id,
    name: r.name,
    type: r.type as Column['type'],
    options: r.options as string[] | undefined,
  }));
}

export async function saveColumns(userId: string, columns: Column[]): Promise<void> {
  await syncRemoteCollection(
    'user_columns',
    columns,
    userId,
    (c) => c.id,
    (col, i) => ({
      column_id: col.id,
      name: col.name,
      type: col.type,
      options: col.options ?? null,
      sort_order: i,
    }),
    'column_id',
    'user_id,column_id',
    saveLocalColumns,
  );
}

export async function ensureMonthTable(month: string): Promise<void> {
  await withRetry(async () =>
    supabase.rpc('ensure_month_table', { month_key: month }),
  );
}

export async function loadMonthRows(userId: string, month: string): Promise<Row[] | null> {
  const tableName = getMonthTableName(month);

  const result = await withRetry(async () =>
    supabase
      .from(tableName)
      .select('row_id, data')
      .eq('user_id', userId),
  ) as { data: Array<Record<string, unknown>> | null; error: unknown };

  if (result.error) return null;
  if (!result.data || result.data.length === 0) return null;

  return result.data.map((r: any) => ({
    id: r.row_id,
    month,
    data: r.data as Row['data'],
  }));
}

export async function saveMonthRows(userId: string, month: string, rows: Row[]): Promise<void> {
  const tableName = getMonthTableName(month);

  await syncRemoteCollection(
    tableName,
    rows,
    userId,
    (r) => r.id,
    (r) => ({ row_id: r.id, data: r.data }),
    'row_id',
    'user_id,row_id',
    (items) => saveLocalMonthRows(month, items),
  );
}

function getAllLocalMonthKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('rows_table_')) {
      keys.push(key.replace('rows_table_', ''));
    }
  }
  return keys;
}

export async function migrateLocalStorageToSupabase(userId: string): Promise<void> {
  const migrated = localStorage.getItem('migrated_to_supabase');
  if (migrated) return;

  const localColumns = loadLocalColumns();
  if (localColumns) {
    await saveColumns(userId, localColumns);
  }

  const localMonths = getAllLocalMonthKeys();
  const failed: string[] = [];
  for (const month of localMonths) {
    const localRows = loadLocalMonthRows(month);
    if (localRows && localRows.length > 0) {
      try {
        await ensureMonthTable(month);
        await saveMonthRows(userId, month, localRows);
      } catch {
        failed.push(month);
      }
    }
  }

  if (failed.length === 0) {
    localStorage.setItem('migrated_to_supabase', 'true');
  } else {
    localStorage.setItem(
      'migration_pending_months',
      JSON.stringify(failed),
    );
  }
}
