import React, { useState, useRef, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { TransactionType } from '../types/index.ts';
import {
  X,
  Plus,
  Paperclip,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Layers,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AddTransactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultExpenseId?: string;
  onSuccess?: () => void;
}

export const AddTransactionDrawer: React.FC<AddTransactionDrawerProps> = ({
  isOpen,
  onClose,
  defaultExpenseId,
  onSuccess,
}) => {
  const { expenses, createTransaction, uploadReceipt } = useExpense();
  const { currencySymbol, debitLabel, creditLabel } = useAuth();

  // 1. Debit and Credit tab first top
  const [type, setType] = useState<TransactionType>('DEBIT');

  // 2. Name
  const [title, setTitle] = useState('');

  // 3. Amount
  const [amount, setAmount] = useState('');

  // 4. More details
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>(
    defaultExpenseId || (expenses[0]?.id ?? '')
  );
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Net Banking' | 'Other'>('UPI');
  const [notes, setNotes] = useState('');
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [isMoreDetailsExpanded, setIsMoreDetailsExpanded] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync defaultExpenseId when opened or changed
  useEffect(() => {
    if (defaultExpenseId) {
      setSelectedExpenseId(defaultExpenseId);
    } else if (expenses.length > 0 && !selectedExpenseId) {
      setSelectedExpenseId(expenses[0].id);
    }
  }, [defaultExpenseId, expenses, isOpen]);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Receipt image must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedExpenseId) {
      setError('Please select or create an expense account first');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a transaction name');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      let finalReceiptUrl = '';
      if (receiptBase64) {
        finalReceiptUrl = await uploadReceipt(receiptBase64);
      }

      await createTransaction({
        expenseId: selectedExpenseId,
        title: title.trim(),
        amount: numAmount,
        type,
        date,
        time,
        notes: notes.trim(),
        receiptUrl: finalReceiptUrl,
        paymentMethod,
      });

      // Reset
      setTitle('');
      setAmount('');
      setNotes('');
      setReceiptBase64(null);

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 70% Half Dedicated Screen Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col h-[70vh] max-h-[70vh] overflow-hidden z-10 animate-in slide-in-from-bottom duration-200">
        {/* Mobile drag handle bar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                type === 'DEBIT' ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            />
            <h3 className="text-base font-extrabold text-slate-900">
              New {type === 'DEBIT' ? debitLabel : creditLabel} Entry
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-[50px] hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-2.5 text-xs text-rose-700 bg-rose-50 rounded-[50px] border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. FIRST TOP: Debit & Credit Tab */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              1. Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-[50px] h-12">
              <button
                type="button"
                onClick={() => setType('DEBIT')}
                className={`h-full flex items-center justify-center gap-2 px-4 rounded-[50px] text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  type === 'DEBIT'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>{debitLabel} (Money Out)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('CREDIT')}
                className={`h-full flex items-center justify-center gap-2 px-4 rounded-[50px] text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  type === 'CREDIT'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>{creditLabel} (Money In)</span>
              </button>
            </div>
          </div>

          {/* 2. THEN SHOW NAME */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              2. Transaction Name / Details
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Groceries, Coffee & Snacks, Client Invoice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 px-4 rounded-[50px] border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* 3. THEN SHOW AMOUNT */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              3. Amount ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-base">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-[50px] border border-slate-200 text-base font-black text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* 4. MORE DETAILS */}
          <div className="pt-1">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                4. More Details
              </span>
              <button
                type="button"
                onClick={() => setIsMoreDetailsExpanded(!isMoreDetailsExpanded)}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <span>{isMoreDetailsExpanded ? 'Hide' : 'Expand'}</span>
                {isMoreDetailsExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {isMoreDetailsExpanded && (
              <div className="p-3.5 rounded-2xl bg-slate-50 space-y-3 border border-slate-100">
                {/* Expense Account Selector */}
                {expenses.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span>Expense Account</span>
                    </label>
                    <select
                      value={selectedExpenseId}
                      onChange={(e) => setSelectedExpenseId(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-[50px] border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {expenses.map((exp) => (
                        <option key={exp.id} value={exp.id}>
                          {exp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date and Time side-by-side */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Date</span>
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-[50px] border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Time</span>
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-[50px] border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-slate-400" />
                    <span>Payment Method</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full h-10 px-3.5 rounded-[50px] border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card (Credit / Debit)</option>
                    <option value="Net Banking">Net Banking / Wire</option>
                    <option value="RWallet(RailOne)">RWallet (RailOne)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Notes / Description */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>Notes / Remarks</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Optional details, invoice number, or breakdown..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Screenshot / Receipt */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Receipt / Screenshot
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {receiptBase64 ? (
                    <div className="flex items-center gap-2 p-1.5 pr-3 rounded-[50px] bg-white border border-slate-200">
                      <img
                        src={receiptBase64}
                        alt="Receipt preview"
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <span className="text-xs font-medium text-slate-700 flex-1 truncate">
                        Receipt attached
                      </span>
                      <button
                        type="button"
                        onClick={() => setReceiptBase64(null)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-full hover:bg-slate-100 cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-[50px] border border-dashed border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-600 text-xs font-medium bg-white transition cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Upload Screenshot / Bill</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2 pb-1 sticky bottom-0 bg-white">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-12 rounded-[50px] flex items-center justify-center gap-2 text-sm sm:text-base font-extrabold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${
                type === 'DEBIT'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
              }`}
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>
                {isSubmitting
                  ? 'Saving Entry...'
                  : `Add ${type === 'DEBIT' ? debitLabel : creditLabel} (${currencySymbol}${amount || '0'})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
