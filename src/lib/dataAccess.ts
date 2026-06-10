import { supabase } from './supabase';
import { Column, Row } from '../types';
import { getMonthTableName } from './tableNames';

export async function loadColumns(userId: string): Promise<Column[] | null> {
  const { data, error } = await supabase
    .from('user_columns')
    .select('column_id, name, type, options, sort_order')
    .eq('user_id', userId)
    .order('sort_order');

  if (error || !data || data.length === 0) return null;
  return data.map((r) => ({
    id: r.column_id as string,
    name: r.name as string,
    type: r.type as Column['type'],
    options: r.options as string[] | undefined,
  }));
}

export async function saveColumns(userId: string, columns: Column[]): Promise<void> {
  const { data: existing } = await supabase
    .from('user_columns')
    .select('column_id')
    .eq('user_id', userId);

  const existingIds = new Set((existing ?? []).map((r: Record<string, unknown>) => r.column_id as string));
  const incomingIds = new Set(columns.map((c) => c.id));

  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
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
}

export async function ensureMonthTable(month: string): Promise<void> {
  await supabase.rpc('ensure_month_table', { month_key: month });
}

export async function loadMonthRows(userId: string, month: string): Promise<Row[] | null> {
  const tableName = getMonthTableName(month);
  const { data, error } = await supabase
    .from(tableName)
    .select('row_id, data')
    .eq('user_id', userId);

  if (error) return null;
  if (!data || data.length === 0) return null;
  return data.map((r) => ({
    id: r.row_id as string,
    month,
    data: r.data as Row['data'],
  }));
}

export async function saveMonthRows(userId: string, month: string, rows: Row[]): Promise<void> {
  const tableName = getMonthTableName(month);

  const { data: existing } = await supabase
    .from(tableName)
    .select('row_id')
    .eq('user_id', userId);

  const existingIds = new Set((existing ?? []).map((r: Record<string, unknown>) => r.row_id as string));
  const incomingIds = new Set(rows.map((r) => r.id));

  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    await supabase
      .from(tableName)
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
    await supabase
      .from(tableName)
      .upsert(toUpsert, { onConflict: 'user_id,row_id' });
  }
}
