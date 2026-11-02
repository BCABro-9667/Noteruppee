/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ExpenseProvider, useExpense } from './context/ExpenseContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { CreateExpenseModal } from './components/CreateExpenseModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { ExpenseDetailView } from './views/ExpenseDetailView.tsx';
import { TransactionsView } from './views/TransactionsView.tsx';
import { AnalyticsView } from './views/AnalyticsView.tsx';
import { ProfileSettingsView } from './views/ProfileSettingsView.tsx';
import { AuthView } from './views/AuthView.tsx';
import { Expense } from './types/index.ts';
import { WifiOff, Loader2 } from 'lucide-react';

function MainApp() {
  const { user, loading: authLoading, isOnline } = useAuth();
  const {
    activeExpenseId,
    setActiveExpenseId,
    deleteExpense,
  } = useExpense();

  // Navigation state
  const [currentView, setCurrentView] = useState<'dashboard' | 'transactions' | 'analytics' | 'profile' | 'expense-detail'>('dashboard');

  // Modals
  const [isCreateExpenseOpen, setIsCreateExpenseOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  // If activeExpenseId changes or user selects an expense, navigate to expense-detail
  const handleSelectExpense = (id: string) => {
    setActiveExpenseId(id);
    setCurrentView('expense-detail');
  };

  const handleBackToDashboard = () => {
    setActiveExpenseId(null);
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: 'dashboard' | 'transactions' | 'analytics' | 'profile') => {
    if (view === 'dashboard') {
      setActiveExpenseId(null);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteExpenseConfirm = async () => {
    if (!expenseToDelete) return;
    setIsDeletingExpense(true);
    try {
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
      if (currentView === 'expense-detail') {
        setCurrentView('dashboard');
      }
    } catch (err) {
      console.error('Failed to delete expense account', err);
    } finally {
      setIsDeletingExpense(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-4 animate-bounce">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-600">Loading RupeeTrack...</p>
      </div>
    );
  }

  // Not logged in -> Render Auth View
  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col text-slate-800">
      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-xs">
          <WifiOff className="w-3.5 h-3.5" />
          <span>You are offline. Cached data is available and changes will sync when connected.</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenCreateExpense={() => setIsCreateExpenseOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12">
        {currentView === 'dashboard' && (
          <DashboardView
            onSelectExpense={handleSelectExpense}
            onOpenCreateModal={() => setIsCreateExpenseOpen(true)}
            onDeleteExpense={(exp) => setExpenseToDelete(exp)}
          />
        )}

        {currentView === 'expense-detail' && (
          <ExpenseDetailView
            onBack={handleBackToDashboard}
            onDeleteExpense={() => {
              // find current expense
              if (activeExpenseId) {
                setExpenseToDelete({ id: activeExpenseId, name: 'this expense account' } as Expense);
              }
            }}
          />
        )}

        {currentView === 'transactions' && <TransactionsView />}

        {currentView === 'analytics' && <AnalyticsView />}

        {currentView === 'profile' && <ProfileSettingsView />}
      </main>

      {/* Mobile / PWA Bottom Navigation Bar */}
      <BottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenCreateExpense={() => setIsCreateExpenseOpen(true)}
      />

      {/* Create Expense Account Modal */}
      <CreateExpenseModal
        isOpen={isCreateExpenseOpen}
        onClose={() => setIsCreateExpenseOpen(false)}
        onSuccess={(id) => {
          handleSelectExpense(id);
        }}
      />

      {/* Delete Expense Account Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        title="Delete Expense Account"
        message={`Are you sure you want to delete "${expenseToDelete?.name}"? All associated transactions will be permanently deleted.`}
        confirmLabel="Delete Account"
        confirmVariant="danger"
        isLoading={isDeletingExpense}
        onConfirm={handleDeleteExpenseConfirm}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ExpenseProvider>
        <MainApp />
      </ExpenseProvider>
    </AuthProvider>
  );
}
