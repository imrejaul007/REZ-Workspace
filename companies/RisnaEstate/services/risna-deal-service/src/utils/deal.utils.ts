import { v4 as uuidv4 } from 'uuid';
import { DealStage, STAGE_ORDER } from '../models/deal.model';

/**
 * Generate a unique deal ID with prefix
 */
export function generateDealId(): string {
  const uuid = uuidv4().split('-')[0];
  return `DEAL-${Date.now().toString(36).toUpperCase()}-${uuid.toUpperCase()}`;
}

/**
 * Generate a unique ID for offers, milestones, etc.
 */
export function generateSubId(): string {
  return uuidv4();
}

/**
 * Calculate the stage index for ordering
 */
export function getStageIndex(stage: DealStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/**
 * Check if a stage transition is valid (forward only, no skipping)
 */
export function isValidStageTransition(fromStage: DealStage, toStage: DealStage): boolean {
  // Allow same stage (no change)
  if (fromStage === toStage) {
    return true;
  }

  // Allow closed_won or closed_lost from any stage
  if (toStage === DealStage.CLOSED_WON || toStage === DealStage.CLOSED_LOST) {
    return true;
  }

  const fromIndex = getStageIndex(fromStage);
  const toIndex = getStageIndex(toStage);

  // Only allow forward progression (max 2 stages at a time for flexibility)
  return toIndex >= fromIndex && toIndex <= fromIndex + 2;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercent(askingPrice: number, negotiatedPrice: number): number {
  if (askingPrice === 0) return 0;
  return Math.round(((askingPrice - negotiatedPrice) / askingPrice) * 100 * 100) / 100;
}

/**
 * Calculate discount amount
 */
export function calculateDiscountAmount(askingPrice: number, negotiatedPrice: number): number {
  return askingPrice - negotiatedPrice;
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate deal value based on stage
 */
export function calculateWeightedValue(finalPrice: number, probability: number): number {
  return finalPrice * (probability / 100);
}

/**
 * Calculate days since a date
 */
export function daysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days until a date
 */
export function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get stage duration in days
 */
export function getStageDuration(stageHistory: Array<{ stage: string; changedAt: Date }>, stage: DealStage): number {
  const stageIndex = STAGE_ORDER.indexOf(stage);
  const currentStageEntry = stageHistory.find(h => h.stage === stage);

  if (!currentStageEntry) {
    return 0;
  }

  // Get the next stage change or now
  const nextEntry = stageHistory
    .filter(h => STAGE_ORDER.indexOf(h.stage as DealStage) > stageIndex)
    .sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime())[0];

  const endDate = nextEntry ? new Date(nextEntry.changedAt) : new Date();
  const startDate = new Date(currentStageEntry.changedAt);

  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate stage progression velocity (stages per day)
 */
export function calculateProgressionVelocity(
  stageHistory: Array<{ stage: string; changedAt: Date }>
): number {
  if (stageHistory.length < 2) {
    return 0;
  }

  const sorted = [...stageHistory].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
  );

  const firstDate = new Date(sorted[0].changedAt);
  const lastDate = new Date(sorted[sorted.length - 1].changedAt);
  const days = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

  return (sorted.length - 1) / days;
}

/**
 * Check if a deal is stale (no activity for N days)
 */
export function isStaleDeal(lastActivity: Date, staleThresholdDays: number = 7): boolean {
  return daysSince(lastActivity) > staleThresholdDays;
}

/**
 * Get pipeline statistics for a set of deals
 */
export function calculatePipelineStats(deals: Array<{
  finalPrice?: number;
  probability: number;
  stage: DealStage;
  askingPrice: number;
}>) {
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, d) => sum + (d.finalPrice || d.askingPrice), 0);
  const weightedValue = deals.reduce(
    (sum, d) => sum + calculateWeightedValue(d.finalPrice || d.askingPrice, d.probability),
    0
  );

  const byStage = deals.reduce((acc, deal) => {
    acc[deal.stage] = (acc[deal.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgProbability = totalDeals > 0
    ? deals.reduce((sum, d) => sum + d.probability, 0) / totalDeals
    : 0;

  return {
    totalDeals,
    totalValue,
    weightedValue,
    avgProbability: Math.round(avgProbability * 100) / 100,
    byStage,
  };
}

/**
 * Sanitize deal data for response (remove internal fields)
 */
export function sanitizeDeal(deal: any): any {
  const { __v, deletedAt, ...sanitized } = deal.toObject ? deal.toObject() : { ...deal };
  return sanitized;
}

/**
 * Pagination helper
 */
export function calculatePagination(page: number, limit: number): { skip: number; take: number } {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Build pagination response
 */
export function buildPaginationResponse(
  total: number,
  page: number,
  limit: number
): {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}