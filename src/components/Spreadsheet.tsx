import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Column, Row, ColumnType } from '../types';
import Toast, { ToastData } from './Toast';
import AddColumnModal from './AddColumnModal';
import DeleteColumnModal from './DeleteColumnModal';
import ColumnSettingsMenu from './ColumnSettingsMenu';
import CellRenderer from './CellRenderer';
import SpreadsheetToolbar from './SpreadsheetToolbar';
import SpreadsheetFooter from './SpreadsheetFooter';
import { coerceDateInMonth } from '../utils/dateCoercion';
import { parseCSV, toCSV, downloadCSV } from '../utils/csv';
import { showToast as globalShowToast } from '../utils/toast';

interface SpreadsheetProps {
  columns: Column[];
  rows: Row[];
  selectedMonth: string;
  onDataChange: (newColumns: Column[], newRows: Row[]) => void;
}

/* ── helpers ───────────────────────────────────────────────── */

/** Find the select column whose name contains "tipo" */
function getTipoColId(columns: Column[]): string | null {
  return (
    columns.find(
      (c) => c.type === 'select' && c.name.toLowerCase().includes('tipo'),
    )?.id ?? null
  );
}

const SAIDA_KW = ['saida', 'saída', 'despesa', 'gasto'];
function isSaidaRow(row: Row, tipoColId: string | null): boolean {
  if (!tipoColId) return false;
  const v = String(row.data[tipoColId] || '').toLowerCase();
  return SAIDA_KW.some((k) => v.includes(k));
}
const ENTRADA_KW = ['entrada', 'receita', 'ganho'];
function isEntradaRow(row: Row, tipoColId: string | null): boolean {
  if (!tipoColId) return false;
  const v = String(row.data[tipoColId] || '').toLowerCase();
  return ENTRADA_KW.some((k) => v.includes(k));
}

/* ── component ─────────────────────────────────────────────── */

