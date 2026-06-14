'use client';

import { useLoyalty } from '@/lib/hooks/useLoyalty';

interface StreakDisplayProps {
  variant?: 'card' | 'inline';
}

export default function StreakDisplay({ variant = 'inline' }: StreakDisplayProps) {
  const { streak, loading } = useLoyalty();

  if (loading || !streak) {
    return null;
  }

  const isAtRisk = streak.currentStreak > 0 && !streak.hasCheckedInToday;

  if (variant === 'card') {
    return (
      <div className="streak-card bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🔥</span>
          <div>
            <div className="text-2xl font-bold">{streak.currentStreak}</div>
            <div className="text-sm opacity-80">Day Streak</div>
          </div>
        </div>

        {isAtRisk && (
          <div className="mt-2 text-sm bg-white/20 rounded-lg px-2 py-1">
            ⚠️ Check in today to keep your streak!
          </div>
        )}

        <div className="mt-2 text-xs opacity-80">
          Longest: {streak.longestStreak} days
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span>🔥</span>
      <span className="font-bold">{streak.currentStreak}</span>
      <span className="text-gray-500">day streak</span>
    </div>
  );
}
