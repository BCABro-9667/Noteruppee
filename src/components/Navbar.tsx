import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Plus, LayoutDashboard, ReceiptText, BarChart3, UserCircle, WifiOff } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface NavbarProps {
  currentView: 'dashboard' | 'transactions' | 'analytics' | 'profile' | 'expense-detail';
  onNavigate: (view: 'dashboard' | 'transactions' | 'analytics' | 'profile') => void;
  onOpenCreateExpense: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenCreateExpense,
}) => {
  const { user, isOnline, currencySymbol } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-xl tracking-tight">
              {currencySymbol}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">Rupee<span className="text-blue-600">Track</span></span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 font-medium">Smart Expense Management</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-[50px] text-sm font-semibold transition-all ${
                currentView === 'dashboard' || currentView === 'expense-detail'
                  ? 'bg-blue-50 text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate('transactions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-[50px] text-sm font-semibold transition-all ${
                currentView === 'transactions'
                  ? 'bg-blue-50 text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <ReceiptText className="w-4 h-4" />
              <span>Transactions</span>
            </button>

            <button
              onClick={() => onNavigate('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-[50px] text-sm font-semibold transition-all ${
                currentView === 'analytics'
                  ? 'bg-blue-50 text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-[50px] text-sm font-semibold transition-all ${
                currentView === 'profile'
                  ? 'bg-blue-50 text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <UserCircle className="w-4 h-4" />
              <span>Profile & Settings</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isOnline && (
              <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-[50px] animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline Mode</span>
              </div>
            )}

            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>

            {/* Create Expense Desktop Button */}
            <button
              onClick={onOpenCreateExpense}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-[50px] text-sm font-bold shadow-sm shadow-blue-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Create Expense</span>
              <span className="sm:hidden">Create</span>
            </button>

            {/* User Profile Avatar Pill */}
            {user && (
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-[50px] border border-slate-200 hover:border-blue-400 bg-white transition-all shadow-2xs"
                title="View Profile & Settings"
              >
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover bg-blue-100"
                />
                <span className="hidden xl:inline text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