export default function Spreadsheet({
  columns,
  rows,
  selectedMonth,
  onDataChange,
}: SpreadsheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [activeHeaderSettings, setActiveHeaderSettings] = useState<string | null>(null);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [showDeleteColumnModal, setShowDeleteColumnModal] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [sortColId, setSortColId] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // NEW: focused cell for row/col highlight
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; colId: string } | null>(null);
  // NEW: animation trigger for newly added rows
  const [animatedRowId, setAnimatedRowId] = useState<string | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const sortedRowsRef = useRef<Row[]>([]);

  const showLocalToast = useCallback((message: string, type: ToastData['type'] = 'success') => {
    globalShowToast(setToast, message, type);
  }, []);

  const handleCenterSpreadsheet = useCallback(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      if (editInputRef.current instanceof HTMLInputElement) {
        editInputRef.current.select();
      }
    }
  }, [editingCell]);

  /* ── cell save ────────────────────────────────────────────── */

  const handleSaveCell = useCallback(
    (rowId: string, colId: string) => {
      if (!editingCell) return;

      const col = columns.find((c) => c.id === colId);
      let finalValue: string | number = editValue;

      if (col?.type === 'number') {
        const normalized = editValue.replace(/\s/g, '').replace(',', '.');
        const num = parseFloat(normalized);
        finalValue = isNaN(num) ? 0 : num;
      }

      if (col?.type === 'date') {
        const coerced = coerceDateInMonth(editValue, selectedMonth);
        if (coerced !== editValue.trim()) {
          showLocalToast(`Data ajustada para o mês ativo (${selectedMonth})`, 'info');
        }
        finalValue = coerced;
      }

      const updatedRows = rows.map((r) =>
        r.id === rowId
          ? { ...r, month: selectedMonth, data: { ...r.data, [colId]: finalValue } }
          : r
      );

      onDataChange(columns, updatedRows);
      setEditingCell(null);
    },
    [editingCell, editValue, columns, rows, selectedMonth, onDataChange, showLocalToast]
  );

  /* ── helpers: navigate to cell ────────────────────────────── */

  const navigateToCell = useCallback(
    (rowId: string, colId: string) => {
      const targetId = `cell-${rowId}-${colId}`;
      document.getElementById(targetId)?.focus();
      setFocusedCell({ rowId, colId });
    },
    [],
  );

  /* ── keyboard: Enter → next column, Tab → next col / auto-row ── */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, rowId: string, colId: string) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveCell(rowId, colId);
        // Move to next column (same row)
        const colIdx = columns.findIndex((c) => c.id === colId);
        if (colIdx < columns.length - 1) {
          const nextCol = columns[colIdx + 1];
          const row = rows.find((r) => r.id === rowId);
          if (row) {
            setTimeout(() => {
              handleStartEditing(rowId, nextCol.id, String(row.data[nextCol.id] ?? ''));
            }, 10);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditingCell(null);
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        handleSaveCell(rowId, colId);
        const colIdx = columns.findIndex((c) => c.id === colId);
        if (colIdx > 0) {
          const prevCol = columns[colIdx - 1];
          const row = rows.find((r) => r.id === rowId);
          if (row) {
            setTimeout(() => {
              handleStartEditing(rowId, prevCol.id, String(row.data[prevCol.id] ?? ''));
            }, 10);
          }
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleSaveCell(rowId, colId);
        const colIdx = columns.findIndex((c) => c.id === colId);
        const rowIdx = sortedRowsRef.current.findIndex((r) => r.id === rowId);
        const isLastCell = colIdx === columns.length - 1 && rowIdx === sortedRowsRef.current.length - 1;

        if (isLastCell) {
          // AUTO-ADD ROW: Tab on last cell creates new row
          handleAddRow();
        } else if (colIdx < columns.length - 1) {
          // Normal Tab → next column
          const nextCol = columns[colIdx + 1];
          const row = rows.find((r) => r.id === rowId);
          if (row) {
            setTimeout(() => {
              handleStartEditing(rowId, nextCol.id, String(row.data[nextCol.id] ?? ''));
            }, 10);
          }
        } else {
          // Last column → first column of next row
          const nextRowIdx = rowIdx + 1;
          if (nextRowIdx < sortedRowsRef.current.length) {
            const targetRow = sortedRowsRef.current[nextRowIdx];
            setTimeout(() => {
              handleStartEditing(targetRow.id, columns[0].id, String(targetRow.data[columns[0].id] ?? ''));
            }, 10);
          }
        }
      }
      },
      [handleSaveCell, columns, rows],
  );

  const handleStartEditing = useCallback((rowId: string, colId: string, value: string) => {
    setEditingCell({ rowId, colId });
    setEditValue(value);
    setFocusedCell({ rowId, colId });
  }, []);

  /* ── row CRUD ─────────────────────────────────────────────── */

  const handleAddRow = useCallback(() => {
    const newRowId = `row_${crypto.randomUUID()}`;
    const defaultData: { [key: string]: string | number } = {};

    columns.forEach((col) => {
      if (col.type === 'number') {
        defaultData[col.id] = 0;
      } else if (col.type === 'select' && col.options && col.options.length > 0) {
        defaultData[col.id] = col.options[0];
      } else if (col.type === 'date') {
        let defaultDate = `${selectedMonth}-01`;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        if (todayStr.startsWith(selectedMonth)) {
          defaultDate = todayStr;
        }
        defaultData[col.id] = defaultDate;
      } else {
        defaultData[col.id] = '';
      }
    });

    const newRows = [...rows, { id: newRowId, month: selectedMonth, data: defaultData }];
    onDataChange(columns, newRows);

    // Trigger entrance animation
    setAnimatedRowId(newRowId);
    setTimeout(() => setAnimatedRowId(null), 500);

    setTimeout(() => {
      if (columns.length > 0) {
        handleStartEditing(newRowId, columns[0].id, '');
      }
    }, 50);
  }, [columns, rows, selectedMonth, onDataChange, handleStartEditing]);

  const handleDeleteRow = useCallback(
    (rowId: string) => {
      // UNDO TOAST: show toast with undo action
      const deletedRow = rows.find((r) => r.id === rowId);
      if (!deletedRow) return;

      const cleanedRows = rows.filter((r) => r.id !== rowId);
      onDataChange(columns, cleanedRows);

      globalShowToast(setToast, 'Lançamento excluído', 'info', {
        label: 'Desfazer',
        onClick: () => {
          // Restore the deleted row
          onDataChange(columns, [...columns.map(() => deletedRow).slice(0, 1), ...cleanedRows]);
          // Actually restore properly: insert back at original position
          const restoredRows = rows; // original full list
          onDataChange(columns, restoredRows);
          showLocalToast('Exclusão desfeita', 'success');
        },
      });
    },
    [columns, rows, onDataChange],
  );

  /* ── column CRUD ──────────────────────────────────────────── */

  const handleAddColumn = useCallback(
    (name: string, type: ColumnType, options?: string[]) => {
      if (columns.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
        showLocalToast(`Já existe uma coluna com o nome "${name}"`, 'error');
        return;
      }

      const newColId = `col_${crypto.randomUUID()}`;
      const newColumn: Column = { id: newColId, name, type, options };

      const updatedRows = rows.map((r) => ({
        ...r,
        data: {
          ...r.data,
          [newColId]: type === 'number' ? 0 : (options ? options[0] : ''),
        },
      }));

      onDataChange([...columns, newColumn], updatedRows);
    },
    [columns, rows, onDataChange, showLocalToast]
  );

  const handleMoveColumnLeft = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const newCols = [...columns];
      [newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
      onDataChange(newCols, rows);
      setActiveHeaderSettings(null);
    },
    [columns, rows, onDataChange]
  );

  const handleMoveColumnRight = useCallback(
    (index: number) => {
      if (index >= columns.length - 1) return;
      const newCols = [...columns];
      [newCols[index], newCols[index + 1]] = [newCols[index + 1], newCols[index]];
      onDataChange(newCols, rows);
      setActiveHeaderSettings(null);
    },
    [columns, rows, onDataChange]
  );

  const handleDeleteColumn = useCallback(
    (colId: string) => {
      if (columns.length <= 1) {
        showLocalToast('A tabela precisa conter pelo menos 1 coluna!', 'error');
        return;
      }
      const col = columns.find((c) => c.id === colId);
      const filteredCols = columns.filter((c) => c.id !== colId);
      const cleanedRows = rows.map((r) => {
        const nextData = { ...r.data };
        delete nextData[colId];
        return { ...r, data: nextData };
      });
      onDataChange(filteredCols, cleanedRows);
      setActiveHeaderSettings(null);
      showLocalToast(`Coluna "${col?.name || ''}" excluída com sucesso!`, 'success');
    },
    [columns, rows, onDataChange, showLocalToast]
  );

  const handleChangeColumnType = useCallback(
    (colId: string, newType: ColumnType) => {
      const updatedCols = columns.map((col) =>
        col.id === colId
          ? { ...col, type: newType, options: newType === 'select' ? ['Entrada', 'Saída'] : undefined }
          : col
      );

      const updatedRows = rows.map((r) => {
        const currentVal = r.data[colId];
        let conformVal = currentVal;
        if (newType === 'number') {
          const parsed = parseFloat(String(currentVal));
          conformVal = isNaN(parsed) ? 0 : parsed;
        } else if (newType === 'select') {
          conformVal = 'Entrada';
        }
        return { ...r, data: { ...r.data, [colId]: conformVal } };
      });

      onDataChange(updatedCols, updatedRows);
      setActiveHeaderSettings(null);
    },
    [columns, rows, onDataChange]
  );

  const handleRenameColumn = useCallback(
    (colId: string, newName: string) => {
      if (!newName.trim()) return;
      onDataChange(
        columns.map((col) => (col.id === colId ? { ...col, name: newName } : col)),
        rows
      );
    },
    [columns, rows, onDataChange]
  );

  /* ── CSV ──────────────────────────────────────────────────── */

  const handleImportCSV = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const { columns: newCols, rows: newRows } = parseCSV(text, selectedMonth);
          if (newCols.length === 0) {
            showLocalToast('Arquivo CSV vazio ou inválido.', 'error');
            return;
          }
          onDataChange(newCols, newRows);
          showLocalToast('Tabela importada com sucesso!', 'success');
        } catch {
          showLocalToast('Erro ao carregar arquivo CSV. Certifique-se de usar ";" como separador.', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [selectedMonth, onDataChange, showLocalToast]
  );

  const handleExportCSV = useCallback(() => {
    try {
      const content = toCSV(columns, rows);
      const filename = `Controle_Financeiro_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCSV(content, filename);
    } catch (err) {
      console.error('Erro ao exportar planilha:', err);
    }
  }, [columns, rows]);

  /* ── filtering / sorting ──────────────────────────────────── */

  const filteredRowsByMonth: Row[] = useMemo(() => {
    const dateCol = columns.find((c) => c.type === 'date');
    const dateColId = dateCol?.id;
    return rows.filter((row) => {
      if (dateColId && row.data[dateColId]) {
        return String(row.data[dateColId]).startsWith(selectedMonth);
      }
      return row.month === selectedMonth;
    });
  }, [rows, columns, selectedMonth]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return filteredRowsByMonth;
    const query = searchQuery.toLowerCase();
    return filteredRowsByMonth.filter((row) =>
      columns.some((col) => String(row.data[col.id] || '').toLowerCase().includes(query))
    );
  }, [filteredRowsByMonth, columns, searchQuery]);

  const handleSort = useCallback((colId: string) => {
    setSortColId((prev) => {
      if (prev === colId) {
        setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
        return colId;
      }
      setSortDir('asc');
      return colId;
    });
  }, []);

  const sortedRows: Row[] = useMemo(() => {
    if (!sortColId) return filteredRows;
    const col = columns.find((c) => c.id === sortColId);
    if (!col) return filteredRows;

    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      const aVal = a.data[sortColId] ?? '';
      const bVal = b.data[sortColId] ?? '';

      let cmp: number;
      if (col.type === 'number') {
        const aNum = typeof aVal === 'number' ? aVal : parseFloat(String(aVal)) || 0;
        const bNum = typeof bVal === 'number' ? bVal : parseFloat(String(bVal)) || 0;
        cmp = aNum - bNum;
      } else if (col.type === 'date') {
        cmp = String(aVal).localeCompare(String(bVal));
      } else {
        cmp = String(aVal).toLowerCase().localeCompare(String(bVal).toLowerCase());
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredRows, columns, sortColId, sortDir]);

  // Sync ref for handleKeyDown (which runs before sortedRows is defined)
  useEffect(() => {
    sortedRowsRef.current = sortedRows;
  }, [sortedRows]);

  const activeCol = activeHeaderSettings ? columns.find((c) => c.id === activeHeaderSettings) ?? null : null;
  const activeColIndex = activeHeaderSettings ? columns.findIndex((c) => c.id === activeHeaderSettings) : -1;

  /* ── lateral indicator helper ─────────────────────────────── */
  const tipoColId = useMemo(() => getTipoColId(columns), [columns]);

  /* ── column totals (for footer) ──────────────────────────── */
  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    columns.forEach((col) => {
      if (col.type === 'number') {
        totals[col.id] = sortedRows.reduce((sum, row) => {
          const v = row.data[col.id];
          const num = typeof v === 'number' ? v : parseFloat(String(v)) || 0;
          return sum + num;
        }, 0);
      }
    });
    return totals;
  }, [columns, sortedRows]);

  /* ══════════════════════════════════════════════════════════ */
  /*  RENDER                                                    */
  /* ══════════════════════════════════════════════════════════ */

  return (
    <div id="spreadsheet-container" className="bg-white dark:bg-[#161920] border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm dark:shadow-xl dark:shadow-black/10 overflow-hidden relative">
      <SpreadsheetToolbar
        searchQuery={searchQuery}
        onSearchChange={(value) => setSearchQuery(value)}
        onClearSearch={() => setSearchQuery('')}
        onCenterSpreadsheet={handleCenterSpreadsheet}
        onAddRow={handleAddRow}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        onOpenAddColumn={() => setShowAddColumnModal(true)}
        onOpenDeleteColumn={() => setShowDeleteColumnModal(true)}
        filteredCount={sortedRows.length}
        totalCount={filteredRowsByMonth.length}
      />

      {/* ═══ MOBILE CARD VIEW ═══ */}
      <div className="md:hidden px-4 py-3 space-y-2 max-h-[60vh] overflow-y-auto">
        {sortedRows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1E222A] flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-slate-300 dark:text-slate-600" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {searchQuery ? 'Nenhum resultado' : 'Nenhum lançamento'}
            </span>
            <button
              onClick={handleAddRow}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
            >
              Adicionar primeiro lançamento
            </button>
          </div>
        ) : (
          sortedRows.map((row, rowIndex) => {
            const tipoIndicator = isEntradaRow(row, tipoColId)
              ? 'row-indicator-entrada'
              : isSaidaRow(row, tipoColId)
                ? 'row-indicator-saida'
                : 'row-indicator-neutral';
            return (
              <div key={row.id} className={`mobile-card ${tipoIndicator}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">#{rowIndex + 1}</span>
                  <button
                    onClick={() => handleDeleteRow(row.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400 transition"
                    aria-label="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {columns.map((col) => (
                  <div key={col.id} className="mobile-card-row">
                    <span className="mobile-card-label">{col.name}</span>
                    <span className="mobile-card-value">
                      <CellRenderer column={col} value={row.data[col.id] ?? ''} row={row} columns={columns} />
                    </span>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* ═══ DESKTOP TABLE ═══ */}
      <div ref={tableContainerRef} className="hidden md:block overflow-x-auto w-full max-h-[60vh] overflow-y-auto">
        <table id="excel-spreadsheet-table" className="w-full text-left border-collapse table-fixed select-text">
          <thead className="sticky top-0 z-20">
            <tr>
              <th id="hdr-row-index" className="sticky-col-first w-12 bg-slate-50/80 dark:bg-[#1A1E28]/90 backdrop-blur-sm text-center text-xs font-medium text-slate-400 dark:text-slate-500 border-r border-slate-200/50 dark:border-slate-700/50 py-3.5 px-0 select-none">#</th>
              {columns.map((col) => {
                const isActive = sortColId === col.id;
                const isFocused = focusedCell?.colId === col.id;
                return (
                  <th
                    id={`hdr-col-${col.id}`}
                    key={col.id}
                    className={`relative group min-w-[150px] border-r border-slate-200/50 dark:border-slate-700/50 px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50/80 dark:bg-[#1A1E28]/90 backdrop-blur-sm transition ${isFocused ? 'col-highlight' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-1 overflow-hidden">
                      <input
                        id={`colname-input-${col.id}`}
                        type="text"
                        value={col.name}
                        title="Clique para renomear"
                        onChange={(e) => handleRenameColumn(col.id, e.target.value)}
                        className={`w-full bg-transparent font-semibold border-none hover:bg-slate-200/40 dark:hover:bg-white/5 focus:bg-white dark:focus:bg-[#1E222A] focus:ring-1 focus:ring-indigo-400/40 p-0.5 rounded text-sm text-ellipsis overflow-hidden focus:outline-none ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
                      />
                      <button
                        id={`col-sort-btn-${col.id}`}
                        type="button"
                        onClick={() => handleSort(col.id)}
                        title={isActive ? (sortDir === 'asc' ? 'Crescente — clique para decrescente' : 'Decrescente — clique para crescente') : 'Clique para ordenar'}
                        className={`flex-shrink-0 p-1 rounded-md transition-all duration-150 ${isActive ? 'text-indigo-600 dark:text-indigo-400 opacity-100' : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-[#1E222A]'}`}
                        aria-label={`Ordenar por ${col.name}`}
                      >
                        <svg className={`w-3.5 h-3.5 transition-transform ${isActive && sortDir === 'desc' ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14M5 12l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        id={`col-settings-btn-${col.id}`}
                        onClick={() => setActiveHeaderSettings(activeHeaderSettings === col.id ? null : col.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-[#1E222A] transition-all duration-150"
                        aria-label="Configurações da coluna"
                      >
                        <svg className="w-[15px] h-[15px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                    </div>
                  </th>
                );
              })}
              <th id="hdr-actions" className="sticky-col-actions w-[72px] text-center text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-50/80 dark:bg-[#1A1E28]/90 backdrop-blur-sm px-2 py-3.5 select-none">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr id="empty-row-fallback">
                <td colSpan={columns.length + 2} className="text-center py-[60px] text-slate-400 dark:text-slate-500 bg-white dark:bg-[#161920] border-b border-slate-200/50 dark:border-slate-700/40">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1E222A] flex items-center justify-center">
                      <FileSpreadsheet className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum lançamento neste mês'}
                    </span>
                    <div className="flex flex-col items-center gap-2">
                      {!searchQuery && (
                        <button
                          onClick={handleAddRow}
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-sm"
                        >
                          Adicionar primeiro lançamento
                        </button>
                      )}
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 underline underline-offset-2"
                        >
                          Limpar filtro de busca
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {sortedRows.map((row, rowIndex) => {
                  const isRowFocused = focusedCell?.rowId === row.id;
                  const tipoIndicator = isEntradaRow(row, tipoColId)
                    ? 'row-indicator-entrada'
                    : isSaidaRow(row, tipoColId)
                      ? 'row-indicator-saida'
                      : 'row-indicator-neutral';
                  const isNew = animatedRowId === row.id;

                  return (
                    <motion.tr
                      id={`spreadsheet-row-${row.id}`}
                      key={row.id}
                      initial={isNew ? { opacity: 0, y: 12 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`transition-colors duration-100 group border-b border-slate-100/50 dark:border-slate-700/30 ${tipoIndicator} ${
                        rowIndex % 2 === 0
                          ? 'bg-white dark:bg-[#161920]'
                          : 'bg-slate-50/30 dark:bg-[#181C25]/40'
                      } hover:bg-slate-100/40 dark:hover:bg-[#1E222A]/60 ${isRowFocused ? 'row-highlight' : ''}`}
                    >
                      <td id={`cell-idx-${row.id}`} className="sticky-col-first text-center text-xs font-mono text-slate-400 dark:text-slate-500 border-r border-slate-200/30 dark:border-slate-700/30 py-3 bg-slate-50/20 dark:bg-[#0F1115]/20 select-none">
                        {rowIndex + 1}
                      </td>
                      {columns.map((col) => {
                        const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                        const value = row.data[col.id] ?? '';
                        const alignmentClass = col.type === 'number' ? 'text-right font-mono' : 'text-left';

                        return (
                          <td
                            id={`cell-${row.id}-${col.id}`}
                            key={col.id}
                            role="gridcell"
                            tabIndex={0}
                            aria-label={`${col.name}: ${String(value)}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !isEditing) {
                                e.preventDefault();
                                handleStartEditing(row.id, col.id, String(value));
                              } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                                e.preventDefault();
                                const colIdx = columns.findIndex((c) => c.id === col.id);
                                const rowIdx = sortedRows.findIndex((r) => r.id === row.id);
                                let targetRow = rowIdx;
                                let targetCol = colIdx;
                                if (e.key === 'ArrowUp' && rowIdx > 0) targetRow = rowIdx - 1;
                                if (e.key === 'ArrowDown' && rowIdx < sortedRows.length - 1) targetRow = rowIdx + 1;
                                if (e.key === 'ArrowLeft' && colIdx > 0) targetCol = colIdx - 1;
                                if (e.key === 'ArrowRight' && colIdx < columns.length - 1) targetCol = colIdx + 1;
                                navigateToCell(sortedRows[targetRow].id, columns[targetCol].id);
                              }
                            }}
                            onFocus={() => setFocusedCell({ rowId: row.id, colId: col.id })}
                            onClick={() => { if (!isEditing) handleStartEditing(row.id, col.id, String(value)); }}
                            className={`border-r border-slate-200/30 dark:border-slate-700/30 px-4 py-2.5 text-sm max-w-[250px] truncate transition-colors duration-75 ${alignmentClass} ${
                              isEditing
                                ? 'p-0.5 ring-2 ring-indigo-400/50 bg-blue-50/20 dark:bg-[#0F1115]'
                                : 'cursor-pointer'
                            }`}
                          >
                            {isEditing ? (
                              col.type === 'select' ? (
                                <select
                                  id={`edit-select-${row.id}-${col.id}`}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => handleSaveCell(row.id, col.id)}
                                  onKeyDown={(e) => handleKeyDown(e, row.id, col.id)}
                                  className="w-full h-8 text-sm border-0 focus:ring-0 px-2 py-0.5 rounded bg-white dark:bg-[#161920] text-slate-900 dark:text-white"
                                >
                                  {(col.options || ['Entrada', 'Saída']).map((opt) => (
                                    <option key={opt} value={opt} className="dark:bg-[#161920]">{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  id={`edit-input-${row.id}-${col.id}`}
                                  ref={editInputRef}
                                  type={col.type === 'number' ? 'text' : col.type}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => handleSaveCell(row.id, col.id)}
                                  onKeyDown={(e) => handleKeyDown(e, row.id, col.id)}
                                  autoFocus
                                  className="w-full h-8 text-sm border-0 focus:ring-1 focus:ring-indigo-400/40 px-2 py-0.5 rounded bg-white dark:bg-[#161920] text-slate-900 dark:text-white focus:outline-none"
                                />
                              )
                            ) : (
                              <div id={`cell-text-render-${row.id}-${col.id}`} className="min-h-[20px] flex items-center overflow-hidden text-ellipsis">
                                <span className="w-full truncate"><CellRenderer column={col} value={value} row={row} columns={columns} /></span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td id={`cell-action-${row.id}`} className="sticky-col-actions px-2 py-2.5 text-center align-middle">
                        <button
                          id={`row-delete-btn-${row.id}`}
                          onClick={() => handleDeleteRow(row.id)}
                          title="Excluir Lançamento"
                          aria-label="Excluir Lançamento"
                          className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-90 transition-all duration-150"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>

          {/* Column totals row */}
          {sortedRows.length > 0 && Object.values(columnTotals).some((v) => v !== 0) && (
            <tfoot>
              <tr className="border-t-2 border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-[#1A1E28]/60">
                <td className="sticky-col-first bg-slate-50/80 dark:bg-[#1A1E28]/90 py-2.5 px-0 select-none" />
                {columns.map((col) => {
                  const total = columnTotals[col.id];
                  if (total === undefined) {
                    return <td key={col.id} className="px-4 py-2.5" />;
                  }
                  return (
                    <td key={col.id} className="px-4 py-2.5 text-right font-mono text-sm font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200/30 dark:border-slate-700/30">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                    </td>
                  );
                })}
                <td className="sticky-col-actions" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <SpreadsheetFooter
        filteredCount={sortedRows.length}
        totalCount={filteredRowsByMonth.length}
      />

      {/* Modals & Toast */}
      <AddColumnModal
        isOpen={showAddColumnModal}
        onClose={() => setShowAddColumnModal(false)}
        onAdd={handleAddColumn}
        existingNames={columns.map((c) => c.name.toLowerCase())}
      />
      <DeleteColumnModal
        isOpen={showDeleteColumnModal}
        onClose={() => setShowDeleteColumnModal(false)}
        columns={columns}
        onDelete={handleDeleteColumn}
      />
      {activeCol && (
        <ColumnSettingsMenu
          column={activeCol}
          index={activeColIndex}
          totalColumns={columns.length}
          isOpen={true}
          onClose={() => setActiveHeaderSettings(null)}
          onMoveLeft={handleMoveColumnLeft}
          onMoveRight={handleMoveColumnRight}
          onChangeType={handleChangeColumnType}
          onDelete={handleDeleteColumn}
        />
      )}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
