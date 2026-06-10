import { useCallback } from 'react';
import { coerceDateInMonth } from '../utils/dateCoercion';

export function useDateCoercion(selectedMonth: string) {
  return useCallback(
    (dateStr: string): string => coerceDateInMonth(dateStr, selectedMonth),
    [selectedMonth]
  );
}
