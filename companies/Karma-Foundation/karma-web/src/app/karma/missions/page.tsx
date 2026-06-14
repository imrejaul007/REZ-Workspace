'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Flag,
  Trophy,
  Ribbon,
  Medal,
  Clock,
  Flame,
  CheckCircle,
  Leaf,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getMissions } from '@/lib/karmaApi';
import type { KarmaMission } from '@/types/karma';

const MISSION_CATEGORY_COLORS: Record<string, string> = {
  mission_first_event: '#22C55E',
  mission_10_events: '#3B82F6',
  mission_50_hours: '#F59E0B',
  mission_7_streak: '#EF4444',
};

const MISSION_ICONS: Record<string, React.ElementType> = {
  mission_first_event: Ribbon,
  mission_10_events: Medal,
  mission_50_hours: Clock,
  mission_7_streak: Flame,
};

function MissionCard({ mission }: { mission: KarmaMission }) {
  const progressPercent = mission.requirement > 0 ? Math.min((mission.progress / mission.requirement) * 100, 100) : 0;
  const accentColor = MISSION_CATEGORY_COLORS[mission.id] ?? '#8B5CF6';
  const Icon = MISSION_ICONS[mission.id] ?? Trophy;

  const unit = mission.id.includes('hour') ? 'h' : mission.id.includes('streak') ? ' days' : ' events';

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4 mb-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}20` }}>
          <Icon className="w-6 h-6" style={{ color: accentColor }} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base text-gray-900">{mission.name}</h3>
            {mission.isComplete && (
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{mission.description}</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPercent}%`, backgroundColor: accentColor }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{mission.progress} / {mission.requirement}{unit}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {mission.reward?.karmaBonus && (
          <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full">
            <Trophy className="w-3 h-3 text-yellow-500" />
            +{mission.reward.karmaBonus} Karma
          </span>
        )}
        {mission.reward?.badgeId && (
          <span className="flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">
            <Medal className="w-3 h-3" />
            Badge
          </span>
        )}
        {mission.isComplete && (
          <span className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Complete
          </span>
        )}
      </div>
    </Card>
  );
}

function MissionEmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center py-16 px-6">
      <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="font-bold text-lg text-gray-900 mb-2">No Missions Yet</h3>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Complete your first event to start earning missions
      </p>
      <Link href="/karma/explore">
        <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED]">Explore Events</Button>
      </Link>
    </Card>
  );
}

function StatsSummary({ missions }: { missions: KarmaMission[] }) {
  const completed = missions.filter((m) => m.isComplete).length;
  const totalKarma = missions.filter((m) => m.isComplete).reduce((sum, m) => sum + (m.reward?.karmaBonus ?? 0), 0);
  const totalRemaining = missions.filter((m) => !m.isComplete).reduce((sum, m) => sum + (m.reward?.karmaBonus ?? 0), 0);

  return (
    <Card className="p-4">
      <div className="grid grid-cols-4 divide-x divide-border">
        <div className="text-center px-2">
          <div className="text-2xl font-extrabold text-gray-900">{completed}</div>
          <div className="text-xs text-muted-foreground">Done</div>
        </div>
        <div className="text-center px-2">
          <div className="text-2xl font-extrabold text-gray-900">{missions.length - completed}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
        <div className="text-center px-2">
          <div className="text-2xl font-extrabold text-yellow-500">+{totalKarma}</div>
          <div className="text-xs text-muted-foreground">Earned</div>
        </div>
        <div className="text-center px-2">
          <div className="text-2xl font-extrabold text-[#8B5CF6]">+{totalRemaining}</div>
          <div className="text-xs text-muted-foreground">Available</div>
        </div>
      </div>
    </Card>
  );
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<KarmaMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getMissions();
      if (res.success && res.data) {
        setMissions(res.data.missions ?? []);
      } else {
        setError(true);
      }
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Missions</h1>
        <p className="text-muted-foreground text-sm">Your Active Goals</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error || missions.length === 0 ? (
        <MissionEmptyState />
      ) : (
        <>
          <StatsSummary missions={missions} />
          <div className="space-y-4">
            {missions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
