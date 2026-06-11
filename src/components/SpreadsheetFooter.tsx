import { HelpCircle } from 'lucide-react';

interface SpreadsheetFooterProps {
  filteredCount: number;
  totalCount: number;
}

export default function SpreadsheetFooter({
  filteredCount,
  totalCount,
}: SpreadsheetFooterProps) {
  return (
    <>
      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-linear-to-r from-slate-50/40 to-white/40 dark:from-[#1A1E28]/30 dark:to-[#161920]/30 border-t border-slate-200/50 dark:border-slate-700/40 text-xs text-slate-400 dark:text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-[14px] h-[14px] text-slate-300 dark:text-slate-600" />
          <span>Clique em qualquer célula para editá-la</span>
        </div>
        <div className="font-mono tracking-tight">
          <span className="text-slate-500 dark:text-slate-500">Exibindo </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredCount}</span>
          <span className="text-slate-500 dark:text-slate-500"> de </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span>
          <span className="text-slate-500 dark:text-slate-500"> registros</span>
        </div>
      </div>
    </>
  );
}
