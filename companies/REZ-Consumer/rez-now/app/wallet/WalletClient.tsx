'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { getWalletBalance, getWalletTransactions } from '@/lib/api/wallet';
import { WalletBalance, WalletTransaction } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  bronze:   { label: 'Bronze',   color: 'text-amber-700',  bg: 'bg-amber-50',   icon: '🥉' },
  silver:   { label: 'Silver',   color: 'text-slate-500',  bg: 'bg-slate-50',   icon: '🥈' },
  gold:     { label: 'Gold',     color: 'text-yellow-600', bg: 'bg-yellow-50',  icon: '🥇' },
  platinum: { label: 'Platinum', color: 'text-indigo-600', bg: 'bg-indigo-50',  icon: '💎' },
};

// ── Icons ─────────────────────────────────────────────────────────────────────

function CoinIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="10" className="text-yellow-400" />
      <text x="12" y="16" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">R</text>
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BalanceCard({ balance }: { balance: WalletBalance }) {
  const tier = balance.tier ? TIER_CONFIG[balance.tier] : null;

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-indigo-200 text-sm font-medium mb-1">REZ Coin Balance</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{balance.coins.toLocaleString('en-IN')}</span>
            <span className="text-indigo-200 text-sm mb-1">coins</span>
          </div>
          <p className="text-indigo-200 text-sm mt-1">
            ≈ ₹{balance.rupees.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white/20 rounded-xl p-3">
          <CoinIcon className="w-8 h-8 text-yellow-300" />
        </div>
      </div>

      {tier && (
        <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 w-fit">
          <span className="text-lg">{tier.icon}</span>
          <span className="text-sm font-semibold">{tier.label} Member</span>
        </div>
      )}
    </div>
  );
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const isCredit = tx.type === 'credit';
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isCredit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
        }`}
        aria-hidden="true"
      >
        {isCredit ? <ArrowDownIcon /> : <ArrowUpIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDate(tx.createdAt)} · {formatTime(tx.createdAt)}
        </p>
      </div>
      <span
        className={`text-sm font-semibold flex-shrink-0 ${
          isCredit ? 'text-green-600' : 'text-red-500'
        }`}
      >
        {isCredit ? '+' : '−'}{tx.amount.toLocaleString('en-IN')}
      </span>
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────────

export default function WalletClient() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();

  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/?login=1');
    }
  }, [isLoggedIn, router]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bal, txData] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(1, 20),
      ]);
      setBalance(bal);
      setTransactions(txData.transactions);
      setHasMore(txData.pagination.hasMore);
      setPage(1);
    } catch {
      setError('Could not load wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadInitial();
  }, [isLoggedIn, loadInitial]);

  const loadMore = useCallback(async () => {
    if (txLoading || !hasMore) return;
    setTxLoading(true);
    try {
      const nextPage = page + 1;
      const txData = await getWalletTransactions(nextPage, 20);
      setTransactions((prev) => [...prev, ...txData.transactions]);
      setHasMore(txData.pagination.hasMore);
      setPage(nextPage);
    } catch {
      // silent — keep existing list
    } finally {
      setTxLoading(false);
    }
  }, [txLoading, hasMore, page]);

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Go back"
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">My Wallet</h1>
        {user?.name && (
          <span className="ml-auto text-sm text-gray-500 truncate max-w-[140px]">{user.name}</span>
        )}
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Balance card */}
        {loading ? (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 animate-pulse h-40" />
        ) : error ? (
          <div
            role="alert"
            className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 flex items-center gap-2"
          >
            <span>{error}</span>
            <button
              onClick={loadInitial}
              className="ml-auto underline font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Retry
            </button>
          </div>
        ) : balance ? (
          <BalanceCard balance={balance} />
        ) : null}

        {/* How coins work */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">How REZ Coins work</h2>
          <div className="space-y-2.5">
            {[
              { icon: '🛒', text: 'Earn coins on every order at participating stores' },
              { icon: '💳', text: '100 coins = ₹1 redeemable value' },
              { icon: '⭐', text: 'Higher tier = more coins per rupee spent' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2.5 text-sm text-gray-600">
                <span className="text-base flex-shrink-0">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Transaction History</h2>
          </div>

          {loading ? (
            <div className="px-4 py-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 bg-gray-100 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-12" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-3xl mb-2">💰</p>
              <p className="text-sm font-medium text-gray-700">No transactions yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Place an order at a participating store to start earning coins.
              </p>
            </div>
          ) : (
            <div className="px-4 divide-y divide-gray-50">
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={loadMore}
                disabled={txLoading}
                className="w-full text-sm text-indigo-600 font-medium py-2 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {txLoading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {[
            { href: '/orders', label: 'My Orders', emoji: '🧾' },
            { href: '/profile', label: 'My Profile', emoji: '👤' },
          ].map(({ href, label, emoji }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <svg className="w-4 h-4 text-gray-400 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
