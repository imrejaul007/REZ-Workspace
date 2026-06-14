'use client';

import { useState, useEffect } from 'react';
import { Activity, Eye, ShoppingBag, DollarSign, AlertTriangle, Clock } from 'lucide-react';
import { RealtimeMetric } from '@/types';

interface RealtimeMetricsProps {
  metrics: RealtimeMetric[];
}

const iconMap: Record<string, typeof Activity> = {
  'Active Users': Activity,
  'Page Views': Eye,
  Orders: ShoppingBag,
  Revenue: DollarSign,
  'Cart Abandonment': AlertTriangle,
  'Avg Session': Clock,
};

const colorMap: Record<string, string> = {
  'Active Users': 'text-green-400',
  'Page Views': 'text-blue-400',
  Orders: 'text-purple-400',
  Revenue: 'text-yellow-400',
  'Cart Abandonment': 'text-red-400',
  'Avg Session': 'text-cyan-400',
};

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString();
}

export default function RealtimeMetrics({ metrics }: RealtimeMetricsProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric) => {
        const Icon = iconMap[metric.name] || Activity;
        const colorClass = colorMap[metric.name] || 'text-primary-400';
        const timestamp = metric.timestamp instanceof Date ? metric.timestamp : new Date(metric.timestamp);

        return (
          <div
            key={metric.id}
            className="metric-card p-4 text-center"
          >
            <div className="flex justify-center mb-3">
              <div className={`p-2 rounded-lg bg-dark-100 ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-slate-400 text-xs mb-1">{metric.name}</p>
            <p className={`text-xl font-bold ${colorClass}`}>
              {metric.value.toLocaleString()}
              {metric.unit && <span className="text-sm font-normal ml-1">{metric.unit}</span>}
            </p>
            <p className="text-slate-600 text-xs mt-2">
              {formatTimestamp(timestamp)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
