import { STORAGE_KEYS } from '../constants';

export type Theme = 'light' | 'dark' | 'midnight';

export function getTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  if (stored === 'dark' || stored === 'midnight') return stored;
  return 'light';
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}
