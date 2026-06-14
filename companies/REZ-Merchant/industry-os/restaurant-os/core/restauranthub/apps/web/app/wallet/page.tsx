'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { CreditScoreCard } from '@/components/fintech/credit-score-card';
import type { CreditTier, CreditFactor } from '@/components/fintech/credit-score-card';
import { WalletIcon } from '@heroicons/react/24/outline';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreditProfile {
  score: number;
  tier: CreditTier;
  maxCreditLine: number;
  recommendedTenor: number;
  eligibleForSupplierTerms: boolean;
  factors: CreditFactor[];
  computedAt: string;
  dataMonthsAvailable: number;
  walletBalance: number;
}

interface IneligibleProfile {
  ineligible: true;
  reason: string;
  dataMonthsAvailable: number;
}

type ProfileResult = CreditProfile | IneligibleProfile;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function authHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('restauranthub_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WalletBalanceCard({ balance }: { balance: number }) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">REZ Wallet Balance</p>
            <p className="text-3xl font-bold mt-1">{formatINR(balance)}</p>
          </div>
          <WalletIcon className="w-12 h-12 text-blue-200" />
        </div>
      </div>
    </Card>
  );
}

function IneligibleCard({ reason, months }: { reason: string; months: number }) {
  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-foreground mb-2">Credit Score</h2>
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
        <p className="text-sm font-medium text-amber-800">
          Keep using REZ for {Math.max(0, 3 - months)} more month
          {Math.max(0, 3 - months) !== 1 ? 's' : ''} to unlock credit scoring
        </p>
        <p className="text-xs text-amber-600 mt-1">{reason}</p>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        REZ uses your transaction history, payment behaviour, and supplier activity
        to build a credit score — with no traditional paperwork required.
      </p>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 rounded-lg bg-muted animate-pulse" />
      <div className="h-64 rounded-lg bg-muted animate-pulse" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const resp = await fetch('/api/fintech/credit-profile', {
          headers: authHeaders(),
        });

        if (!resp.ok) {
          setError('Unable to load your credit profile. Please try again.');
          return;
        }

        const data: ProfileResult = await resp.json();
        setProfile(data);
      } catch {
        setError('Network error — could not load wallet data.');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const isIneligible = profile && 'ineligible' in profile;
  const creditProfile = !isIneligible ? (profile as CreditProfile) : null;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Wallet & Credits</h1>

        {loading && <LoadingSkeleton />}

        {!loading && error && (
          <Card className="p-6">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {!loading && !error && profile && (
          <>
            {/* Wallet balance */}
            <WalletBalanceCard
              balance={creditProfile?.walletBalance ?? 0}
            />

            {/* Credit section */}
            {isIneligible ? (
              <IneligibleCard
                reason={(profile as IneligibleProfile).reason}
                months={(profile as IneligibleProfile).dataMonthsAvailable}
              />
            ) : creditProfile ? (
              <CreditScoreCard
                score={creditProfile.score}
                tier={creditProfile.tier}
                maxCreditLine={creditProfile.maxCreditLine}
                factors={creditProfile.factors}
                eligibleForSupplierTerms={creditProfile.eligibleForSupplierTerms}
                onApply={() => router.push('/payments/working-capital')}
                onImprove={() => router.push('/payments/working-capital')}
              />
            ) : null}

            {/* Data freshness note */}
            {creditProfile && (
              <p className="text-xs text-muted-foreground text-center">
                Score computed from {creditProfile.dataMonthsAvailable} month(s) of REZ data.
                Updated every 24 hours.
              </p>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
