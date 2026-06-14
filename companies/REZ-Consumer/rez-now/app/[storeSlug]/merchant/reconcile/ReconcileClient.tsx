'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getReconciliation,
  submitCashEntry,
  lockReconciliation,
  exportReconciliationCSV,
  ReconciliationResult,
} from '@/lib/api/reconcile';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import Button from '@/components/ui/Button';
import TransactionList from '@/components/merchant/reconcile/TransactionList';

interface ReconcileClientProps {
  storeSlug: string;
}

// NW-HIGH-006 FIX: Backend sends amounts in paise (1 INR = 100 paise).
// This function converts paise to INR for display.
function formatPaise(paise: number): string {
  return formatINR(paise / 100);
}

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function DiscrepancyBadge({ discrepancy, percent }: { discrepancy: number; percent: number }) {
  const isZero = Math.abs(discrepancy) === 0;
  const isSmall = !isZero && percent < 5;
  const isLarge = percent >= 5;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold',
        isZero && 'bg-green-100 text-green-800',
        isSmall && 'bg-yellow-100 text-yellow-800',
        isLarge && 'bg-red-100 text-red-800',
      )}
    >
      {isZero && (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {isSmall && (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )}
      {isLarge && (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {isZero ? 'Balanced' : isSmall ? `${formatPaise(Math.abs(discrepancy))} (${percent.toFixed(1)}%)` : `${formatPaise(Math.abs(discrepancy))} (${percent.toFixed(1)}%) — FLAGGED`}
    </span>
  );
}

export default function ReconcileClient({ storeSlug }: ReconcileClientProps) {
  const date = todayDate();

  const [data, setData] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cashInput, setCashInput] = useState(''); // in rupees (display only)
  const [submitting, setSubmitting] = useState(false);
  const [locking, setLocking] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadReconciliation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getReconciliation(storeSlug, date);
      setData(result);
      if (result.totalCash > 0) {
        setCashInput((result.totalCash / 100).toFixed(2));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load reconciliation');
    } finally {
      setLoading(false);
    }
  }, [storeSlug, date]);

  useEffect(() => {
    loadReconciliation();
  }, [loadReconciliation]);

  async function handleCashSubmit() {
    if (!data) return;
    const rupees = parseFloat(cashInput);
    if (isNaN(rupees) || rupees < 0) {
      setError('Please enter a valid cash amount');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitCashEntry(storeSlug, date, Math.round(rupees * 100));
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit cash entry');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLock() {
    if (!data) return;
    setLocking(true);
    setError(null);
    try {
      const result = await lockReconciliation(storeSlug, date);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to lock reconciliation');
    } finally {
      setLocking(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportReconciliationCSV(storeSlug, date);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-100 rounded-xl" />
          <div className="h-24 bg-gray-100 rounded-xl" />
        </div>
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-3">{error}</p>
        <Button onClick={loadReconciliation} size="sm">Try again</Button>
      </div>
    );
  }

  if (!data) return null;

  const isReconciled = data.status === 'reconciled';
  const isFlagged = data.status === 'flagged';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for future display
  const _total = data.totalDigital + data.totalCash;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">End-of-Day Reconciliation</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {' — '}
          {storeSlug}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 font-medium">Dismiss</button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Digital total */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Digital Total</div>
          <div className="text-2xl font-bold text-emerald-600">{formatPaise(data.totalDigital)}</div>
          <div className="text-xs text-gray-400 mt-1">{data.transactions.filter((t) => t.type === 'digital').length} transactions</div>
        </div>

        {/* Cash in drawer */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Cash in Drawer</div>
          {isReconciled ? (
            <div className="text-2xl font-bold text-blue-600">{formatPaise(data.totalCash)}</div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-400">Rs</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                className="text-2xl font-bold text-blue-600 bg-transparent border-none outline-none w-full focus:ring-0 placeholder-gray-300"
                placeholder="0.00"
                disabled={isReconciled}
              />
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            {isReconciled ? `Entered: ${formatPaise(data.totalCash)}` : 'Enter cash amount'}
          </div>
        </div>

        {/* Expected cash */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expected Cash</div>
          <div className="text-2xl font-bold text-gray-700">{formatPaise(data.expectedCash)}</div>
          <div className="text-xs text-gray-400 mt-1">Total − Digital</div>
        </div>

        {/* Discrepancy */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Discrepancy</div>
          <div className="mt-1">
            <DiscrepancyBadge discrepancy={data.discrepancy} percent={data.discrepancyPercent} />
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {isFlagged ? 'Needs investigation' : isReconciled ? 'Reconciled' : 'Enter cash to calculate'}
          </div>
        </div>
      </div>

      {/* Cash entry form (when open) */}
      {!isReconciled && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Enter Cash Total</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg font-semibold text-gray-500">Rs</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                className="text-xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
                placeholder="0.00"
              />
            </div>
            <Button
              onClick={handleCashSubmit}
              loading={submitting}
              disabled={!cashInput || parseFloat(cashInput) < 0}
              size="md"
            >
              Calculate Discrepancy
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isReconciled && (
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={handleLock}
            loading={locking}
            disabled={data.totalCash === 0}
            size="md"
          >
            Lock &amp; Reconcile
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
            loading={exporting}
            size="md"
          >
            Export CSV
          </Button>
        </div>
      )}

      {isReconciled && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Reconciled
            {data.reconciledAt && (
              <span className="text-green-600 font-normal">
                at {new Date(data.reconciledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={handleExport}
            loading={exporting}
            size="sm"
          >
            Export CSV
          </Button>
        </div>
      )}

      {/* Transaction list */}
      <div>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Today&apos;s Transactions
          <span className="text-gray-400 font-normal ml-2">({data.transactions.length})</span>
        </h2>
        <TransactionList transactions={data.transactions} />
      </div>
    </div>
  );
}
