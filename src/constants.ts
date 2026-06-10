export const STORAGE_KEYS = {
  COLUMNS_CONFIG: 'columns_config',
  THEME: 'theme',
  rowsTable: (month: string) => `rows_table_${month}`,
} as const;

export const DEFAULT_MONTH = '2026-06';

export const MAX_HISTORY_SIZE = 50;

export const RESEND_COOLDOWN_SECONDS = 60;
