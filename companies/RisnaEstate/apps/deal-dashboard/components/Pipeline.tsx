'use client';

import { Deal, DealStage } from '@/lib/api';
import { DealCard } from './DealCard';
import { STAGE_ORDER, getStageConfig, formatCurrency, cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';

interface PipelineProps {
  deals: Deal[];
  onDealMove: (dealId: string, newStage: DealStage) => void;
  isLoading?: boolean;
}

export function Pipeline({ deals, onDealMove, isLoading }: PipelineProps) {
  const [activeDeal, setActiveDeal] = React.useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const dealsByStage = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = deals.filter((deal) => deal.stage === stage);
    return acc;
  }, {} as Record<DealStage, Deal[]>);

  const stageValues = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = dealsByStage[stage].reduce((sum, deal) => sum + deal.value, 0);
    return acc;
  }, {} as Record<DealStage, number>);

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);

    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as DealStage;

    if (STAGE_ORDER.includes(newStage)) {
      const deal = deals.find((d) => d.id === dealId);
      if (deal && deal.stage !== newStage) {
        onDealMove(dealId, newStage);
      }
    }
  };

  const handleDragOver = (event: DragEndEvent) => {
    // Handle drag over for visual feedback
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGE_ORDER.map((stage) => {
          const config = getStageConfig(stage);
          const stageDeals = dealsByStage[stage];
          const totalValue = stageValues[stage];

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-[300px] bg-muted/50 rounded-lg"
            >
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', config.bgColor.replace('bg-', 'bg-'))} />
                    <h3 className="font-semibold text-sm">{config.label}</h3>
                  </div>
                  <span className="text-xs font-medium bg-background px-2 py-0.5 rounded-full">
                    {stageDeals.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(totalValue)}
                </p>
              </div>

              <ScrollArea className="h-[calc(100vh-300px)] p-3">
                <div className="space-y-3">
                  {stageDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      isDragging={activeDeal?.id === deal.id}
                    />
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No deals
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="opacity-80">
            <DealCard deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

import React from 'react';