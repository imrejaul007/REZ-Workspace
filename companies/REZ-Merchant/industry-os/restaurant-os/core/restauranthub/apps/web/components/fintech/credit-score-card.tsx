'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface CreditFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export type CreditTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface CreditScoreCardProps {
  score: number;
  tier: CreditTier;
  maxCreditLine: number;
  factors: CreditFactor[];
  eligibleForSupplierTerms: boolean;
  onApply?: () => void;
  onImprove?: () => void;
  className?: string;
}

// ── Tier styling ──────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<
  CreditTier,
  { label: string; bg: string; text: string; ring: string; badge: string }
> = {
  bronze: {
    label: 'Bronze',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    ring: 'stroke-amber-400',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  silver: {
    label: 'Silver',
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    ring: 'stroke-slate-400',
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  gold: {
    label: 'Gold',
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    ring: 'stroke-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  platinum: {
    label: 'Platinum',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    ring: 'stroke-purple-500',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
  },
};

// ── Circular progress dial ────────────────────────────────────────────────────

function ScoreDial({ score, tier }: { score: number; tier: CreditTier }) {
  const cfg = TIER_CONFIG[tier];
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        {/* Track */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-gray-200"
        />
        {/* Progress */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={`transition-all duration-700 ${cfg.ring}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${cfg.text}`}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

// ── Factor list ───────────────────────────────────────────────────────────────

function FactorItem({ factor }: { factor: CreditFactor }) {
  const dotClass =
    factor.impact === 'positive'
      ? 'bg-green-500'
      : factor.impact === 'negative'
      ? 'bg-red-400'
      : 'bg-gray-400';

  return (
    <li className="flex items-start gap-2 text-sm">
      <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dotClass}`} />
      <span className="text-muted-foreground leading-snug">{factor.description}</span>
    </li>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CreditScoreCard({
  score,
  tier,
  maxCreditLine,
  factors,
  eligibleForSupplierTerms,
  onApply,
  onImprove,
  className = '',
}: CreditScoreCardProps) {
  const cfg = TIER_CONFIG[tier];

  // Show the top positive factors and top negative factor
  const positives = factors.filter((f) => f.impact === 'positive').slice(0, 2);
  const negatives = factors.filter((f) => f.impact === 'negative').slice(0, 1);
  const displayFactors = [...positives, ...negatives];

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header band */}
      <div className={`${cfg.bg} px-6 py-4 flex items-center justify-between`}>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            REZ Credit Score
          </p>
          <p className={`text-lg font-bold ${cfg.text}`}>Based on your REZ activity</p>
        </div>
        <span
          className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${cfg.badge}`}
        >
          {cfg.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex flex-col gap-5">
        {/* Dial + credit line */}
        <div className="flex items-center gap-6">
          <ScoreDial score={score} tier={tier} />
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Max Credit Line</p>
              <p className="text-xl font-bold text-foreground">
                {maxCreditLine > 0
                  ? `₹${maxCreditLine.toLocaleString('en-IN')}`
                  : 'Not eligible yet'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Supplier Payment Terms</p>
              <p className="text-sm font-medium">
                {eligibleForSupplierTerms ? (
                  <span className="text-green-600">Eligible</span>
                ) : (
                  <span className="text-amber-600">Not yet eligible</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Score factors */}
        {displayFactors.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Score factors
            </p>
            <ul className="space-y-1.5">
              {displayFactors.map((f) => (
                <FactorItem key={f.factor} factor={f} />
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        {eligibleForSupplierTerms ? (
          <Button className="w-full" onClick={onApply}>
            Apply for Supplier Credit
          </Button>
        ) : (
          <Button variant="outline" className="w-full" onClick={onImprove}>
            How to improve my score
          </Button>
        )}
      </div>
    </Card>
  );
}

export default CreditScoreCard;
