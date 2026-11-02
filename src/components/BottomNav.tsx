import React from 'react';
import { LayoutDashboard, ReceiptText, Plus, BarChart3, UserCircle } from 'lucide-react';

interface BottomNavProps {
  currentView: 'dashboard' | 'transactions' | 'analytics' | 'profile' | 'expense-detail';
  onNavigate: (view: 'dashboard' | 'transactions' | 'analytics' | 'profile') => void;
  onOpenCreateExpense: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenCreateExpense,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-around h-16 px-3 relative">
        {/* Home / Dashboard */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentView === 'dashboard' || currentView === 'expense-detail'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Home Dashboard"
        >
          <LayoutDashboard className={`w-5 h-5 ${currentView === 'dashboard' || currentView === 'expense-detail' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] mt-1">Home</span>
        </button>

        {/* Transactions */}
        <button
          onClick={() => onNavigate('transactions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentView === 'transactions'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="All Transactions"
        >
          <ReceiptText className={`w-5 h-5 ${currentView === 'transactions' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] mt-1">Transactions</span>
        </button>

        {/* Prominent Circular Royal Blue Create Expense Button */}
        <div className="relative flex-1 flex justify-center -top-5">
          <button
            onClick={onOpenCreateExpense}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 border-4 border-white transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
            aria-label="Create Expense"
            title="Create Expense"
          >
            <Plus className="w-7 h-7 stroke-[2.75]" />
          </button>
        </div>

        {/* Analytics (Before Profile!) */}
        <button
          onClick={() => onNavigate('analytics')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentView === 'analytics'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Financial Analytics"
        >
          <BarChart3 className={`w-5 h-5 ${currentView === 'analytics' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] mt-1">Analytics</span>
        </button>

        {/* Profile & Settings */}
        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentView === 'profile'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Profile and Settings"
        >
          <UserCircle className={`w-5 h-5 ${currentView === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
};
