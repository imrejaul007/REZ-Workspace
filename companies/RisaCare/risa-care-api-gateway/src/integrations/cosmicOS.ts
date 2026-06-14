import { logger } from '../../shared/logger';
/**
 * RisaCare - Cosmic OS Integration
 *
 * Emits wellness signals to Cosmic OS Human Context Graph
 */

import axios from 'axios';

// ============================================
// COSMIC OS CONFIGURATION
// ============================================

const COSMIC_OS_URL = process.env.COSMIC_OS_URL || 'http://localhost:4163';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'risacare-internal-token';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Internal-Token': INTERNAL_TOKEN,
});

// ============================================
// WELLNESS SIGNAL TYPES
// ============================================

export interface WellnessSignal {
  userId: string;
  layer: 'health';
  signal: string;
  value: number | string | object;
  source: string;
  confidence: number;
}

// ============================================
// SIGNAL EMISSION
// ============================================

export async function emitWellnessSignal(signal: WellnessSignal): Promise<boolean> {
  try {
    await axios.post(
      `${COSMIC_OS_URL}/api/signals`,
      signal,
      { headers: getHeaders(), timeout: 5000 }
    );
    return true;
  } catch (error) {
    logger.error('Failed to emit wellness signal to Cosmic OS:', error);
    return false;
  }
}

export async function emitBatchWellnessSignals(signals: WellnessSignal[]): Promise<{
  emitted: number;
  failed: number;
}> {
  let emitted = 0;
  let failed = 0;

  for (const signal of signals) {
    const success = await emitWellnessSignal(signal);
    if (success) emitted++;
    else failed++;
  }

  return { emitted, failed };
}

// ============================================
// WELLNESS DATA MAPPING
// ============================================

export interface RisaCareWellness {
  userId: string;
  wellnessScore: number;
  sleepQuality: number;
  stressLevel: number;
  fitnessLevel: number;
  recoveryStatus: 'recovering' | 'stable' | 'depleted';
  healthGoals: string[];
}

export function mapRisaCareToCosmicSignals(wellness: RisaCareWellness): WellnessSignal[] {
  return [
    {
      userId: wellness.userId,
      layer: 'health',
      signal: 'wellness_score',
      value: wellness.wellnessScore,
      source: 'risacare',
      confidence: 0.9,
    },
    {
      userId: wellness.userId,
      layer: 'health',
      signal: 'sleep_quality',
      value: wellness.sleepQuality,
      source: 'risacare',
      confidence: 0.85,
    },
    {
      userId: wellness.userId,
      layer: 'health',
      signal: 'stress_level',
      value: wellness.stressLevel,
      source: 'risacare',
      confidence: 0.8,
    },
    {
      userId: wellness.userId,
      layer: 'health',
      signal: 'fitness_level',
      value: wellness.fitnessLevel,
      source: 'risacare',
      confidence: 0.75,
    },
    {
      userId: wellness.userId,
      layer: 'health',
      signal: 'recovery_status',
      value: wellness.recoveryStatus,
      source: 'risacare',
      confidence: 0.7,
    },
  ];
}

// ============================================
// INTEGRATION HOOKS
// ============================================

/**
 * Call this after wellness check-in
 */
export async function onWellnessUpdate(wellness: RisaCareWellness): Promise<void> {
  const signals = mapRisaCareToCosmicSignals(wellness);
  await emitBatchWellnessSignals(signals);
}

/**
 * Call this after health goal achievement
 */
export async function onHealthGoalAchieved(
  userId: string,
  goal: string,
  achievement: number
): Promise<void> {
  await emitWellnessSignal({
    userId,
    layer: 'health',
    signal: 'health_goal_achieved',
    value: { goal, achievement },
    source: 'risacare',
    confidence: 0.95,
  });
}

/**
 * Call this after fitness activity
 */
export async function onFitnessActivity(
  userId: string,
  activity: string,
  duration: number,
  intensity: number
): Promise<void> {
  await emitWellnessSignal({
    userId,
    layer: 'health',
    signal: 'fitness_activity',
    value: { activity, duration, intensity },
    source: 'risacare',
    confidence: 0.85,
  });
}

/**
 * Call this when sleep quality changes significantly
 */
export async function onSleepChange(
  userId: string,
  hours: number,
  quality: number,
  previousQuality: number
): Promise<void> {
  const change = quality - previousQuality;

  await emitWellnessSignal({
    userId,
    layer: 'health',
    signal: 'sleep_quality_change',
    value: { hours, quality, change },
    source: 'risacare',
    confidence: 0.8,
  });
}
