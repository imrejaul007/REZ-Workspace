'use client';

import { Badge } from '@/components/ui/badge';

type StatusType =
  | 'pending' | 'accepted' | 'rejected' | 'countered'
  | 'paid' | 'overdue'
  | 'draft' | 'pending_signatures' | 'registered' | 'cancelled'
  | 'scheduled' | 'in_progress' | 'completed';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const displayLabel = label || status.replace(/_/g, ' ');

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <Badge variant={status} className={sizeClasses[size]}>
      {displayLabel}
    </Badge>
  );
}
