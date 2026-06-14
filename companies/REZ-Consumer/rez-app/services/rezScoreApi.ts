import apiClient from './apiClient';
import { logger } from '@/utils/logger';

// ============================================================================
// REZ SCORE API SERVICE
// Phase 2.3 — REZ Score — Universal Savings Score
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export type RezScoreTier =
  | 'Beginner'
  | 'Smart Saver'
  | 'Super Saver'
  | 'Elite Saver'
  | 'Legend';

export interface ScorePillar {
  name: string;
  score: number;     // 0-100 contribution
  weight: number;    // e.g. 0.30 (30%)
  description: string;
}

export interface RezScore {
  score: number;           // 0-999
  tier: RezScoreTier;
  tierMinScore: number;
  tierMaxScore: number;
  lastMonthScore: number;
  trend: 'up' | 'down' | 'stable';
  trendPoints: number;     // e.g. +34
  peerPercentile: number;  // e.g. 72
  pillars: ScorePillar[];
  lastCalculated: string;
}

export interface ScoreBooster {
  id: string;
  title: string;
  description: string;
  estimatedBoost: number;   // e.g. 30 points
  category: 'visits' | 'streaks' | 'diversity' | 'savings' | 'community';
  actionLabel: string;
  actionRoute?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ScoreHistoryEntry {
  date: string;           // "YYYY-MM-DD"
  score: number;
  tier: RezScoreTier;
  change: number;         // +/- from previous entry
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch the current user's REZ Score with full pillar breakdown.
 * GET /api/score
 */
export async function getScore(): Promise<RezScore> {
  try {
    const response = await apiClient.get<RezScore>('/score');
    return response.data as RezScore;
  } catch (error) {
    logger.error('[RezScoreAPI] Failed to fetch score', error, 'RezScoreAPI');
    throw new Error('Failed to fetch REZ Score');
  }
}

/**
 * Fetch actionable suggestions to improve the user's REZ Score.
 * GET /api/score/boosters
 */
export async function getScoreBoosters(): Promise<ScoreBooster[]> {
  try {
    const response = await apiClient.get<ScoreBooster[]>('/score/boosters');
    return (response.data as ScoreBooster[]) ?? [];
  } catch (error) {
    logger.error('[RezScoreAPI] Failed to fetch score boosters', error, 'RezScoreAPI');
    return [];
  }
}

/**
 * Fetch the user's historical REZ Score for trend visualization.
 * GET /api/score/history
 */
export async function getScoreHistory(): Promise<ScoreHistoryEntry[]> {
  try {
    const response = await apiClient.get<ScoreHistoryEntry[]>('/score/history');
    return (response.data as ScoreHistoryEntry[]) ?? [];
  } catch (error) {
    logger.error('[RezScoreAPI] Failed to fetch score history', error, 'RezScoreAPI');
    return [];
  }
}
