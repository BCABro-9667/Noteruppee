import React, { useRef, useState } from 'react';
import { Expense, Transaction, ExpenseSummary } from '../types/index.ts';
import { formatCurrency, getLabelForType } from '../utils/calculations.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Printer, X, Download, ExternalLink, Check, ArrowLeft, FileText } from 'lucide-react';

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
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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

  const generateSlipHtml = () => {
    const slipEl = document.getElementById('printable-slip');
    const content = slipEl ? slipEl.innerHTML : (printAreaRef.current?.innerHTML || '');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${expense.name} - Statement Slip - RupeeTrack</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #ffffff;
      color: #0f172a;
      padding: 0;
      line-height: 1.5;
      font-size: 13px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .slip-box {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 15mm;
      background: #ffffff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
    }
    th {
      background-color: #f1f5f9;
      color: #334155;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      font-size: 12px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .text-rose { color: #e11d48; }
    .text-emerald { color: #059669; }
    .text-blue { color: #2563eb; }
    @media print {
      body { padding: 0; }
      .slip-box { padding: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="slip-box">
    ${content}
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
  };

  const handlePrint = () => {
    try {
      window.focus();

      // Try isolated hidden iframe print first to bypass iframe parent modals
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('title', 'Print Frame');
      document.body.appendChild(iframe);

      const html = generateSlipHtml();
      const iframeDoc = iframe.contentWindow?.document;

      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch {
              window.print();
            }
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 3000);
          }, 300);
        };
        return;
      }

      window.print();
    } catch {
      window.print();
    }
  };

  const handleDownloadSlip = () => {
    try {
      const html = generateSlipHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${expense.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-a4-statement-slip.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const handleOpenInNewTab = () => {
    try {
      const html = generateSlipHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      handlePrint();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col h-screen w-screen overflow-hidden animate-in fade-in duration-150">
      {/* Dedicated Top Action Bar (hidden during print) */}
      <div className="no-print bg-slate-950 text-white px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 shadow-lg z-10">
        {/* Left: Back / Close & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[50px] bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer shrink-0"
            title="Exit full dedicated print screen"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate">
                {expense.name} — Statement Slip
              </h2>

            </div>
           
          </div>
        </div>

        {/* Right: Actions (Download & Print on A4) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadSlip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[50px] bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer active:scale-95 border border-slate-700/80"
            title="Download slip as HTML file for offline printing"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Download Slip</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-[50px] bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer active:scale-95 border border-slate-700/80"
            title="Open in new window"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>New Window</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-1.5 rounded-[50px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition cursor-pointer active:scale-95"
            title="Print directly on A4 paper"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition cursor-pointer ml-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Dedicated Workspace / Paper Canvas */}
      <div className="flex-1 overflow-y-auto bg-slate-800/90 py-6 sm:py-10 px-2 sm:px-6 flex justify-center items-start print:bg-white print:p-0 print:overflow-visible">
        {/* Printable A4 Paper Sheet Preview Container */}
        <div
          ref={printAreaRef}
          id="printable-slip"
          className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm p-6 sm:p-12 border border-slate-200/90 font-sans print:max-w-none print:w-full print:min-h-0 print:border-none print:shadow-none print:p-0 print:m-0"
        >
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
      </div>

      {/* Subtle Dedicated Full-Screen Bottom Status Bar (hidden during print) */}
      <div className="no-print bg-slate-950/90 text-slate-400 border-t border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadSlip}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition px-2.5 py-1 rounded cursor-pointer"
          >
            <Download className="w-3 h-3 text-blue-400" />
            <span>Download</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1 rounded-[50px] bg-blue-600 hover:bg-blue-500 text-white font-bold transition cursor-pointer"
          >
            <Printer className="w-3 h-3" />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};
