'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Coins,
  TrendingUp,
  Gift,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Crown,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  type: 'earn' | 'redeem';
  amount: number;
  description: string;
  source: string;
  date: string;
}

interface RewardTier {
  name: string;
  icon: string;
  color: string;
  minCoins: number;
  progress: number;
}

const MOCK_WALLET = {
  balance: 2450,
  lifetimeEarned: 12500,
  lifetimeRedeemed: 10050,
  thisMonth: 500,
  currentTier: {
    name: 'Gold',
    icon: '🥇',
    color: '#FFD700',
    minCoins: 5000,
    maxCoins: 15000,
    progress: 72.5,
  },
  nextTier: {
    name: 'Platinum',
    icon: '💎',
    color: '#E5E4E2',
    minCoins: 15000,
  },
};

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'earn', amount: 500, description: 'Hotel booking - The Grand Mumbai', source: 'benefit_usage', date: '2024-04-28' },
  { id: '2', type: 'earn', amount: 250, description: 'Earth Day Challenge completed', source: 'campaign', date: '2024-04-22' },
  { id: '3', type: 'redeem', amount: -500, description: 'Gift voucher redeemed', source: 'redeem', date: '2024-04-20' },
  { id: '4', type: 'earn', amount: 100, description: 'Dining at restaurant', source: 'benefit_usage', date: '2024-04-15' },
  { id: '5', type: 'earn', amount: 1000, description: 'Team milestone bonus', source: 'milestone', date: '2024-04-10' },
];

export default function CorpWalletPage() {
  const [wallet, setWallet] = useState(MOCK_WALLET);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setTransactions(MOCK_TRANSACTIONS);
      setLoading(false);
    }, 500);
  }, []);

  const formatCoins = (amount: number) => {
    return amount.toLocaleString('en-IN');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/karma/corp" className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <ChevronRight className="w-5 h-5 rotate-180 transform text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
          <p className="text-sm text-muted-foreground">ReZ Coins rewards</p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="p-6" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
        <div className="text-white">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-white/70" />
            <span className="text-white/70 text-sm">ReZ Coins Balance</span>
          </div>

          <div className="flex items-end gap-2 mb-6">
            <span className="text-5xl font-extrabold">{formatCoins(wallet.balance)}</span>
            <Coins className="w-8 h-8 mb-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div>
              <div className="text-2xl font-bold">{formatCoins(wallet.lifetimeEarned)}</div>
              <div className="text-xs text-white/70 mt-1">Lifetime Earned</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCoins(wallet.lifetimeRedeemed)}</div>
              <div className="text-xs text-white/70 mt-1">Redeemed</div>
            </div>
            <div>
              <div className="text-2xl font-bold">+{formatCoins(wallet.thisMonth)}</div>
              <div className="text-xs text-white/70 mt-1">This Month</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tier Progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: wallet.currentTier.color + '20' }}>
              {wallet.currentTier.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{wallet.currentTier.name} Tier</span>
                <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
              </div>
              <p className="text-sm text-muted-foreground">Keep earning to unlock next tier!</p>
            </div>
          </div>
          {wallet.nextTier && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-[#E5E4E2]">
                <span>{wallet.nextTier.icon}</span>
                <span className="text-sm font-medium">{wallet.nextTier.name}</span>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${wallet.currentTier.progress}%`,
                backgroundColor: wallet.currentTier.color,
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatCoins(wallet.currentTier.minCoins)} coins
            </span>
            <span className="text-xs font-semibold text-[#8B5CF6]">
              {wallet.currentTier.progress}% to next tier
            </span>
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="flex flex-wrap gap-2 mt-4">
          {wallet.currentTier.name === 'Gold' && (
            <>
              <span className="px-3 py-1 bg-[#FFD700]/10 rounded-full text-xs font-medium text-[#B8860B]">
                VIP Rewards
              </span>
              <span className="px-3 py-1 bg-[#FFD700]/10 rounded-full text-xs font-medium text-[#B8860B]">
                Priority Support
              </span>
              <span className="px-3 py-1 bg-[#FFD700]/10 rounded-full text-xs font-medium text-[#B8860B]">
                10% Bonus Coins
              </span>
            </>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Earn More</div>
              <p className="text-xs text-muted-foreground">Use benefits daily</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EC4899]/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#EC4899]" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Redeem</div>
              <p className="text-xs text-muted-foreground">Gift cards & more</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Transaction History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          <Button variant="ghost" size="sm" className="text-[#8B5CF6]">
            View All
          </Button>
        </div>

        <Card className="divide-y divide-gray-100">
          {transactions.map((txn) => (
            <div key={txn.id} className="flex items-center gap-4 p-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  txn.type === 'earn' ? 'bg-[#22C55E]/10' : 'bg-[#EC4899]/10'
                }`}
              >
                {txn.type === 'earn' ? (
                  <ArrowUpRight className="w-5 h-5 text-[#22C55E]" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-[#EC4899]" />
                )}
              </div>

              <div className="flex-1">
                <div className="font-medium text-gray-900">{txn.description}</div>
                <div className="text-xs text-muted-foreground">{formatDate(txn.date)}</div>
              </div>

              <div className="text-right">
                <div
                  className={`font-bold ${
                    txn.type === 'earn' ? 'text-[#22C55E]' : 'text-[#EC4899]'
                  }`}
                >
                  {txn.type === 'earn' ? '+' : ''}{txn.amount}
                </div>
                <div className="text-xs text-muted-foreground">coins</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Leaderboard Teaser */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFD700]/20 flex items-center justify-center">
            <Crown className="w-6 h-6 text-[#FFD700]" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900">You're ranked #12!</div>
            <p className="text-sm text-muted-foreground">
              Top 5% in your company this month
            </p>
          </div>
          <Link href="/karma/leaderboard">
            <Button variant="outline" size="sm" className="border-[#8B5CF6] text-[#8B5CF6]">
              View Rankings
            </Button>
          </Link>
        </div>
      </Card>

      {/* Redeem CTA */}
      <Card className="p-5 bg-gradient-to-r from-[#EC4899] to-[#F472B6]">
        <div className="flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg">Ready to redeem?</div>
            <p className="text-sm text-white/80">
              Use your {formatCoins(wallet.balance)} coins on exciting rewards!
            </p>
          </div>
          <Button className="bg-white text-[#EC4899] hover:bg-white/90">
            Redeem Now
          </Button>
        </div>
      </Card>
    </div>
  );
}
