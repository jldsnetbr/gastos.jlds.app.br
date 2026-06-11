import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          id="toast-notification"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-[#161a20] dark:border-emerald-500/30 dark:text-emerald-300'
              : toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-[#1f1619] dark:border-rose-500/30 dark:text-rose-300'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-[#161922] dark:border-indigo-500/30 dark:text-indigo-300'
          }`}
        >
          <div className={`p-1 rounded-md ${
            toast.type === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10' :
            toast.type === 'error' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10' :
            'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : toast.type === 'error' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <span>{toast.message}</span>
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="ml-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition"
            >
              {toast.action.label}
            </button>
          )}
          <button
            id="btn-dismiss-toast"
            onClick={onDismiss}
            className="ml-2 hover:opacity-80 transition p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
