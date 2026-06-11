/**
 * LocalStorage-based data access for offline dev/demo mode.
 * Replaces Supabase when VITE_LOCAL_MODE=true.
 */
import { Column, Row } from '../types';

const PREFIX = 'finanspreados_';

function key(name: string, userId?: string): string {
  return userId ? `${PREFIX}${userId}_${name}` : `${PREFIX}${name}`;
}

// ── Columns ──

export async function loadColumns(_userId: string): Promise<Column[] | null> {
  const raw = localStorage.getItem(key('columns', _userId));
  if (!raw) return null;
  try { return JSON.parse(raw) as Column[]; } catch { return null; }
}

export async function saveColumns(userId: string, columns: Column[]): Promise<void> {
  localStorage.setItem(key('columns', userId), JSON.stringify(columns));
}

// ── Month rows ──

export async function loadMonthRows(userId: string, month: string): Promise<Row[] | null> {
  const raw = localStorage.getItem(key(`rows_${month}`, userId));
  if (!raw) return null;
  try { return JSON.parse(raw) as Row[]; } catch { return null; }
}

export async function saveMonthRows(userId: string, month: string, rows: Row[]): Promise<void> {
  localStorage.setItem(key(`rows_${month}`, userId), JSON.stringify(rows));
}

// ── Ensure month table (no-op in local mode) ──

export async function ensureMonthTable(_month: string): Promise<void> {
  // Nothing to do — localStorage doesn't need table creation
}
