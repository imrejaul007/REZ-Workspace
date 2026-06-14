'use client';

import { Activity } from '@/lib/api';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Phone,
  MessageSquare,
  FileText,
  DollarSign,
  ArrowRightLeft,
  Calendar,
  User,
} from 'lucide-react';

interface TimelineProps {
  activities: Activity[];
  maxItems?: number;
}

const activityIcons = {
  stage_change: ArrowRightLeft,
  note: MessageSquare,
  call: Phone,
  meeting: Calendar,
  offer: DollarSign,
  payment: DollarSign,
};

const activityColors = {
  stage_change: 'bg-purple-100 text-purple-600',
  note: 'bg-blue-100 text-blue-600',
  call: 'bg-green-100 text-green-600',
  meeting: 'bg-orange-100 text-orange-600',
  offer: 'bg-yellow-100 text-yellow-600',
  payment: 'bg-emerald-100 text-emerald-600',
};

export function Timeline({ activities, maxItems }: TimelineProps) {
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No activities yet
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-4">
        {displayActivities.map((activity, index) => {
          const Icon = activityIcons[activity.type] || FileText;
          const colorClass = activityColors[activity.type] || 'bg-gray-100 text-gray-600';

          return (
            <div key={activity.id} className="relative pl-10">
              <div
                className={cn(
                  'absolute left-0 h-8 w-8 rounded-full flex items-center justify-center',
                  colorClass
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{activity.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{formatRelativeTime(activity.createdAt)}</span>
                  <span>•</span>
                  <span>{activity.createdBy}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
