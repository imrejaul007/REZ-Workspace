'use client';

import { TrendingUp, TrendingDown, DollarSign, Users, Target, ShoppingCart } from 'lucide-react';
import { keyMetrics } from '@/lib/mock-data';

const iconMap = {
  'Total Revenue': DollarSign,
  'Active Users': Users,
  'Conversion Rate': Target,
  'Avg Order Value': ShoppingCart,
};

export default function MetricsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {keyMetrics.map((metric) => {
        const Icon = iconMap[metric.label as keyof typeof iconMap] || TrendingUp;
        const isPositive = metric.trend === 'up';
        const isNeutral = metric.trend === 'neutral';

        return (
          <div
            key={metric.label}
            className="metric-card p-5 hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-lg bg-primary-500/20">
                <Icon className="w-5 h-5 text-primary-400" />
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                  isNeutral
                    ? 'bg-slate-700/50 text-slate-400'
                    : isPositive
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>{Math.abs(metric.change)}%</span>
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-1">{metric.label}</p>
            <p className="text-2xl font-bold text-white">
              {metric.label === 'Conversion Rate'
                ? `${metric.value.toFixed(2)}%`
                : metric.label === 'Avg Order Value'
                ? `$${metric.value.toFixed(2)}`
                : metric.value.toLocaleString()}
            </p>
            <p className="text-slate-500 text-xs mt-2">vs. last 30 days</p>
          </div>
        );
      })}
    </div>
  );
}
