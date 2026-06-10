import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDateCoercion } from '../useDateCoercion';

describe('useDateCoercion', () => {
  it('returns a callback that coerces full date into selected month', () => {
    const { result } = renderHook(() => useDateCoercion('2026-06'));
    expect(result.current('2026-08-15')).toBe('2026-06-15');
  });

  it('handles empty date string by returning first day of month', () => {
    const { result } = renderHook(() => useDateCoercion('2026-06'));
    expect(result.current('')).toBe('2026-06-01');
  });

  it('handles whitespace-only date string', () => {
    const { result } = renderHook(() => useDateCoercion('2026-06'));
    expect(result.current('   ')).toBe('2026-06-01');
  });

  it('handles partial date (year-month only) by returning first day', () => {
    const { result } = renderHook(() => useDateCoercion('2026-06'));
    expect(result.current('2026-08')).toBe('2026-06-01');
  });

  it('pads single digit day', () => {
    const { result } = renderHook(() => useDateCoercion('2026-06'));
    expect(result.current('2026-08-5')).toBe('2026-06-05');
  });

  it('preserves zero-padded day', () => {
    const { result } = renderHook(() => useDateCoercion('2026-06'));
    expect(result.current('2026-08-05')).toBe('2026-06-05');
  });

  it('updates returned callback when selectedMonth changes', () => {
    const { rerender, result } = renderHook(
      ({ month }: { month: string }) => useDateCoercion(month),
      { initialProps: { month: '2026-06' } }
    );
    expect(result.current('2026-08-15')).toBe('2026-06-15');
    rerender({ month: '2026-07' });
    expect(result.current('2026-08-15')).toBe('2026-07-15');
  });

  it('works with different year and month formats', () => {
    const { result } = renderHook(() => useDateCoercion('2025-12'));
    expect(result.current('2026-01-31')).toBe('2025-12-31');
  });

  it('coerces day 31 into months that have 31 days', () => {
    const { result } = renderHook(() => useDateCoercion('2026-01'));
    expect(result.current('2025-12-31')).toBe('2026-01-31');
  });
});
