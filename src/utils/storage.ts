import { STORAGE_KEYS } from '../constants';

export type Theme = 'light' | 'midnight';

export function getTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  if (stored === 'midnight') return 'midnight';
  return 'light';
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}
