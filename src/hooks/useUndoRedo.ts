import { useState, useCallback } from 'react';
import { HistoryState } from '../types';
import { MAX_HISTORY_SIZE } from '../constants';

interface UseUndoRedoReturn {
  history: HistoryState[];
  currentIndex: number;
  pushState: (state: HistoryState) => void;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  reset: (state: HistoryState) => void;
}

export function useUndoRedo(): UseUndoRedoReturn {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const pushState = useCallback((state: HistoryState) => {
    setHistory((prev) => {
      const clean = prev.slice(0, currentIndex + 1);
      const next = [...clean, state];
      if (next.length > MAX_HISTORY_SIZE) next.shift();
      return next;
    });
    setCurrentIndex((prev) => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [currentIndex]);

  const undo = useCallback((): HistoryState | null => {
    if (currentIndex <= 0) return null;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex] ?? null;
  }, [history, currentIndex]);

  const redo = useCallback((): HistoryState | null => {
    if (currentIndex >= history.length - 1) return null;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex] ?? null;
  }, [history, currentIndex]);

  const reset = useCallback((state: HistoryState) => {
    setHistory([state]);
    setCurrentIndex(0);
  }, []);

  return { history, currentIndex, pushState, undo, redo, reset };
}
