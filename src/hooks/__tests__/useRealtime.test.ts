import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { supabase } from '../../lib/supabase';
import { useRealtime } from '../useRealtime';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

describe('useRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.removeChannel).mockResolvedValue('unsubscribed' as never);
  });

  it('subscribes to postgres_changes with correct config', () => {
    const mockSubscribe = vi.fn();
    const mockOn = vi.fn(() => ({ subscribe: mockSubscribe }));
    vi.mocked(supabase.channel).mockReturnValue({ on: mockOn } as never);

    renderHook(() => useRealtime({ userId: 'u1', month: '2026-06', onRowsChange: vi.fn() }));

    expect(supabase.channel).toHaveBeenCalledWith('realtime:rows_2026_06');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rows_2026_06',
        filter: 'user_id=eq.u1',
      },
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('does not subscribe when userId is undefined', () => {
    renderHook(() => useRealtime({ userId: undefined, month: '2026-06', onRowsChange: vi.fn() }));
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('does not subscribe when month is empty', () => {
    renderHook(() => useRealtime({ userId: 'u1', month: '', onRowsChange: vi.fn() }));
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('does not subscribe when userId and month are both falsy', () => {
    renderHook(() => useRealtime({ userId: undefined, month: '', onRowsChange: vi.fn() }));
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('removes previous channel and creates new one when month changes', () => {
    const channel1 = { id: 'ch1' };
    const subscribe1 = vi.fn(() => channel1);
    const on1 = vi.fn(() => ({ subscribe: subscribe1 }));

    const channel2 = { id: 'ch2' };
    const subscribe2 = vi.fn(() => channel2);
    const on2 = vi.fn(() => ({ subscribe: subscribe2 }));

    vi.mocked(supabase.channel)
      .mockReturnValueOnce({ on: on1 } as never)
      .mockReturnValueOnce({ on: on2 } as never);

    const { rerender } = renderHook(
      ({ userId, month, onRowsChange }: { userId: string; month: string; onRowsChange: () => void }) =>
        useRealtime({ userId, month, onRowsChange }),
      { initialProps: { userId: 'u1', month: '2026-06', onRowsChange: vi.fn() } }
    );

    expect(subscribe1).toHaveBeenCalled();

    rerender({ userId: 'u1', month: '2026-07', onRowsChange: vi.fn() });

    expect(supabase.removeChannel).toHaveBeenCalledWith(channel1);
    expect(subscribe2).toHaveBeenCalled();
  });

  it('removes channel on unmount', () => {
    const mockChannel = { id: 'ch' };
    const mockSubscribe = vi.fn(() => mockChannel);
    const mockOn = vi.fn(() => ({ subscribe: mockSubscribe }));
    vi.mocked(supabase.channel).mockReturnValue({ on: mockOn } as never);

    const { unmount } = renderHook(() =>
      useRealtime({ userId: 'u1', month: '2026-06', onRowsChange: vi.fn() })
    );

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('calls onRowsChange when postgres_changes callback fires', () => {
    let capturedCallback: () => void;
    const mockOn = vi.fn((_event: string, _config: object, callback: () => void) => {
      capturedCallback = callback;
      return { subscribe: vi.fn() };
    });
    vi.mocked(supabase.channel).mockReturnValue({ on: mockOn } as never);

    const onRowsChange = vi.fn();
    renderHook(() => useRealtime({ userId: 'u1', month: '2026-06', onRowsChange }));

    capturedCallback!();
    expect(onRowsChange).toHaveBeenCalled();
  });

  it('uses the latest onRowsChange callback via ref when rerendered', () => {
    let capturedCallback: () => void;
    const mockOn = vi.fn((_event: string, _config: object, callback: () => void) => {
      capturedCallback = callback;
      return { subscribe: vi.fn() };
    });
    vi.mocked(supabase.channel).mockReturnValue({ on: mockOn } as never);

    const firstCallback = vi.fn();
    const { rerender } = renderHook(
      ({ userId, month, onRowsChange }: { userId: string; month: string; onRowsChange: () => void }) =>
        useRealtime({ userId, month, onRowsChange }),
      { initialProps: { userId: 'u1', month: '2026-06', onRowsChange: firstCallback } }
    );

    const secondCallback = vi.fn();
    rerender({ userId: 'u1', month: '2026-06', onRowsChange: secondCallback });

    capturedCallback!();
    expect(secondCallback).toHaveBeenCalled();
    expect(firstCallback).not.toHaveBeenCalled();
  });

  it('handles removeChannel error gracefully', () => {
    vi.mocked(supabase.removeChannel).mockRejectedValue(new Error('network'));

    const channel1 = { id: 'ch1' };
    const subscribe1 = vi.fn(() => channel1);
    const on1 = vi.fn(() => ({ subscribe: subscribe1 }));

    const channel2 = { id: 'ch2' };
    const subscribe2 = vi.fn(() => channel2);
    const on2 = vi.fn(() => ({ subscribe: subscribe2 }));

    vi.mocked(supabase.channel)
      .mockReturnValueOnce({ on: on1 } as never)
      .mockReturnValueOnce({ on: on2 } as never);

    const { rerender } = renderHook(
      ({ userId, month, onRowsChange }: { userId: string; month: string; onRowsChange: () => void }) =>
        useRealtime({ userId, month, onRowsChange }),
      { initialProps: { userId: 'u1', month: '2026-06', onRowsChange: vi.fn() } }
    );

    expect(() =>
      rerender({ userId: 'u1', month: '2026-07', onRowsChange: vi.fn() })
    ).not.toThrow();

    expect(subscribe2).toHaveBeenCalled();
  });
});
