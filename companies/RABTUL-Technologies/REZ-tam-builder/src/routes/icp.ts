/**
 * REZ TAM Builder - ICP Routes
 *
 * API endpoints for ICP management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ICPModel, IICP } from '../models/ICP.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateICPSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  firmographics: z.object({
    industries: z.array(z.string()).min(1),
    companySizes: z.array(z.string()).min(1),
    locations: z.object({
      countries: z.array(z.string()).min(1),
      states: z.array(z.string()).optional(),
      cities: z.array(z.string()).optional(),
      tiers: z.array(z.enum(['tier1', 'tier2', 'tier3'])).optional(),
    }),
    revenueRange: z.object({ min: z.number(), max: z.number() }).optional(),
    employeeCount: z.object({ min: z.number(), max: z.number() }).optional(),
    foundingYear: z.object({ min: z.number(), max: z.number() }).optional(),
    publicPrivate: z.array(z.enum(['public', 'private'])).optional(),
  }),
  technographics: z.object({
    technologies: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
    hasCRM: z.boolean().optional(),
    hasMarketingAutomation: z.boolean().optional(),
    hasSalesAutomation: z.boolean().optional(),
  }).optional(),
  behavioral: z.object({
    useCases: z.array(z.string()).optional(),
    buyingStage: z.array(z.enum(['awareness', 'consideration', 'decision'])).optional(),
    purchaseFrequency: z.enum(['one-time', 'recurring', 'subscription']).optional(),
    averageDealSize: z.object({ min: z.number(), max: z.number() }).optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
});

const UpdateICPSchema = CreateICPSchema.partial();

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/v1/icp
 * Create new ICP
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = CreateICPSchema.parse(req.body);

    const icp = await ICPModel.create({
      ...validated,
      tenantId,
      createdBy: userId || 'system',
      tags: validated.tags || [],
    });

    logger.info('ICP created', { tenantId, icpId: icp._id, name: icp.name });

    res.status(201).json({
      success: true,
      data: { icp },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to create ICP', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create ICP' });
  }
});

/**
 * GET /api/v1/icp
 * List ICPs for tenant
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const { page = '1', limit = '20', active = 'true' } = req.query;

    const icps = await ICPModel.find({
      tenantId,
      isActive: active === 'true',
    })
      .sort({ updatedAt: -1 })
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .limit(parseInt(limit as string));

    const total = await ICPModel.countDocuments({ tenantId, isActive: active === 'true' });

    res.json({
      success: true,
      data: {
        icps,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to list ICPs', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to list ICPs' });
  }
});

/**
 * GET /api/v1/icp/:id
 * Get ICP by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    const icp = await ICPModel.findOne({ _id: id, tenantId });

    if (!icp) {
      res.status(404).json({ success: false, error: 'ICP not found' });
      return;
    }

    res.json({ success: true, data: { icp } });
  } catch (error) {
    logger.error('Failed to get ICP', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get ICP' });
  }
});

/**
 * PUT /api/v1/icp/:id
 * Update ICP
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    const validated = UpdateICPSchema.parse(req.body);

    const icp = await ICPModel.findOneAndUpdate(
      { _id: id, tenantId },
      {
        ...validated,
        updatedBy: userId || 'system',
        version: { $inc: 1 },
      },
      { new: true }
    );

    if (!icp) {
      res.status(404).json({ success: false, error: 'ICP not found' });
      return;
    }

    logger.info('ICP updated', { tenantId, icpId: id });

    res.json({ success: true, data: { icp } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to update ICP', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to update ICP' });
  }
});

/**
 * DELETE /api/v1/icp/:id
 * Soft delete ICP
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    const icp = await ICPModel.findOneAndUpdate(
      { _id: id, tenantId },
      { isActive: false },
      { new: true }
    );

    if (!icp) {
      res.status(404).json({ success: false, error: 'ICP not found' });
      return;
    }

    logger.info('ICP deleted', { tenantId, icpId: id });

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    logger.error('Failed to delete ICP', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to delete ICP' });
  }
});

/**
 * POST /api/v1/icp/:id/clone
 * Clone ICP
 */
router.post('/:id/clone', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    const original = await ICPModel.findOne({ _id: id, tenantId });

    if (!original) {
      res.status(404).json({ success: false, error: 'ICP not found' });
      return;
    }

    const { name: _name, ...icpData } = original.toObject();

    const cloned = await ICPModel.create({
      ...icpData,
      _id: undefined,
      tenantId,
      name: `${original.name} (Copy)`,
      createdBy: userId || 'system',
      updatedBy: undefined,
      accountCount: 0,
      lastBuiltAt: undefined,
      version: 1,
    });

    logger.info('ICP cloned', { tenantId, originalId: id, newId: cloned._id });

    res.status(201).json({ success: true, data: { icp: cloned } });
  } catch (error) {
    logger.error('Failed to clone ICP', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to clone ICP' });
  }
});

export default router;
