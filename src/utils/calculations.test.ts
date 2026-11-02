import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExpenseSummary,
  calculateOverallSummary,
  formatCurrency,
  getLabelForType,
  filterAndSortTransactions,
} from './calculations.ts';
import { Expense, Transaction } from '../types/index.ts';

test('calculateExpenseSummary calculates Total, Expended, and Remaining correctly', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      expenseId: 'exp-1',
      userId: 'user-1',
      title: 'Additional Budget',
      amount: 5000,
      type: 'CREDIT',
      date: '2026-11-01',
      time: '10:00',
      createdAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 'tx-2',
      expenseId: 'exp-1',
      userId: 'user-1',
      title: 'Groceries',
      amount: 2500,
      type: 'DEBIT',
      date: '2026-11-01',
      time: '12:00',
      createdAt: '2026-11-01T12:00:00Z',
    },
    {
      id: 'tx-3',
      expenseId: 'exp-1',
      userId: 'user-1',
      title: 'Electricity Bill',
      amount: 1500,
      type: 'DEBIT',
      date: '2026-11-02',
      time: '09:00',
      createdAt: '2026-11-02T09:00:00Z',
    },
  ];

  // Initial amount: 10,000
  // Credit: 5,000 -> Total = 15,000
  // Debit: 2500 + 1500 = 4,000 Expended
  // Remaining = 15,000 - 4,000 = 11,000
  const summary = calculateExpenseSummary(10000, transactions);

  assert.equal(summary.totalAmount, 15000);
  assert.equal(summary.expendedAmount, 4000);
  assert.equal(summary.remainingAmount, 11000);
  assert.equal(summary.isOverspent, false);
  assert.equal(Math.round(summary.percentageUsed), Math.round((4000 / 15000) * 100));
});

test('calculateExpenseSummary handles overspent state', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      expenseId: 'exp-1',
      userId: 'user-1',
      title: 'Big Purchase',
      amount: 12000,
      type: 'DEBIT',
      date: '2026-11-02',
      time: '14:00',
      createdAt: '2026-11-02T14:00:00Z',
    },
  ];

  const summary = calculateExpenseSummary(10000, transactions);
  assert.equal(summary.totalAmount, 10000);
  assert.equal(summary.expendedAmount, 12000);
  assert.equal(summary.remainingAmount, -2000);
  assert.equal(summary.isOverspent, true);
});

test('calculateOverallSummary computes aggregates across all expenses', () => {
  const expenses: Expense[] = [
    { id: 'e1', userId: 'u1', name: 'Household', initialAmount: 20000, createdAt: '', updatedAt: '' },
    { id: 'e2', userId: 'u1', name: 'Travel', initialAmount: 10000, createdAt: '', updatedAt: '' },
  ];

  const transactions: Transaction[] = [
    { id: 't1', expenseId: 'e1', userId: 'u1', title: 'Salary Top-up', amount: 5000, type: 'CREDIT', date: '2026-11-01', time: '10:00', createdAt: '' },
    { id: 't2', expenseId: 'e1', userId: 'u1', title: 'Rent', amount: 15000, type: 'DEBIT', date: '2026-11-01', time: '11:00', createdAt: '' },
    { id: 't3', expenseId: 'e2', userId: 'u1', title: 'Hotel booking', amount: 8000, type: 'DEBIT', date: '2026-11-02', time: '15:00', createdAt: '' },
  ];

  // Total Credit: 20,000 + 10,000 + 5,000 = 35,000
  // Total Debit: 15,000 + 8,000 = 23,000
  // Net Remaining: 12,000
  const overall = calculateOverallSummary(expenses, transactions);

  assert.equal(overall.totalCredit, 35000);
  assert.equal(overall.totalDebit, 23000);
  assert.equal(overall.netRemaining, 12000);
  assert.equal(overall.expenseCount, 2);
  assert.equal(overall.transactionCount, 3);
});

test('formatCurrency formats Indian Rupee and symbols properly', () => {
  assert.equal(formatCurrency(100000, '₹'), '₹1,00,000');
  assert.equal(formatCurrency(2500.5, '₹'), '₹2,500.50');
  assert.equal(formatCurrency(-500, '₹'), '-₹500');
  assert.equal(formatCurrency(1250, '$'), '$1,250');
});

test('getLabelForType handles custom terminology correctly', () => {
  const settingsLiyaDiya = { debitLabel: 'Liya' as const, creditLabel: 'Diya' as const, currencySymbol: '₹' };
  assert.equal(getLabelForType('DEBIT', settingsLiyaDiya), 'Liya');
  assert.equal(getLabelForType('CREDIT', settingsLiyaDiya), 'Diya');

  const settingsTakeGive = { debitLabel: 'Take' as const, creditLabel: 'Give' as const, currencySymbol: '₹' };
  assert.equal(getLabelForType('DEBIT', settingsTakeGive), 'Take');
  assert.equal(getLabelForType('CREDIT', settingsTakeGive), 'Give');
});

test('filterAndSortTransactions filters by type and search query', () => {
  const sample: Transaction[] = [
    { id: '1', expenseId: 'e1', userId: 'u1', title: 'Supermarket', amount: 200, type: 'DEBIT', date: '2026-11-01', time: '10:00', createdAt: '' },
    { id: '2', expenseId: 'e1', userId: 'u1', title: 'Gift Money', amount: 500, type: 'CREDIT', date: '2026-11-02', time: '12:00', createdAt: '' },
    { id: '3', expenseId: 'e2', userId: 'u1', title: 'Train Ticket', amount: 1200, type: 'DEBIT', date: '2026-11-03', time: '14:00', createdAt: '' },
  ];

  const debitsOnly = filterAndSortTransactions(sample, { type: 'DEBIT' });
  assert.equal(debitsOnly.length, 2);

  const searchSuper = filterAndSortTransactions(sample, { searchQuery: 'market' });
  assert.equal(searchSuper.length, 1);
  assert.equal(searchSuper[0].title, 'Supermarket');

  const sortedHighest = filterAndSortTransactions(sample, { sortBy: 'highest' });
  assert.equal(sortedHighest[0].amount, 1200);
});
