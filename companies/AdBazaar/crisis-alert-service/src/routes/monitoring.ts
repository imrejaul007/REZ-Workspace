/**
 * Monitoring Router - API routes for monitoring keywords
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { MonitoringService, CreateKeywordInput } from '../services/monitoringService';
import { AuthRequest } from '../middleware/auth';
import { KeywordType, KeywordSentiment, AlertChannel } from '../models';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createKeywordSchema = z.object({
  keyword: z.string().min(1).max(100),
  type: z.enum(['brand', 'competitor', 'crisis', 'custom']),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  threshold: z.number().min(1).default(100),
  alertChannels: z.array(z.enum(['slack', 'email', 'push', 'sms'])).min(1),
  enabled: z.boolean().optional().default(true),
});

const updateKeywordSchema = z.object({
  keyword: z.string().min(1).max(100).optional(),
  type: z.enum(['brand', 'competitor', 'crisis', 'custom']).optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  threshold: z.number().min(1).optional(),
  alertChannels: z.array(z.enum(['slack', 'email', 'push', 'sms'])).optional(),
  enabled: z.boolean().optional(),
});

const listKeywordsSchema = z.object({
  type: z.enum(['brand', 'competitor', 'crisis', 'custom']).optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  enabled: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  search: z.string().optional(),
});

const bulkUpdateSchema = z.object({
  keywordIds: z.array(z.string()).min(1),
  enabled: z.boolean(),
});

/**
 * GET /api/monitoring
 * List all monitoring keywords
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const validation = listKeywordsSchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.issues,
      });
      return;
    }

    const { search, ...filters } = validation.data;

    let keywords;
    if (search) {
      keywords = await MonitoringService.searchKeywords(search);
    } else {
      keywords = await MonitoringService.listKeywords(filters);
    }

    res.json({
      success: true,
      data: keywords,
      count: keywords.length,
    });
  } catch (error) {
    logger.error('Failed to list keywords', { error });
    res.status(500).json({ success: false, error: 'Failed to list keywords' });
  }
});

/**
 * GET /api/monitoring/stats
 * Get monitoring statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await MonitoringService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get monitoring stats', { error });
    res.status(500).json({ success: false, error: 'Failed to get monitoring stats' });
  }
});

/**
 * POST /api/monitoring
 * Create a new monitoring keyword
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = createKeywordSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    const keyword = await MonitoringService.createKeyword(
      validation.data as CreateKeywordInput,
      req.user?.userId || 'unknown'
    );

    res.status(201).json({
      success: true,
      data: keyword,
    });
  } catch (error) {
    logger.error('Failed to create keyword', { error });
    res.status(500).json({ success: false, error: 'Failed to create keyword' });
  }
});

/**
 * GET /api/monitoring/active
 * Get active keywords for real-time monitoring
 */
router.get('/active', async (_req: Request, res: Response) => {
  try {
    const keywords = await MonitoringService.getActiveKeywords();

    res.json({
      success: true,
      data: keywords,
      count: keywords.length,
    });
  } catch (error) {
    logger.error('Failed to get active keywords', { error });
    res.status(500).json({ success: false, error: 'Failed to get active keywords' });
  }
});

/**
 * GET /api/monitoring/:id
 * Get keyword by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const keyword = await MonitoringService.getKeywordById(req.params.id);

    if (!keyword) {
      res.status(404).json({ success: false, error: 'Keyword not found' });
      return;
    }

    res.json({
      success: true,
      data: keyword,
    });
  } catch (error) {
    logger.error('Failed to get keyword', { error });
    res.status(500).json({ success: false, error: 'Failed to get keyword' });
  }
});

/**
 * PATCH /api/monitoring/:id
 * Update a monitoring keyword
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const validation = updateKeywordSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    const keyword = await MonitoringService.updateKeyword(req.params.id, validation.data);

    if (!keyword) {
      res.status(404).json({ success: false, error: 'Keyword not found' });
      return;
    }

    res.json({
      success: true,
      data: keyword,
    });
  } catch (error) {
    logger.error('Failed to update keyword', { error });
    res.status(500).json({ success: false, error: 'Failed to update keyword' });
  }
});

/**
 * DELETE /api/monitoring/:id
 * Delete a monitoring keyword
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await MonitoringService.deleteKeyword(req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Keyword not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Keyword deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete keyword', { error });
    res.status(500).json({ success: false, error: 'Failed to delete keyword' });
  }
});

/**
 * POST /api/monitoring/:id/toggle
 * Toggle keyword enabled status
 */
router.post('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const keyword = await MonitoringService.toggleKeyword(req.params.id);

    if (!keyword) {
      res.status(404).json({ success: false, error: 'Keyword not found' });
      return;
    }

    res.json({
      success: true,
      data: keyword,
      message: `Keyword ${keyword.enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    logger.error('Failed to toggle keyword', { error });
    res.status(500).json({ success: false, error: 'Failed to toggle keyword' });
  }
});

/**
 * POST /api/monitoring/bulk-update
 * Bulk update keywords status
 */
router.post('/bulk-update', async (req: Request, res: Response) => {
  try {
    const validation = bulkUpdateSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    const count = await MonitoringService.bulkUpdateStatus(
      validation.data.keywordIds,
      validation.data.enabled
    );

    res.json({
      success: true,
      message: `${count} keywords updated successfully`,
    });
  } catch (error) {
    logger.error('Failed to bulk update keywords', { error });
    res.status(500).json({ success: false, error: 'Failed to bulk update keywords' });
  }
});

export { router as monitoringRouter };