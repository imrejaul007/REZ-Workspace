/**
 * SkillNet Webhook Service
 *
 * Subscribes to SkillNet skill events and updates Professional Twins.
 *
 * Event Types:
 * - SKILL_USED: When a skill is executed
 * - SKILL_LEARNED: When a new skill is acquired
 * - TASK_COMPLETED: When a task using skills is completed
 * - FEEDBACK_RECEIVED: When feedback is given
 * - KNOWLEDGE_GAINED: When new knowledge is acquired
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ProfessionalTwin } from '../index.js';

const router = express.Router();

// Config
const SKILLNET_BRIDGE_URL = process.env.SKILLNET_BRIDGE_URL || 'http://localhost:5130';
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || 'skillnet-twin-bridge-secret';

// =============================================================================
// WEBHOOK ENDPOINTS
// =============================================================================

/**
 * Receive skill event from SkillNet
 */
router.post('/events/skillnet', async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      corpId,
      skillId,
      skillName,
      eventType,
      outcome,
      duration,
      context,
      metadata
    } = req.body;

    if (!corpId || !skillName) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'corpId and skillName are required' }
      });
    }

    // Determine which twin to update
    const twinType = determineTwinType(skillName, eventType);

    // Calculate impact
    const impact = calculateImpact(eventType, outcome, duration);

    // Create skill event record
    const skillEvent = new SkillEvent({
      eventId: eventId || `SE-${Date.now().toString(36)}`,
      corpId,
      skillId,
      skillName,
      eventType: eventType || 'SKILL_USED',
      outcome: outcome || 'SUCCESS',
      duration,
      context: {
        source: 'SKILLNET',
        confidence: context?.confidence || 0.8,
        evidence: context?.evidence || []
      },
      metadata,
      impact,
      twinId: `TWIN-${corpId}-${twinType}`,
      processed: false,
      createdAt: new Date()
    });

    await skillEvent.save();

    // Update twin
    await updateTwinFromSkillEvent(corpId, twinType, skillName, impact);

    res.status(201).json({
      success: true,
      data: {
        eventId: skillEvent.eventId,
        twinId: skillEvent.twinId,
        twinType,
        impact,
        processed: true
      }
    });
  } catch (error: any) {
    logger.error('SkillNet webhook error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * Receive bulk skill events
 */
router.post('/events/skillnet/bulk', async (req: Request, res: Response) => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'events array required' }
      });
    }

    const results = [];

    for (const event of events) {
      const twinType = determineTwinType(event.skillName, event.eventType);
      const impact = calculateImpact(event.eventType, event.outcome, event.duration);

      const skillEvent = new SkillEvent({
        eventId: event.eventId || `SE-${Date.now().toString(36)}`,
        corpId: event.corpId,
        skillId: event.skillId,
        skillName: event.skillName,
        eventType: event.eventType || 'SKILL_USED',
        outcome: event.outcome || 'SUCCESS',
        duration: event.duration,
        context: {
          source: 'SKILLNET_BULK',
          confidence: 0.8,
          evidence: []
        },
        metadata: event.metadata,
        impact,
        twinId: `TWIN-${event.corpId}-${twinType}`,
        processed: false,
        createdAt: new Date()
      });

      await skillEvent.save();
      await updateTwinFromSkillEvent(event.corpId, twinType, event.skillName, impact);

      results.push({
        eventId: skillEvent.eventId,
        twinId: skillEvent.twinId,
        twinType,
        success: true
      });
    }

    res.status(201).json({
      success: true,
      data: {
        processed: results.length,
        results
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// SUBSCRIPTION ENDPOINTS
// =============================================================================

/**
 * Subscribe to SkillNet events for a twin
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { twinId, eventTypes, webhookUrl } = req.body;

    const twin = await ProfessionalTwin.findOne({ twinId });
    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Create subscription
    const subscription = new SkillSubscription({
      subscriptionId: `SUB-${Date.now().toString(36)}`,
      twinId,
      ownerCorpId: twin.ownerCorpId,
      eventTypes: eventTypes || ['SKILL_USED', 'SKILL_LEARNED', 'TASK_COMPLETED'],
      webhookUrl: webhookUrl || `${SKILLNET_BRIDGE_URL}/webhook/twin/${twinId}`,
      status: 'ACTIVE',
      createdAt: new Date()
    });

    await subscription.save();

    res.status(201).json({
      success: true,
      data: {
        subscriptionId: subscription.subscriptionId,
        twinId,
        status: 'ACTIVE'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * Unsubscribe from SkillNet events
 */
router.delete('/subscribe/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;

    await SkillSubscription.findOneAndUpdate(
      { subscriptionId },
      { $set: { status: 'CANCELLED' } }
    );

    res.json({
      success: true,
      data: { subscriptionId, status: 'CANCELLED' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * Get skill events for a twin
 */
router.get('/events/:twinId', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [events, total] = await Promise.all([
      SkillEvent.find({ twinId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      SkillEvent.countDocuments({ twinId })
    ]);

    res.json({
      success: true,
      data: {
        events: events.map(e => ({
          eventId: e.eventId,
          skillName: e.skillName,
          eventType: e.eventType,
          outcome: e.outcome,
          impact: e.impact,
          createdAt: e.createdAt
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// SKILLNET BRIDGE INTEGRATION
// =============================================================================

/**
 * Forward events to SkillNet-Twin Bridge
 */
router.post('/forward/:corpId', async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const events = req.body.events || [req.body];

    // Forward to SkillNet-Twin Bridge
    const response = await fetch(`${SKILLNET_BRIDGE_URL}/events/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_TOKEN
      },
      body: JSON.stringify({ events: events.map((e: any) => ({ ...e, corpId })) })
    });

    const result = await response.json();

    res.json({
      success: true,
      data: {
        forwarded: events.length,
        result
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * Get skill learning summary
 */
router.get('/learning/:corpId', async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    // Get all events for this owner
    const twinIds = [
      `TWIN-${corpId}-KNOWLEDGE`,
      `TWIN-${corpId}-SKILL`,
      `TWIN-${corpId}-CAREER`,
      `TWIN-${corpId}-PRODUCTIVITY`,
      `TWIN-${corpId}-EXECUTION`
    ];

    const events = await SkillEvent.find({ twinId: { $in: twinIds } })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Aggregate by twin type
    const byType: Record<string, any> = {};
    const bySkill: Record<string, number> = {};

    for (const event of events) {
      const twinType = event.twinId.split('-').pop();
      if (!byType[twinType]) {
        byType[twinType] = { events: 0, success: 0, failed: 0 };
      }
      byType[twinType].events++;
      if (event.outcome === 'SUCCESS') {
        byType[twinType].success++;
      } else {
        byType[twinType].failed++;
      }

      bySkill[event.skillName] = (bySkill[event.skillName] || 0) + 1;
    }

    // Get twins and their metrics
    const twins = await ProfessionalTwin.find({
      ownerCorpId: corpId,
      status: { $ne: 'ARCHIVED' }
    }).lean();

    res.json({
      success: true,
      data: {
        ownerCorpId: corpId,
        twins: twins.map(t => ({
          twinId: t.twinId,
          twinType: t.twinType,
          metrics: t.metrics,
          learning: byType[t.twinType] || { events: 0, success: 0, failed: 0 }
        })),
        topSkills: Object.entries(bySkill)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([skill, count]) => ({ skill, count })),
        recentEvents: events.slice(0, 10).map(e => ({
          eventId: e.eventId,
          skillName: e.skillName,
          outcome: e.outcome,
          createdAt: e.createdAt
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// HELPERS
// =============================================================================

function determineTwinType(skillName: string, eventType: string): string {
  const skill = skillName.toLowerCase();

  // Knowledge-related skills
  if (skill.includes('analysis') || skill.includes('research') || skill.includes('knowledge')) {
    return 'KNOWLEDGE';
  }

  // Execution-related skills
  if (skill.includes('code') || skill.includes('write') || skill.includes('design') ||
      skill.includes('build') || skill.includes('create') || skill.includes('execute')) {
    return 'EXECUTION';
  }

  // Career/professional skills
  if (skill.includes('lead') || skill.includes('manage') || skill.includes('communicate') ||
      skill.includes('strategy')) {
    return 'CAREER';
  }

  // Productivity skills
  if (skill.includes('time') || skill.includes('schedule') || skill.includes('plan') ||
      skill.includes('optimize')) {
    return 'PRODUCTIVITY';
  }

  // Default to SKILL
  return 'SKILL';
}

function calculateImpact(eventType: string, outcome: string, duration?: number): any {
  const baseImpact = {
    knowledgeScore: 0,
    executionScore: 0,
    reliabilityScore: 0,
    productivityMultiplier: 0,
    trainingHours: 0
  };

  const success = outcome === 'SUCCESS';
  const partial = outcome === 'PARTIAL';

  switch (eventType) {
    case 'SKILL_USED':
      if (success) {
        baseImpact.executionScore = 2;
        baseImpact.reliabilityScore = 1;
        baseImpact.productivityMultiplier = 0.01;
        baseImpact.trainingHours = 0.5;
      } else if (partial) {
        baseImpact.executionScore = 1;
        baseImpact.productivityMultiplier = 0.005;
        baseImpact.trainingHours = 0.25;
      }
      break;

    case 'SKILL_LEARNED':
      baseImpact.knowledgeScore = 5;
      baseImpact.executionScore = 3;
      baseImpact.productivityMultiplier = 0.02;
      baseImpact.trainingHours = 2;
      break;

    case 'TASK_COMPLETED':
      if (success) {
        baseImpact.executionScore = 4;
        baseImpact.reliabilityScore = 2;
        baseImpact.productivityMultiplier = 0.05;
        baseImpact.trainingHours = 4;
      }
      break;

    case 'FEEDBACK_RECEIVED':
      baseImpact.knowledgeScore = 3;
      baseImpact.executionScore = 2;
      baseImpact.trainingHours = 0.5;
      break;

    case 'KNOWLEDGE_GAINED':
      baseImpact.knowledgeScore = 4;
      baseImpact.productivityMultiplier = 0.01;
      baseImpact.trainingHours = 1;
      break;
  }

  // Bonus for fast completion
  if (duration && duration < 60000) { // Under 1 minute
    baseImpact.productivityMultiplier += 0.005;
    baseImpact.reliabilityScore += 1;
  }

  return baseImpact;
}

async function updateTwinFromSkillEvent(corpId: string, twinType: string, skillName: string, impact: any): Promise<void> {
  const twinId = `TWIN-${corpId}-${twinType}`;

  const twin = await ProfessionalTwin.findOne({ twinId });
  if (!twin) return;

  const updates: any = {
    'learning.lastActiveAt': new Date(),
    'learning.totalTrainingHours': twin.learning.totalTrainingHours + (impact.trainingHours || 0)
  };

  // Update metrics
  if (impact.knowledgeScore) {
    updates['metrics.knowledgeScore'] = Math.min(100, twin.metrics.knowledgeScore + impact.knowledgeScore);
  }
  if (impact.executionScore) {
    updates['metrics.executionScore'] = Math.min(100, twin.metrics.executionScore + impact.executionScore);
  }
  if (impact.reliabilityScore) {
    updates['metrics.reliabilityScore'] = Math.min(100, twin.metrics.reliabilityScore + impact.reliabilityScore);
  }

  // Update expertise
  if (!twin.knowledge.expertise.includes(skillName)) {
    updates['knowledge.expertise'] = [...twin.knowledge.expertise, skillName];
  }

  // Calculate new combined score
  const newKnowledge = updates['metrics.knowledgeScore'] || twin.metrics.knowledgeScore;
  const newExecution = updates['metrics.executionScore'] || twin.metrics.executionScore;
  const newReliability = updates['metrics.reliabilityScore'] || twin.metrics.reliabilityScore;
  updates['metrics.combinedScore'] = Math.round((newKnowledge + newExecution + newReliability) / 3);

  // Update productivity multiplier based on twin type
  if (twinType === 'EXECUTION') {
    updates['metrics.productivityMultiplier'] = Math.min(5, twin.metrics.productivityMultiplier + impact.productivityMultiplier);
  }

  // Mark as ACTIVE if trained enough
  if (twin.learning.totalTrainingHours + (impact.trainingHours || 0) >= 100 && twin.status === 'TRAINING') {
    updates['status'] = 'ACTIVE';
  }

  await ProfessionalTwin.findOneAndUpdate({ twinId }, { $set: updates });
}

// =============================================================================
// SCHEMAS (local to this file for webhook service)
// =============================================================================

const skillEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  corpId: { type: String, required: true, index: true },
  twinId: { type: String, index: true },
  skillId: String,
  skillName: { type: String, required: true },
  eventType: { type: String, enum: ['SKILL_USED', 'SKILL_LEARNED', 'TASK_COMPLETED', 'FEEDBACK_RECEIVED', 'KNOWLEDGE_GAINED'] },
  outcome: { type: String, enum: ['SUCCESS', 'PARTIAL', 'FAILURE'] },
  duration: Number,
  context: {
    source: String,
    confidence: Number,
    evidence: [String]
  },
  metadata: mongoose.Schema.Types.Mixed,
  impact: {
    knowledgeScore: Number,
    executionScore: Number,
    reliabilityScore: Number,
    productivityMultiplier: Number,
    trainingHours: Number
  },
  processed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const skillSubscriptionSchema = new mongoose.Schema({
  subscriptionId: { type: String, required: true, unique: true },
  twinId: { type: String, required: true, index: true },
  ownerCorpId: { type: String, required: true },
  eventTypes: [String],
  webhookUrl: String,
  status: { type: String, enum: ['ACTIVE', 'PAUSED', 'CANCELLED'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now }
});

// Create models if they don't exist
export const SkillEvent = mongoose.models.SkillEvent || mongoose.model('SkillEvent', skillEventSchema);
export const SkillSubscription = mongoose.models.SkillSubscription || mongoose.model('SkillSubscription', skillSubscriptionSchema);

export default router;
