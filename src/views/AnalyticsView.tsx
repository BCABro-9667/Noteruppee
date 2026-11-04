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
import { AnalyticsSkeleton } from '../components/SkeletonLoader.tsx';

export const AnalyticsView: React.FC = () => {
  const { expenses, transactions, loading } = useExpense();
  const { currencySymbol, debitLabel, creditLabel } = useAuth();

  const [timeRange, setTimeRange] = useState<'ALL' | '30DAYS' | 'THIS_MONTH'>('ALL');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('ALL');
  const [barChartMode, setBarChartMode] = useState<'cashflow' | 'category'>('cashflow');
  const [hoveredBarId, setHoveredBarId] = useState<string | null>(null);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

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

  // Group transactions for timeline Bar Chart
  const timelineBarData = useMemo(() => {
    const groupMap = new Map<string, { label: string; credit: number; debit: number; count: number }>();
    const sorted = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));

    if (sorted.length === 0) return [];

    const monthsSet = new Set(sorted.map((t) => t.date.slice(0, 7)));

    if (monthsSet.size <= 1 && (timeRange === 'THIS_MONTH' || timeRange === '30DAYS')) {
      // Group by single dates
      for (const tx of sorted) {
        const key = tx.date;
        if (!groupMap.has(key)) {
          const parts = key.split('-');
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          const label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
          groupMap.set(key, { label, credit: 0, debit: 0, count: 0 });
        }
        const item = groupMap.get(key)!;
        if (tx.type === 'CREDIT') item.credit += tx.amount;
        else item.debit += tx.amount;
        item.count += 1;
      }
    } else {
      // Group by Month (YYYY-MM)
      for (const tx of sorted) {
        const key = tx.date.slice(0, 7);
        if (!groupMap.has(key)) {
          const parts = key.split('-');
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
          const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          groupMap.set(key, { label, credit: 0, debit: 0, count: 0 });
        }
        const item = groupMap.get(key)!;
        if (tx.type === 'CREDIT') item.credit += tx.amount;
        else item.debit += tx.amount;
        item.count += 1;
      }
    }

    return Array.from(groupMap.entries()).map(([key, data]) => ({
      key,
      ...data,
    }));
  }, [filteredTransactions, timeRange]);

  const maxTimelineVal = useMemo(() => {
    let max = 0;
    for (const item of timelineBarData) {
      if (item.credit > max) max = item.credit;
      if (item.debit > max) max = item.debit;
    }
    return max > 0 ? max : 1;
  }, [timelineBarData]);

  const maxCategoryVal = useMemo(() => {
    let max = 0;
    for (const cat of categoryBreakdown) {
      if (cat.amount > max) max = cat.amount;
    }
    return max > 0 ? max : 1;
  }, [categoryBreakdown]);

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

      {/* Visual Bar Chart Analytics Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xs border border-slate-200/90 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Financial Bar Chart</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {barChartMode === 'cashflow'
                ? `Comparative timeline bars for ${creditLabel} (In) vs ${debitLabel} (Out)`
                : 'Vertical breakdown of expenditures across categories'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mode Toggle Buttons */}
            <div className="flex items-center p-1 bg-slate-100 rounded-[50px]">
              <button
                type="button"
                onClick={() => setBarChartMode('cashflow')}
                className={`px-3 py-1.5 rounded-[50px] text-xs font-bold transition cursor-pointer ${
                  barChartMode === 'cashflow'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cash Flow Bars
              </button>
              <button
                type="button"
                onClick={() => setBarChartMode('category')}
                className={`px-3 py-1.5 rounded-[50px] text-xs font-bold transition cursor-pointer ${
                  barChartMode === 'category'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Category Bars
              </button>
            </div>

            {/* Legend Indicators */}
            {barChartMode === 'cashflow' && (
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-[50px]">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  +{creditLabel}
                </span>
                <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-[50px]">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                  −{debitLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart Visualization Canvas */}
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            No transactions found for the selected time range and account filters.
          </div>
        ) : barChartMode === 'cashflow' ? (
          /* Mode 1: Cash Flow Timeline Bar Chart */
          <div className="space-y-2">
            <div className="relative h-64 sm:h-72 w-full pt-6 pb-6 flex items-end">
              {/* Background Grid Lines with Y-Axis Percent / Scale */}
              <div className="absolute inset-x-0 top-6 bottom-6 flex flex-col justify-between pointer-events-none text-[10px] text-slate-300 font-semibold">
                <div className="border-b border-dashed border-slate-100 w-full flex justify-between">
                  <span>{formatCurrency(maxTimelineVal, currencySymbol)}</span>
                  <span className="text-slate-300">100%</span>
                </div>
                <div className="border-b border-dashed border-slate-100 w-full flex justify-between">
                  <span>{formatCurrency(maxTimelineVal * 0.75, currencySymbol)}</span>
                  <span className="text-slate-300">75%</span>
                </div>
                <div className="border-b border-dashed border-slate-100 w-full flex justify-between">
                  <span>{formatCurrency(maxTimelineVal * 0.5, currencySymbol)}</span>
                  <span className="text-slate-300">50%</span>
                </div>
                <div className="border-b border-dashed border-slate-100 w-full flex justify-between">
                  <span>{formatCurrency(maxTimelineVal * 0.25, currencySymbol)}</span>
                  <span className="text-slate-300">25%</span>
                </div>
                <div className="border-b border-slate-200 w-full flex justify-between text-slate-400 font-bold">
                  <span>0</span>
                  <span>0%</span>
                </div>
              </div>

              {/* Grouped Vertical Bar Columns */}
              <div className="relative z-10 w-full h-full flex items-end justify-around gap-2 sm:gap-4 px-2 overflow-x-auto no-scrollbar">
                {timelineBarData.map((item) => {
                  const creditHeight = maxTimelineVal > 0 ? (item.credit / maxTimelineVal) * 100 : 0;
                  const debitHeight = maxTimelineVal > 0 ? (item.debit / maxTimelineVal) * 100 : 0;
                  const isHovered = hoveredBarId === item.key;

                  return (
                    <div
                      key={item.key}
                      onMouseEnter={() => setHoveredBarId(item.key)}
                      onMouseLeave={() => setHoveredBarId(null)}
                      className="flex flex-col items-center flex-1 min-w-[56px] max-w-[90px] h-full justify-end group cursor-pointer relative"
                    >
                      {/* Interactive Floating Hover Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-12 z-30 bg-slate-900 text-white rounded-xl py-1.5 px-3 shadow-xl text-[11px] whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
                          <div className="font-bold text-center border-b border-slate-700 pb-0.5 mb-1 text-slate-200">
                            {item.label}
                          </div>
                          <div className="flex items-center justify-between gap-3 text-emerald-400">
                            <span>In:</span>
                            <span className="font-extrabold">+{formatCurrency(item.credit, currencySymbol)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-rose-400">
                            <span>Out:</span>
                            <span className="font-extrabold">−{formatCurrency(item.debit, currencySymbol)}</span>
                          </div>
                          <div className="border-t border-slate-700/80 pt-0.5 mt-0.5 text-center text-[10px] text-slate-300">
                            Net: {item.credit - item.debit >= 0 ? '+' : '−'}
                            {formatCurrency(Math.abs(item.credit - item.debit), currencySymbol)}
                          </div>
                        </div>
                      )}

                      {/* Side-by-Side Bars Container */}
                      <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-full pb-0.5">
                        {/* Money In Bar (Emerald) */}
                        <div className="flex flex-col items-center justify-end h-full w-3.5 sm:w-5">
                          <div
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              isHovered ? 'bg-emerald-600 ring-2 ring-emerald-300' : 'bg-emerald-500'
                            }`}
                            style={{
                              height: item.credit > 0 ? `${Math.max(6, Math.round(creditHeight))}%` : '2px',
                            }}
                          />
                        </div>

                        {/* Money Out Bar (Rose) */}
                        <div className="flex flex-col items-center justify-end h-full w-3.5 sm:w-5">
                          <div
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              isHovered ? 'bg-rose-600 ring-2 ring-rose-300' : 'bg-rose-500'
                            }`}
                            style={{
                              height: item.debit > 0 ? `${Math.max(6, Math.round(debitHeight))}%` : '2px',
                            }}
                          />
                        </div>
                      </div>

                      {/* X-Axis Date / Period Label */}
                      <div className="mt-2 text-[11px] font-bold text-slate-600 truncate text-center w-full">
                        {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Legend */}
            <div className="flex sm:hidden items-center justify-center gap-3 pt-2 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-[50px]">
                <span className="w-2 h-2 rounded-xs bg-emerald-500" />
                +{creditLabel}
              </span>
              <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-[50px]">
                <span className="w-2 h-2 rounded-xs bg-rose-500" />
                −{debitLabel}
              </span>
            </div>
          </div>
        ) : (
          /* Mode 2: Category Spending Vertical Bar Chart */
          <div className="space-y-2">
            {categoryBreakdown.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No expense debit transactions to plot.
              </div>
            ) : (
              <div className="relative h-64 sm:h-72 w-full pt-6 pb-6 flex items-end">
                {/* Background Grid Lines */}
                <div className="absolute inset-x-0 top-6 bottom-6 flex flex-col justify-between pointer-events-none text-[10px] text-slate-300 font-semibold">
                  <div className="border-b border-dashed border-slate-100 w-full flex justify-between">
                    <span>{formatCurrency(maxCategoryVal, currencySymbol)}</span>
                    <span className="text-slate-300">100%</span>
                  </div>
                  <div className="border-b border-dashed border-slate-100 w-full flex justify-between">
                    <span>{formatCurrency(maxCategoryVal * 0.5, currencySymbol)}</span>
                    <span className="text-slate-300">50%</span>
                  </div>
                  <div className="border-b border-slate-200 w-full flex justify-between text-slate-400 font-bold">
                    <span>0</span>
                    <span>0%</span>
                  </div>
                </div>

                {/* Vertical Category Pillar Bars */}
                <div className="relative z-10 w-full h-full flex items-end justify-around gap-2 sm:gap-4 px-2 overflow-x-auto no-scrollbar">
                  {categoryBreakdown.map((cat, idx) => {
                    const heightPercent = maxCategoryVal > 0 ? (cat.amount / maxCategoryVal) * 100 : 0;
                    const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                    const isHovered = hoveredBarId === cat.category;

                    return (
                      <div
                        key={cat.category}
                        onMouseEnter={() => setHoveredBarId(cat.category)}
                        onMouseLeave={() => setHoveredBarId(null)}
                        className="flex flex-col items-center flex-1 min-w-[54px] max-w-[80px] h-full justify-end group cursor-pointer relative"
                      >
                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-10 z-30 bg-slate-900 text-white rounded-xl py-1 px-2.5 shadow-xl text-[11px] whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
                            <span className="font-bold">{cat.category}: </span>
                            <span className="text-blue-300 font-extrabold">
                              {formatCurrency(cat.amount, currencySymbol)} ({Math.round(cat.percentage)}%)
                            </span>
                          </div>
                        )}

                        {/* Top Amount Label (visible on larger screens) */}
                        <div className="text-[10px] font-black text-slate-700 mb-1 truncate hidden sm:block">
                          {formatCurrency(cat.amount, currencySymbol)}
                        </div>

                        {/* Vertical Category Pillar Bar */}
                        <div className="w-full flex justify-center h-full items-end pb-0.5">
                          <div
                            className={`w-7 sm:w-10 rounded-t-lg transition-all duration-300 ${
                              isHovered ? 'brightness-110 ring-2 ring-slate-400/50' : ''
                            }`}
                            style={{
                              height: `${Math.max(8, Math.round(heightPercent))}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>

                        {/* Category Name on X-Axis */}
                        <div className="mt-2 text-[11px] font-bold text-slate-600 truncate text-center w-full">
                          {cat.category}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
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
