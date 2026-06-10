import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMutationLock } from '../useMutationLock';

describe('useMutationLock', () => {
  it('starts with pending set to false', () => {
    const { result } = renderHook(() => useMutationLock());
    expect(result.current.pending).toBe(false);
  });

  it('wrap returns a function that invokes the original', async () => {
    const { result } = renderHook(() => useMutationLock());
    const fn = vi.fn().mockResolvedValue('ok');
    const wrapped = result.current.wrap(fn);
    const output = await wrapped('a', 'b');
    expect(output).toBe('ok');
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });

  it('sets pending to true during execution and false after completion', async () => {
    const { result } = renderHook(() => useMutationLock());
    const fn = vi.fn().mockResolvedValue('done');
    const wrapped = result.current.wrap(fn);

    let promise: Promise<unknown>;
    act(() => {
      promise = wrapped();
    });
    expect(result.current.pending).toBe(true);

    await act(async () => {
      await promise!;
    });
    expect(result.current.pending).toBe(false);
  });

  it('ignores concurrent calls while one is in flight', async () => {
    const { result } = renderHook(() => useMutationLock());
    let resolve: (v: string) => void;
    const fn = vi.fn().mockImplementation(() => new Promise<string>((r) => { resolve = r; }));
    const wrapped = result.current.wrap(fn);

    const call1 = wrapped();
    const call2 = wrapped();

    await expect(call2).resolves.toBeUndefined();
    resolve!('first');
    await expect(call1).resolves.toBe('first');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets lock even when wrapped function throws', async () => {
    const { result } = renderHook(() => useMutationLock());
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const wrapped = result.current.wrap(fn);

    await expect(wrapped()).rejects.toThrow('fail');
    expect(result.current.pending).toBe(false);

    fn.mockResolvedValue('retry');
    await expect(wrapped()).resolves.toBe('retry');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('returns undefined for subsequent calls while locked', async () => {
    const { result } = renderHook(() => useMutationLock());
    let resolve: (v: string) => void;
    const fn = vi.fn().mockImplementation(() => new Promise<string>((r) => { resolve = r; }));
    const wrapped = result.current.wrap(fn);

    const call1 = wrapped();
    const call2 = wrapped();
    const call3 = wrapped();

    resolve!('done');
    await expect(call1).resolves.toBe('done');
    await expect(call2).resolves.toBeUndefined();
    await expect(call3).resolves.toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows new calls after lock is released', async () => {
    const { result } = renderHook(() => useMutationLock());
    const fn = vi.fn().mockResolvedValue('done');
    const wrapped = result.current.wrap(fn);

    await expect(wrapped()).resolves.toBe('done');
    await expect(wrapped()).resolves.toBe('done');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('handles synchronous return values', async () => {
    const { result } = renderHook(() => useMutationLock());
    const fn = vi.fn().mockReturnValue('sync');
    const wrapped = result.current.wrap(fn);

    const output = await wrapped();
    expect(output).toBe('sync');
  });
});
