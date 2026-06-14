'use client';

import { ReconciliationTransaction } from '@/lib/api/reconcile';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

interface TransactionListProps {
  transactions: ReconciliationTransaction[];
}

function formatTime(isoString: string): string {
  if (!isoString) return '--:--';
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '--:--';
  }
}

// NW-HIGH-006 FIX: All amounts from the backend MUST be in paise (1 INR = 100 paise).
// This function converts paise to INR for display. If backend ever sends rupees,
// remove the division by 100 from this function.
function formatPaise(paise: number): string {
  if (paise < 10000) {
    logger.warn('[NW-HIGH-006] Amount < 10000 paise — verify backend sends paise (not rupees)', { component: 'TransactionList', paise });
  }
  // Flag amounts above 10 INR (1000 paise) per transaction row as suspicious
  // — a single transaction over ₹1,00,000 (10M paise) in a restaurant context is almost certainly wrong.
  if (paise > 10_000_000) {
    logger.warn(`[NW-HIGH-006] Amount ${paise} paise exceeds ₹1,00,000 — verify this is correct`, {
      component: 'TransactionList',
      paise,
      formattedINR: `₹${(paise / 100).toLocaleString()}`,
    });
  }
  return formatINR(paise / 100);
}

export default function TransactionList({ transactions }: TransactionListProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        No transactions today
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Time</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Type</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Amount</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((tx) => (
            <tr key={tx.paymentId} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-700 font-mono text-xs">{formatTime(tx.createdAt)}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    tx.type === 'digital'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200',
                  )}
                >
                  {tx.type === 'digital' ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  )}
                  {tx.type === 'digital' ? 'Digital' : 'Cash'}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatPaise(tx.amount)}</td>
              <td className="px-4 py-3 text-center">
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    tx.status === 'completed'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-yellow-50 text-yellow-700',
                  )}
                >
                  {tx.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
