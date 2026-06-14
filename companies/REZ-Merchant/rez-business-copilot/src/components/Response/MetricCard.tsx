'use client';

import React from 'react';
import type { Metric } from '@/types/copilot';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  metric: Metric;
  showTrend?: boolean;
  className?: string;
}

export function MetricCard({
  metric,
  showTrend = true,
  className = '',
}: MetricCardProps) {
  const formatValue = (value: string | number, format?: string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return String(value);

    switch (format) {
      case 'currency':
        return `$${numValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      case 'percentage':
        return `${numValue.toFixed(1)}%`;
      case 'number':
      default:
        return numValue.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    if (metric.trend === 'up') return 'bg-green-50 text-green-700';
    if (metric.trend === 'down') return 'bg-red-50 text-red-700';
    return 'bg-gray-50 text-gray-600';
  };

  const getChangeColor = () => {
    if (metric.changePercentage === undefined) return 'text-gray-500';
    if (metric.changePercentage > 0) return 'text-green-600';
    if (metric.changePercentage < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div
      className={`bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">{metric.name}</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatValue(metric.value, metric.format)}
            {metric.unit && <span className="text-sm font-normal text-gray-500 ml-1">{metric.unit}</span>}
          </p>
        </div>

        {showTrend && (
          <div className="flex flex-col items-end ml-2">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-xs font-medium">
                {metric.changePercentage !== undefined
                  ? `${metric.changePercentage >= 0 ? '+' : ''}${metric.changePercentage.toFixed(1)}%`
                  : '-'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Previous value comparison */}
      {metric.previousValue !== undefined && (
        <p className="text-xs text-gray-400 mt-2">
          Previous: {formatValue(metric.previousValue, metric.format)}
        </p>
      )}
    </div>
  );
}

interface MetricGridProps {
  metrics: Metric[];
  columns?: 2 | 3 | 4;
  showTrend?: boolean;
  className?: string;
}

export function MetricGrid({
  metrics,
  columns = 2,
  showTrend = true,
  className = '',
}: MetricGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {metrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} showTrend={showTrend} />
      ))}
    </div>
  );
}