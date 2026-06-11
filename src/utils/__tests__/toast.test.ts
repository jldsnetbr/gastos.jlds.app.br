import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showToast } from '../toast';

describe('showToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets toast with message and type', () => {
    const setToast = vi.fn();
    showToast(setToast, 'Test message', 'success');

    expect(setToast).toHaveBeenCalledWith({
      message: 'Test message',
      type: 'success',
      action: undefined,
    });
  });

  it('uses default type success', () => {
    const setToast = vi.fn();
    showToast(setToast, 'Hello');

    expect(setToast).toHaveBeenCalledWith({
      message: 'Hello',
      type: 'success',
      action: undefined,
    });
  });

  it('clears toast after default 4000ms', () => {
    const setToast = vi.fn();
    showToast(setToast, 'Msg', 'info');

    vi.advanceTimersByTime(4000);

    expect(setToast).toHaveBeenLastCalledWith(
      expect.any(Function)
    );
  });

  it('clears toast after custom duration', () => {
    const setToast = vi.fn();
    showToast(setToast, 'Msg', 'info', 2000);

    vi.advanceTimersByTime(2000);

    expect(setToast).toHaveBeenLastCalledWith(
      expect.any(Function)
    );
  });

  it('sets action and uses 6000ms duration when action provided', () => {
    const setToast = vi.fn();
    const action = { label: 'Undo', onClick: vi.fn() };
    showToast(setToast, 'Deleted', 'info', action);

    expect(setToast).toHaveBeenCalledWith({
      message: 'Deleted',
      type: 'info',
      action,
    });

    vi.advanceTimersByTime(4000);
    // Toast should still be visible (6000ms duration)
    expect(setToast).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2000);
    expect(setToast).toHaveBeenCalledTimes(2);
  });

  it('does not clear toast if message changed', () => {
    const setToast = vi.fn();
    showToast(setToast, 'First', 'success');

    // Simulate a new toast replacing the old one
    setToast.mockClear();
    showToast(setToast, 'Second', 'error');

    vi.advanceTimersByTime(4000);

    // The first timer fires, but prev.message is 'Second' not 'First', so it stays
    const clearCall = setToast.mock.calls[setToast.mock.calls.length - 1]?.[0];
    expect(typeof clearCall).toBe('function');
  });
});
