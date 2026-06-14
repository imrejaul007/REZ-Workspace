'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface RezVerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { badge: 'gap-1 px-1.5 py-0.5 text-xs', icon: 'h-3 w-3' },
  md: { badge: 'gap-1.5 px-2 py-1 text-sm', icon: 'h-4 w-4' },
  lg: { badge: 'gap-2 px-3 py-1.5 text-base', icon: 'h-5 w-5' },
};

export function RezVerifiedBadge({
  size = 'md',
  showTooltip = true,
  className,
}: RezVerifiedBadgeProps) {
  const { badge, icon } = sizeMap[size];

  const badgeEl = (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold',
        badge,
        className,
      )}
    >
      <ShieldCheck className={cn('shrink-0 text-emerald-600', icon)} aria-hidden="true" />
      REZ Verified
    </Badge>
  );

  if (!showTooltip) return badgeEl;

  return (
    <span
      title="This merchant is verified on REZ platform"
      aria-label="REZ Verified merchant"
      className="inline-flex"
    >
      {badgeEl}
    </span>
  );
}
