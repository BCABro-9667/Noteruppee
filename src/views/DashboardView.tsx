import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { formatCurrency, calculateExpenseSummary } from '../utils/calculations.ts';
import {
  Search,
  ArrowRight,
  MoreVertical,
  Trash2,
  Edit2,
  PieChart,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Expense } from '../types/index.ts';

interface DashboardViewProps {
  onSelectExpense: (expenseId: string) => void;
  onOpenCreateModal: () => void;
  onDeleteExpense: (expense: Expense) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectExpense,
  onOpenCreateModal,
  onDeleteExpense,
}) => {
  const { expenses, transactions } = useExpense();
  const { user, currencySymbol } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedExpenseIds, setExpandedExpenseIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedExpenseIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || exp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Unique categories
  const categories = ['ALL', ...Array.from(new Set(expenses.map((e) => e.category).filter(Boolean)))];

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-150">
      {/* Top Welcome Title (Summary cards & create expense button removed as requested) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back, <span className="text-blue-600">{user?.name ? user.name.split(' ')[0] : 'User'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your individual expense accounts and current balances.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expense accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-[50px] border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Category Pills with invisible scrollbar */}
        {categories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as string)}
                className={`px-3.5 py-1.5 rounded-[50px] text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat === 'ALL' ? 'All Accounts' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>My Expense Accounts</span>
          <span className="text-xs font-medium text-slate-400">({filteredExpenses.length})</span>
        </h2>
      </div>

      {/* Expense Cards List: Left side name, Right side current amount and expend btn (dots/img removed) */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-2xs p-8 sm:p-12 text-center border-0">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <PieChart className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No expense accounts found</h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try modifying your search or filter criteria.'
              : 'Tap the blue (+) button in the bottom navigation bar to create your first expense account.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => {
            const expTx = transactions.filter((t) => t.expenseId === expense.id);
            const summary = calculateExpenseSummary(expense.initialAmount, expTx);
            const isExpanded = !!expandedExpenseIds[expense.id];

            return (
              <div
                key={expense.id}
                className="bg-white rounded-2xl shadow-2xs hover:shadow-xs transition-all overflow-hidden border-0 outline-none"
              >
                {/* Main Row: Left side Name, Right side Current Amount + Expend Btn (no dots) */}
                <div
                  onClick={() => onSelectExpense(expense.id)}
                  className="flex items-center justify-between p-4 sm:p-4.5 gap-3 cursor-pointer select-none hover:bg-slate-50/40 transition-colors"
                >
                  {/* Left Side: Expense Name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: expense.color || '#2563EB' }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 hover:text-blue-600 transition truncate">
                        {expense.name}
                      </h3>
                      {expense.category && (
                        <span className="text-[10px] font-semibold text-slate-400 block truncate mt-0.5">
                          {expense.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Current Amount & Expend Btn (Dots/menu removed) */}
                  <div
                    className="flex items-center gap-2 sm:gap-3 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Current Amount (Remaining Balance) */}
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-extrabold tracking-tight ${
                          summary.remainingAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatCurrency(summary.remainingAmount, currencySymbol)}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Current Balance
                      </div>
                    </div>

                    {/* Expend / Expand Button */}
                    <button
                      onClick={(e) => toggleExpand(expense.id, e)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-[50px] transition"
                      aria-label={isExpanded ? 'Collapse expense breakdown' : 'Expend expense breakdown'}
                      title={isExpanded ? 'Collapse' : 'Expend'}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="px-5 py-4 bg-slate-50/80 text-xs text-slate-600 space-y-3 animate-in fade-in duration-150 border-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Total Budget
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {formatCurrency(summary.totalAmount, currencySymbol)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Expended (Debit)
                        </span>
                        <span className="text-sm font-bold text-rose-600">
                          {formatCurrency(summary.expendedAmount, currencySymbol)}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Utilization
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {Math.round(summary.percentageUsed)}% used ({expTx.length} transactions)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Visual Indicator */}
                    <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          summary.isOverspent
                            ? 'bg-rose-600'
                            : summary.percentageUsed > 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, summary.percentageUsed)}%` }}
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onSelectExpense(expense.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[50px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                      >
                        <span>Open Details Page</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
