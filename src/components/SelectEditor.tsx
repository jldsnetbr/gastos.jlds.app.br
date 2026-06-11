import { Column, Row } from '../types';

interface SelectEditorProps {
  options: string[];
  value: string;
  rowId: string;
  colId: string;
  columns: Column[];
  rows: Row[];
  selectedMonth: string;
  onDataChange: (columns: Column[], rows: Row[]) => void;
  onStartEditing: (rowId: string, colId: string, value: string) => void;
  onClose: () => void;
}

const OPTION_STYLES: Record<string, string> = {
  'Entrada': 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
  'Saída': 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30',
};
const DEFAULT_STYLE = 'bg-slate-100 dark:bg-[#1E222A] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';

export default function SelectEditor({
  options,
  value,
  rowId,
  colId,
  columns,
  rows,
  selectedMonth,
  onDataChange,
  onStartEditing,
  onClose,
}: SelectEditorProps) {
  const currentIdx = Math.max(0, options.indexOf(value));
  const selected = options[currentIdx] ?? options[0];

  const saveAndNavigate = (newValue: string) => {
    const updatedRows = rows.map((r) =>
      r.id === rowId
        ? { ...r, month: selectedMonth, data: { ...r.data, [colId]: newValue } }
        : r
    );
    onDataChange(columns, updatedRows);
    onClose();
    // Navigate to next column
    const colIdx = columns.findIndex((c) => c.id === colId);
    if (colIdx < columns.length - 1) {
      const nextCol = columns[colIdx + 1];
      const row = rows.find((r) => r.id === rowId);
      if (row) {
        setTimeout(() => {
          onStartEditing(rowId, nextCol.id, String(row.data[nextCol.id] ?? ''));
        }, 30);
      }
    }
  };

  const cycleNext = () => {
    const nextIdx = (currentIdx + 1) % options.length;
    saveAndNavigate(options[nextIdx]);
  };

  const cyclePrev = () => {
    const prevIdx = (currentIdx - 1 + options.length) % options.length;
    saveAndNavigate(options[prevIdx]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      cycleNext();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      cyclePrev();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      saveAndNavigate(selected);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const style = OPTION_STYLES[selected] ?? DEFAULT_STYLE;

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-full h-8 flex items-center justify-center gap-1 outline-none select-none"
    >
      {/* Left arrow */}
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => { e.stopPropagation(); cyclePrev(); }}
        className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition text-xs flex-shrink-0"
      >
        ‹
      </button>

      {/* Current option pill */}
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${style}`}>
        {selected}
      </span>

      {/* Right arrow */}
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => { e.stopPropagation(); cycleNext(); }}
        className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition text-xs flex-shrink-0"
      >
        ›
      </button>
    </div>
  );
}
