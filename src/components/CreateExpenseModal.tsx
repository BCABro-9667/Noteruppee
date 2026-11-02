import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Sparkles, Tag, AlertCircle } from 'lucide-react';

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (expenseId: string) => void;
}

const CATEGORIES = [
  'General',
  'Food & Groceries',
  'Travel & Vacation',
  'Business & Freelance',
  'Household & Utilities',
  'Personal & Shopping',
  'Health & Medical',
  'Entertainment',
];

const COLOR_OPTIONS = [
  '#2563EB', // Royal Blue (Default)
  '#0D9488', // Teal
  '#7C3AED', // Purple
  '#EA580C', // Orange
  '#059669', // Emerald
  '#DB2777', // Pink
];

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createExpense } = useExpense();
  const { currencySymbol } = useAuth();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an expense name');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      setError('Please enter a valid amount (0 or greater)');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const newExp = await createExpense({
        name: name.trim(),
        initialAmount: numAmount,
        category,
        color,
      });

      setName('');
      setAmount('');
      onClose();
      if (onSuccess) {
        onSuccess(newExp.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Half Dedicated Screen Drawer (bottom sheet with 50px pill buttons) */}
      <div className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
        {/* Top Handle Pill for mobile half sheet */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-white shrink-0">
          <div className="flex items-center gap-3">

            <div>
              <h2 className="text-lg font-bold text-slate-900">Create New Expense</h2>
              <p className="text-xs text-slate-500">Track budgets, trips, or individual ledgers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-[50px] hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Expense Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Goa Trip, Monthly Groceries, Office Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-[50px] border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Amount / Initial Budget ({currencySymbol}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-[50px] border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Starting allocated amount for this expense account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[50px] border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition appearance-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Theme Color
              </label>
              <div className="flex items-center gap-2 pt-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                    }`}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 50px Border Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/3 py-3 rounded-[50px] border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-[50px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-bold text-white shadow-md shadow-blue-500/25 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
