import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Expense, ExpenseSummary, OverallSummary, Transaction } from '../types/index.ts';
import { api } from '../services/api.ts';
import { calculateExpenseSummary, calculateOverallSummary } from '../utils/calculations.ts';
import { useAuth } from './AuthContext.tsx';

interface ExpenseContextType {
  expenses: Expense[];
  transactions: Transaction[];
  loading: boolean;
  activeExpenseId: string | null;
  activeExpense: Expense | null;
  activeExpenseTransactions: Transaction[];
  activeExpenseSummary: ExpenseSummary | null;
  overallSummary: OverallSummary;
  setActiveExpenseId: (id: string | null) => void;
  refreshData: () => Promise<void>;
  createExpense: (data: { name: string; initialAmount: number; category?: string; color?: string }) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  createTransaction: (data: {
    expenseId: string;
    title: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    date?: string;
    time?: string;
    notes?: string;
    receiptUrl?: string;
    paymentMethod?: string;
  }) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  uploadReceipt: (base64: string) => Promise<string>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeExpenseId, setActiveExpenseId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshData = async () => {
    if (!user) {
      setExpenses([]);
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [expList, txList] = await Promise.all([
        api.getExpenses(),
        api.getTransactions(),
      ]);
      setExpenses(expList);
      setTransactions(txList);
    } catch (err) {
      console.warn('Failed to load expense data from server, relying on cache', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user?.id]);

  const activeExpense = useMemo(() => {
    if (!activeExpenseId) return null;
    return expenses.find((e) => e.id === activeExpenseId) || null;
  }, [expenses, activeExpenseId]);

  const activeExpenseTransactions = useMemo(() => {
    if (!activeExpenseId) return [];
    return transactions.filter((t) => t.expenseId === activeExpenseId);
  }, [transactions, activeExpenseId]);

  const activeExpenseSummary = useMemo(() => {
    if (!activeExpense) return null;
    return calculateExpenseSummary(activeExpense.initialAmount, activeExpenseTransactions);
  }, [activeExpense, activeExpenseTransactions]);

  const overallSummary = useMemo(() => {
    return calculateOverallSummary(expenses, transactions);
  }, [expenses, transactions]);

  // CRUD actions
  const createExpense = async (data: { name: string; initialAmount: number; category?: string; color?: string }) => {
    const newExp = await api.createExpense(data);
    setExpenses((prev) => [newExp, ...prev]);
    return newExp;
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    const updated = await api.updateExpense(id, data);
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  };

  const deleteExpense = async (id: string) => {
    await api.deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setTransactions((prev) => prev.filter((t) => t.expenseId !== id));
    if (activeExpenseId === id) {
      setActiveExpenseId(null);
    }
  };

  const createTransaction = async (data: {
    expenseId: string;
    title: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    date?: string;
    time?: string;
    notes?: string;
    receiptUrl?: string;
    paymentMethod?: string;
  }) => {
    const newTx = await api.createTransaction(data);
    setTransactions((prev) => [newTx, ...prev]);
    return newTx;
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    const updated = await api.updateTransaction(id, data);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const deleteTransaction = async (id: string) => {
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const uploadReceipt = async (base64: string) => {
    return await api.uploadImage(base64);
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        transactions,
        loading,
        activeExpenseId,
        activeExpense,
        activeExpenseTransactions,
        activeExpenseSummary,
        overallSummary,
        setActiveExpenseId,
        refreshData,
        createExpense,
        updateExpense,
        deleteExpense,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        uploadReceipt,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export function useExpense() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
}
