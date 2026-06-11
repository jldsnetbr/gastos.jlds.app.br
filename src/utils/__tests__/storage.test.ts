import { describe, it, expect, beforeEach } from 'vitest';
import { getTheme, setTheme } from '../storage';

describe('getTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns light when nothing stored', () => {
    expect(getTheme()).toBe('light');
  });

  it('returns dark when stored', () => {
    localStorage.setItem('theme', 'dark');
    expect(getTheme()).toBe('dark');
  });

  it('returns midnight when stored', () => {
    localStorage.setItem('theme', 'midnight');
    expect(getTheme()).toBe('midnight');
  });

  it('returns light for invalid stored value', () => {
    localStorage.setItem('theme', 'invalid');
    expect(getTheme()).toBe('light');
  });
});

describe('setTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores theme in localStorage', () => {
    setTheme('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('stores midnight theme', () => {
    setTheme('midnight');
    expect(localStorage.getItem('theme')).toBe('midnight');
  });

  it('overwrites previous theme', () => {
    setTheme('dark');
    setTheme('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
