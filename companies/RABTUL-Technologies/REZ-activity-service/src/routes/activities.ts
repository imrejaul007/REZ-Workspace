/**
 * REZ Activity Service - Activity Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { ActivityModel, IActivity, ActivityType } from '../models/Activity.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateActivitySchema = z.object({
  type: z.enum([
    'email_sent', 'email_opened', 'email_clicked', 'email_replied',
    'call_made', 'call_received', 'call_completed', 'call_missed',
    'meeting_scheduled', 'meeting_started', 'meeting_completed', 'meeting_cancelled',
    'linkedin_sent', 'linkedin_connected', 'linkedin_message',
    'sms_sent', 'sms_received',
    'note_added', 'deal_created', 'deal_stage_changed', 'deal_closed',
    'signal_detected', 'task_created', 'task_completed',
    'document_viewed', 'proposal_sent', 'contract_signed',
    'website_visited', 'content_downloaded'
  ]),
  source: z.enum(['outbound', 'inbound', 'system', 'manual', 'integration']).default('manual'),
  companyId: z.string().min(1),
  companyName: z.string().optional(),
  contactId: z.string().optional(),
  contactName: z.string().optional(),
  dealId: z.string().optional(),
  dealName: z.string().optional(),
  userId: z.string().min(1),
  userName: z.string().optional(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  engagement: z.object({
    duration: z.number().optional(),
    clicks: z.number().optional(),
    opens: z.number().optional(),
    responseTime: z.number().optional(),
  }).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  sentimentScore: z.number().min(-100).max(100).optional(),
  occurredAt: z.string().datetime().or(z.date()).optional(),
});

const BatchActivitySchema = z.object({
  activities: z.array(CreateActivitySchema).min(1).max(100),
});

const ActivityQuerySchema = z.object({
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  userId: z.string().optional(),
  type: z.string().optional(),
  source: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sentiment: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/v1/activities
 * Create a new activity
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = CreateActivitySchema.parse(req.body);

    const activity = await ActivityModel.create({
      ...validated,
      tenantId,
      occurredAt: validated.occurredAt ? new Date(validated.occurredAt) : new Date(),
    });

    logger.info('Activity created', { tenantId, type: activity.type, companyId: activity.companyId });

    res.status(201).json({ success: true, data: { activity } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to create activity', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create activity' });
  }
});

/**
 * POST /api/v1/activities/batch
 * Create multiple activities
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const { activities } = BatchActivitySchema.parse(req.body);

    const created = await ActivityModel.insertMany(
      activities.map(a => ({
        ...a,
        tenantId,
        occurredAt: a.occurredAt ? new Date(a.occurredAt as any) : new Date(),
      }))
    );

    logger.info('Batch activities created', { tenantId, count: created.length });

    res.status(201).json({ success: true, data: { created: created.length, activities: created } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to create batch activities', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create batch activities' });
  }
});

/**
 * GET /api/v1/activities
 * List activities with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = ActivityQuerySchema.parse(req.query);

    const query: any = { tenantId };
    if (validated.companyId) query.companyId = validated.companyId;
    if (validated.contactId) query.contactId = validated.contactId;
    if (validated.dealId) query.dealId = validated.dealId;
    if (validated.userId) query.userId = validated.userId;
    if (validated.type) query.type = validated.type;
    if (validated.source) query.source = validated.source;
    if (validated.sentiment) query.sentiment = validated.sentiment;
    if (validated.startDate || validated.endDate) {
      query.occurredAt = {};
      if (validated.startDate) query.occurredAt.$gte = new Date(validated.startDate);
      if (validated.endDate) query.occurredAt.$lte = new Date(validated.endDate);
    }

    const [activities, total] = await Promise.all([
      ActivityModel.find(query).sort({ occurredAt: -1 }).skip(validated.offset).limit(validated.limit),
      ActivityModel.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { activities, pagination: { offset: validated.offset, limit: validated.limit, total, hasMore: validated.offset + activities.length < total } },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to list activities', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to list activities' });
  }
});

/**
 * GET /api/v1/activities/timeline/:entityType/:entityId
 * Get activity timeline for an entity
 */
router.get('/timeline/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { entityType, entityId } = req.params;
    const { limit = '50' } = req.query;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const field = entityType === 'company' ? 'companyId' : entityType === 'contact' ? 'contactId' : 'dealId';
    const activities = await ActivityModel.find({ tenantId, [field]: entityId })
      .sort({ occurredAt: -1 })
      .limit(parseInt(limit as string));

    res.json({ success: true, data: { activities, count: activities.length } });
  } catch (error) {
    logger.error('Failed to get timeline', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get timeline' });
  }
});

/**
 * GET /api/v1/activities/stats/:entityType/:entityId
 * Get activity stats for an entity
 */
router.get('/stats/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { entityType, entityId } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const field = entityType === 'company' ? 'companyId' : entityType === 'contact' ? 'contactId' : 'dealId';
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = await ActivityModel.aggregate([
      { $match: { tenantId, [field]: entityId, occurredAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: '$type',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$occurredAt' },
      }},
    ]);

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const byType = stats.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {} as Record<string, number>);

    res.json({
      success: true,
      data: { stats: { total, byType, last30Days: true } },
    });
  } catch (error) {
    logger.error('Failed to get stats', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

/**
 * GET /api/v1/activities/types
 * Get all activity types
 */
router.get('/types', async (_req: Request, res: Response) => {
  const types = [
    { category: 'email', items: ['email_sent', 'email_opened', 'email_clicked', 'email_replied'] },
    { category: 'call', items: ['call_made', 'call_received', 'call_completed', 'call_missed'] },
    { category: 'meeting', items: ['meeting_scheduled', 'meeting_started', 'meeting_completed', 'meeting_cancelled'] },
    { category: 'linkedin', items: ['linkedin_sent', 'linkedin_connected', 'linkedin_message'] },
    { category: 'sms', items: ['sms_sent', 'sms_received'] },
    { category: 'deal', items: ['deal_created', 'deal_stage_changed', 'deal_closed'] },
    { category: 'task', items: ['task_created', 'task_completed'] },
    { category: 'engagement', items: ['document_viewed', 'proposal_sent', 'contract_signed', 'website_visited', 'content_downloaded'] },
    { category: 'other', items: ['note_added', 'signal_detected'] },
  ];
  res.json({ success: true, data: { types } });
});

export default router;
