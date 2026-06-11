import { HelpCircle } from 'lucide-react';
import type { Theme } from '../utils/storage';
import { mp } from '../utils/theme';

interface SpreadsheetFooterProps {
  filteredCount: number;
  totalCount: number;
  theme?: Theme;
}

export default function SpreadsheetFooter({
  filteredCount,
  totalCount,
  theme = 'light',
}: SpreadsheetFooterProps) {
  return (
    <>
      {/* Footer */}
      <div style={{
        backgroundColor: mp(theme, 'surface2'),
        borderTopColor: mp(theme, 'border'),
        color: mp(theme, 'textDim'),
      }} className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-linear-to-r from-slate-50/40 to-white/40 dark:from-[#1A1E28]/30 dark:to-[#161920]/30 border-t border-slate-200/50 dark:border-slate-700/40 text-xs text-slate-400 dark:text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-[14px] h-[14px] text-slate-300 dark:text-slate-600" />
          <span>Clique em qualquer célula para editá-la</span>
        </div>
        <div className="font-mono tracking-tight">
          <span className="text-slate-500 dark:text-slate-500">Exibindo </span>
          <span style={{ color: mp(theme, 'text') }} className="font-semibold text-slate-700 dark:text-slate-300">{filteredCount}</span>
          <span className="text-slate-500 dark:text-slate-500"> de </span>
          <span style={{ color: mp(theme, 'text') }} className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span>
          <span className="text-slate-500 dark:text-slate-500"> registros</span>
        </div>
      </div>
    </>
  );
}
