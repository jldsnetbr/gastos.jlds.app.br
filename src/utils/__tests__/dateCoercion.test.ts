import { describe, it, expect } from 'vitest';
import { coerceDateInMonth } from '../dateCoercion';

describe('coerceDateInMonth', () => {
  it('returns first day of month for empty string', () => {
    expect(coerceDateInMonth('', '2026-06')).toBe('2026-06-01');
  });

  it('returns first day of month for whitespace-only string', () => {
    expect(coerceDateInMonth('   ', '2026-06')).toBe('2026-06-01');
  });

  it('preserves day when date is in YYYY-MM-DD format', () => {
    expect(coerceDateInMonth('2026-06-15', '2026-06')).toBe('2026-06-15');
  });

  it('pads single-digit day with leading zero', () => {
    expect(coerceDateInMonth('2026-06-5', '2026-06')).toBe('2026-06-05');
  });

  it('replaces year and month from input with target month', () => {
    expect(coerceDateInMonth('2025-01-20', '2026-06')).toBe('2026-06-20');
  });

  it('uses third segment as day for non-standard 3-part string', () => {
    expect(coerceDateInMonth('not-a-date', '2026-06')).toBe('2026-06-date');
  });

  it('returns first day for partial date (YYYY-MM)', () => {
    expect(coerceDateInMonth('2026-06', '2026-06')).toBe('2026-06-01');
  });

  it('handles month with leading zero', () => {
    expect(coerceDateInMonth('2026-03-10', '2026-03')).toBe('2026-03-10');
  });

  it('handles December to January transition', () => {
    expect(coerceDateInMonth('2026-12-25', '2027-01')).toBe('2027-01-25');
  });
});
