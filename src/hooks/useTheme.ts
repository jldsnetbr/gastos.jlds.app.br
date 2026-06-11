import { useState, useEffect, useCallback } from 'react';
import { getTheme, setTheme as persistTheme, Theme } from '../utils/storage';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme());

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'midnight');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'midnight') {
      root.classList.add('dark', 'midnight');
    }
    persistTheme(theme);
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) =>
      prev === 'light' ? 'dark' : prev === 'dark' ? 'midnight' : 'light'
    );
  }, []);

  return { theme, cycleTheme };
}
