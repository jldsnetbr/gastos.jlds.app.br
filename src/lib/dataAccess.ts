import { supabase } from './supabase';
import type { Column, ColumnType, Row } from '../types';

const VALID_COLUMN_TYPES = new Set<string>(['text', 'number', 'select', 'date']);

function assertColumnType(val: unknown): ColumnType {
  if (typeof val === 'string' && VALID_COLUMN_TYPES.has(val)) return val as ColumnType;
  return 'text';
}

function assertString(val: unknown, fallback: string): string {
  return typeof val === 'string' ? val : fallback;
}

function assertRowData(val: unknown): Row['data'] {
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    return val as Row['data'];
  }
  return {};
}

// ── Columns (unchanged) ──────────────────────────────────────

export async function loadColumns(userId: string): Promise<Column[] | null> {
  const { data, error } = await supabase
    .from('user_columns')
    .select('column_id, name, type, options, sort_order')
    .eq('user_id', userId)
    .order('sort_order');

  if (error) return null;
  if (!data) return [];
  return data.map((r) => ({
    id: assertString(r.column_id, ''),
    name: assertString(r.name, ''),
    type: assertColumnType(r.type),
    options: Array.isArray(r.options) ? (r.options as string[]) : undefined,
  }));
}

export async function saveColumns(userId: string, columns: Column[]): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('user_columns')
      .select('column_id')
      .eq('user_id', userId);

    const existingIds = new Set((existing ?? []).map((r) => r.column_id));
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
  } catch (err) {
    console.warn('saveColumns failed:', err);
  }
}

// ── Rows (single `rows` table) ────────────────────────────────

export async function loadMonthRows(userId: string, month: string): Promise<Row[] | null> {
  const { data, error } = await supabase
    .from('rows')
    .select('row_id, month, data')
    .eq('user_id', userId)
    .eq('month', month);

  if (error) return null;
  if (!data || data.length === 0) return null;

  return data.map((r) => ({
    id: assertString(r.row_id, ''),
    month: assertString(r.month, month),
    data: assertRowData(r.data),
  }));
}

export async function saveMonthRows(userId: string, month: string, rows: Row[]): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('rows')
      .select('row_id')
      .eq('user_id', userId)
      .eq('month', month);

    const existingRows: string[] = ((existing ?? []) as { row_id: string }[]).map(
      (r) => assertString(r.row_id, ''),
    );
    const incomingIds = new Set(rows.map((r) => r.id));

    const toDelete = existingRows.filter((id) => !incomingIds.has(id));
    if (toDelete.length > 0) {
      await supabase
        .from('rows')
        .delete()
        .eq('user_id', userId)
        .eq('month', month)
        .in('row_id', toDelete);
    }

    if (rows.length > 0) {
      const toUpsert = rows.map((r) => ({
        user_id: userId,
        row_id: r.id,
        month: r.month,
        data: r.data,
      }));
      await supabase
        .from('rows')
        .upsert(toUpsert, { onConflict: 'user_id,row_id' });
    }
  } catch (err) {
    console.warn('saveMonthRows failed:', err);
  }
}

// ── Backward compat (no-op) ──────────────────────────────────
/** @deprecated No longer needed — rows table is always available */
export async function ensureMonthTable(_month: string): Promise<void> {
  // Single rows table exists from migration 006 — nothing to ensure
}
