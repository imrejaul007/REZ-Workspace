'use client';

import React from 'react';
import type { Insight } from '@/types/copilot';
import {
  AlertTriangle,
  Lightbulb,
  Info,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';

interface InsightCardProps {
  insight: Insight;
  onClick?: () => void;
  showActions?: boolean;
  className?: string;
}

export function InsightCard({
  insight,
  onClick,
  showActions = true,
  className = '',
}: InsightCardProps) {
  const getTypeConfig = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          iconColor: 'text-amber-600',
          textColor: 'text-amber-800',
        };
      case 'opportunity':
        return {
          icon: <Lightbulb className="w-5 h-5" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          textColor: 'text-green-800',
        };
      case 'info':
        return {
          icon: <Info className="w-5 h-5" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800',
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          iconColor: 'text-emerald-600',
          textColor: 'text-emerald-800',
        };
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          textColor: 'text-gray-800',
        };
    }
  };

  const getImpactConfig = (impact: Insight['impact']) => {
    switch (impact) {
      case 'high':
        return { label: 'High Impact', color: 'text-red-600', bg: 'bg-red-100' };
      case 'medium':
        return { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-100' };
      case 'low':
        return { label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' };
      default:
        return { label: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const typeConfig = getTypeConfig(insight.type);
  const impactConfig = getImpactConfig(insight.impact);

  return (
    <div
      onClick={onClick}
      className={`${typeConfig.bgColor} border ${typeConfig.borderColor} rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={`flex items-center gap-2 ${typeConfig.iconColor}`}>
          {typeConfig.icon}
          <span className="text-sm font-medium capitalize">{insight.type}</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${impactConfig.bg} ${impactConfig.color}`}>
          {impactConfig.label}
        </span>
      </div>

      {/* Title */}
      <h4 className={`font-semibold ${typeConfig.textColor} mb-2`}>
        {insight.title}
      </h4>

      {/* Description */}
      <p className={`text-sm ${typeConfig.textColor} opacity-80 mb-3`}>
        {insight.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 capitalize">
          Category: {insight.category}
        </span>
        {showActions && (
          <button className={`text-xs font-medium ${typeConfig.iconColor} hover:underline`}>
            Learn more →
          </button>
        )}
      </div>
    </div>
  );
}

interface InsightListProps {
  insights: Insight[];
  onInsightClick?: (insight: Insight) => void;
  groupByCategory?: boolean;
  className?: string;
}

export function InsightList({
  insights,
  onInsightClick,
  groupByCategory = false,
  className = '',
}: InsightListProps) {
  if (!groupByCategory) {
    return (
      <div className={`space-y-3 ${className}`}>
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onClick={() => onInsightClick?.(insight)}
          />
        ))}
      </div>
    );
  }

  // Group by category
  const grouped = insights.reduce<Record<string, Insight[]>>((acc, insight) => {
    const category = insight.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(insight);
    return acc;
  }, {});

  return (
    <div className={`space-y-6 ${className}`}>
      {Object.entries(grouped).map(([category, categoryInsights]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 capitalize">
            {category} ({categoryInsights.length})
          </h3>
          <div className="space-y-3">
            {categoryInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onClick={() => onInsightClick?.(insight)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface InsightSummaryProps {
  insights: Insight[];
  className?: string;
}

export function InsightSummary({ insights, className = '' }: InsightSummaryProps) {
  const highImpactCount = insights.filter((i) => i.impact === 'high').length;
  const opportunitiesCount = insights.filter((i) => i.type === 'opportunity').length;
  const warningsCount = insights.filter((i) => i.type === 'warning').length;

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Insight Summary</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">{insights.length}</div>
          <div className="text-xs text-gray-500">Total Insights</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{highImpactCount}</div>
          <div className="text-xs text-gray-500">High Impact</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{opportunitiesCount}</div>
          <div className="text-xs text-gray-500">Opportunities</div>
        </div>
      </div>
      {warningsCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{warningsCount} warning(s) to address</span>
          </div>
        </div>
      )}
    </div>
  );
}