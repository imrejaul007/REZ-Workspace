/**
 * Journey Builder Service - Day 15-21
 * Visual automation for notification flows
 */

import { v4 as uuidv4 } from 'uuid';
import { redis } from './config/redis';
import { sendNotification } from './notificationService';

const JOURNEY_PREFIX = 'journey:';
const ENROLLMENT_PREFIX = 'enrollment:';
const EVENT_PREFIX = 'journey:event:';

export interface Journey {
  id: string;
  name: string;
  trigger: JourneyTrigger;
  steps: JourneyStep[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface JourneyTrigger {
  type: 'event' | 'segment' | 'date' | 'api';
  event?: string;
  segment?: string;
  schedule?: string; // cron
  filter?: Record<string, unknown>;
}

export interface JourneyStep {
  id: string;
  type: 'delay' | 'message' | 'condition' | 'webhook' | 'wait' | 'exit';
  config: Record<string, unknown>;
  next?: string[];
  delay?: number; // minutes
  channel?: 'email' | 'sms' | 'push' | 'whatsapp';
  template?: string;
  fallbackChannel?: string;
}

/**
 * Create journey
 */
export async function createJourney(data: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>): Promise<Journey> {
  const journey: Journey = {
    ...data,
    id: `journey_${uuidv4()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await redis.set(`${JOURNEY_PREFIX}${journey.id}`, JSON.stringify(journey));
  return journey;
}

/**
 * Enroll user in journey
 */
export async function enrollUser(journeyId: string, userId: string): Promise<void> {
  const key = `${ENROLLMENT_PREFIX}${journeyId}:${userId}`;
  await redis.set(key, JSON.stringify({ enrolledAt: new Date() }));
}

/**
 * Process journey event
 */
export async function processEvent(event: { type: string; userId: string; data: Record<string, unknown> }): Promise<void> {
  // Find journeys triggered by this event
  const journeyIds = await redis.smembers(`journey:trigger:${event.type}`);

  for (const journeyId of journeyIds) {
    const journey = await getJourney(journeyId);
    if (!journey || journey.status !== 'active') continue;

    // Check filters
    if (journey.trigger.filter && !matchesFilter(event.data, journey.trigger.filter)) continue;

    // Enroll user
    await enrollUser(journeyId, event.userId);

    // Start journey execution
    await executeJourney(journeyId, event.userId);
  }
}

/**
 * Execute journey steps
 */
async function executeJourney(journeyId: string, userId: string): Promise<void> {
  const journey = await getJourney(journeyId);
  if (!journey) return;

  let currentStepId = journey.steps[0]?.id;
  while (currentStepId) {
    const step = journey.steps.find(s => s.id === currentStepId);
    if (!step) break;

    if (step.type === 'delay') {
      // Schedule delay step
      await scheduleStep(journeyId, userId, step);
      return; // Exit, will be re-triggered by scheduler
    }

    if (step.type === 'message') {
      await sendNotification({
        userId,
        channel: step.channel || 'push',
        template: step.template || 'journey_message',
        data: step.config,
      });
    }

    // Next step
    currentStepId = step.next?.[0];
  }
}

/**
 * Schedule delayed step
 */
async function scheduleStep(journeyId: string, userId: string, step: JourneyStep): Promise<void> {
  const key = `${EVENT_PREFIX}schedule`;
  const delay = step.delay || 0;
  const executeAt = Date.now() + delay * 60 * 1000;

  await redis.zadd(key, executeAt, JSON.stringify({ journeyId, userId, stepId: step.id }));
}
