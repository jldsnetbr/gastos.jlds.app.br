import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Column, ColumnType } from '../types';

interface ColumnSettingsMenuProps {
  column: Column;
  index: number;
  totalColumns: number;
  isOpen: boolean;
  onClose: () => void;
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
  onChangeType: (colId: string, newType: ColumnType) => void;
  onDelete: (colId: string) => void;
}

export default function ColumnSettingsMenu({
  column,
  index,
  totalColumns,
  isOpen,
  onClose,
  onMoveLeft,
  onMoveRight,
  onChangeType,
  onDelete,
}: ColumnSettingsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id={`col-settings-backdrop-${column.id}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1115]/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            id={`col-settings-menu-${column.id}`}
            ref={menuRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-sm bg-white dark:bg-[#161920] border border-slate-200 dark:border-[#1E222A] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#1E222A]">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{column.name}</span>
                <span className="text-2xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  Configurações da coluna
                </span>
              </div>
              <button
                id={`btn-close-col-settings-${column.id}`}
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E222A] hover:text-slate-600 dark:hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2">
              <div className="px-4 py-1 text-2xs font-bold text-slate-400 tracking-wider uppercase">
                Organizar
              </div>
              <button
                id={`col-move-left-${column.id}`}
                onClick={() => { onMoveLeft(index); onClose(); }}
                disabled={index === 0}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-[#1E222A] disabled:opacity-40 disabled:cursor-not-allowed text-left transition"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
                <span>Mover para Esquerda</span>
              </button>
              <button
                id={`col-move-right-${column.id}`}
                onClick={() => { onMoveRight(index); onClose(); }}
                disabled={index === totalColumns - 1}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-[#1E222A] disabled:opacity-40 disabled:cursor-not-allowed text-left transition"
              >
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span>Mover para Direita</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-[#1E222A] mx-4 my-2" />

              <div className="px-4 py-1 text-2xs font-bold text-slate-400 tracking-wider uppercase">
                Tipo de Dados
              </div>
              {(['text', 'number', 'select', 'date'] as ColumnType[]).map((t) => (
                <button
                  id={`col-change-type-${column.id}-${t}`}
                  key={t}
                  onClick={() => { onChangeType(column.id, t); onClose(); }}
                  className={`flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-[#1E222A] text-left transition capitalize ${
                    column.type === t ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{t === 'text' ? 'Texto livre' : t === 'number' ? 'Valor numérico (R$)' : t === 'select' ? 'Seleção (Dropdown)' : 'Data'}</span>
                  {column.type === t && <Check className="w-4 h-4" />}
                </button>
              ))}

              <div className="h-px bg-slate-100 dark:bg-[#1E222A] mx-4 my-2" />

              <button
                id={`col-delete-btn-${column.id}`}
                onClick={() => { onDelete(column.id); onClose(); }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-left transition"
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-medium">Excluir Coluna</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
