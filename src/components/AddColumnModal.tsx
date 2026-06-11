import { useState } from 'react';
import { X, Columns } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ColumnType } from '../types';

interface AddColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, type: ColumnType, options?: string[]) => void;
  existingNames?: string[];
}

const DEFAULT_SELECT_OPTIONS = 'Entrada, Saída';

export default function AddColumnModal({ isOpen, onClose, onAdd, existingNames = [] }: AddColumnModalProps) {
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');
  const [newColOptionsText, setNewColOptionsText] = useState(DEFAULT_SELECT_OPTIONS);
  const [validationError, setValidationError] = useState('');

  const reset = () => {
    setNewColName('');
    setNewColType('text');
    setNewColOptionsText(DEFAULT_SELECT_OPTIONS);
    setValidationError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newColName.trim();
    if (!trimmedName) return;

    if (existingNames.includes(trimmedName.toLowerCase())) {
      setValidationError(`Já existe uma coluna com o nome "${trimmedName}"`);
      return;
    }

    const parsedOptions = newColType === 'select'
      ? newColOptionsText.split(',').map((opt) => opt.trim()).filter((opt) => opt.length > 0)
      : undefined;

    onAdd(trimmedName, newColType, parsedOptions);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="add-column-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1115]/80 backdrop-blur-xs">
          <motion.div
            id="add-column-modal-frame"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-white dark:bg-[#161920] border border-slate-200 dark:border-[#1E222A] rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1E222A]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Columns className="w-5 h-5 text-indigo-400" />
                Nova Coluna Dinâmica
              </h3>
              <button
                id="btn-close-modal"
                onClick={handleClose}
                aria-label="Fechar modal"
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E222A] hover:text-slate-600 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-sans">
              <div>
                <label id="lbl-col-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Nome da Coluna
                </label>
                <input
                  id="input-col-name"
                  type="text"
                  required
                  maxLength={32}
                  placeholder="Ex: Categoria, Fornecedor..."
                  value={newColName}
                  onChange={(e) => {
                    setNewColName(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  aria-invalid={!!validationError}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-[#1E222A] rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none dark:bg-[#161920]"
                />
              </div>

              <div>
                <label id="lbl-col-type" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Tipo de Dados
                </label>
                <select
                  id="select-col-type"
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as ColumnType)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-[#1E222A] rounded-lg bg-transparent text-slate-950 dark:text-white dark:bg-[#161920] focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                >
                  <option value="text" className="dark:bg-[#161920]">Texto livre</option>
                  <option value="number" className="dark:bg-[#161920]">Valor numérico (R$ Moeda)</option>
                  <option value="date" className="dark:bg-[#161920]">Data completa</option>
                  <option value="select" className="dark:bg-[#161920]">Lista de Seleção (Dropdown)</option>
                </select>
              </div>

              {newColType === 'select' && (
                <motion.div
                  id="options-field-anim"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="space-y-1.5"
                >
                  <label id="lbl-col-options" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Opções da Lista (separadas por vírgula)
                  </label>
                  <input
                    id="input-col-options"
                    type="text"
                    placeholder="Ex: Entrada, Saída, Transferência"
                    value={newColOptionsText}
                    onChange={(e) => setNewColOptionsText(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-[#1E222A] rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none dark:bg-[#161920]"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    As opções criadas serão oferecidas como menu rápido em cada célula.
                  </p>
                </motion.div>
              )}

              {validationError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 rounded-lg">
                  {validationError}
                </p>
              )}

              <div className="flex items-center gap-2 justify-end pt-4 border-t border-slate-100 dark:border-[#1E222A]">
                <button
                  id="btn-cancel-col"
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-col"
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
                >
                  Adicionar Coluna
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
