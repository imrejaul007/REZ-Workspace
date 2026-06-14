'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Leaf,
  Wallet,
  Lock,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Gift,
  Sparkles,
  ArrowLeftRight as SwapHorizontal,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletBalance, getTransactions } from '@/lib/karmaApi';
import type { WalletBalance, Transaction } from '@/types/karma';

const TX_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  earned: { icon: Leaf, color: '#22C55E' },
  converted: { icon: SwapHorizontal, color: '#3B82F6' },
  spent: { icon: ArrowDown, color: '#EF4444' },
  bonus: { icon: Gift, color: '#F59E0B' },
};

const COIN_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  karma_points: { label: 'Karma Points', icon: 'leaf', color: '#8B5CF6' },
  rez_coins: { label: 'ReZ Coins', icon: 'wallet', color: '#F59E0B' },
  branded_coin: { label: 'Branded Coins', icon: 'storefront', color: '#6366F1' },
  all: { label: 'All', icon: 'apps', color: '#6B7280' },
};

function TransactionItem({ tx }: { tx: Transaction }) {
  const txCfg = TX_CONFIG[tx.type] ?? TX_CONFIG.earned;
  const Icon = txCfg.icon;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${txCfg.color}20` }}>
          <Icon className="w-5 h-5" style={{ color: txCfg.color }} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">{tx.description}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(tx.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <div className={`font-extrabold text-sm ${tx.type === 'spent' ? 'text-red-500' : 'text-green-600'}`}>
          {tx.type === 'spent' ? '-' : '+'}{tx.amount}
        </div>
        <div className="w-5 h-5 rounded-full mx-auto mt-1" style={{ backgroundColor: `${COIN_TYPE_CONFIG[tx.coinType]?.color ?? '#8B5CF6'}20` }} />
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<'karma_points' | 'rez_coins' | 'branded_coin' | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);
    try {
      const [balRes, txRes] = await Promise.all([
        getWalletBalance('all'),
        getTransactions(selectedCoin as 'karma_points' | 'rez_coins' | 'all', 1),
      ]);
      if (balRes.success && balRes.data) setBalance(balRes.data);
      if (txRes.success && txRes.data) setTransactions(txRes.data.transactions ?? []);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, [isAuthenticated, selectedCoin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="flex flex-col items-center justify-center py-12 px-6">
          <Lock className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-muted-foreground text-sm mb-6 text-center">Sign in to view your wallet</p>
          <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED]">Sign In</Button>
        </Card>
      </div>
    );
  }

  const karmaPoints = balance?.karmaPoints ?? 0;
  const rezCoins = balance?.rezCoins ?? 0;

  const coinFilters: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'karma_points', label: 'Karma' },
    { key: 'rez_coins', label: 'ReZ Coins' },
    { key: 'branded_coin', label: 'Branded' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-muted-foreground text-sm">Your karma points and coins</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Balance Cards */}
          <div className="space-y-3">
            {/* Karma Points */}
            <div className="bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Leaf className="w-5 h-5" />
                </div>
                <span className="text-white/90 font-semibold">Karma Points</span>
              </div>
              <div className="text-4xl font-extrabold mb-1">{karmaPoints.toLocaleString()}</div>
              <div className="text-white/70 text-sm">Identity layer — grows with every event</div>
              <div className="flex items-center gap-2 mt-3 bg-white/20 px-3 py-1.5 rounded-full self-start">
                <SwapHorizontal className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white/80 text-xs">Rolling 30-45 days</span>
              </div>
            </div>

            {/* ReZ Coins */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-gray-900 font-semibold">ReZ Coins</span>
              </div>
              <div className="text-4xl font-extrabold text-gray-900 mb-1">{rezCoins.toLocaleString()}</div>
              <div className="text-muted-foreground text-sm">Universal currency — spend anywhere</div>
              <div className="flex items-center gap-2 mt-3 bg-yellow-50 px-3 py-1.5 rounded-full self-start">
                <SwapHorizontal className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-700 text-xs font-medium">Convert from karma</span>
              </div>
            </Card>
          </div>

          {/* Conversion Info */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <SwapHorizontal className="w-5 h-5 text-[#8B5CF6]" />
              <h3 className="font-bold text-gray-900">How Conversion Works</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your Karma Points auto-convert to ReZ Coins weekly based on your level. Higher levels = higher conversion rate.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { level: 'L1', rate: '25%', karma: '0-500' },
                { level: 'L2', rate: '50%', karma: '500-2K' },
                { level: 'L3', rate: '75%', karma: '2K-5K' },
                { level: 'L4', rate: '100%', karma: '5000+' },
              ].map((item) => (
                <div key={item.level} className="text-center bg-gray-50 rounded-xl p-2">
                  <div className="font-bold text-gray-900">{item.level}</div>
                  <div className="text-[#8B5CF6] font-extrabold">{item.rate}</div>
                  <div className="text-xs text-muted-foreground">{item.karma}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Coin Filter */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Transactions</h3>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
              {coinFilters.map((filter) => {
                const isActive = selectedCoin === filter.key;
                return (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedCoin(filter.key as typeof selectedCoin)}
                    className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all"
                    style={{
                      backgroundColor: isActive ? '#8B5CF6' : '#fff',
                      borderColor: isActive ? '#8B5CF6' : '#e5e7eb',
                      color: isActive ? '#fff' : '#6b7280',
                    }}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transaction List */}
          <Card>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center py-12 px-6">
                <Wallet className="w-12 h-12 text-muted-foreground mb-3" />
                <div className="font-bold text-gray-900 mb-1">No transactions yet</div>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Start earning karma to see your activity here
                </p>
                <Link href="/karma/explore">
                  <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED]">Find Events</Button>
                </Link>
              </div>
            ) : (
              <div className="px-4">
                {transactions.map((tx) => (
                  <TransactionItem key={tx._id} tx={tx} />
                ))}
              </div>
            )}
          </Card>

          {/* Earn More CTA */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Leaf className="w-8 h-8 text-green-500" />
              <div className="flex-1">
                <div className="font-bold text-gray-900">Earn More Karma</div>
                <div className="text-xs text-muted-foreground">Join events, complete activities, and build your impact</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/karma/explore" className="flex-1">
                <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  Explore Events
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/karma/missions">
                <button className="w-12 h-12 rounded-xl bg-[#F5F3FF] border border-[#8B5CF6] flex items-center justify-center hover:bg-[#EDE9FE] transition-colors">
                  <ArrowRight className="w-5 h-5 text-[#8B5CF6]" />
                </button>
              </Link>
            </div>
          </Card>

          {/* Branded Coins teaser */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
              <h3 className="font-bold text-gray-900">Branded Coins (Coming Soon)</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Earn special coins from partner brands when you participate in their events. Redeem at partner stores.
            </p>
            <div className="flex gap-2">
              {['Partner A', 'Partner B', 'Partner C'].map((brand, idx) => (
                <span key={brand} className="text-xs font-medium px-3 py-1.5 rounded-full border" style={{
                  backgroundColor: idx === 0 ? '#DCFCE7' : 'transparent',
                  borderColor: idx === 0 ? '#22C55E' : '#e5e7eb',
                  color: idx === 0 ? '#22C55E' : '#6b7280',
                }}>
                  {brand}
                </span>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
