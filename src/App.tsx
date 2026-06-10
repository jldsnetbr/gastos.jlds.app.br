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
  CloudOff,
  Cloud,
  Loader,
} from 'lucide-react';
import { Column, Row, HistoryState } from './types';
import KPICard from './components/KPICard';

const Spreadsheet = lazy(() => import('./components/Spreadsheet'));
const Auth = lazy(() => import('./pages/Auth'));
import { useAuth } from './contexts/AuthContext';
import { calculateSummary } from './utils/financeHelper';
import { navigateMonth, formatMonthLabel } from './utils/monthUtils';
import { getTheme, setTheme } from './utils/storage';
import { useSpreadsheetData } from './hooks/useSpreadsheetData';
import { coerceDateInMonth } from './utils/dateCoercion';
import { DEFAULT_MONTH, MAX_HISTORY_SIZE } from './constants';

const TEMPLATE_COLUMNS: Column[] = [
  { id: 'data', name: 'Data', type: 'date' },
  { id: 'descricao', name: 'Descrição', type: 'text' },
  { id: 'tipo', name: 'Tipo', type: 'select', options: ['Entrada', 'Saída'] },
  { id: 'valor', name: 'Valor', type: 'number' },
  { id: 'categoria', name: 'Categoria', type: 'text' },
];

