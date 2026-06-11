import type { Theme } from '../utils/storage';

export interface MidnightColors {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  borderStrong: string;
  text: string;
  textDim: string;
  textMuted: string;
  accent: string;
  accentDim: string;
  hover: string;
}

const MIDNIGHT: MidnightColors = {
  bg: '#0d0a14',
  surface: '#14101e',
  surface2: '#1a1528',
  surface3: '#211b33',
  border: 'rgba(139, 92, 246, 0.12)',
  borderStrong: 'rgba(139, 92, 246, 0.2)',
  text: '#e8e0f0',
  textDim: '#9585b0',
  textMuted: '#6b5a85',
  accent: '#a78bfa',
  accentDim: 'rgba(167, 139, 250, 0.15)',
  hover: 'rgba(139, 92, 246, 0.06)',
};

export function mp(theme: Theme, key: keyof MidnightColors): string | undefined {
  return theme === 'midnight' ? MIDNIGHT[key] : undefined;
}
