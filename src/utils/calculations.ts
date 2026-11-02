import { Expense, ExpenseSummary, OverallSummary, Transaction, TransactionType, UserSettings } from '../types/index.ts';

/**
 * Calculates Total, Expended, and Remaining amounts for a single expense according to business logic:
 * Total Amount = Initial Amount (allocated budget/seed) + Sum of all Credit transactions.
 * Expended Amount = Sum of all Debit transactions.
 * Remaining Amount = Total Amount - Expended Amount.
 */
export function calculateExpenseSummary(
  initialAmount: number,
  transactions: Transaction[]
): ExpenseSummary {
  const safeInitial = Math.max(0, Number(initialAmount) || 0);

  let creditSum = 0;
  let debitSum = 0;

  for (const tx of transactions) {
    const amt = Math.max(0, Number(tx.amount) || 0);
    if (tx.type === 'CREDIT') {
      creditSum += amt;
    } else if (tx.type === 'DEBIT') {
      debitSum += amt;
    }
  }

  const totalAmount = safeInitial + creditSum;
  const expendedAmount = debitSum;
  const remainingAmount = totalAmount - expendedAmount;
  const percentageUsed = totalAmount > 0 ? Math.min(100, Math.max(0, (expendedAmount / totalAmount) * 100)) : 0;
  const isOverspent = remainingAmount < 0;

  return {
    totalAmount,
    expendedAmount,
    remainingAmount,
    percentageUsed,
    isOverspent,
  };
}

/**
 * Calculates overall summary across all expenses and transactions for a user
 */
export function calculateOverallSummary(
  expenses: Expense[],
  transactions: Transaction[]
): OverallSummary {
  let totalCredit = 0;
  let totalDebit = 0;

  // Add initial amounts of all expenses as starting credits
  for (const exp of expenses) {
    totalCredit += Math.max(0, Number(exp.initialAmount) || 0);
  }

  for (const tx of transactions) {
    const amt = Math.max(0, Number(tx.amount) || 0);
    if (tx.type === 'CREDIT') {
      totalCredit += amt;
    } else if (tx.type === 'DEBIT') {
      totalDebit += amt;
    }
  }

  const netRemaining = totalCredit - totalDebit;

  return {
    totalCredit,
    totalDebit,
    netRemaining,
    expenseCount: expenses.length,
    transactionCount: transactions.length,
  };
}

/**
 * Formats a numeric amount with the selected currency symbol and Indian / international grouping
 */
export function formatCurrency(amount: number, symbol: string = '₹'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formattedNumber: string;

  if (symbol === '₹') {
    // Format according to Indian numbering system: e.g. 1,00,000.00
    const parts = absAmount.toFixed(2).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    formattedNumber = decimalPart === '00' ? formattedInt : `${formattedInt}.${decimalPart}`;
  } else {
    // Standard international numbering system
    formattedNumber = absAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  return `${isNegative ? '-' : ''}${symbol}${formattedNumber}`;
}

/**
 * Returns the customized terminology label for Debit/Credit
 */
export function getLabelForType(type: TransactionType, settings?: Partial<UserSettings>): string {
  if (type === 'CREDIT') {
    return settings?.creditLabel || 'Credit';
  }
  return settings?.debitLabel || 'Debit';
}

export interface TransactionFilterOptions {
  type?: 'ALL' | 'DEBIT' | 'CREDIT';
  expenseId?: string;
  searchQuery?: string;
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
  startDate?: string;
  endDate?: string;
}

/**
 * Filters and sorts transactions cleanly
 */
export function filterAndSortTransactions(
  transactions: Transaction[],
  options: TransactionFilterOptions
): Transaction[] {
  let result = [...transactions];

  if (options.type && options.type !== 'ALL') {
    result = result.filter((t) => t.type === options.type);
  }

  if (options.expenseId && options.expenseId !== 'ALL') {
    result = result.filter((t) => t.expenseId === options.expenseId);
  }

  if (options.searchQuery && options.searchQuery.trim() !== '') {
    const q = options.searchQuery.toLowerCase().trim();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.paymentMethod && t.paymentMethod.toLowerCase().includes(q))
    );
  }

  if (options.startDate) {
    result = result.filter((t) => t.date >= options.startDate!);
  }

  if (options.endDate) {
    result = result.filter((t) => t.date <= options.endDate!);
  }

  const sort = options.sortBy || 'newest';
  result.sort((a, b) => {
    if (sort === 'highest') {
      return b.amount - a.amount;
    }
    if (sort === 'lowest') {
      return a.amount - b.amount;
    }
    const dtA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
    const dtB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
    if (sort === 'oldest') {
      return dtA - dtB;
    }
    return dtB - dtA; // newest default
  });

  return result;
}
