import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { formatCurrency } from '../utils/calculations.ts';
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
  Plus,
} from 'lucide-react';
import { Transaction } from '../types/index.ts';
import { AddTransactionDrawer } from '../components/AddTransactionDrawer.tsx';

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

  // Accordion state: only one transaction expanded at a time
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Modals state
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeletingTx, setIsDeletingTx] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPrintSlipOpen, setIsPrintSlipOpen] = useState(false);

  const handleDeleteTxConfirm = async () => {
    if (!transactionToDelete) return;
    setIsDeletingTx(true);
    try {
      await deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    } catch (err) {
      console.error('Failed to delete transaction', err);
    } finally {
      setIsDeletingTx(false);
    }
  };

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
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb Navigation outside transaction card */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Transaction Top Card Details - Clean White Background Theme without back icon inside card */}
      <div className="bg-white text-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Expense Name & Category (Clean without back icon inside card) */}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-slate-200"
                style={{ backgroundColor: activeExpense.color || '#3B82F6' }}
              />
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate">
                {activeExpense.name}
              </h1>
              {activeExpense.category && (
                <span className="hidden sm:inline-block font-bold text-[11px] px-2.5 py-0.5 rounded-[50px] bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
                  {activeExpense.category}
                </span>
              )}
            </div>
          </div>

          {/* Right: Three Amounts in ONE Line Horizontally */}
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 overflow-x-auto no-scrollbar shrink-0 pt-1 md:pt-0">
            {/* Total */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total
              </div>
              <div className="text-sm sm:text-lg font-black text-slate-900">
                {formatCurrency(activeExpenseSummary.totalAmount, currencySymbol)}
              </div>
            </div>

            {/* Thin Divider */}
            <div className="w-[1px] h-7 bg-slate-200 shrink-0" />

            {/* Expended */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Expended ({debitLabel})
              </div>
              <div className="text-sm sm:text-lg font-black text-rose-600">
                {formatCurrency(activeExpenseSummary.expendedAmount, currencySymbol)}
              </div>
            </div>

            {/* Thin Divider */}
            <div className="w-[1px] h-7 bg-slate-200 shrink-0" />

            {/* Remaining */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Remaining
              </div>
              <div
                className={`text-sm sm:text-lg font-black ${
                  activeExpenseSummary.remainingAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(activeExpenseSummary.remainingAmount, currencySymbol)}
              </div>
            </div>

            {/* Print Slip Button */}
            <div className="w-[1px] h-7 bg-slate-200 shrink-0 hidden sm:block" />
            <button
              onClick={() => setIsPrintSlipOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-[50px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 shrink-0 active:scale-95 cursor-pointer"
              title="Print Expense Statement Slip"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>
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
              Tap the (+) floating button at the bottom right to record your first debit or credit entry for this expense.
            </p>
            <button
              type="button"
              onClick={() => setIsAddDrawerOpen(true)}
              className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-[50px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        ) : (
          /* Transaction list with single accordion expansion: one expands, previously open automatically collapses */
          <div className="space-y-3">
            {activeExpenseTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                isExpanded={expandedTxId === tx.id}
                onToggleExpand={() => setExpandedTxId(expandedTxId === tx.id ? null : tx.id)}
                onEdit={(t) => setEditingTransaction(t)}
                onDelete={(t) => setTransactionToDelete(t)}
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

      {/* Delete Transaction Confirm Dialog */}
      <ConfirmModal
        isOpen={!!transactionToDelete}
        title="Delete Transaction"
        message={`Are you sure you want to permanently delete "${transactionToDelete?.title}" (${formatCurrency(transactionToDelete?.amount || 0, currencySymbol)})?`}
        confirmLabel="Delete Entry"
        confirmVariant="danger"
        isLoading={isDeletingTx}
        onConfirm={handleDeleteTxConfirm}
        onCancel={() => setTransactionToDelete(null)}
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

      {/* Floating Right Bottom (+) Action Button to Enter Transaction Details */}
      <div className="fixed bottom-20 sm:bottom-8 right-5 sm:right-8 z-40">
        <button
          type="button"
          onClick={() => setIsAddDrawerOpen(true)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xl shadow-blue-600/35 flex items-center justify-center transition-all cursor-pointer group"
          aria-label="Add transaction entry"
          title="Add transaction"
        >
          <Plus className="w-7 h-7 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>

      {/* 70% Half Dedicated Screen Drawer to Enter Details */}
      <AddTransactionDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        defaultExpenseId={activeExpense.id}
      />
    </div>
  );
};
