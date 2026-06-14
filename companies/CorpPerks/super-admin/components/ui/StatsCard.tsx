'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconBg = 'bg-primary-100',
  iconColor = 'text-primary-600',
}: StatsCardProps) {
  const isPositive = change !== undefined ? change >= 0 : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>

          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isPositive ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500 ml-1">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        <div
          className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center ${iconColor}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
