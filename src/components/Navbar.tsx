import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Plus,
  LayoutDashboard,
  ReceiptText,
  BarChart3,
  UserCircle,
  WifiOff,
  LogOut,
  ChevronDown,
  User,
} from 'lucide-react';
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
  const { user, isOnline, currencySymbol, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset avatar error when user.avatarUrl changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

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
              className={`flex items-center gap-2 px-4 py-2 rounded-[50px] text-sm font-semibold transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-[50px] text-sm font-semibold transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-[50px] text-sm font-semibold transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-[50px] text-sm font-semibold transition-all cursor-pointer ${
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

            {/* Create Expense Button - hidden on mobile devices since mobile bottom nav contains the (+) button */}
            <button
              onClick={onOpenCreateExpense}
              className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-[50px] text-sm font-bold shadow-sm shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Expense</span>
            </button>

            {/* User Profile Avatar Pill with Dropdown containing Logout */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:pl-1 sm:pr-2.5 rounded-full sm:rounded-[50px] border border-slate-200 hover:border-blue-400 bg-white transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Account menu"
                  aria-expanded={isProfileMenuOpen}
                >
                  {/* High visibility avatar with robust fallback */}
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-blue-500/20 bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                    {!avatarError && user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        onError={() => setAvatarError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-blue-500/20 bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                        {!avatarError && user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            onError={() => setAvatarError(true)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{userInitial}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Navigation Options */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onNavigate('profile');
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Profile & Settings</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onNavigate('dashboard');
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer md:hidden"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        <span>Dashboard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onNavigate('transactions');
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer md:hidden"
                      >
                        <ReceiptText className="w-4 h-4 text-slate-400" />
                        <span>Transactions</span>
                      </button>
                    </div>

                    {/* Logout Option */}
                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Sign Out (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

