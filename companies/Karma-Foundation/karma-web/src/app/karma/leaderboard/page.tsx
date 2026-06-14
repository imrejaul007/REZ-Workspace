'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Medal,
  Star,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getLeaderboard, getMyRank } from '@/lib/karmaApi';
import type { LeaderboardResult, UserRankResult, LeaderboardEntry } from '@/types/karma';

const SCOPE_OPTIONS: { value: 'global' | 'city' | 'cause'; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'city', label: 'City' },
  { value: 'cause', label: 'Cause' },
];

const PERIOD_OPTIONS: { value: 'all-time' | 'monthly' | 'weekly'; label: string }[] = [
  { value: 'all-time', label: 'All Time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
];

const LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  L1: { bg: '#DCFCE7', color: '#22C55E' },
  L2: { bg: '#ECFEFF', color: '#06B6D4' },
  L3: { bg: '#FFF1F2', color: '#F43F5E' },
  L4: { bg: '#FEF9C3', color: '#EAB308' },
};

function TopThreeCard({ entry, position }: { entry: LeaderboardEntry; position: 1 | 2 | 3 }) {
  const medalColors = { 1: '#F59E0B', 2: '#9CA3AF', 3: '#D97706' };
  const medalColor = medalColors[position];
  const levelCfg = LEVEL_COLORS[entry.level] ?? LEVEL_COLORS.L1;

  return (
    <Card className="flex-1 flex flex-col items-center p-4 rounded-2xl border-2" style={{ borderColor: `${medalColor}40` }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: `${medalColor}20` }}>
        {position === 1 ? (
          <Trophy className="w-7 h-7" style={{ color: medalColor }} />
        ) : (
          <Medal className="w-6 h-6" style={{ color: medalColor }} />
        )}
      </div>
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-extrabold mb-2" style={{ backgroundColor: levelCfg.bg, color: levelCfg.color }}>
        {entry.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="font-bold text-sm text-gray-900 text-center truncate w-full mb-1">{entry.displayName}</div>
      <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-1" style={{ backgroundColor: levelCfg.bg, color: levelCfg.color }}>
        {entry.level}
      </span>
      <div className="text-xl font-extrabold" style={{ color: medalColor }}>{entry.karmaScore.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">karma</div>
    </Card>
  );
}

function LeaderboardRow({ entry, isLast }: { entry: LeaderboardEntry; isLast: boolean }) {
  const levelCfg = LEVEL_COLORS[entry.level] ?? LEVEL_COLORS.L1;

  return (
    <div className={`flex items-center gap-3 py-3 ${!isLast ? 'border-b border-border' : ''}`}>
      <div className="w-8 text-center font-bold text-muted-foreground">{entry.rank}</div>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: levelCfg.bg, color: levelCfg.color }}>
        {entry.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-900 truncate">{entry.displayName}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: levelCfg.bg, color: levelCfg.color }}>{entry.level}</span>
          <span className="text-xs text-muted-foreground">{entry.eventsCompleted} events</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-extrabold text-sm text-gray-900">{entry.karmaScore.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">karma</div>
      </div>
    </div>
  );
}

function EmptyLeaderboard() {
  return (
    <Card className="flex flex-col items-center justify-center py-16">
      <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="font-bold text-lg text-gray-900 mb-2">No Rankings Yet</h3>
      <p className="text-sm text-muted-foreground text-center">
        Join events and complete actions to appear on the leaderboard
      </p>
    </Card>
  );
}

export default function LeaderboardPage() {
  const { isAuthenticated } = useAuth();
  const [scope, setScope] = useState<'global' | 'city' | 'cause'>('global');
  const [period, setPeriod] = useState<'all-time' | 'monthly' | 'weekly'>('monthly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardResult | null>(null);
  const [userRank, setUserRank] = useState<UserRankResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const [lbRes, rankRes] = await Promise.all([
        getLeaderboard(scope, period, 50, 0),
        isAuthenticated ? getMyRank(scope, period) : Promise.resolve({ success: false as const }),
      ]);
      if (lbRes.success && lbRes.data) setLeaderboard(lbRes.data);
      if (rankRes.success && rankRes.data) setUserRank(rankRes.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [scope, period, isAuthenticated]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const topThree = leaderboard?.entries.slice(0, 3) ?? [];
  const restEntries = leaderboard?.entries.slice(3) ?? [];

  const percentileBadge = userRank?.percentile
    ? userRank.percentile <= 10 ? 'Top 10%'
    : userRank.percentile <= 25 ? 'Top 25%'
    : userRank.percentile <= 50 ? 'Top 50%'
    : null
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-muted-foreground text-sm">See how you rank</p>
      </div>

      {/* User Rank Card */}
      {userRank && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#F5F3FF] flex items-center justify-center">
              <span className="text-xl font-extrabold text-[#8B5CF6]">#{userRank.rank}</span>
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900">Your Rank</div>
              <div className="text-sm text-muted-foreground">of {userRank.totalParticipants.toLocaleString()} participants</div>
            </div>
            {percentileBadge && (
              <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <Trophy className="w-3.5 h-3.5" />
                {percentileBadge}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Scope Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-gray-100 rounded-xl p-1">
        {SCOPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setScope(option.value)}
            className="py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: scope === option.value ? '#fff' : 'transparent',
              color: scope === option.value ? '#8B5CF6' : '#6b7280',
              boxShadow: scope === option.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 flex-wrap">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setPeriod(option.value)}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
            style={{
              backgroundColor: period === option.value ? '#F5F3FF' : '#fff',
              borderColor: period === option.value ? '#8B5CF6' : '#e5e7eb',
              color: period === option.value ? '#8B5CF6' : '#6b7280',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : topThree.length === 0 ? (
        <EmptyLeaderboard />
      ) : (
        <>
          {/* Top 3 */}
          {topThree.length > 0 && (
            <div className="flex gap-3 justify-center items-end">
              {topThree[1] && <TopThreeCard entry={topThree[1]} position={2} />}
              {topThree[0] && <TopThreeCard entry={topThree[0]} position={1} />}
              {topThree[2] && <TopThreeCard entry={topThree[2]} position={3} />}
            </div>
          )}

          {/* Rest */}
          {restEntries.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Rankings</h3>
              <Card className="px-4">
                {restEntries.map((entry, idx) => (
                  <LeaderboardRow key={entry.userId} entry={entry} isLast={idx === restEntries.length - 1} />
                ))}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
