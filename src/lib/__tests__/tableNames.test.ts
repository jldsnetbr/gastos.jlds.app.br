import { describe, it, expect } from 'vitest';
import { getMonthTableName, getRealtimeChannelName, TABLE_PREFIX } from '../tableNames';

describe('getMonthTableName', () => {
  it('converts 2026-06 to rows_2026_06', () => {
    expect(getMonthTableName('2026-06')).toBe('rows_2026_06');
  });

  it('handles month strings without dash', () => {
    expect(getMonthTableName('2026_06')).toBe('rows_2026_06');
  });
});

describe('getRealtimeChannelName', () => {
  it('prefixes with realtime:', () => {
    expect(getRealtimeChannelName('2026-06')).toBe('realtime:rows_2026_06');
  });
});

describe('TABLE_PREFIX', () => {
  it('is rows_', () => {
    expect(TABLE_PREFIX).toBe('rows_');
  });
});
