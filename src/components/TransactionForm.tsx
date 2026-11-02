import React, { useState, useRef } from 'react';
import { useExpense } from '../context/ExpenseContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ChevronDown, ChevronUp, Plus, Camera, X, Paperclip, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TransactionType } from '../types/index.ts';

interface TransactionFormProps {
  expenseId: string;
  onTransactionAdded?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  expenseId,
  onTransactionAdded,
}) => {
  const { createTransaction, uploadReceipt } = useExpense();
  const { currencySymbol, debitLabel, creditLabel } = useAuth();

  // Core state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('DEBIT');

  // Expandable details state
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Net Banking' | 'Other'>('UPI');
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);

  // Status feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be under 8MB');
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
    if (!title.trim()) {
      setError('Please enter transaction details/name');
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
        expenseId,
        title: title.trim(),
        amount: numAmount,
        type,
        date,
        time,
        notes: notes.trim(),
        receiptUrl: finalReceiptUrl,
        paymentMethod,
      });

      // Reset form
      setTitle('');
      setAmount('');
      setNotes('');
      setReceiptBase64(null);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);

      if (onTransactionAdded) {
        onTransactionAdded();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span>Add Transaction</span>
          {successToast && (
            <span className="flex items-center gap-1 text-xs normal-case font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-[50px] border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> Added!
            </span>
          )}
        </h3>

        {/* Expand / Collapse Toggle for Additional Details with 50px border btn */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 py-1.5 px-3 rounded-[50px] hover:bg-blue-50 transition"
        >
          <span>{isExpanded ? 'Hide Details' : '+ More Details'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2.5 mb-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-[50px]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Compact Primary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Transaction Name with 50px border input */}
          <div className="sm:col-span-5">
            <input
              type="text"
              required
              placeholder="e.g. Flight ticket, Grocery, Salary, Dinner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[50px] border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Amount with Currency & 50px border input */}
          <div className="sm:col-span-3 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
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
              className="w-full pl-9 pr-4 py-2.5 rounded-[50px] border border-slate-200 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Type Toggle with 50px border buttons */}
          <div className="sm:col-span-4 flex items-center gap-1.5 p-1 bg-slate-100 rounded-[50px]">
            <button
              type="button"
              onClick={() => setType('DEBIT')}
              className={`flex-1 py-1.5 px-2 rounded-[50px] text-xs font-bold transition-all text-center ${
                type === 'DEBIT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              {debitLabel} (Out)
            </button>
            <button
              type="button"
              onClick={() => setType('CREDIT')}
              className={`flex-1 py-1.5 px-2 rounded-[50px] text-xs font-bold transition-all text-center ${
                type === 'CREDIT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              {creditLabel} (In)
            </button>
          </div>
        </div>

        {/* Expandable Additional Details Section */}
        {isExpanded && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-[50px] border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-[50px] border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-[50px] border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card (Credit/Debit)</option>
                  <option value="Net Banking">Net Banking / Wire</option>
                  <option value="RWallet(RailOne)">RWallet(RailOne)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Notes / Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Add optional notes, itemized breakdown, or purpose..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Receipt / Screenshot Attachment */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Attach Bill / Receipt Screenshot
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {receiptBase64 ? (
                  <div className="flex items-center gap-2 p-1.5 pr-3 rounded-[50px] bg-white border border-slate-200 shadow-2xs">
                    <img
                      src={receiptBase64}
                      alt="Receipt preview"
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <span className="text-xs font-medium text-slate-700">Receipt attached</span>
                    <button
                      type="button"
                      onClick={() => setReceiptBase64(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-full hover:bg-slate-100"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[50px] border border-dashed border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-600 text-xs font-medium bg-white transition"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Upload Screenshot</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Primary Submit Button with 50px border btn */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-[50px] font-bold text-xs sm:text-sm text-white shadow-md transition-all active:scale-[0.98] w-full sm:w-auto ${
              type === 'DEBIT'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
            } disabled:opacity-50`}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>
              {isSubmitting
                ? 'Adding...'
                : `Add ${type === 'DEBIT' ? debitLabel : creditLabel} Transaction`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
