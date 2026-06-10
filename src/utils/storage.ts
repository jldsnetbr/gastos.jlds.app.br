import { STORAGE_KEYS } from '../constants';

export function getTheme(): 'dark' | 'light' {
  return localStorage.getItem(STORAGE_KEYS.THEME) === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: 'dark' | 'light'): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}


