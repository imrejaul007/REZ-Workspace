/**
 * Canonical streak milestone definitions.
 * Import this file wherever streak milestone coins need to be awarded.
 * Values must match those in rez-karma-service/src/config/streakMilestones.ts
 */
export const STREAK_MILESTONES = [
  { days: 3, coins: 50 },
  { days: 7, coins: 200 },
  { days: 30, coins: 500 },
] as const;

export const STREAK_MILESTONE_MAP: ReadonlyMap<number, number> = new Map(
  STREAK_MILESTONES.map(m => [m.days, m.coins])
);
