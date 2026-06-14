'use client';

import { CheckCircle, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { KarmaLevel } from '@/types/karma';

const LEVEL_CONFIG: Record<KarmaLevel, { label: string; name: string; color: string; bg: string; threshold: number; next: number | null }> = {
  L1: { label: 'L1', name: 'Seed', color: '#22C55E', bg: '#DCFCE7', threshold: 0, next: 500 },
  L2: { label: 'L2', name: 'Sprout', color: '#06B6D4', bg: '#ECFEFF', threshold: 500, next: 2000 },
  L3: { label: 'L3', name: 'Bloom', color: '#F43F5E', bg: '#FFF1F2', threshold: 2000, next: 5000 },
  L4: { label: 'L4', name: 'Tree', color: '#EAB308', bg: '#FEF9C3', threshold: 5000, next: null },
};

const CONVERSION_RATES: Record<KarmaLevel, number> = {
  L1: 25, L2: 50, L3: 75, L4: 100,
};

interface TierProgressProps {
  currentTier: KarmaLevel;
  showDetails?: boolean;
}

export function TierProgress({ currentTier, showDetails = true }: TierProgressProps) {
  const levels: KarmaLevel[] = ['L1', 'L2', 'L3', 'L4'];
  const currentIdx = levels.indexOf(currentTier);

  return (
    <Card className="p-6">
      <h3 className="font-bold text-gray-900 mb-4">Karma Tiers</h3>

      {/* Progress Line */}
      <div className="relative flex justify-between items-center mb-6">
        {/* Connecting line background */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 mx-4">
          {/* Progress fill */}
          <div
            className="h-full bg-[#8B5CF6] rounded-full transition-all duration-500"
            style={{ width: `${(currentIdx / (levels.length - 1)) * 100}%` }}
          />
        </div>

        {levels.map((lvl, idx) => {
          const cfg = LEVEL_CONFIG[lvl];
          const isActive = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const isLocked = idx > currentIdx;

          return (
            <div key={lvl} className="flex flex-col items-center z-10">
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  isLocked ? 'opacity-50' : ''
                }`}
                style={{
                  backgroundColor: isActive ? cfg.color : '#f3f4f6',
                  borderColor: isActive ? cfg.color : '#e5e7eb',
                }}
              >
                {isCurrent ? (
                  <div className="w-3 h-3 bg-white rounded-full" />
                ) : isActive ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <Lock className="w-3 h-3 text-gray-400" />
                )}
              </div>
              <span
                className="text-xs font-semibold mt-2"
                style={{ color: isCurrent ? cfg.color : isActive ? '#6b7280' : '#9ca3af' }}
              >
                {cfg.label}
              </span>
              <span className="text-xs text-gray-500">{cfg.name}</span>
            </div>
          );
        })}
      </div>

      {/* Tier Details */}
      {showDetails && (
        <div className="space-y-3">
          {levels.map((lvl) => {
            const cfg = LEVEL_CONFIG[lvl];
            const rate = CONVERSION_RATES[lvl];
            const isCurrent = lvl === currentTier;
            const isCompleted = levels.indexOf(lvl) < currentIdx;

            return (
              <div
                key={lvl}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  isCurrent ? 'bg-[#F5F3FF] ring-2 ring-[#8B5CF6]/20' : 'bg-gray-50/50'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0"
                  style={{
                    backgroundColor: isCompleted || isCurrent ? cfg.bg : '#f3f4f6',
                    color: isCompleted || isCurrent ? cfg.color : '#9ca3af',
                  }}
                >
                  {cfg.label}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{cfg.name}</span>
                    {isCurrent && (
                      <span className="text-xs font-medium text-[#8B5CF6] bg-[#F5F3FF] px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {cfg.next
                      ? `${cfg.threshold.toLocaleString()} - ${cfg.next.toLocaleString()} karma`
                      : `${cfg.threshold.toLocaleString()}+ karma (Max)`}
                  </div>
                </div>
                <div
                  className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: isCompleted || isCurrent ? cfg.bg : '#f3f4f6',
                    color: isCompleted || isCurrent ? cfg.color : '#9ca3af',
                  }}
                >
                  {rate}% rate
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
