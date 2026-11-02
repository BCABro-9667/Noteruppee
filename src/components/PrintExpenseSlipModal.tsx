import React, { useRef } from 'react';
import { Expense, Transaction, ExpenseSummary } from '../types/index.ts';
import { formatCurrency, getLabelForType } from '../utils/calculations.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Printer, X, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PrintExpenseSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense;
  transactions: Transaction[];
  summary: ExpenseSummary;
}

export const PrintExpenseSlipModal: React.FC<PrintExpenseSlipModalProps> = ({
  isOpen,
  onClose,
  expense,
  transactions,
  summary,
}) => {
  const { user, currencySymbol } = useAuth();
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const now = new Date();
  const formattedGeneratedDate = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedGeneratedTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const slipReferenceId = `RT-${expense.id.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Container - on screen it is a modal, on print it fills the printed page */}
      <div className="bg-white rounded-3xl w-full max-w-3xl my-auto shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* On-Screen Modal Header (hidden during print) */}
        <div className="no-print flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Expense Statement & Settlement Slip</h3>
              <p className="text-[11px] text-slate-500">Preview and print or save as PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[50px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Slip Content */}
        <div ref={printAreaRef} className="p-6 sm:p-8 overflow-y-auto print:p-0 print:overflow-visible text-slate-900 font-sans">
          {/* Slip Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                  {currencySymbol}
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">
                    Rupee<span className="text-blue-600">Track</span>
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium">Expense Statement & Settlement Slip</p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs">
              <div className="font-bold text-slate-800">Reference: <span className="font-mono text-blue-600">{slipReferenceId}</span></div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Generated: {formattedGeneratedDate} at {formattedGeneratedTime}
              </div>
              <div className="text-slate-500 text-[11px]">
                Account Holder: <span className="font-semibold text-slate-700">{user?.name || 'Authorized User'}</span>
              </div>
            </div>
          </div>

          {/* Expense Top Details Box */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expense Account</span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">{expense.name}</h2>
                {expense.category && (
                  <span className="inline-block mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Category: {expense.category}
                  </span>
                )}
              </div>
              <div className="text-left sm:text-right text-xs text-slate-500">
                <div>Created: <span className="font-semibold text-slate-700">{new Date(expense.createdAt).toLocaleDateString()}</span></div>
                <div>Total Transactions: <span className="font-semibold text-slate-700">{transactions.length}</span></div>
              </div>
            </div>

            {/* Three Amount Summary Row */}
            <div className="grid grid-cols-3 gap-3 pt-3 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Budget</span>
                <span className="text-sm sm:text-base font-black text-slate-900 block mt-0.5">
                  {formatCurrency(summary.totalAmount, currencySymbol)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Expended (Out)</span>
                <span className="text-sm sm:text-base font-black text-rose-600 block mt-0.5">
                  {formatCurrency(summary.expendedAmount, currencySymbol)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Remaining Balance</span>
                <span className={`text-sm sm:text-base font-black block mt-0.5 ${summary.remainingAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(summary.remainingAmount, currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          {/* Transactions Table Section */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              Transaction Ledger Details
            </h3>

            {transactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No transactions recorded for this expense account.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-12 text-center">Sr. No.</th>
                      <th className="py-2.5 px-3">Transaction Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Payment / Note</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {transactions.map((tx, idx) => {
                      const isDebit = tx.type === 'DEBIT';
                      const label = getLabelForType(tx.type, user?.settings);
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{tx.title}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                isDebit ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{tx.date}</td>
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{tx.time}</td>
                          <td className="py-2.5 px-3 text-slate-500 max-w-[160px] truncate">
                            {tx.paymentMethod ? `${tx.paymentMethod}` : ''}
                            {tx.notes ? (tx.paymentMethod ? ` • ${tx.notes}` : tx.notes) : '—'}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-extrabold whitespace-nowrap ${
                              isDebit ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {isDebit ? '−' : '+'}{formatCurrency(tx.amount, currencySymbol)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                      <td colSpan={6} className="py-2.5 px-3 text-right text-xs">
                        Net Settled Expended Total:
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs font-black text-rose-600">
                        {formatCurrency(summary.expendedAmount, currencySymbol)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* System Generated Slip Notice */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-center">
            <p className="text-[11px] font-semibold text-slate-500 italic">
              *** This is a system generated slip and does not require a physical signature. ***
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Generated by RupeeTrack Smart Expense Management
            </p>
          </div>
        </div>

        {/* Modal Bottom Action Controls (hidden during print) */}
        <div className="no-print p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Use your browser printer or choose &quot;Save as PDF&quot;.
          </span>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-[50px] border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 rounded-[50px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
