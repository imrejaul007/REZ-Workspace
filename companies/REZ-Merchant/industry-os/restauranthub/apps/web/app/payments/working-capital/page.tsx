'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditScoreCard } from '@/components/fintech/credit-score-card';
import type { CreditTier, CreditFactor } from '@/components/fintech/credit-score-card';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

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

interface ApplicationResult {
  applicationId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'closed';
  approvedAmount?: number;
  rejectionReason?: string;
  tenor: number;
  purpose: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('restauranthub_token') : null;
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function formatINR(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Score improvement tips ────────────────────────────────────────────────────

const IMPROVEMENT_TIPS = [
  'Pay all supplier bills on time — payment regularity has a 25% weight in your score.',
  'Place supplier orders consistently — higher order frequency improves your score.',
  'Keep your dispute rate below 1% by resolving issues through REZ before escalation.',
  'Stay active on REZ — longer account history means a higher age score.',
];

// ── Application status tracker ────────────────────────────────────────────────

function StatusTracker({ result }: { result: ApplicationResult }) {
  const steps: Array<{ key: ApplicationResult['status']; label: string }> = [
    { key: 'pending', label: 'Submitted' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'disbursed', label: 'Disbursed' },
  ];

  const statusOrder = ['pending', 'under_review', 'approved', 'disbursed'];
  const currentIdx = statusOrder.indexOf(result.status);

  return (
    <Card className="p-6 space-y-4">
      <h2 className="font-semibold text-foreground">Application Status</h2>
      <p className="text-xs text-muted-foreground">ID: {result.applicationId}</p>

      {result.status === 'rejected' ? (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
          <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Application Rejected</p>
            {result.rejectionReason && (
              <p className="text-xs text-red-600 mt-1">{result.rejectionReason}</p>
            )}
          </div>
        </div>
      ) : (
        <ol className="flex items-center gap-2">
          {steps.map((step, idx) => {
            const done = idx <= currentIdx;
            const active = idx === currentIdx;
            return (
              <React.Fragment key={step.key}>
                <li className="flex flex-col items-center gap-1 flex-1">
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                      ${done
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                      } ${active ? 'ring-2 ring-green-300' : ''}`}
                  >
                    {done ? <CheckCircleIcon className="w-5 h-5" /> : idx + 1}
                  </span>
                  <span className={`text-xs text-center ${done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </li>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 ${done && idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      )}

      {result.approvedAmount && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm font-medium text-green-800">
            Approved for {formatINR(result.approvedAmount)} — {result.tenor}-day tenor
          </p>
          <p className="text-xs text-green-600 mt-1">
            Funds will be disbursed to your REZ wallet within 1 business day.
          </p>
        </div>
      )}
    </Card>
  );
}

// ── Application form ──────────────────────────────────────────────────────────

function ApplicationForm({
  profile,
  onSubmit,
  submitting,
}: {
  profile: CreditProfile;
  onSubmit: (amount: number, tenor: 15 | 30 | 45, purpose: string) => void;
  submitting: boolean;
}) {
  const [amount, setAmount] = useState(Math.min(10000, profile.maxCreditLine));
  const [tenor, setTenor] = useState<15 | 30 | 45>(
    profile.recommendedTenor as 15 | 30 | 45,
  );
  const [purpose, setPurpose] = useState<'supplier_payment' | 'working_capital'>('supplier_payment');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(amount, tenor, purpose);
  };

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-foreground mb-1">Working Capital Application</h2>
      <p className="text-xs text-muted-foreground mb-5">
        Based on your {profile.dataMonthsAvailable} months of REZ transaction history
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount slider */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm font-medium text-foreground">Amount</label>
            <span className="text-sm font-bold text-foreground">{formatINR(amount)}</span>
          </div>
          <input
            type="range"
            min={1000}
            max={profile.maxCreditLine}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>₹1,000</span>
            <span>{formatINR(profile.maxCreditLine)}</span>
          </div>
        </div>

        {/* Tenor */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Repayment Period</label>
          <div className="flex gap-2">
            {([15, 30, 45] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTenor(t)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors
                  ${tenor === t
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-input hover:bg-muted'
                  }`}
              >
                {t} days
              </button>
            ))}
          </div>
          {tenor === profile.recommendedTenor && (
            <p className="text-xs text-green-600 mt-1">Recommended for your tier</p>
          )}
        </div>

        {/* Purpose */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Purpose</label>
          <div className="flex gap-2">
            {(
              [
                { value: 'supplier_payment', label: 'Supplier Payment' },
                { value: 'working_capital', label: 'Working Capital' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPurpose(opt.value)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors
                  ${purpose === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-input hover:bg-muted'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 animate-spin" /> Submitting...
            </span>
          ) : (
            `Apply for ${formatINR(amount)}`
          )}
        </Button>
      </form>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkingCapitalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [applicationResult, setApplicationResult] = useState<ApplicationResult | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const resp = await fetch('/api/fintech/credit-profile', {
          headers: authHeaders(),
        });
        if (!resp.ok) {
          setError('Could not load your credit profile.');
          return;
        }
        const data: ProfileResult = await resp.json();
        setProfile(data);
      } catch {
        setError('Network error — please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleApply = async (
    amount: number,
    tenor: 15 | 30 | 45,
    purpose: string,
  ) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const resp = await fetch('/api/fintech/apply', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ requestedAmount: amount, tenor, purpose }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setSubmitError(data?.message ?? 'Application failed. Please try again.');
        return;
      }

      setApplicationResult(data as ApplicationResult);
    } catch {
      setSubmitError('Network error — could not submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const isIneligible = profile && 'ineligible' in profile;
  const creditProfile = !isIneligible ? (profile as CreditProfile) : null;
  const isBronze = creditProfile?.tier === 'bronze';

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/wallet')}
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
            aria-label="Back to wallet"
          >
            <ArrowLeftIcon className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Working Capital</h1>
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <Card className="p-6">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {/* Already submitted — show status tracker */}
        {applicationResult && (
          <>
            <StatusTracker result={applicationResult} />
            <Button variant="outline" className="w-full" onClick={() => router.push('/wallet')}>
              Back to Wallet
            </Button>
          </>
        )}

        {/* Eligibility states */}
        {!loading && !error && !applicationResult && (
          <>
            {/* Not enough data */}
            {isIneligible && (
              <Card className="p-6 space-y-4">
                <h2 className="font-semibold text-foreground">Working Capital</h2>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm font-medium text-amber-800">
                    Keep using REZ for{' '}
                    {Math.max(0, 3 - (profile as IneligibleProfile).dataMonthsAvailable)} more
                    month(s) to unlock working capital
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {(profile as IneligibleProfile).reason}
                  </p>
                </div>
                <ul className="space-y-2">
                  {IMPROVEMENT_TIPS.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Bronze tier — ineligible for credit, show improvement tips */}
            {creditProfile && isBronze && (
              <>
                <CreditScoreCard
                  score={creditProfile.score}
                  tier={creditProfile.tier}
                  maxCreditLine={creditProfile.maxCreditLine}
                  factors={creditProfile.factors}
                  eligibleForSupplierTerms={false}
                  onImprove={() => {}}
                />
                <Card className="p-6 space-y-3">
                  <h2 className="font-semibold text-foreground">How to improve your score</h2>
                  <p className="text-sm text-muted-foreground">
                    Reach Silver tier (41+) to unlock supplier credit.
                  </p>
                  <ul className="space-y-2">
                    {IMPROVEMENT_TIPS.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}

            {/* Silver+ — eligible, show application form */}
            {creditProfile && !isBronze && (
              <>
                <CreditScoreCard
                  score={creditProfile.score}
                  tier={creditProfile.tier}
                  maxCreditLine={creditProfile.maxCreditLine}
                  factors={creditProfile.factors}
                  eligibleForSupplierTerms={creditProfile.eligibleForSupplierTerms}
                  onApply={() => {}}
                />

                <ApplicationForm
                  profile={creditProfile}
                  onSubmit={handleApply}
                  submitting={submitting}
                />

                {submitError && (
                  <p className="text-sm text-destructive text-center">{submitError}</p>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  This credit facility is powered by your{' '}
                  {creditProfile.dataMonthsAvailable} months of REZ transaction history.
                  No collateral or paperwork required.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
