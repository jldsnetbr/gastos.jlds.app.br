/**
 * Coerces a date string to be within the given month.
 * Preserves the day if valid, falls back to first day of month.
 */
export function coerceDateInMonth(dateStr: string, monthKey: string): string {
  const trimmed = String(dateStr).trim();
  if (!trimmed) return `${monthKey}-01`;

  const parts = trimmed.split('-');
  if (parts.length === 3) {
    const day = parts[2];
    const [selYear, selMonth] = monthKey.split('-');
    return `${selYear}-${selMonth}-${day.padStart(2, '0')}`;
  }
  return `${monthKey}-01`;
}
