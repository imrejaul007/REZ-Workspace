'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Home,
  Share2,
  User,
  UserPlus,
  MessageCircle as DiscordLogo,
  Calendar,
  Flame,
  Trophy,
  Star,
  Lock,
  CheckCircle,
  Clock,
  Zap,
  Medal,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getMicroActions, claimMicroAction } from '@/lib/karmaApi';
import type { MicroAction, MicroActionsResult, CompletedAction } from '@/types/karma';
import { toast } from 'sonner';

const ACTION_ICONS: Record<string, React.ElementType> = {
  share_impact: Share2,
  daily_checkin: Home,
  refer_friend: UserPlus,
  complete_profile: User,
  join_discord: DiscordLogo,
  first_event_month: Calendar,
  streak_7: Flame,
  streak_30: Trophy,
};

const ACTION_COLORS: Record<string, string> = {
  daily: '#22C55E',
  social: '#3B82F6',
  profile: '#8B5CF6',
  streak: '#EF4444',
  special: '#F59E0B',
};

const DEFAULT_ACTIONS: MicroAction[] = [
  { id: '1', key: 'daily_checkin', name: 'Daily Check-in', description: 'Open the app today', karmaBonus: 3, icon: 'home', category: 'daily', isAvailable: true, isLocked: false },
  { id: '2', key: 'share_impact', name: 'Share Your Impact', description: 'Share your report to earn', karmaBonus: 5, icon: 'share', category: 'social', isAvailable: true, isLocked: false },
  { id: '3', key: 'complete_profile', name: 'Profile Power', description: 'Complete all profile fields', karmaBonus: 10, icon: 'person', category: 'profile', isAvailable: true, isLocked: false },
  { id: '4', key: 'refer_friend', name: 'Refer a Friend', description: 'Invite someone new', karmaBonus: 20, icon: 'person-add', category: 'social', isAvailable: true, isLocked: false },
  { id: '5', key: 'join_discord', name: 'Join the Community', description: 'Connect with volunteers', karmaBonus: 8, icon: 'logo-discord', category: 'social', isAvailable: true, isLocked: false },
  { id: '6', key: 'first_event_month', name: 'Monthly Mission', description: 'Join your first event this month', karmaBonus: 15, icon: 'calendar', category: 'special', isAvailable: true, isLocked: false },
  { id: '7', key: 'streak_7', name: '7-Day Streak', description: 'Complete actions 7 days in a row', karmaBonus: 10, icon: 'flame', category: 'streak', isAvailable: false, isLocked: true, lockReason: 'Complete 3 daily actions first' },
  { id: '8', key: 'streak_30', name: '30-Day Streak', description: 'Complete actions 30 days in a row', karmaBonus: 50, icon: 'trophy', category: 'streak', isAvailable: false, isLocked: true, lockReason: 'Reach 7-day streak first' },
];

function ActionCard({
  action,
  isCompleted,
  onClaim,
  isClaiming,
}: {
  action: MicroAction;
  isCompleted: boolean;
  onClaim: (key: string) => void;
  isClaiming: boolean;
}) {
  const Icon = ACTION_ICONS[action.key] ?? Zap;
  const accentColor = ACTION_COLORS[action.category] ?? '#8B5CF6';
  const canClaim = action.isAvailable && !isCompleted && !action.isLocked;

  return (
    <Card className={`p-4 ${isCompleted ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}20` }}>
          <Icon className="w-6 h-6" style={{ color: accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-gray-900">{action.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
            </div>
            {canClaim ? (
              <Button
                size="sm"
                className="flex-shrink-0 text-white font-bold"
                style={{ backgroundColor: accentColor }}
                onClick={() => onClaim(action.key)}
                disabled={isClaiming}
              >
                {isClaiming ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Claim'}
              </Button>
            ) : isCompleted ? (
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : null}
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
              <Star className="w-3 h-3 text-yellow-500" />
              +{action.karmaBonus}
            </span>
            {isCompleted && (
              <span className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Done
              </span>
            )}
            {action.isLocked && (
              <span className="flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-semibold px-2 py-1 rounded-full">
                <Lock className="w-3 h-3" />
                {action.lockReason ?? 'Locked'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProgressRing({ completed, total, size = 80 }: { completed: number; total: number; size?: number }) {
  const progress = total > 0 ? completed / total : 0;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-2xl font-extrabold">{completed}</span>
        <span className="text-xs text-white/70">of {total}</span>
      </div>
    </div>
  );
}

export default function MicroActionsPage() {
  const [data, setData] = useState<MicroActionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingKey, setClaimingKey] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const fetchMicroActions = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getMicroActions();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setData({
          available: DEFAULT_ACTIONS,
          completed: [],
          earnedToday: 0,
          totalAvailable: DEFAULT_ACTIONS.length,
          totalCompleted: 0,
        });
      }
    } catch {
      setError(true);
      setData({
        available: DEFAULT_ACTIONS,
        completed: [],
        earnedToday: 0,
        totalAvailable: DEFAULT_ACTIONS.length,
        totalCompleted: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMicroActions(); }, [fetchMicroActions]);

  const handleClaim = async (actionKey: string) => {
    setClaimingKey(actionKey);
    try {
      const res = await claimMicroAction(actionKey);
      if (res.success && res.data) {
        toast.success(`Karma Earned!`, { description: `+${res.data.karmaEarned} karma added to your account.` });
        fetchMicroActions();
      } else {
        toast.error('Failed', { description: res.error ?? 'Could not claim action' });
      }
    } catch {
      toast.error('Error', { description: 'Failed to claim action. Please try again.' });
    } finally {
      setClaimingKey(null);
    }
  };

  const completedKeys = new Set(data?.completed.map((c) => c.actionKey) ?? []);
  const availableActions = data?.available.filter((a) => a.isAvailable && !a.isLocked) ?? [];
  const lockedActions = data?.available.filter((a) => a.isLocked) ?? [];
  const completedCount = data?.completed.length ?? completedKeys.size;
  const totalCount = data?.available.length ?? DEFAULT_ACTIONS.length;
  const earnedToday = data?.earnedToday ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Actions</h1>
        <p className="text-muted-foreground text-sm">Earn karma daily</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Today's Progress Header */}
          <div className="bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xl font-bold">Daily Actions</div>
                <div className="text-white/80 text-sm">Complete actions to earn karma</div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold">{earnedToday} earned today</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <ProgressRing completed={completedCount} total={totalCount} size={80} />
              <div>
                <div className="font-bold text-lg">Today&apos;s Progress</div>
                <div className="text-white/80 text-sm mt-0.5">
                  {completedCount === totalCount && totalCount > 0
                    ? 'All done for today!'
                    : `${totalCount - completedCount} actions remaining`}
                </div>
                {completedCount === totalCount && totalCount > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-green-300 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    Great job!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Available Actions */}
          {availableActions.length > 0 && (
            <section>
              <h2 className="font-bold text-gray-900 mb-3">Available Actions</h2>
              <div className="space-y-3">
                {availableActions.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    isCompleted={completedKeys.has(action.key)}
                    onClaim={handleClaim}
                    isClaiming={claimingKey === action.key}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Locked Actions */}
          {lockedActions.length > 0 && (
            <section>
              <h2 className="font-bold text-gray-900 mb-3">Upcoming</h2>
              <div className="space-y-3">
                {lockedActions.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    isCompleted={completedKeys.has(action.key)}
                    onClaim={handleClaim}
                    isClaiming={claimingKey === action.key}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Tomorrow's Actions */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                New actions unlock daily. Check back tomorrow for fresh opportunities!
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
