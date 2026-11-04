import React from 'react';

export const ExpenseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-2xs border-0 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-200" />
          <div className="space-y-1.5">
            <div className="w-28 h-4 bg-slate-200 rounded-md" />
            <div className="w-16 h-3 bg-slate-100 rounded-md" />
          </div>
        </div>
        <div className="w-16 h-5 bg-slate-200 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="p-2.5 rounded-2xl bg-slate-50 space-y-1">
          <div className="w-12 h-2.5 bg-slate-200 rounded" />
          <div className="w-20 h-4 bg-slate-200 rounded" />
        </div>
        <div className="p-2.5 rounded-2xl bg-slate-50 space-y-1">
          <div className="w-14 h-2.5 bg-slate-200 rounded" />
          <div className="w-20 h-4 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center pb-2">
        <div className="space-y-2">
          <div className="w-48 h-7 bg-slate-200 rounded-lg" />
          <div className="w-64 h-3.5 bg-slate-100 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <ExpenseCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
};

export const TransactionItemSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-2xs border-0 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
        <div className="space-y-1.5">
          <div className="w-32 h-4 bg-slate-200 rounded" />
          <div className="flex items-center gap-2">
            <div className="w-16 h-3 bg-slate-100 rounded" />
            <div className="w-20 h-3 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
      <div className="space-y-1 text-right">
        <div className="w-20 h-4 bg-slate-200 rounded ml-auto" />
        <div className="w-12 h-3 bg-slate-100 rounded ml-auto" />
      </div>
    </div>
  );
};

export const TransactionsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top summary card skeleton */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xs border-0">
        <div className="flex justify-between items-center mb-4">
          <div className="w-36 h-4 bg-slate-200 rounded" />
          <div className="w-20 h-4 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5">
            <div className="w-12 h-2.5 bg-slate-200 rounded" />
            <div className="w-24 h-5 bg-slate-200 rounded" />
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5">
            <div className="w-12 h-2.5 bg-slate-200 rounded" />
            <div className="w-24 h-5 bg-slate-200 rounded" />
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5">
            <div className="w-16 h-2.5 bg-slate-200 rounded" />
            <div className="w-24 h-5 bg-slate-200 rounded" />
          </div>
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="bg-white rounded-2xl p-3 shadow-2xs border-0 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100" />
        <div className="flex-1 h-9 bg-slate-100 rounded-[50px]" />
      </div>

      {/* Transactions list skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <TransactionItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center pb-2">
        <div className="space-y-1.5">
          <div className="w-40 h-6 bg-slate-200 rounded" />
          <div className="w-56 h-3.5 bg-slate-100 rounded" />
        </div>
        <div className="w-28 h-8 bg-slate-200 rounded-[50px]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-5 shadow-2xs border-0 space-y-2">
            <div className="w-16 h-3 bg-slate-200 rounded" />
            <div className="w-28 h-6 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-2xs border-0 space-y-4">
        <div className="w-36 h-4 bg-slate-200 rounded" />
        <div className="h-56 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );
};
