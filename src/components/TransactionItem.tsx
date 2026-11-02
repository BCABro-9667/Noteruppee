import React, { useState } from 'react';
import { Transaction } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { formatCurrency, getLabelForType } from '../utils/calculations.ts';
import {
  MoreVertical,
  Edit2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  FileText,
  CreditCard,
  ExternalLink,
  Tag,
} from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  expenseName?: string;
  onEdit: (transaction: Transaction) => void;
  onViewReceipt?: (imageUrl: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  expenseName,
  onEdit,
  onViewReceipt,
}) => {
  const { user, currencySymbol } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isDebit = transaction.type === 'DEBIT';
  const label = getLabelForType(transaction.type, user?.settings);

  return (
    <div className="bg-white border-b border-slate-100/90 last:border-b-0 transition-colors hover:bg-slate-50/50">
      {/* Primary Row: Clicking anywhere on mobile expands/collapses. Without expend show name and amount only */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between py-3 sm:py-3.5 px-3 sm:px-4 gap-3 cursor-pointer select-none"
      >
        {/* Left: ONLY the name without expend */}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-slate-900 truncate tracking-tight">
            {transaction.title}
          </h4>
        </div>

        {/* Right: Amount, Expand Button (hidden on mobile, visible on sm+ screens), & Three Dots */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            className={`text-sm sm:text-base font-extrabold tracking-tight ${
              isDebit ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {isDebit ? '−' : '+'}{formatCurrency(transaction.amount, currencySymbol)}
          </div>

          {/* Expand / Collapse Chevron Button: Hidden on mobile devices as tapping the row expands it */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-[50px] transition"
            aria-label={isExpanded ? 'Collapse transaction details' : 'Expand transaction details'}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Three-Dot Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-[50px] transition"
              aria-label="Transaction options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(transaction);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edit</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details Section: Show ALL details only when expanded */}
      {isExpanded && (
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100/80 text-xs text-slate-600 space-y-3 animate-in fade-in duration-150">
          {/* Metadata Grid */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-500">
            {/* Type badge */}
            <span
              className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-[50px] text-[11px] ${
                isDebit
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isDebit ? '−' : '+'} {label}
            </span>

            {/* Associated Expense capsule badge if present */}
            {expenseName && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-[50px] bg-blue-50 text-blue-700 border border-blue-200">
                <Tag className="w-3 h-3 text-blue-500" />
                {expenseName}
              </span>
            )}

            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{transaction.date}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{transaction.time}</span>
            </div>

            {transaction.paymentMethod && (
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>{transaction.paymentMethod}</span>
              </div>
            )}
          </div>

          {/* Notes if available */}
          {transaction.notes && (
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-slate-700 flex items-start gap-2">
              <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="text-xs whitespace-pre-wrap">{transaction.notes}</div>
            </div>
          )}

          {/* Receipt attachment if available */}
          {transaction.receiptUrl && (
            <div className="pt-1">
              <p className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Receipt Attachment:
              </p>
              <div className="inline-block relative group">
                <img
                  src={transaction.receiptUrl}
                  alt="Receipt"
                  onClick={() => onViewReceipt && onViewReceipt(transaction.receiptUrl!)}
                  className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-200 shadow-2xs cursor-pointer group-hover:opacity-90 transition"
                />
                <button
                  type="button"
                  onClick={() => onViewReceipt && onViewReceipt(transaction.receiptUrl!)}
                  className="absolute inset-0 bg-black/40 text-white rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-xs font-semibold transition"
                >
                  <ExternalLink className="w-4 h-4" /> View
                </button>
              </div>
            </div>
          )}

          {/* Edit button in expanded view (Delete removed as requested) */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 justify-end">
            <button
              onClick={() => onEdit(transaction)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[50px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
