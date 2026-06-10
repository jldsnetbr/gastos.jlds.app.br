import { describe, it, expect } from 'vitest';
import { navigateMonth, formatMonthLabel } from '../monthUtils';

describe('navigateMonth', () => {
  it('navigates to next month', () => {
    expect(navigateMonth('2026-06', 'next')).toBe('2026-07');
  });

  it('navigates to previous month', () => {
    expect(navigateMonth('2026-06', 'prev')).toBe('2026-05');
  });

  it('wraps from december to january', () => {
    expect(navigateMonth('2026-12', 'next')).toBe('2027-01');
  });

  it('wraps from january to december', () => {
    expect(navigateMonth('2026-01', 'prev')).toBe('2025-12');
  });
});

describe('formatMonthLabel', () => {
  it('formats june 2026', () => {
    expect(formatMonthLabel('2026-06')).toBe('Junho / 2026');
  });

  it('formats january 2025', () => {
    expect(formatMonthLabel('2025-01')).toBe('Janeiro / 2025');
  });

  it('formats december', () => {
    expect(formatMonthLabel('2024-12')).toBe('Dezembro / 2024');
  });
});
