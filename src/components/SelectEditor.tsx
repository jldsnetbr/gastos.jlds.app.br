import { useState, useEffect, useRef, useCallback } from 'react';
import { Check } from 'lucide-react';
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
  const [selectedIndex, setSelectedIndex] = useState(currentIdx);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Focus on mount
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Scroll selected option into view
  useEffect(() => {
    optionRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const confirmSelection = useCallback(() => {
    const selected = options[selectedIndex] ?? options[0];
    // Save
    const updatedRows = rows.map((r) =>
      r.id === rowId
        ? { ...r, month: selectedMonth, data: { ...r.data, [colId]: selected } }
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
  }, [selectedIndex, options, rows, rowId, colId, columns, selectedMonth, onDataChange, onClose, onStartEditing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      confirmSelection();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else {
      // Type first letter to jump to option
      const letter = e.key.toLowerCase();
      const idx = options.findIndex((o) => o.toLowerCase().startsWith(letter));
      if (idx >= 0) setSelectedIndex(idx);
    }
  }, [options, confirmSelection, onClose]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative w-full outline-none"
    >
      {/* Dropdown options */}
      <div className="absolute left-0 top-full mt-0.5 z-30 bg-white dark:bg-[#1E222A] border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden min-w-[120px]">
        {options.map((opt, i) => {
          const isSelected = opt === value;
          const isHighlighted = i === selectedIndex;
          return (
            <button
              key={opt}
              ref={(el) => { optionRefs.current[i] = el; }}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setSelectedIndex(i);
                setTimeout(() => confirmSelection(), 10);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm transition-colors ${
                isHighlighted
                  ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <span>{opt}</span>
              {isSelected && (
                <Check className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#161920]">
        <span>↑↓ selecionar</span>
        <span>Enter confirmar</span>
      </div>
    </div>
  );
}
