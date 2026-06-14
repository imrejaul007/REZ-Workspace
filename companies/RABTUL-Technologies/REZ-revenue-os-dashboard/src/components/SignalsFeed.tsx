'use client';

import clsx from 'clsx';
import { format } from 'date-fns';
import { TrendingUp, Building, Briefcase, DollarSign, Users, Globe } from 'lucide-react';

interface SignalsFeedProps {
  signals: Array<{
    id: string;
    type: string;
    title: string;
    company: string;
    intent: 'high' | 'medium' | 'low';
    date: string;
    description?: string;
  }>;
}

const signalIcons: Record<string, React.ElementType> = {
  funding: DollarSign,
  expansion: Building,
  news: Globe,
  job_posting: Briefcase,
  executive_change: Users,
  partnership: TrendingUp,
};

export default function SignalsFeed({ signals }: SignalsFeedProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Intent Signals</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">All</button>
          <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">High</button>
          <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">Medium</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {signals.map((signal) => {
          const Icon = signalIcons[signal.type] || TrendingUp;
          return (
            <div key={signal.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={clsx(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  signal.type === 'funding' ? 'bg-green-100 text-green-600' :
                  signal.type === 'expansion' ? 'bg-blue-100 text-blue-600' :
                  signal.type === 'news' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={clsx(
                  'px-2 py-1 text-xs rounded-full font-medium',
                  signal.intent === 'high' ? 'bg-green-100 text-green-700' :
                  signal.intent === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {signal.intent.toUpperCase()}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{signal.title}</h3>
              <p className="text-sm text-gray-500 mb-2">{signal.company}</p>
              {signal.description && (
                <p className="text-xs text-gray-400 mb-3">{signal.description}</p>
              )}
              <div className="text-xs text-gray-400">
                {format(new Date(signal.date), 'MMM d, yyyy')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
