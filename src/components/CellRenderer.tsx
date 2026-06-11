import { type ReactNode, memo } from 'react';
import type { Column, Row } from '../types';
import { formatNumberCell, formatSelectCell } from '../utils/cellFormat';

interface CellRendererProps {
  column: Column;
  value: string | number;
  row: Row;
  columns: Column[];
}

const SELECT_COLORS = {
  emerald: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400',
  rose: 'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400',
  slate: 'bg-slate-100 dark:bg-[#1E222A] text-slate-800 dark:text-slate-300',
} as const;

function CellRenderer({ column, value, row, columns }: CellRendererProps): ReactNode {
  if (column.type === 'number') {
    const { text, color } = formatNumberCell(value, row, columns);
    const colorClass = color === 'rose'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-emerald-600 dark:text-emerald-400';
    return <span className={`${colorClass} font-semibold`}>{text}</span>;
  }

  if (column.type === 'select') {
    const { text, color } = formatSelectCell(value);
    const classes = SELECT_COLORS[color] ?? SELECT_COLORS.slate;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes} select-none`}>
        {text}
      </span>
    );
  }

  // Text cells: show dash for empty
  const strVal = String(value);
  if (!strVal) {
    return <span className="text-slate-300 dark:text-slate-600 select-none">—</span>;
  }
  return <>{strVal}</>;
}

export default memo(CellRenderer);
