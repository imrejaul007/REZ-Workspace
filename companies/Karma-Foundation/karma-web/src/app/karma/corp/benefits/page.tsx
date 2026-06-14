'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Utensils,
  Plane,
  Heart,
  Book,
  Gift,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Benefit {
  id: string;
  type: 'meal' | 'travel' | 'wellness' | 'learning' | 'gift';
  name: string;
  allocated: number;
  utilized: number;
  remaining: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  color: string;
  validUntil?: string;
}

const MOCK_BENEFITS: Benefit[] = [
  { id: '1', type: 'meal', name: 'Meal Allowance', allocated: 2000, utilized: 500, remaining: 1500, icon: Utensils, color: '#f59e0b', validUntil: '2024-04-30' },
  { id: '2', type: 'travel', name: 'Travel Benefits', allocated: 10000, utilized: 2000, remaining: 8000, icon: Plane, color: '#3b82f6', validUntil: '2024-06-30' },
  { id: '3', type: 'wellness', name: 'Wellness', allocated: 3000, utilized: 0, remaining: 3000, icon: Heart, color: '#22c55e', validUntil: '2024-12-31' },
  { id: '4', type: 'learning', name: 'Learning', allocated: 5000, utilized: 1500, remaining: 3500, icon: Book, color: '#8b5cf6', validUntil: '2024-12-31' },
  { id: '5', type: 'gift', name: 'Gift Budget', allocated: 2000, utilized: 500, remaining: 1500, icon: Gift, color: '#ec4899', validUntil: '2024-12-31' },
];

export default function CorpBenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setBenefits(MOCK_BENEFITS);
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

  const getUsagePercent = (benefit: Benefit) => {
    return Math.round((benefit.utilized / benefit.allocated) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalAllocated = benefits.reduce((sum, b) => sum + b.allocated, 0);
  const totalUsed = benefits.reduce((sum, b) => sum + b.utilized, 0);
  const totalRemaining = benefits.reduce((sum, b) => sum + b.remaining, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/karma/corp" className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <ChevronRight className="w-5 h-5 rotate-180 transform text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Benefits</h1>
          <p className="text-sm text-muted-foreground">Manage your corporate benefits</p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="p-5" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
        <div className="text-white">
          <div className="text-xs font-medium text-white/70 mb-1">Total Remaining</div>
          <div className="text-3xl font-extrabold mb-4">{formatCurrency(totalRemaining)}</div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <div className="text-lg font-bold">{formatCurrency(totalAllocated)}</div>
              <div className="text-xs text-white/70">Allocated</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{formatCurrency(totalUsed)}</div>
              <div className="text-xs text-white/70">Used</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{benefits.length}</div>
              <div className="text-xs text-white/70">Active</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Benefits List */}
      <div className="space-y-4">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;
          const usagePercent = getUsagePercent(benefit);

          return (
            <Card key={benefit.id} className="p-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: benefit.color + '20' }}
                >
                  <Icon className="w-6 h-6" style={{ color: benefit.color }} />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{benefit.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(benefit.remaining)} remaining of {formatCurrency(benefit.allocated)}
                      </p>
                    </div>
                    <div
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: benefit.color + '20', color: benefit.color }}
                    >
                      {usagePercent}%
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${usagePercent}%`,
                        backgroundColor: benefit.color,
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3">
                    {benefit.validUntil && (
                      <span className="text-xs text-muted-foreground">
                        Valid till {new Date(benefit.validUntil).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                    <Button size="sm" variant="outline" className="ml-auto">
                      Use Benefit
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/karma/corp/hotels">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#3B82F620] hover:bg-[#3B82F630] transition-colors">
              <Plane className="w-5 h-5 text-[#3B82F6]" />
              <span className="text-sm font-medium text-gray-900">Book Travel</span>
            </div>
          </Link>
          <Link href="/karma/corp/dining">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#f59e0b20] hover:bg-[#f59e0b30] transition-colors">
              <Utensils className="w-5 h-5 text-[#f59e0b]" />
              <span className="text-sm font-medium text-gray-900">Order Food</span>
            </div>
          </Link>
          <Link href="/karma/corp/wellness">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#22c55e20] hover:bg-[#22c55e30] transition-colors">
              <Heart className="w-5 h-5 text-[#22c55e]" />
              <span className="text-sm font-medium text-gray-900">Wellness</span>
            </div>
          </Link>
          <Link href="/karma/corp/gifts">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#ec489920] hover:bg-[#ec489930] transition-colors">
              <Gift className="w-5 h-5 text-[#ec4899]" />
              <span className="text-sm font-medium text-gray-900">Gift Store</span>
            </div>
          </Link>
        </div>
      </Card>

      {/* Help Card */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#8B5CF620] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Tip: Use Benefits to Earn Karma</div>
            <div className="text-sm text-muted-foreground">
              Every benefit you use earns you karma points!
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
