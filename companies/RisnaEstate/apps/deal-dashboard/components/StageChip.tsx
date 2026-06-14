'use client';

import { Badge } from '@/components/ui/badge';
import { DealStage } from '@/lib/api';
import { getStageConfig } from '@/lib/utils';

interface StageChipProps {
  stage: DealStage;
  size?: 'sm' | 'md' | 'lg';
}

export function StageChip({ stage, size = 'md' }: StageChipProps) {
  const config = getStageConfig(stage);

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <Badge
      variant={stage}
      className={sizeClasses[size]}
    >
      {config.label}
    </Badge>
  );
}
