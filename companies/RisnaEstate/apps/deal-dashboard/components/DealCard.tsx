'use client';

import { Deal } from '@/lib/api';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { StageChip } from './StageChip';
import { User, MapPin, Building2 } from 'lucide-react';
import Link from 'next/link';

interface DealCardProps {
  deal: Deal;
  onDragStart?: (e: React.DragEvent, deal: Deal) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  className?: string;
}

export function DealCard({
  deal,
  onDragStart,
  onDragEnd,
  isDragging,
  className,
}: DealCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', deal.id);
    onDragStart?.(e, deal);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    onDragEnd?.(e);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md',
        isDragging && 'opacity-50 scale-95',
        className
      )}
    >
      <Link href={`/deals/${deal.id}`} className="block">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-mono text-muted-foreground">
            {deal.dealId}
          </span>
          <StageChip stage={deal.stage} size="sm" />
        </div>

        <h4 className="font-medium text-sm mb-1 line-clamp-1">
          {deal.property.name}
        </h4>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{deal.property.address}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{deal.customer.name}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-semibold text-primary">
            {formatCurrency(deal.value)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(deal.updatedAt)}
          </span>
        </div>
      </Link>
    </div>
  );
}
