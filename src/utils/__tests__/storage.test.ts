import { describe, it, expect, beforeEach } from 'vitest';
import { getTheme, setTheme } from '../storage';

describe('getTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns light when nothing stored', () => {
    expect(getTheme()).toBe('light');
  });

  it('returns midnight when stored', () => {
    localStorage.setItem('theme', 'midnight');
    expect(getTheme()).toBe('midnight');
  });

  it('returns light for invalid stored value', () => {
    localStorage.setItem('theme', 'invalid');
    expect(getTheme()).toBe('light');
  });

  it('returns light for legacy dark value', () => {
    localStorage.setItem('theme', 'dark');
    expect(getTheme()).toBe('light');
  });
});

describe('setTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores midnight theme', () => {
    setTheme('midnight');
    expect(localStorage.getItem('theme')).toBe('midnight');
  });

  it('stores light theme', () => {
    setTheme('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('overwrites previous theme', () => {
    setTheme('midnight');
    setTheme('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
