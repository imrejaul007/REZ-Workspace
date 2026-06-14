'use client';

import { Leaf, Shield, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress';
import type { KarmaProfile, KarmaLevel } from '@/types/karma';

const LEVEL_CONFIG: Record<KarmaLevel, { label: string; name: string; color: string; bg: string; next: number | null }> = {
  L1: { label: 'L1', name: 'Seed', color: '#22C55E', bg: '#DCFCE7', next: 500 },
  L2: { label: 'L2', name: 'Sprout', color: '#06B6D4', bg: '#ECFEFF', next: 2000 },
  L3: { label: 'L3', name: 'Bloom', color: '#F43F5E', bg: '#FFF1F2', next: 5000 },
  L4: { label: 'L4', name: 'Tree', color: '#EAB308', bg: '#FEF9C3', next: null },
};

const CONVERSION_RATES: Record<KarmaLevel, number> = {
  L1: 25, L2: 50, L3: 75, L4: 100,
};

interface KarmaLevelCardProps {
  profile: KarmaProfile;
  showDetailedStats?: boolean;
}

export function KarmaLevelCard({ profile, showDetailedStats = true }: KarmaLevelCardProps) {
  const levelCfg = LEVEL_CONFIG[profile.level] ?? LEVEL_CONFIG.L1;
  const conversionPct = CONVERSION_RATES[profile.level] ?? 25;
  const progressPercent =
    profile.level !== 'L4' && levelCfg.next
      ? Math.min((profile.activeKarma / levelCfg.next) * 100, 100)
      : 100;

  return (
    <Card className="overflow-hidden" style={{ background: 'linear-gradient(135deg, #7C3AED, #8B5CF6, #A78BFA)' }}>
      <div className="p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold"
              style={{ backgroundColor: levelCfg.bg, color: levelCfg.color }}
            >
              {levelCfg.label}
            </div>
            <div>
              <div className="text-white font-bold text-lg">{levelCfg.name}</div>
              <div className="text-white/60 text-sm">Level {profile.level}</div>
            </div>
          </div>
          {showDetailedStats && (
            <div className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-sm font-medium text-white transition-colors">
              <Leaf className="w-3.5 h-3.5" />
              {conversionPct}% Conversion
            </div>
          )}
        </div>

        {/* Main Stats */}
        <div className="flex justify-around mb-4">
          <div className="text-center">
            <div className="text-3xl font-extrabold">{profile.activeKarma.toLocaleString()}</div>
            <div className="text-white/70 text-sm mt-0.5">Active Karma</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <div className="text-3xl font-extrabold">{profile.lifetimeKarma.toLocaleString()}</div>
            <div className="text-white/70 text-sm mt-0.5">Lifetime</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <div className="text-3xl font-extrabold" style={{ color: levelCfg.color }}>{conversionPct}%</div>
            <div className="text-white/70 text-sm mt-0.5">Conversion</div>
          </div>
        </div>

        {/* Level Progress */}
        {profile.level !== 'L4' && (
          <div className="mb-4">
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-white/70 text-xs mt-1.5 text-center">
              {profile.activeKarma.toLocaleString()} / {levelCfg.next?.toLocaleString()} to next level
            </div>
          </div>
        )}

        {/* Quick Stats Badges */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-sm font-medium text-white">
            <Shield className="w-3.5 h-3.5" />
            Trust {profile.trustScore}%
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-sm font-medium text-white">
            <CheckCircle className="w-3.5 h-3.5" />
            {profile.eventsCompleted} Events
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-sm font-medium text-white">
            <Clock className="w-3.5 h-3.5" />
            {profile.totalHours}h Given
          </div>
        </div>

        {/* Decay Warning */}
        {profile.decayWarning && (
          <div className="flex items-center gap-2 bg-black/20 mt-3 px-3 py-2 rounded-lg text-sm text-yellow-300">
            <Leaf className="w-3.5 h-3.5" />
            {profile.decayWarning}
          </div>
        )}
      </div>
    </Card>
  );
}
