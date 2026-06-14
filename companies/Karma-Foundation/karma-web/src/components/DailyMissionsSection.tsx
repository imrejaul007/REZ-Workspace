'use client';

import { Flag, Target, CheckCircle, Circle, Leaf, Star, Gift } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress';
import type { KarmaMission } from '@/types/karma';

const MISSION_TYPE_CONFIG: Record<string, { icon: typeof Flag; color: string; bg: string }> = {
  daily: { icon: Target, color: '#3B82F6', bg: '#EFF6FF' },
  social: { icon: Leaf, color: '#22C55E', bg: '#DCFCE7' },
  streak: { icon: Star, color: '#F59E0B', bg: '#FFFBEB' },
  special: { icon: Gift, color: '#8B5CF6', bg: '#F5F3FF' },
};

interface DailyMissionsSectionProps {
  missions: KarmaMission[];
  onMissionClick?: (mission: KarmaMission) => void;
}

export function DailyMissionsSection({ missions, onMissionClick }: DailyMissionsSectionProps) {
  const completedCount = missions.filter((m) => m.isComplete).length;
  const totalCount = missions.length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] flex items-center justify-center">
            <Flag className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Daily Missions</h3>
            <p className="text-xs text-muted-foreground">Complete for bonus karma</p>
          </div>
        </div>
        <div className="text-sm font-semibold text-[#8B5CF6]">
          {completedCount}/{totalCount} done
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mb-4">
          <Progress value={(completedCount / totalCount) * 100} className="h-2">
            <ProgressTrack>
              <ProgressIndicator className="bg-[#8B5CF6]" />
            </ProgressTrack>
          </Progress>
        </div>
      )}

      {/* Missions List */}
      {missions.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Flag className="w-10 h-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No missions available today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {missions.map((mission) => (
            <MissionItem
              key={mission.id}
              mission={mission}
              onClick={() => onMissionClick?.(mission)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

interface MissionItemProps {
  mission: KarmaMission;
  onClick?: () => void;
}

function MissionItem({ mission, onClick }: MissionItemProps) {
  const typeConfig = MISSION_TYPE_CONFIG[mission.type] ?? MISSION_TYPE_CONFIG.daily;
  const TypeIcon = typeConfig.icon;
  const progressPercent = Math.min((mission.progress / mission.requirement) * 100, 100);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={mission.isComplete}
      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
        mission.isComplete
          ? 'bg-green-50/50 opacity-75'
          : 'bg-gray-50 hover:bg-gray-100 active:scale-[0.99]'
      }`}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: mission.isComplete ? '#DCFCE7' : typeConfig.bg }}
      >
        {mission.isComplete ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <TypeIcon className="w-5 h-5" style={{ color: typeConfig.color }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-900">{mission.name}</span>
          {mission.isComplete && (
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              Done
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {mission.description}
        </p>

        {/* Progress */}
        {!mission.isComplete && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{mission.progress}/{mission.requirement}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: typeConfig.color,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Reward */}
      {mission.reward && (
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1 text-sm font-bold text-[#8B5CF6]">
            <Leaf className="w-3.5 h-3.5" />
            +{mission.reward.karmaBonus}
          </div>
          {mission.reward.badgeId && (
            <div className="text-xs text-muted-foreground mt-0.5">+ Badge</div>
          )}
        </div>
      )}
    </button>
  );
}