const TEMPLATE_ROWS: Row[] = [
  { id: 'row-1', month: DEFAULT_MONTH, data: { data: '2026-06-01', descricao: 'Salário Mensal', tipo: 'Entrada', valor: 5500.00, categoria: 'Trabalho' } },
  { id: 'row-2', month: DEFAULT_MONTH, data: { data: '2026-06-03', descricao: 'Aluguel do Apartamento', tipo: 'Saída', valor: 1350.00, categoria: 'Moradia' } },
  { id: 'row-3', month: DEFAULT_MONTH, data: { data: '2026-06-05', descricao: 'Venda de Notebook Antigo', tipo: 'Entrada', valor: 1600.00, categoria: 'Vendas' } },
  { id: 'row-4', month: DEFAULT_MONTH, data: { data: '2026-06-06', descricao: 'Supermercado Mensal', tipo: 'Saída', valor: 820.50, categoria: 'Alimentação' } },
  { id: 'row-5', month: DEFAULT_MONTH, data: { data: '2026-06-08', descricao: 'Mensalidade da Academia', tipo: 'Saída', valor: 120.00, categoria: 'Saúde & Lazer' } },
  { id: 'row-6', month: DEFAULT_MONTH, data: { data: '2026-06-10', descricao: 'Dividendo Ações', tipo: 'Entrada', valor: 75.30, categoria: 'Investimentos' } },
];

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(DEFAULT_MONTH);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [darkMode, setDarkMode] = useState<boolean>(() => getTheme() === 'dark');
  const [didSeedDefaults, setDidSeedDefaults] = useState(false);

  const { columns, rows, dataLoaded, syncStatus, setColumns, setRows } = useSpreadsheetData(
    user?.id,
    selectedMonth
  );

  // Seed default template on first load if user has no columns
  useEffect(() => {
    if (dataLoaded && user && columns.length === 0 && !didSeedDefaults) {
      setColumns(TEMPLATE_COLUMNS);
      setRows(TEMPLATE_ROWS);
      setDidSeedDefaults(true);
    }
  }, [dataLoaded, user, columns.length, didSeedDefaults, setColumns, setRows]);

  // Reset history when data changes month
  useEffect(() => {
    if (!dataLoaded) return;
    setHistory([{ columns, rows }]);
    setCurrentIndex(0);
  }, [selectedMonth, dataLoaded]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      setTheme('dark');
    } else {
      root.classList.remove('dark');
      setTheme('light');
    }
  }, [darkMode]);

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
        const cleanHistory = history.slice(0, currentIndex + 1);
        const nextHistory = [...cleanHistory, { columns: newCols, rows: enforcedRows }];
        if (nextHistory.length > MAX_HISTORY_SIZE) nextHistory.shift();
        setHistory(nextHistory);
        setCurrentIndex(nextHistory.length - 1);
      }
    },
    [selectedMonth, history, currentIndex, setColumns, setRows]
  );

  const handleUndo = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevState = history[prevIndex];
      setColumns(prevState.columns);
      setRows(prevState.rows);
      setCurrentIndex(prevIndex);
    }
  }, [currentIndex, history, setColumns, setRows]);

  const handleRedo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextState = history[nextIndex];
      setColumns(nextState.columns);
      setRows(nextState.rows);
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, history, setColumns, setRows]);

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

  const syncIcon = {
    idle: null,
    saving: <Loader className="w-3.5 h-3.5 animate-spin text-slate-400" />,
    saved: <Cloud className="w-3.5 h-3.5 text-emerald-500" />,
    offline: <CloudOff className="w-3.5 h-3.5 text-amber-500" />,
    error: <CloudOff className="w-3.5 h-3.5 text-rose-500" />,
  }[syncStatus];

  return (
    <div id="finance-app-root" className="min-h-screen bg-slate-50 dark:bg-[#0F1115] text-slate-900 dark:text-slate-200 transition-colors duration-200">
      <header id="main-header" className="bg-white dark:bg-[#161920] border-b border-slate-200 dark:border-slate-800 py-5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 dark:bg-indigo-650 rounded-xl text-white shadow-md shadow-blue-500/20 dark:shadow-indigo-550/10">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                FinanSpread<span className="text-blue-500 dark:text-indigo-400 font-sans font-light italic">OS</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Planilha inteligente de controle financeiro pessoal estilo Excel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-[#1E222A] rounded-lg border border-slate-200/60 dark:border-slate-800 p-0.5">
              <button id="btn-prev-month" onClick={handlePrevMonth} title="Mês anterior" className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-[#252A34] rounded transition shadow-3xs">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-2xs md:text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[110px] md:min-w-[120px] text-center select-none font-mono tracking-wide">
                {formatMonthLabel(selectedMonth).toUpperCase()}
              </span>
              <button id="btn-next-month" onClick={handleNextMonth} title="Próximo mês" className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-[#252A34] rounded transition shadow-3xs">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {syncIcon && (
              <div className="p-2" title={syncStatus === 'offline' ? 'Offline - será sincronizado depois' : syncStatus === 'saving' ? 'Salvando...' : 'Salvo'}>
                {syncIcon}
              </div>
            )}
            <button id="theme-toggler" onClick={() => setDarkMode(!darkMode)} title="Trocar tema" className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E222A] rounded-lg border border-slate-200/50 dark:border-slate-800 transition">
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            <button id="btn-signout" onClick={signOut} title="Sair" className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E222A] rounded-lg border border-slate-200/50 dark:border-slate-800 transition">
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">
        <div id="financial-summary-cards" className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <KPICard id="kpi-entradas" title="Entradas (Receitas)" value={entradas} icon={TrendingUp} variant="green" subtitle="Soma de valores positivos / créditos" />
          <KPICard id="kpi-saidas" title="Saídas (Despesas)" value={saidas} icon={TrendingDown} variant="red" subtitle="Soma de saídas / débitos categorizados" />
          <KPICard id="kpi-saldo" title="Saldo Disponível" value={saldo} icon={Wallet} variant="mixed" subtitle="Patrimônio líquido calculado" />
        </div>

        <section id="spreadsheet-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" />
                Lançamentos Financeiros
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Utilize as colunas dinâmicas para registrar datas, valores e categorias como desejar.
              </p>
            </div>
          </div>
          {dataLoaded ? (
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
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={currentIndex > 0}
                canRedo={currentIndex < history.length - 1}
              />
            </Suspense>
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
