import {
  Plus,
  Trash2,
  Search,
  Download,
  Upload,
  X,
  PlusCircle,
  ChevronsLeft,
} from 'lucide-react';

interface SpreadsheetToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onCenterSpreadsheet: () => void;
  onAddRow: () => void;
  onExportCSV: () => void;
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenAddColumn: () => void;
  onOpenDeleteColumn: () => void;
  filteredCount: number;
  totalCount: number;
}

export default function SpreadsheetToolbar({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onCenterSpreadsheet,
  onAddRow,
  onExportCSV,
  onImportCSV,
  onOpenAddColumn,
  onOpenDeleteColumn,
}: SpreadsheetToolbarProps) {
  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-5 gap-4 border-b border-slate-200/60 dark:border-slate-700/40 bg-linear-to-r from-white via-slate-50/80 to-white dark:from-[#161920] dark:via-[#1A1E28]/60 dark:to-[#161920]">
        {/* Left toolbar group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Centralizar planilha */}
          <button
            id="btn-center-spreadsheet"
            onClick={onCenterSpreadsheet}
            title="Centralizar planilha"
            className="p-2 rounded-md transition active:scale-90 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#252A34] bg-slate-100 dark:bg-[#1E222A]/80 border border-slate-200/40 dark:border-slate-700/40"
          >
            <ChevronsLeft className="w-[18px] h-[18px]" />
          </button>

          {/* Search bar */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="spreadsheet-search"
              type="text"
              data-testid="spreadsheet-search"
              aria-label="Buscar na planilha"
              placeholder="Buscar na planilha..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm bg-white dark:bg-[#1E222A]/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400/60 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={onClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right toolbar group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* CSV buttons */}
          <div className="flex items-center gap-px bg-slate-100 dark:bg-[#1E222A]/80 rounded-lg border border-slate-200/40 dark:border-slate-700/40">
            <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#252A34] rounded-l-lg cursor-pointer transition">
              <Upload className="w-4 h-4 text-slate-400 dark:text-indigo-400/70" />
              <span>CSV</span>
              <input id="input-file-csv" type="file" accept=".csv" onChange={onImportCSV} className="hidden" />
            </label>
            <div className="w-px h-5 bg-slate-200/50 dark:bg-slate-700/50" />
            <button
              id="btn-export-csv"
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#252A34] rounded-r-lg transition"
            >
              <Download className="w-4 h-4 text-slate-400 dark:text-indigo-400/70" />
              <span>Excel</span>
            </button>
          </div>

          {/* Nova Coluna */}
          <button
            id="btn-add-column-trigger"
            onClick={onOpenAddColumn}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-[#1E222A]/80 hover:bg-indigo-100 dark:hover:bg-[#252A34] border border-indigo-200/60 dark:border-indigo-500/20 rounded-lg transition active:scale-95 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Coluna</span>
          </button>

          {/* Excluir Colunas */}
          <button
            id="btn-delete-column-trigger"
            onClick={onOpenDeleteColumn}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400/80 bg-rose-50/50 dark:bg-[#1E222A]/80 hover:bg-rose-100/50 dark:hover:bg-rose-950/20 border border-rose-200/40 dark:border-rose-900/30 rounded-lg transition active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir</span>
          </button>

          {/* Adicionar Linha */}
          <button
            id="btn-add-row-quick"
            onClick={onAddRow}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-linear-to-r from-slate-800 to-slate-700 dark:from-indigo-600 dark:to-indigo-500 hover:from-slate-700 hover:to-slate-600 dark:hover:from-indigo-500 dark:hover:to-indigo-400 rounded-lg transition-all duration-200 shadow-sm active:scale-95"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Adicionar Linha</span>
          </button>
        </div>
      </div>
    </>
  );
}
