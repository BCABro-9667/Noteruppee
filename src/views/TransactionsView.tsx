import React, { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { filterAndSortTransactions, formatCurrency } from '../utils/calculations.ts';
import { TransactionItem } from '../components/TransactionItem.tsx';
import { EditTransactionModal } from '../components/EditTransactionModal.tsx';
import { ConfirmModal } from '../components/ConfirmModal.tsx';
import { ReceiptPreviewModal } from '../components/ReceiptPreviewModal.tsx';
import { PrintExpenseSlipModal } from '../components/PrintExpenseSlipModal.tsx';
import {
  Search,
  Filter,
  ReceiptText,
  Layers,
  FileSpreadsheet,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Plus,
  Printer,
} from 'lucide-react';
import { Transaction } from '../types/index.ts';
import { AddTransactionDrawer } from '../components/AddTransactionDrawer.tsx';

export const TransactionsView: React.FC = () => {
  const { transactions, expenses, deleteTransaction } = useExpense();
  const { user, currencySymbol, debitLabel, creditLabel } = useAuth();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Accordion state: only one transaction expanded at a time
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Modals state
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isPrintSlipOpen, setIsPrintSlipOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Map of expenseId -> expense name
  const expenseMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const exp of expenses) {
      map.set(exp.id, exp.name);
    }
    return map;
  }, [expenses]);

  // Filtered and sorted transactions
  const filteredList = useMemo(() => {
    return filterAndSortTransactions(transactions, {
      type: typeFilter,
      expenseId: selectedExpenseId,
      searchQuery,
      sortBy,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }, [transactions, typeFilter, selectedExpenseId, searchQuery, sortBy, startDate, endDate]);

  const activeFiltersCount = (typeFilter !== 'ALL' ? 1 : 0) +
    (selectedExpenseId !== 'ALL' ? 1 : 0) +
    (sortBy !== 'newest' ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    } catch (err) {
      console.error('Failed to delete transaction', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-150">
      {/* Transaction Top Card Details - Clean White Background Theme */}
      <div className="bg-white text-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Title / Expense Name */}
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate">
              {selectedExpenseId !== 'ALL' && expenseMap.get(selectedExpenseId)
                ? expenseMap.get(selectedExpenseId)
                : 'All Transactions Ledger'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {filteredList.length} total entries recorded
            </p>
          </div>

          {/* Right: Three Amounts in ONE Line Horizontally */}
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 overflow-x-auto no-scrollbar shrink-0 pt-1 md:pt-0">
            {/* Total In (Credits) */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total ({creditLabel})
              </div>
              <div className="text-sm sm:text-lg font-black text-emerald-600">
                +{formatCurrency(
                  filteredList.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0),
                  currencySymbol
                )}
              </div>
            </div>

            {/* Thin Divider */}
            <div className="w-[1px] h-7 bg-slate-200 shrink-0" />

            {/* Expended (Debits) */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Expended ({debitLabel})
              </div>
              <div className="text-sm sm:text-lg font-black text-rose-600">
                −{formatCurrency(
                  filteredList.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0),
                  currencySymbol
                )}
              </div>
            </div>

            {/* Thin Divider */}
            <div className="w-[1px] h-7 bg-slate-200 shrink-0" />

            {/* Remaining / Net - Shown in grey */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Net Remaining
              </div>
              {(() => {
                const totalIn = filteredList.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
                const totalOut = filteredList.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
                const net = totalIn - totalOut;
                return (
                  <div className="text-sm sm:text-lg font-black text-slate-600">
                    {net < 0 ? '−' : ''}{formatCurrency(Math.abs(net), currencySymbol)}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Expendable Filters Container - borderless & outlineless */}
      <div className="bg-white rounded-3xl border-0 outline-none shadow-2xs p-4 sm:p-5 space-y-3">
        {/* Search Only Visibly Shown by Default + Filter Expend Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-[50px] border-0 outline-none bg-slate-100/70 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 transition"
            />
          </div>

          {/* Expend Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-[50px] text-xs font-bold transition shrink-0 border-0 outline-none ${
              isFilterExpanded || activeFiltersCount > 0
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-blue-600 text-[10px] flex items-center justify-center font-extrabold">
                {activeFiltersCount}
              </span>
            )}
            {isFilterExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Other Sort and Filter Options: Shown ONLY after expend */}
        {isFilterExpanded && (
          <div className="pt-3 border-t border-slate-100 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Type Filter Buttons */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Transaction Type
              </label>
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-[50px] w-fit">
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-[50px] text-xs font-bold transition border-0 outline-none ${
                    typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('DEBIT')}
                  className={`px-3.5 py-1.5 rounded-[50px] text-xs font-bold transition border-0 outline-none ${
                    typeFilter === 'DEBIT' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  {debitLabel} (Out)
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('CREDIT')}
                  className={`px-3.5 py-1.5 rounded-[50px] text-xs font-bold transition border-0 outline-none ${
                    typeFilter === 'CREDIT' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  {creditLabel} (In)
                </button>
              </div>
            </div>

            {/* Dropdowns & Date Range - borderless & outlineless */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Expense Account Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Expense Account
                </label>
                <div className="relative">
                  <select
                    value={selectedExpenseId}
                    onChange={(e) => setSelectedExpenseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[50px] border-0 outline-none text-xs font-medium text-slate-800 bg-slate-100/70 focus:outline-none focus:ring-0 appearance-none"
                  >
                    <option value="ALL">All Expense Accounts</option>
                    {expenses.map((exp) => (
                      <option key={exp.id} value={exp.id}>
                        {exp.name}
                      </option>
                    ))}
                  </select>
                  <Layers className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-[50px] border-0 outline-none text-xs font-medium text-slate-800 bg-slate-100/70 focus:outline-none focus:ring-0 appearance-none"
                  >
                    <option value="newest">Date: Newest First</option>
                    <option value="oldest">Date: Oldest First</option>
                    <option value="highest">Amount: Highest First</option>
                    <option value="lowest">Amount: Lowest First</option>
                  </select>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[50px] border-0 outline-none text-xs font-medium text-slate-800 bg-slate-100/70 focus:outline-none focus:ring-0"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[50px] border-0 outline-none text-xs font-medium text-slate-800 bg-slate-100/70 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Reset Filters button */}
            {activeFiltersCount > 0 && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('ALL');
                    setSelectedExpenseId('ALL');
                    setSortBy('newest');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transactions List: In transaction card without expend show the name and amount only */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-blue-600" />
            <span>Transactions List</span>
            <span className="text-xs font-medium text-slate-400">({filteredList.length})</span>
          </h2>

          {/* Dedicated A4 Print Statement Slip Button */}
          {filteredList.length > 0 && (
            <button
              type="button"
              onClick={() => setIsPrintSlipOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[50px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer active:scale-95 shadow-2xs"
              title="Print or export statement slip on A4 paper"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print Slip (A4)</span>
            </button>
          )}
        </div>

        {filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No matching transactions</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
              Try modifying your search or expanding the filter options.
            </p>
          </div>
        ) : (
          /* Transaction list with single accordion expansion: one expands, previously open automatically collapses */
          <div className="space-y-3">
            {filteredList.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                expenseName={expenseMap.get(tx.expenseId)}
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

      {/* Edit Modal (Half Dedicated Screen Drawer) */}
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
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTransactionToDelete(null)}
      />

      {/* Receipt Zoom Preview */}
      <ReceiptPreviewModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* Dedicated Full Screen A4 Print & Export Slip */}
      <PrintExpenseSlipModal
        isOpen={isPrintSlipOpen}
        onClose={() => setIsPrintSlipOpen(false)}
        expense={
          (selectedExpenseId !== 'ALL'
            ? expenses.find((e) => e.id === selectedExpenseId)
            : null) || {
            id: 'all',
            userId: user?.id || 'user',
            name: selectedExpenseId !== 'ALL' ? 'Filtered Transactions Statement' : 'All Transactions Statement',
            initialAmount: filteredList.reduce((s, t) => s + t.amount, 0),
            color: '#2563eb',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
        transactions={filteredList}
        summary={(() => {
          const totalIn = filteredList.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
          const totalOut = filteredList.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
          const totalBudget = totalIn > 0 ? totalIn : totalOut;
          return {
            totalAmount: totalBudget,
            expendedAmount: totalOut,
            remainingAmount: totalIn - totalOut,
            percentageUsed: totalBudget > 0 ? (totalOut / totalBudget) * 100 : 0,
            isOverspent: totalOut > totalIn,
          };
        })()}
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
        defaultExpenseId={selectedExpenseId !== 'ALL' ? selectedExpenseId : undefined}
      />
    </div>
  );
};
