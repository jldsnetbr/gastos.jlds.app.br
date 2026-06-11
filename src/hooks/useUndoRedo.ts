import { useState, useCallback } from 'react';
import type { HistoryState } from '../types';
import { MAX_HISTORY_SIZE } from '../constants';

interface UseUndoRedoReturn {
  history: HistoryState[];
  currentIndex: number;
  pushState: (state: HistoryState) => void;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  reset: (state: HistoryState) => void;
}

/**
 * Gerencia pilha de histórico (undo/redo) usando estado único e functional updates.
 *
 * Functional updates (setState(prev => ...)) eliminam a necessidade de dependências
 * nos callbacks, evitando que `pushState` mude de referência a cada alteração.
 *
 * O padrão `let result` captura o valor síncrono durante a atualização do estado
 * (o updater roda imediatamente em event handlers no React 18+).
 */
export function useUndoRedo(): UseUndoRedoReturn {
  const [state, setState] = useState<{
    history: HistoryState[];
    currentIndex: number;
  }>({
    history: [],
    currentIndex: -1,
  });

  const pushState = useCallback((s: HistoryState) => {
    setState((prev) => {
      const clean = prev.history.slice(0, prev.currentIndex + 1);
      const next = [...clean, s];
      if (next.length > MAX_HISTORY_SIZE) next.shift();
      return { history: next, currentIndex: next.length - 1 };
    });
  }, []);

  const undo = useCallback((): HistoryState | null => {
    let result: HistoryState | null = null;
    setState((prev) => {
      if (prev.currentIndex <= 0) return prev;
      const newIndex = prev.currentIndex - 1;
      result = prev.history[newIndex] ?? null;
      return { ...prev, currentIndex: newIndex };
    });
    return result;
  }, []);

  const redo = useCallback((): HistoryState | null => {
    let result: HistoryState | null = null;
    setState((prev) => {
      if (prev.currentIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.currentIndex + 1;
      result = prev.history[newIndex] ?? null;
      return { ...prev, currentIndex: newIndex };
    });
    return result;
  }, []);

  const reset = useCallback((s: HistoryState) => {
    setState({ history: [s], currentIndex: 0 });
  }, []);

  return {
    history: state.history,
    currentIndex: state.currentIndex,
    pushState,
    undo,
    redo,
    reset,
  };
}
