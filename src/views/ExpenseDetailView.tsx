import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { formatCurrency } from '../utils/calculations.ts';
import { TransactionForm } from '../components/TransactionForm.tsx';
import { TransactionItem } from '../components/TransactionItem.tsx';
import { EditTransactionModal } from '../components/EditTransactionModal.tsx';
import { ConfirmModal } from '../components/ConfirmModal.tsx';
import { ReceiptPreviewModal } from '../components/ReceiptPreviewModal.tsx';
import { PrintExpenseSlipModal } from '../components/PrintExpenseSlipModal.tsx';
import {
  ArrowLeft,
  Wallet,
  TrendingDown,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Trash2,
  Calendar,
  Printer,
} from 'lucide-react';
import { Transaction } from '../types/index.ts';

interface ExpenseDetailViewProps {
  onBack: () => void;
  onDeleteExpense: () => void;
}

export const ExpenseDetailView: React.FC<ExpenseDetailViewProps> = ({
  onBack,
  onDeleteExpense,
}) => {
  const {
    activeExpense,
    activeExpenseTransactions,
    activeExpenseSummary,
    deleteTransaction,
  } = useExpense();

  const { currencySymbol, debitLabel, creditLabel } = useAuth();

  // Modals state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPrintSlipOpen, setIsPrintSlipOpen] = useState(false);

  if (!activeExpense || !activeExpenseSummary) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">No active expense selected.</p>
        <button
          onClick={onBack}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Curved Royal Blue Banner with Expense Name and 3 Amounts in ONE Horizontal Line */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white rounded-3xl p-4 sm:p-5 shadow-sm shadow-blue-500/15 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Back Button + Expense Name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="p-2 sm:p-2.5 rounded-[50px] bg-white/20 hover:bg-white/30 text-white transition shrink-0 backdrop-blur-sm shadow-2xs"
              aria-label="Back to dashboard"
              title="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/50"
                  style={{ backgroundColor: activeExpense.color || '#93C5FD' }}
                />
                <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white truncate">
                  {activeExpense.name}
                </h1>
                {activeExpense.category && (
                  <span className="hidden sm:inline-block font-bold text-[11px] px-2.5 py-0.5 rounded-[50px] bg-white/20 text-white backdrop-blur-sm shrink-0">
                    {activeExpense.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Three Amounts in ONE Line Horizontally */}
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 overflow-x-auto no-scrollbar shrink-0 pt-1 md:pt-0">
            {/* Total */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] sm:text-xs font-semibold text-blue-100 uppercase tracking-wider">
                Total
              </div>
              <div className="text-sm sm:text-lg font-black text-white">
                {formatCurrency(activeExpenseSummary.totalAmount, currencySymbol)}
              </div>
            </div>

            {/* Thin Divider */}
            <div className="w-[1px] h-7 bg-white/25 shrink-0" />

            {/* Expended */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] sm:text-xs font-semibold text-blue-100 uppercase tracking-wider">
                Expended ({debitLabel})
              </div>
              <div className="text-sm sm:text-lg font-black text-rose-200">
                {formatCurrency(activeExpenseSummary.expendedAmount, currencySymbol)}
              </div>
            </div>

            {/* Thin Divider */}
            <div className="w-[1px] h-7 bg-white/25 shrink-0" />

            {/* Remaining */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] sm:text-xs font-semibold text-blue-100 uppercase tracking-wider">
                Remaining
              </div>
              <div
                className={`text-sm sm:text-lg font-black ${
                  activeExpenseSummary.remainingAmount >= 0 ? 'text-emerald-200' : 'text-rose-200'
                }`}
              >
                {formatCurrency(activeExpenseSummary.remainingAmount, currencySymbol)}
              </div>
            </div>

            {/* Print Slip Button */}
            <div className="w-[1px] h-7 bg-white/25 shrink-0 hidden sm:block" />
            <button
              onClick={() => setIsPrintSlipOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-[50px] bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition backdrop-blur-xs shadow-2xs shrink-0 active:scale-95 cursor-pointer"
              title="Print Expense Statement Slip"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>
      </div>

      {/* B. Compact Add Transaction Form with Expandable Details */}
      <div>
        <TransactionForm expenseId={activeExpense.id} />
      </div>

      {/* C & D. Transaction History */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span>Transaction History</span>
            <span className="text-xs font-medium text-slate-400">
              ({activeExpenseTransactions.length})
            </span>
          </h2>
          <div className="text-xs font-medium text-slate-500 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {debitLabel} (Out)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {creditLabel} (In)
            </span>
          </div>
        </div>

        {activeExpenseTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No transactions yet</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
              Use the form above to record your first debit or credit entry for this expense.
            </p>
          </div>
        ) : (
          /* Transaction list with minimal/zero gap, no card outline/border, separated only by thin greywhite line */
          <div className="bg-white rounded-2xl overflow-hidden border-0 divide-y divide-slate-100/90">
            {activeExpenseTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onEdit={(t) => setEditingTransaction(t)}
                onViewReceipt={(url) => setPreviewImageUrl(url)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
      />

      {/* Receipt Image Zoom Preview Modal */}
      <ReceiptPreviewModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* Printable Expense Slip Modal */}
      <PrintExpenseSlipModal
        isOpen={isPrintSlipOpen}
        onClose={() => setIsPrintSlipOpen(false)}
        expense={activeExpense}
        transactions={activeExpenseTransactions}
        summary={activeExpenseSummary}
      />
    </div>
  );
};
