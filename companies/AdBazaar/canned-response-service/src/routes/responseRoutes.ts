/**
 * Response Routes - Express routes for canned response operations
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { responseService } from '../services/responseService';
import { ResponseStatus } from '../models/CannedResponse';
import logger from '../utils/logger';

export const responseRoutes = Router();

// Validation schemas
const createResponseSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  shortcut: z.string().max(50).optional(),
  categoryId: z.string().min(1),
  tags: z.array(z.string()).optional(),
  authorId: z.string().min(1),
  authorName: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isGlobal: z.boolean().optional(),
});

const updateResponseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  shortcut: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  variables: z.array(z.string()).optional(),
  isGlobal: z.boolean().optional(),
});

const renderSchema = z.object({
  variables: z.record(z.string()),
});

/**
 * POST /api/responses
 * Create a new canned response
 */
responseRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createResponseSchema.parse(req.body);
    const response = await responseService.createResponse(validated);
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      return;
    }
    if (error instanceof Error && error.message.includes('Shortcut')) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    logger.error('Failed to create response', { error });
    res.status(500).json({ success: false, error: 'Failed to create response' });
  }
});

/**
 * GET /api/responses
 * Get all responses with filters
 */
responseRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      categoryId,
      tags,
      authorId,
      page = '1',
      limit = '20',
    } = req.query;

    const filter = {
      status: status as ResponseStatus | undefined,
      categoryId: categoryId as string | undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      authorId: authorId as string | undefined,
    };

    const result = await responseService.getResponses(
      filter,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to get responses', { error });
    res.status(500).json({ success: false, error: 'Failed to get responses' });
  }
});

/**
 * GET /api/responses/search
 * Search responses
 */
responseRoutes.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, categoryId, tags, limit = '20' } = req.query;

    if (!q) {
      res.status(400).json({ success: false, error: 'Search query is required' });
      return;
    }

    const result = await responseService.searchResponses(
      q as string,
      categoryId as string | undefined,
      tags ? (tags as string).split(',') : undefined,
      parseInt(limit as string, 10)
    );

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to search responses', { error });
    res.status(500).json({ success: false, error: 'Failed to search responses' });
  }
});

/**
 * GET /api/responses/popular
 * Get popular responses
 */
responseRoutes.get('/popular', async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const responses = await responseService.getPopularResponses(parseInt(limit as string, 10));
    res.json({ success: true, data: responses });
  } catch (error) {
    logger.error('Failed to get popular responses', { error });
    res.status(500).json({ success: false, error: 'Failed to get popular responses' });
  }
});

/**
 * GET /api/responses/shortcut/:shortcut
 * Get response by shortcut
 */
responseRoutes.get('/shortcut/:shortcut', async (req: Request, res: Response) => {
  try {
    const response = await responseService.getResponseByShortcut(req.params.shortcut);
    if (!response) {
      res.status(404).json({ success: false, error: 'Response not found' });
      return;
    }
    res.json({ success: true, data: response });
  } catch (error) {
    logger.error('Failed to get response by shortcut', { error, shortcut: req.params.shortcut });
    res.status(500).json({ success: false, error: 'Failed to get response' });
  }
});

/**
 * GET /api/responses/prefix/:prefix
 * Get responses by shortcut prefix
 */
responseRoutes.get('/prefix/:prefix', async (req: Request, res: Response) => {
  try {
    const responses = await responseService.getResponsesByShortcutPrefix(req.params.prefix);
    res.json({ success: true, data: responses });
  } catch (error) {
    logger.error('Failed to get responses by prefix', { error, prefix: req.params.prefix });
    res.status(500).json({ success: false, error: 'Failed to get responses' });
  }
});

/**
 * GET /api/responses/:id
 * Get response by ID
 */
responseRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const response = await responseService.getResponseById(req.params.id);
    if (!response) {
      res.status(404).json({ success: false, error: 'Response not found' });
      return;
    }
    res.json({ success: true, data: response });
  } catch (error) {
    logger.error('Failed to get response', { error, responseId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to get response' });
  }
});

/**
 * PUT /api/responses/:id
 * Update canned response
 */
responseRoutes.put('/:id', async (req: Request, res: Response) => {
  try {
    const validated = updateResponseSchema.parse(req.body);
    const response = await responseService.updateResponse(req.params.id, validated);
    if (!response) {
      res.status(404).json({ success: false, error: 'Response not found' });
      return;
    }
    res.json({ success: true, data: response });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      return;
    }
    if (error instanceof Error && error.message.includes('Shortcut')) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    logger.error('Failed to update response', { error, responseId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to update response' });
  }
});

/**
 * DELETE /api/responses/:id
 * Delete (archive) canned response
 */
responseRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await responseService.deleteResponse(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Response not found' });
      return;
    }
    res.json({ success: true, message: 'Response archived' });
  } catch (error) {
    logger.error('Failed to delete response', { error, responseId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to delete response' });
  }
});

/**
 * POST /api/responses/:id/use
 * Record response usage
 */
responseRoutes.post('/:id/use', async (req: Request, res: Response) => {
  try {
    const response = await responseService.recordUsage(req.params.id);
    if (!response) {
      res.status(404).json({ success: false, error: 'Response not found' });
      return;
    }
    res.json({ success: true, data: response });
  } catch (error) {
    logger.error('Failed to record usage', { error, responseId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to record usage' });
  }
});

/**
 * POST /api/responses/:id/render
 * Render response with variables
 */
responseRoutes.post('/:id/render', async (req: Request, res: Response) => {
  try {
    const validated = renderSchema.parse(req.body);
    const response = await responseService.getResponseById(req.params.id);
    if (!response) {
      res.status(404).json({ success: false, error: 'Response not found' });
      return;
    }

    const rendered = responseService.renderResponse(response.content, validated.variables);
    res.json({ success: true, data: { rendered, variables: response.variables } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      return;
    }
    logger.error('Failed to render response', { error, responseId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to render response' });
  }
});

/**
 * GET /api/responses/category/:categoryId
 * Get responses by category
 */
responseRoutes.get('/category/:categoryId', async (req: Request, res: Response) => {
  try {
    const responses = await responseService.getResponsesByCategory(req.params.categoryId);
    res.json({ success: true, data: responses });
  } catch (error) {
    logger.error('Failed to get responses by category', { error, categoryId: req.params.categoryId });
    res.status(500).json({ success: false, error: 'Failed to get responses' });
  }
});

export default responseRoutes;