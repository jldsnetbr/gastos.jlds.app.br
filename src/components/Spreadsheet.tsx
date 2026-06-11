import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
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

  const editInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, rowId: string, colId: string) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveCell(rowId, colId);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditingCell(null);
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        handleSaveCell(rowId, colId);
        const currentColIndex = columns.findIndex((c) => c.id === colId);
        if (currentColIndex > 0) {
          const prevCol = columns[currentColIndex - 1];
          setTimeout(() => {
            const row = rows.find((r) => r.id === rowId);
            if (row) {
              handleStartEditing(rowId, prevCol.id, String(row.data[prevCol.id] ?? ''));
            }
          }, 10);
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleSaveCell(rowId, colId);
        const currentColIndex = columns.findIndex((c) => c.id === colId);
        if (currentColIndex < columns.length - 1) {
          const nextCol = columns[currentColIndex + 1];
          setTimeout(() => {
            const row = rows.find((r) => r.id === rowId);
            if (row) {
              handleStartEditing(rowId, nextCol.id, String(row.data[nextCol.id] ?? ''));
            }
          }, 10);
        }
      }
    },
    [handleSaveCell, columns, rows]
  );

  const handleStartEditing = useCallback((rowId: string, colId: string, value: string) => {
    setEditingCell({ rowId, colId });
    setEditValue(value);
  }, []);

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

    setTimeout(() => {
      if (columns.length > 0) {
        handleStartEditing(newRowId, columns[0].id, '');
      }
    }, 50);
  }, [columns, rows, selectedMonth, onDataChange, handleStartEditing]);

  const handleDeleteRow = useCallback(
    (rowId: string) => {
      onDataChange(columns, rows.filter((r) => r.id !== rowId));
    },
    [columns, rows, onDataChange]
  );

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

      let cmp = 0;
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

  const activeCol = activeHeaderSettings ? columns.find((c) => c.id === activeHeaderSettings) ?? null : null;
  const activeColIndex = activeHeaderSettings ? columns.findIndex((c) => c.id === activeHeaderSettings) : -1;

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

      {/* Spreadsheet table */}
      <div ref={tableContainerRef} className="overflow-x-auto w-full max-h-[60vh] overflow-y-auto">
        <table id="excel-spreadsheet-table" className="w-full text-left border-collapse table-fixed select-text">
          <thead className="sticky top-0 z-20">
            <tr>
              <th id="hdr-row-index" className="w-12 bg-slate-50/80 dark:bg-[#1A1E28]/90 backdrop-blur-sm text-center text-xs font-medium text-slate-400 dark:text-slate-500 border-r border-slate-200/50 dark:border-slate-700/50 py-3.5 px-0 select-none">#</th>
              {columns.map((col) => {
                const isActive = sortColId === col.id;
                return (
                  <th
                    id={`hdr-col-${col.id}`}
                    key={col.id}
                    className="relative group min-w-[150px] border-r border-slate-200/50 dark:border-slate-700/50 px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50/80 dark:bg-[#1A1E28]/90 backdrop-blur-sm transition"
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
              <th id="hdr-actions" className="w-[72px] text-center text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-50/80 dark:bg-[#1A1E28]/90 backdrop-blur-sm px-2 py-3.5 select-none">Ações</th>
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
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 underline underline-offset-2"
                      >
                        Limpar filtro de busca
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedRows.map((row, rowIndex) => (
                <tr
                  id={`spreadsheet-row-${row.id}`}
                  key={row.id}
                  className={`transition-colors duration-100 group border-b border-slate-100/50 dark:border-slate-700/30 ${
                    rowIndex % 2 === 0
                      ? 'bg-white dark:bg-[#161920]'
                      : 'bg-slate-50/30 dark:bg-[#181C25]/40'
                  } hover:bg-slate-100/40 dark:hover:bg-[#1E222A]/60`}
                >
                  <td id={`cell-idx-${row.id}`} className="text-center text-xs font-mono text-slate-400 dark:text-slate-500 border-r border-slate-200/30 dark:border-slate-700/30 py-3 bg-slate-50/20 dark:bg-[#0F1115]/20 select-none">
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
                          }
                        }}
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
                  <td id={`cell-action-${row.id}`} className="px-2 py-2.5 text-center align-middle">
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
                </tr>
              ))
            )}
          </tbody>
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
