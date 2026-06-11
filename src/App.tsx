import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Layers,
  Moon,
  Sun,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Loader2,
  Loader,
} from 'lucide-react';
import { Column, Row } from './types';
import KPICard from './components/KPICard';
import { SectionErrorBoundary } from './components/SectionErrorBoundary';

const Spreadsheet = lazy(() => import('./components/Spreadsheet'));
const Auth = lazy(() => import('./pages/Auth'));
import { useAuth } from './contexts/AuthContext';
import { calculateSummary } from './utils/financeHelper';
import { navigateMonth, formatMonthLabel } from './utils/monthUtils';
import { useSpreadsheetData } from './hooks/useSpreadsheetData';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useTheme } from './hooks/useTheme';
import { coerceDateInMonth } from './utils/dateCoercion';
import { mp } from './utils/theme';
import { DEFAULT_MONTH } from './constants';

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(DEFAULT_MONTH);
  const { theme, cycleTheme } = useTheme();
  const { pushState, reset: resetHistory } = useUndoRedo();

  const { columns, rows, dataLoaded, syncStatus, setColumns, setRows } = useSpreadsheetData(
    user?.id,
    selectedMonth
  );

  // Reset history when data changes month
  useEffect(() => {
    if (!dataLoaded) return;
    resetHistory({ columns, rows });
  }, [selectedMonth, dataLoaded, columns, rows, resetHistory]);

  const themeIcon = theme === 'light'
    ? <Moon className="w-[18px] h-[18px]" />
    : <Sun className="w-[18px] h-[18px] text-amber-400" />;

  const themeLabel = theme === 'light' ? 'Midnight' : 'Light';

  const handlePrevMonth = () => setSelectedMonth(navigateMonth(selectedMonth, 'prev'));
  const handleNextMonth = () => setSelectedMonth(navigateMonth(selectedMonth, 'next'));

  const updateData = useCallback(
    (newCols: Column[], newRows: Row[], skipHistory = false) => {
      const dateCol = newCols.find((c) => c.type === 'date');
      const dateColId = dateCol?.id;

      const enforcedRows = newRows.map((row) => {
        const updatedData = { ...row.data };
        if (dateColId && updatedData[dateColId]) {
          const current = String(updatedData[dateColId]).trim();
          if (current && !current.startsWith(selectedMonth)) {
            updatedData[dateColId] = coerceDateInMonth(current, selectedMonth);
          }
        }
        return { ...row, month: selectedMonth, data: updatedData };
      });

      setColumns(newCols);
      setRows(enforcedRows);

      if (!skipHistory) {
        pushState({ columns: newCols, rows: enforcedRows });
      }
    },
    [selectedMonth, setColumns, setRows, pushState]
  );

  const dateColId = useMemo(() => columns.find((c) => c.type === 'date')?.id, [columns]);
  const { entradas, saidas, saldo } = useMemo(() => {
    const filteredMonthRows = rows.filter((row) => {
      if (dateColId && row.data[dateColId]) {
        return String(row.data[dateColId]).startsWith(selectedMonth);
      }
      return row.month === selectedMonth;
    });
    return calculateSummary(columns, filteredMonthRows);
  }, [columns, rows, selectedMonth, dateColId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0F1115] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader className="w-6 h-6 animate-spin text-slate-400" /></div>}><Auth /></Suspense>;
  }

  const syncDotClass = {
    idle: 'sync-dot sync-dot-idle',
    saving: 'sync-dot sync-dot-saving',
    saved: 'sync-dot sync-dot-saved',
    offline: 'sync-dot sync-dot-offline',
  }[syncStatus];
  const syncLabel = {
    idle: '',
    saving: 'Salvando...',
    saved: 'Salvo',
    offline: 'Offline',
  }[syncStatus];

  return (
    <div id="finance-app-root" style={{
      background: mp(theme, 'bg'),
    }} className={`min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 dark:from-[#0F1115] dark:via-[#12141B] dark:to-[#0F1115] text-slate-900 dark:text-slate-200 transition-colors duration-300 ${theme === 'midnight' ? 'midnight-root' : ''}`}>
      {/* Header with glass effect */}
      <header id="main-header" style={{
        backgroundColor: mp(theme, 'surface'),
        borderBottomColor: mp(theme, 'border'),
        color: mp(theme, 'text'),
      }} className="sticky top-0 z-30 bg-white/70 dark:bg-[#161920]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 py-4 transition-colors duration-300 shadow-sm dark:shadow-lg dark:shadow-black/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-linear-to-br from-blue-600 to-indigo-600 dark:from-indigo-500 dark:to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20 dark:shadow-indigo-500/20">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 style={{ color: mp(theme, 'text') }} className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                FinanSpread<span style={{ color: mp(theme, 'accent') }} className="text-blue-500 dark:text-indigo-400 font-light italic">OS</span>
              </h1>
              <p style={{ color: mp(theme, 'textDim') }} className="text-xs text-slate-400 dark:text-slate-500">
                Planilha inteligente de controle financeiro pessoal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div style={{
              backgroundColor: mp(theme, 'surface2'),
              borderColor: mp(theme, 'border'),
            }} className="flex items-center gap-0.5 bg-slate-100/80 dark:bg-[#1E222A]/80 rounded-lg border border-slate-200/40 dark:border-slate-700/50 p-0.5 shadow-xs">
              <button id="btn-prev-month" onClick={handlePrevMonth} title="Mês anterior" className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-[#252A34] rounded transition active:scale-90">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span style={{ color: mp(theme, 'text') }} className="px-3 text-2xs md:text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[110px] md:min-w-[120px] text-center select-none font-mono tracking-wide">
                {formatMonthLabel(selectedMonth).toUpperCase()}
              </span>
              <button id="btn-next-month" onClick={handleNextMonth} title="Próximo mês" className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-[#252A34] rounded transition active:scale-90">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {syncStatus !== 'idle' && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" title={syncLabel}>
                <span className={syncDotClass} />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">{syncLabel}</span>
              </div>
            )}
            <button id="theme-toggler" onClick={cycleTheme} title={`Tema: ${themeLabel}`} className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-[#1E222A]/80 rounded-lg border border-slate-200/40 dark:border-slate-700/50 transition active:scale-90">
              {themeIcon}
            </button>
            <button id="btn-signout" onClick={signOut} title="Sair" className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-[#1E222A]/80 rounded-lg border border-slate-200/40 dark:border-slate-700/50 transition active:scale-90">
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-7">
        {/* KPI Cards */}
        <div id="financial-summary-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          <KPICard
            id="kpi-entradas"
            title="Entradas (Receitas)"
            value={entradas}
            icon={TrendingUp}
            variant="green"
            subtitle="Soma de valores positivos / créditos"
            theme={theme}
          />
          <KPICard
            id="kpi-saidas"
            title="Saídas (Despesas)"
            value={saidas}
            icon={TrendingDown}
            variant="red"
            subtitle="Soma de saídas / débitos categorizados"
            referenceValue={entradas}
            theme={theme}
          />
          <KPICard
            id="kpi-saldo"
            title="Saldo Disponível"
            value={saldo}
            icon={Wallet}
            variant="mixed"
            subtitle="Patrimônio líquido calculado"
            theme={theme}
          />
        </div>

        {/* Spreadsheet */}
        <section id="spreadsheet-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 style={{ color: mp(theme, 'text') }} className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-white" />
                </div>
                Lançamentos Financeiros
              </h2>
              <p style={{ color: mp(theme, 'textDim') }} className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 ml-8">
                Utilize as colunas dinâmicas para registrar datas, valores e categorias como desejar.
              </p>
            </div>
          </div>
          {dataLoaded ? (
            <SectionErrorBoundary fallbackTitle="Erro na planilha">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  </div>
                }
              >
                <Spreadsheet
                  columns={columns}
                  rows={rows}
                  selectedMonth={selectedMonth}
                  onDataChange={updateData}
                />
              </Suspense>
            </SectionErrorBoundary>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
