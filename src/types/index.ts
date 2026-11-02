export type TransactionType = 'DEBIT' | 'CREDIT';

export type DebitTerminology = 'Debit' | 'Take' | 'Liya';
export type CreditTerminology = 'Credit' | 'Give' | 'Diya';

export interface UserSettings {
  debitLabel: DebitTerminology;
  creditLabel: CreditTerminology;
  currencySymbol: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  settings: UserSettings;
}

export interface Expense {
  id: string;
  userId: string;
  name: string;
  initialAmount: number;
  category?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  expenseId: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  receiptUrl?: string;
  paymentMethod?: 'Cash' | 'UPI' | 'Card' | 'Net Banking' | 'Other';
  createdAt: string;
}

export interface ExpenseSummary {
  totalAmount: number;
  expendedAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  isOverspent: boolean;
}

export interface OverallSummary {
  totalCredit: number;
  totalDebit: number;
  netRemaining: number;
  expenseCount: number;
  transactionCount: number;
}
