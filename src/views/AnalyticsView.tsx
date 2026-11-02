import React, { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { formatCurrency } from '../utils/calculations.ts';
import {
  TrendingDown,
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  CreditCard,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { expenses, transactions } = useExpense();
  const { currencySymbol, debitLabel, creditLabel } = useAuth();

  const [timeRange, setTimeRange] = useState<'ALL' | '30DAYS' | 'THIS_MONTH'>('ALL');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('ALL');

  // Filter transactions based on time range and selected expense account
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      // Expense filter
      if (selectedExpenseId !== 'ALL' && tx.expenseId !== selectedExpenseId) {
        return false;
      }

      // Date filter
      if (timeRange === 'ALL') return true;
      const txDate = new Date(tx.date);
      if (isNaN(txDate.getTime())) return true;

      if (timeRange === '30DAYS') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return txDate >= thirtyDaysAgo;
      }

      if (timeRange === 'THIS_MONTH') {
        return (
          txDate.getFullYear() === now.getFullYear() &&
          txDate.getMonth() === now.getMonth()
        );
      }

      return true;
    });
  }, [transactions, selectedExpenseId, timeRange]);

  // Key Aggregates
  const aggregates = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const tx of filteredTransactions) {
      if (tx.type === 'DEBIT') {
        totalDebit += tx.amount;
      } else {
        totalCredit += tx.amount;
      }
    }

    const netSavings = totalCredit - totalDebit;
    const savingsRate =
      totalCredit > 0 ? Math.max(0, Math.round(((totalCredit - totalDebit) / totalCredit) * 100)) : 0;

    return {
      totalDebit,
      totalCredit,
      netSavings,
      savingsRate,
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Category Distribution (from expense categories)
  const categoryBreakdown = useMemo(() => {
    const expenseCatMap = new Map<string, string>();
    for (const exp of expenses) {
      expenseCatMap.set(exp.id, exp.category || 'General');
    }

    const catTotals = new Map<string, number>();
    for (const tx of filteredTransactions) {
      if (tx.type === 'DEBIT') {
        const cat = expenseCatMap.get(tx.expenseId) || 'General';
        catTotals.set(cat, (catTotals.get(cat) || 0) + tx.amount);
      }
    }

    const entries = Array.from(catTotals.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: aggregates.totalDebit > 0 ? (amount / aggregates.totalDebit) * 100 : 0,
    }));

    return entries.sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, expenses, aggregates.totalDebit]);

  // Account Spending Breakdown
  const accountBreakdown = useMemo(() => {
    const accMap = new Map<string, { name: string; debit: number; credit: number; color: string }>();
    for (const exp of expenses) {
      accMap.set(exp.id, { name: exp.name, debit: 0, credit: 0, color: exp.color || '#2563EB' });
    }

    for (const tx of filteredTransactions) {
      const acc = accMap.get(tx.expenseId);
      if (acc) {
        if (tx.type === 'DEBIT') acc.debit += tx.amount;
        else acc.credit += tx.amount;
      }
    }

    return Array.from(accMap.entries()).map(([id, data]) => ({
      id,
      ...data,
    })).sort((a, b) => b.debit - a.debit);
  }, [expenses, filteredTransactions]);

  // Payment Methods Breakdown
  const paymentMethodBreakdown = useMemo(() => {
    const methodMap = new Map<string, number>();
    for (const tx of filteredTransactions) {
      if (tx.type === 'DEBIT') {
        const method = tx.paymentMethod || 'Other / Cash';
        methodMap.set(method, (methodMap.get(method) || 0) + tx.amount);
      }
    }

    return Array.from(methodMap.entries()).map(([method, amount]) => ({
      method,
      amount,
      percentage: aggregates.totalDebit > 0 ? (amount / aggregates.totalDebit) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, aggregates.totalDebit]);

  // Top 5 Expenses
  const topTransactions = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'DEBIT')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredTransactions]);

  const CATEGORY_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-150 max-w-7xl mx-auto">
      {/* Top Royal Blue Horizontal Curved Banner with Key Metrics */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white rounded-3xl p-4 sm:p-5 shadow-sm shadow-blue-500/15 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Title & Transactions info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-200" />
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Financial Analytics
              </h1>
            </div>
            <p className="text-xs text-blue-100 mt-1">
              Visual insights, cash flow breakdown & category spending
            </p>
          </div>

          {/* Right: Three Amounts in ONE Line Horizontally */}
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 overflow-x-auto no-scrollbar shrink-0 pt-1 md:pt-0">
            {/* Total In (Diya/Credit) */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] sm:text-xs font-semibold text-blue-100 uppercase tracking-wider">
                Total In ({creditLabel})
              </div>
              <div className="text-sm sm:text-lg font-black text-emerald-200">
                +{formatCurrency(aggregates.totalCredit, currencySymbol)}
              </div>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-7 bg-white/25 shrink-0" />

            {/* Total Out (Liya/Debit) */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] sm:text-xs font-semibold text-blue-100 uppercase tracking-wider">
                Expended ({debitLabel})
              </div>
              <div className="text-sm sm:text-lg font-black text-rose-200">
                −{formatCurrency(aggregates.totalDebit, currencySymbol)}
              </div>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-7 bg-white/25 shrink-0" />

            {/* Net / Savings */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] sm:text-xs font-semibold text-blue-100 uppercase tracking-wider">
                Net Balance
              </div>
              <div
                className={`text-sm sm:text-lg font-black ${
                  aggregates.netSavings >= 0 ? 'text-white' : 'text-rose-200'
                }`}
              >
                {aggregates.netSavings < 0 ? '−' : ''}
                {formatCurrency(Math.abs(aggregates.netSavings), currencySymbol)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Selector Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Time Period Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-[50px] w-fit">
          <button
            onClick={() => setTimeRange('ALL')}
            className={`px-3.5 py-1.5 rounded-[50px] text-xs font-bold transition ${
              timeRange === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeRange('THIS_MONTH')}
            className={`px-3.5 py-1.5 rounded-[50px] text-xs font-bold transition ${
              timeRange === 'THIS_MONTH'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeRange('30DAYS')}
            className={`px-3.5 py-1.5 rounded-[50px] text-xs font-bold transition ${
              timeRange === '30DAYS'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 30 Days
          </button>
        </div>

        {/* Expense Account Filter Dropdown */}
        <div className="w-full sm:w-64">
          <select
            value={selectedExpenseId}
            onChange={(e) => setSelectedExpenseId(e.target.value)}
            className="w-full px-4 py-2 rounded-[50px] border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Expense Accounts</option>
            {expenses.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column Grid: Cash Flow Ratio & Category Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Cash Flow Comparison Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xs border-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Cash Flow Comparison</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-[50px] bg-slate-100 text-slate-600">
              {aggregates.transactionCount} transactions
            </span>
          </div>

          {/* Visual Side-by-Side Comparative Progress Bars */}
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Money In ({creditLabel})
                </span>
                <span className="text-emerald-700">
                  +{formatCurrency(aggregates.totalCredit, currencySymbol)}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      aggregates.totalCredit + aggregates.totalDebit > 0
                        ? (aggregates.totalCredit / (aggregates.totalCredit + aggregates.totalDebit)) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-rose-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Money Out ({debitLabel})
                </span>
                <span className="text-rose-700">
                  −{formatCurrency(aggregates.totalDebit, currencySymbol)}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      aggregates.totalCredit + aggregates.totalDebit > 0
                        ? (aggregates.totalDebit / (aggregates.totalCredit + aggregates.totalDebit)) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Ratio Summary Pill */}
          <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Spending vs Income Ratio:</span>
            <span className="font-extrabold text-slate-900">
              {aggregates.totalCredit > 0
                ? `${Math.round((aggregates.totalDebit / aggregates.totalCredit) * 100)}% expended`
                : 'No income logged'}
            </span>
          </div>
        </div>

        {/* Category Spending Breakdown */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xs border-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span>Category Breakdown</span>
            </h2>
            <span className="text-xs font-medium text-slate-400">By Expended Amount</span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No debit transactions in this period.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {categoryBreakdown.map((cat, idx) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                      />
                      {cat.category}
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(cat.amount, currencySymbol)} ({Math.round(cat.percentage)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Grid: Accounts Breakdown & Top Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Account Spending Comparison */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xs border-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Spending by Expense Account</span>
            </h2>
          </div>

          <div className="space-y-3 pt-1">
            {accountBreakdown.map((acc) => (
              <div key={acc.id} className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 transition space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: acc.color }} />
                    <span className="truncate max-w-[180px] sm:max-w-xs">{acc.name}</span>
                  </div>
                  <div className="text-right font-extrabold text-rose-600">
                    {formatCurrency(acc.debit, currencySymbol)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Largest Debits */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xs border-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Highest Transactions</span>
            </h2>
            <span className="text-xs font-medium text-slate-400">Top debits</span>
          </div>

          {topTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topTransactions.map((tx, idx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{tx.title}</p>
                      <p className="text-[11px] text-slate-400">{tx.date}</p>
                    </div>
                  </div>
                  <div className="font-extrabold text-rose-600 shrink-0">
                    −{formatCurrency(tx.amount, currencySymbol)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
