'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAtRiskCustomers } from '@/lib/api/customerAnalytics';
import { formatINR } from '@/lib/utils/currency';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useUIStore } from '@/lib/store/uiStore';
import type { AtRiskCustomer } from '@/lib/types';

function formatPaise(paise: number): string {
  return formatINR(paise);
}

function formatDays(days: number): string {
  if (days === 14) return '14 days';
  if (days === 21) return '21 days';
  if (days === 30) return '30 days';
  return `${days} days`;
}

interface AtRiskCustomersProps {
  storeSlug: string;
}

export default function AtRiskCustomers({ storeSlug }: AtRiskCustomersProps) {
  const [customers, setCustomers] = useState<AtRiskCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingOffer, setSendingOffer] = useState<Record<string, boolean>>({});
  const { showToast } = useUIStore();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAtRiskCustomers(storeSlug);
      setCustomers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load at-risk customers');
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => { load(); }, [load]);

  async function handleSendOffer(customer: AtRiskCustomer) {
    setSendingOffer((prev) => ({ ...prev, [customer.customerId]: true }));
    // Simulate async send
    await new Promise((r) => setTimeout(r, 800));
    setSendingOffer((prev) => ({ ...prev, [customer.customerId]: false }));
    showToast(
      `Offer sent to ${customer.name || customer.phone}`,
      'success',
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        <p>Could not load at-risk customers.</p>
        <button onClick={load} className="mt-2 text-indigo-600 hover:underline">Try again</button>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-10 bg-green-50 border border-green-200 rounded-xl">
        <div className="text-3xl mb-2">🎉</div>
        <p className="text-sm font-medium text-green-800">No at-risk customers</p>
        <p className="text-xs text-green-600 mt-1">All your customers have visited recently.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">At-Risk Customers</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            No visit in 14+ days — send an offer to re-engage
          </p>
        </div>
        <Badge variant="yellow">{customers.length}</Badge>
      </div>

      <div className="space-y-2">
        {customers.map((c) => (
          <div
            key={c.customerId}
            className="bg-white border border-yellow-200 rounded-xl p-4 flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {c.name || c.phone}
                </span>
                <Badge variant="yellow">{formatDays(c.daysSinceLastVisit)}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                <span>{c.visitCount}x visits</span>
                <span>{formatPaise(c.totalSpent)} total</span>
                <span>{formatPaise(c.avgOrderValue)} avg order</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              loading={sendingOffer[c.customerId] ?? false}
              onClick={() => handleSendOffer(c)}
              className="shrink-0 whitespace-nowrap"
            >
              Send Offer
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
