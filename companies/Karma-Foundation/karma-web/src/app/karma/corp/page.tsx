'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Wallet,
  Gift,
  Bed,
  Users,
  CreditCard,
  TrendingUp,
  ChevronRight,
  Leaf,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CorpBenefit {
  type: string;
  allocated: number;
  utilized: number;
  remaining: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  color: string;
}

interface CorpStats {
  totalKarma: number;
  rank: number;
  benefitsUsed: number;
  savings: number;
}

const MOCK_BENEFITS: CorpBenefit[] = [
  { type: 'Meal', allocated: 2000, utilized: 500, remaining: 1500, icon: 'utensils', color: '#f59e0b' },
  { type: 'Travel', allocated: 10000, utilized: 2000, remaining: 8000, icon: 'plane', color: '#3b82f6' },
  { type: 'Wellness', allocated: 3000, utilized: 0, remaining: 3000, icon: 'heart', color: '#22c55e' },
  { type: 'Learning', allocated: 5000, utilized: 1500, remaining: 3500, icon: 'book', color: '#8b5cf6' },
];

const MOCK_STATS: CorpStats = {
  totalKarma: 2450,
  rank: 23,
  benefitsUsed: 8,
  savings: 12500,
};

export default function CorpPage() {
  const [benefits, setBenefits] = useState<CorpBenefit[]>([]);
  const [stats, setStats] = useState<CorpStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setBenefits(MOCK_BENEFITS);
      setStats(MOCK_STATS);
      setLoading(false);
    }, 500);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const menuItems = [
    {
      title: 'Book Hotel',
      description: 'Corporate hotel bookings',
      icon: Bed,
      color: '#3b82f6',
      href: '/karma/corp/hotels',
    },
    {
      title: 'My Benefits',
      description: 'View and use your benefits',
      icon: Briefcase,
      color: '#8b5cf6',
      href: '/karma/corp/benefits',
    },
    {
      title: 'Gift Store',
      description: 'Redeem karma for gifts',
      icon: Gift,
      color: '#ec4899',
      href: '/karma/corp/gifts',
    },
    {
      title: 'Book Dining',
      description: 'Corporate meal benefits',
      icon: Briefcase,
      color: '#f59e0b',
      href: '/karma/corp/dining',
    },
    {
      title: 'Expense Card',
      description: 'Virtual corporate card',
      icon: CreditCard,
      color: '#22c55e',
      href: '/karma/corp/card',
    },
    {
      title: 'Wellness',
      description: 'Health & fitness benefits',
      icon: TrendingUp,
      color: '#06b6d4',
      href: '/karma/corp/wellness',
    },
  ];

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
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#8B5CF6] flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold text-[#8B5CF6] tracking-wider">CORPPERKS</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">My Benefits</h1>
        <p className="text-muted-foreground text-sm">Corporate benefits from your employer</p>
      </div>

      {/* Stats Card */}
      {stats && (
        <Card className="p-5" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
          <div className="text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-medium text-white/70">Total Karma Earned</div>
                <div className="text-3xl font-extrabold">{stats.totalKarma.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-white/70">Company Rank</div>
                <div className="text-2xl font-extrabold">#{stats.rank}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
              <div className="text-center">
                <div className="text-lg font-bold">{stats.benefitsUsed}</div>
                <div className="text-xs text-white/70">Benefits Used</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{formatCurrency(stats.savings)}</div>
                <div className="text-xs text-white/70">Total Savings</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">Active</div>
                <div className="text-xs text-white/70">Status</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Benefits Summary */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">My Benefit Wallet</h2>
        <div className="grid grid-cols-2 gap-3">
          {benefits.map((benefit) => (
            <Card key={benefit.type} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: benefit.color + '20' }}
                >
                  <span style={{ color: benefit.color }} className="text-lg">₹</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{benefit.type}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(benefit.remaining)} left
                  </div>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(benefit.utilized / benefit.allocated) * 100}%`,
                    backgroundColor: benefit.color,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  Used: {formatCurrency(benefit.utilized)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Total: {formatCurrency(benefit.allocated)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: item.color + '20' }}
                    >
                      <Icon className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Karma Integration Banner */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] flex items-center justify-center">
            <Leaf className="w-6 h-6 text-[#22C55E]" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Earn Karma Points</div>
            <div className="text-sm text-muted-foreground">
              Use your benefits and earn karma points!
            </div>
          </div>
          <Link href="/karma">
            <Button size="sm" variant="outline" className="border-[#22C55E] text-[#22C55E] hover:bg-[#DCFCE7]">
              View Karma
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
