'use client';

import React from 'react';
import { getStatusColor, getPlanColor } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium capitalize ${sizeClasses[size]} ${getStatusColor(status)}`}
    >
      {status}
    </span>
  );
}

interface PlanBadgeProps {
  plan: string;
  size?: 'sm' | 'md';
}

export function PlanBadge({ plan, size = 'sm' }: PlanBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium capitalize ${sizeClasses[size]} ${getPlanColor(plan)}`}
    >
      {plan}
    </span>
  );
}

interface ModuleBadgeProps {
  module: string;
}

export function ModuleBadge({ module }: ModuleBadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium capitalize">
      {module}
    </span>
  );
}
