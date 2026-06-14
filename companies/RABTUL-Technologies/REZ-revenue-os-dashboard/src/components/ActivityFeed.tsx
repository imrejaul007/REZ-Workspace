'use client';

import { format } from 'date-fns';
import { Mail, Phone, Video, Linkedin, MessageSquare } from 'lucide-react';

interface ActivityFeedProps {
  activities: Array<{
    id: string;
    type: string;
    title: string;
    user: string;
    time: string;
  }>;
}

const activityIcons: Record<string, React.ElementType> = {
  email: Mail,
  call: Phone,
  meeting: Video,
  linkedin: Linkedin,
  note: MessageSquare,
};

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type] || MessageSquare;
        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {activity.user} • {activity.time}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
