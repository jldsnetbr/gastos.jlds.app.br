import { Column, Row } from '../types';
import { STORAGE_KEYS } from '../constants';

export function loadMonthRows(month: string): Row[] | null {
  const raw = localStorage.getItem(STORAGE_KEYS.rowsTable(month));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Row[];
  } catch {
    return null;
  }
}

export function saveMonthRows(month: string, rows: Row[]): void {
  localStorage.setItem(STORAGE_KEYS.rowsTable(month), JSON.stringify(rows));
}

export function loadColumns(): Column[] | null {
  const raw = localStorage.getItem(STORAGE_KEYS.COLUMNS_CONFIG);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Column[];
  } catch {
    return null;
  }
}

export function saveColumns(columns: Column[]): void {
  localStorage.setItem(STORAGE_KEYS.COLUMNS_CONFIG, JSON.stringify(columns));
}

export function getTheme(): 'dark' | 'light' {
  return localStorage.getItem(STORAGE_KEYS.THEME) === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: 'dark' | 'light'): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}


