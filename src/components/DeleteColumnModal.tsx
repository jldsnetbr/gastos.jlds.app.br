import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Column } from '../types';

interface DeleteColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: Column[];
  onDelete: (colId: string) => void;
}

export default function DeleteColumnModal({ isOpen, onClose, columns, onDelete }: DeleteColumnModalProps) {
  const [colIdToConfirmDelete, setColIdToConfirmDelete] = useState<string | null>(null);

  const handleDelete = (colId: string) => {
    onDelete(colId);
    setColIdToConfirmDelete(null);
  };

  const handleClose = () => {
    setColIdToConfirmDelete(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="delete-column-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1115]/80 backdrop-blur-xs">
          <motion.div
            id="delete-column-modal-frame"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-white dark:bg-[#161920] border border-slate-200 dark:border-[#1E222A] rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1E222A]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                Gerenciar & Excluir Colunas
              </h3>
              <button
                id="btn-close-delete-modal"
                onClick={handleClose}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E222A] hover:text-slate-600 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Selecione qual coluna deseja remover. Atenção: isso apagará todos os dados guardados nela permanentemente!
              </p>
              {columns.map((col) => {
                const isLastOne = columns.length <= 1;
                return (
                  <div
                    key={col.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#1E222A] border border-slate-200 dark:border-slate-800/80 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{col.name}</span>
                      <span className="text-2xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        ID: {col.id} • Tipo: {col.type === 'text' ? 'Texto' : col.type === 'number' ? 'Moeda' : col.type === 'select' ? 'Seletor' : 'Data'}
                      </span>
                    </div>

                    {colIdToConfirmDelete === col.id ? (
                      <div className="flex items-center gap-1.5 animate-fadeIn">
                        <button
                          id={`btn-purge-confirm-${col.id}`}
                          onClick={() => handleDelete(col.id)}
                          className="px-2.5 py-1 text-2xs font-extrabold uppercase bg-rose-600 hover:bg-rose-500 text-white rounded-md shadow-sm transition active:scale-95"
                        >
                          Excluir
                        </button>
                        <button
                          id={`btn-purge-cancel-${col.id}`}
                          onClick={() => setColIdToConfirmDelete(null)}
                          className="px-2 py-1 text-2xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`btn-purge-col-${col.id}`}
                        onClick={() => {
                          if (isLastOne) return;
                          setColIdToConfirmDelete(col.id);
                        }}
                        disabled={isLastOne}
                        title={isLastOne ? "Não é possível excluir a única coluna restante" : `Excluir coluna ${col.name}`}
                        className={`p-2 rounded-lg transition ${
                          isLastOne
                            ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed bg-slate-100 dark:bg-slate-900'
                            : 'text-rose-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-[#1E222A] mt-4">
              <button
                id="btn-close-delete-modal-footer"
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
