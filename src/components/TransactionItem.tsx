import React, { useState } from 'react';
import { Transaction } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { formatCurrency, getLabelForType } from '../utils/calculations.ts';
import {
  Edit2,
  Trash2,
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
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onViewReceipt?: (imageUrl: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  expenseName,
  isExpanded: controlledExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onViewReceipt,
}) => {
  const { user, currencySymbol } = useAuth();
  const [internalExpanded, setInternalExpanded] = useState(false);

  // If controlledExpanded is passed, use it, else fallback to internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const isDebit = transaction.type === 'DEBIT';
  const label = getLabelForType(transaction.type, user?.settings);

  return (
    <div className="bg-white rounded-2xl shadow-2xs hover:shadow-xs transition-all overflow-hidden border-0 outline-none">
      {/* Primary Row: Clicking anywhere expands/collapses. Without expend show name and amount only */}
      <div
        onClick={handleToggle}
        className="flex items-center justify-between py-3 sm:py-3.5 px-3.5 sm:px-4 gap-3 cursor-pointer select-none hover:bg-slate-50/40 transition-colors"
      >
        {/* Left: ONLY the name without expend */}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-slate-900 truncate tracking-tight">
            {transaction.title}
          </h4>
        </div>

        {/* Right: Amount and Expand/Collapse indicator */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            className={`text-sm sm:text-base font-extrabold tracking-tight ${
              isDebit ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {isDebit ? '−' : '+'}{formatCurrency(transaction.amount, currencySymbol)}
          </div>

          {/* Expand / Collapse Chevron Button (hidden on mobile, visible on sm+ screens) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-[50px] transition cursor-pointer"
            aria-label={isExpanded ? 'Collapse transaction details' : 'Expand transaction details'}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details Section: Show ALL details only when expanded */}
      {isExpanded && (
        <div className="px-4 py-3.5 bg-slate-50/70 text-xs text-slate-600 space-y-3 animate-in fade-in duration-150 border-0">
          {/* Metadata Grid */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-500">
            {/* Type badge */}
            <span
              className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-[50px] text-[11px] ${
                isDebit
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isDebit ? '−' : '+'} {label}
            </span>

            {/* Associated Expense capsule badge if present */}
            {expenseName && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-[50px] bg-blue-50 text-blue-700">
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
            <div className="p-3 bg-white rounded-xl shadow-2xs text-slate-700 flex items-start gap-2 border-0">
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
                  className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-xl shadow-2xs cursor-pointer group-hover:opacity-90 transition border-0"
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

          {/* Action buttons in expanded view: Edit and Delete buttons */}
          <div className="flex items-center gap-2 pt-1.5 justify-end border-0">
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(transaction);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[50px] bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 text-xs font-semibold shadow-2xs transition cursor-pointer border-0"
                title="Delete this transaction"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(transaction);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[50px] bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer border-0"
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
