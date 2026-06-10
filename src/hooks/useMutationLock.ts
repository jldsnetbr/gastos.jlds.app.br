import { useState, useCallback, useRef } from 'react';

/**
 * Prevents re-entrant calls to async mutations.
 * Returns a wrapped function that:
 * - ignores calls while a previous one is in flight
 * - tracks a `pending` flag for UI feedback
 */
export function useMutationLock() {
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  const wrap = useCallback(<T extends (...args: any[]) => any>(fn: T) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      if (inFlight.current) return undefined;
      inFlight.current = true;
      setPending(true);
      try {
        return await fn(...args);
      } finally {
        inFlight.current = false;
        setPending(false);
      }
    };
  }, []);

  return { pending, wrap };
}
