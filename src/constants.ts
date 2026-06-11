export const STORAGE_KEYS = {
  THEME: 'theme',
} as const;

export const DEFAULT_MONTH = new Date().toISOString().slice(0, 7);

export const MAX_HISTORY_SIZE = 50;
