import { logger } from '../../shared/logger';
import { Router, Request, Response } from 'express';
import { relationshipsService } from '../services/relationshipsService.js';
import {
  AddRelationshipInputSchema,
  LogInteractionInputSchema,
  SetGoalInputSchema,
  AddRelationshipInput,
  LogInteractionInput,
  SetGoalInput
} from '../models/relationships.js';
import { ZodSchema } from 'zod';

const router = Router();

// Helper to validate request body against schema
const validate = <T>(schema: ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
    };
  }
  return { success: true, data: result.data };
};

// =====================
// RELATIONSHIP ROUTES
// =====================

/**
 * GET /api/relationships
 * Get all relationships for a user
 */
router.get('/relationships', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(400).json({ error: 'x-user-id header is required' });
  }

  try {
    const relationships = relationshipsService.getRelationships(userId);
    return res.json({ success: true, data: relationships });
  } catch (error) {
    logger.error('Error getting relationships:', error);
    return res.status(500).json({ error: 'Failed to get relationships' });
  }
});

/**
 * GET /api/relationships/:id
 * Get a single relationship by ID
 */
router.get('/relationships/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  // UUID validation - if it doesn't look like a UUID, return 404 for this route
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(404).json({ error: 'Relationship not found' });
  }

  try {
    const relationship = relationshipsService.getRelationship(id);
    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    return res.json({ success: true, data: relationship });
  } catch (error) {
    logger.error('Error getting relationship:', error);
    return res.status(500).json({ error: 'Failed to get relationship' });
  }
});

/**
 * POST /api/relationships
 * Add a new relationship
 */
router.post('/relationships', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(400).json({ error: 'x-user-id header is required' });
  }

  const validation = validate<AddRelationshipInput>(AddRelationshipInputSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const relationship = relationshipsService.addRelationship(userId, validation.data!);
    return res.status(201).json({ success: true, data: relationship });
  } catch (error) {
    logger.error('Error adding relationship:', error);
    return res.status(500).json({ error: 'Failed to add relationship' });
  }
});

/**
 * PUT /api/relationships/:id
 * Update a relationship
 */
router.put('/relationships/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(404).json({ error: 'Relationship not found' });
  }

  try {
    const relationship = relationshipsService.updateRelationship(id, req.body);
    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    return res.json({ success: true, data: relationship });
  } catch (error) {
    logger.error('Error updating relationship:', error);
    return res.status(500).json({ error: 'Failed to update relationship' });
  }
});

/**
 * DELETE /api/relationships/:id
 * Archive (soft delete) a relationship
 */
router.delete('/relationships/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(404).json({ error: 'Relationship not found' });
  }

  try {
    const success = relationshipsService.deleteRelationship(id);
    if (!success) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    return res.json({ success: true, message: 'Relationship archived' });
  } catch (error) {
    logger.error('Error deleting relationship:', error);
    return res.status(500).json({ error: 'Failed to delete relationship' });
  }
});

// =====================
// INTERACTION ROUTES
// =====================

/**
 * GET /api/relationships/:relationshipId/interactions
 * Get interactions for a relationship
 * Query params: days (optional) - number of days to look back
 */
router.get('/relationships/:relationshipId/interactions', (req: Request, res: Response) => {
  const { relationshipId } = req.params;
  const days = req.query.days ? parseInt(req.query.days as string, 10) : undefined;

  if (req.query.days && isNaN(days!)) {
    return res.status(400).json({ error: 'Invalid days parameter' });
  }

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(relationshipId)) {
    return res.status(404).json({ error: 'Relationship not found' });
  }

  try {
    const relationship = relationshipsService.getRelationship(relationshipId);
    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    const interactions = relationshipsService.getInteractions(relationshipId, days);
    return res.json({ success: true, data: interactions });
  } catch (error) {
    logger.error('Error getting interactions:', error);
    return res.status(500).json({ error: 'Failed to get interactions' });
  }
});

/**
 * POST /api/relationships/:relationshipId/interactions
 * Log a new interaction
 */
router.post('/relationships/:relationshipId/interactions', (req: Request, res: Response) => {
  const { relationshipId } = req.params;

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(relationshipId)) {
    return res.status(404).json({ error: 'Relationship not found' });
  }

  const validation = validate<LogInteractionInput>(LogInteractionInputSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const interaction = relationshipsService.logInteraction(relationshipId, validation.data!);
    if (!interaction) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    return res.status(201).json({ success: true, data: interaction });
  } catch (error) {
    logger.error('Error logging interaction:', error);
    return res.status(500).json({ error: 'Failed to log interaction' });
  }
});

// =====================
// HEALTH SCORE ROUTE
// =====================

/**
 * GET /api/health
 * Get relationship health score for a user
 */
router.get('/health', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(400).json({ error: 'x-user-id header is required' });
  }

  try {
    const health = relationshipsService.getRelationshipHealth(userId);
    return res.json({ success: true, data: health });
  } catch (error) {
    logger.error('Error getting health score:', error);
    return res.status(500).json({ error: 'Failed to get health score' });
  }
});

/**
 * GET /api/relationships/:relationshipId/health
 * Get health score for a specific relationship
 */
router.get('/:relationshipId/health', (req: Request, res: Response) => {
  const { relationshipId } = req.params;

  try {
    const relationship = relationshipsService.getRelationship(relationshipId);
    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    // Calculate individual relationship health
    const interactions = relationshipsService.getInteractions(relationshipId, 30);
    const avgQuality = interactions.length > 0
      ? interactions.reduce((sum, i) => sum + i.quality, 0) / interactions.length
      : 3;

    return res.json({
      success: true,
      data: {
        relationshipId,
        overallScore: Math.round(relationship.qualityScore * 10),
        communicationScore: Math.round(relationship.communicationScore * 10),
        intimacyScore: Math.round(relationship.intimacyScore * 10),
        trustScore: Math.round(relationship.trustScore * 10),
        conflictResolutionScore: Math.round(relationship.conflictResolutionScore * 10),
        qualityTimeScore: Math.round(avgQuality * 20),
        recentInteractions: interactions.length,
        calculatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting relationship health:', error);
    return res.status(500).json({ error: 'Failed to get relationship health' });
  }
});

// =====================
// GOALS ROUTES
// =====================

/**
 * GET /api/goals
 * Get goals for a user
 * Query params: relationshipId (optional)
 */
router.get('/goals', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const relationshipId = req.query.relationshipId as string | undefined;

  if (!userId) {
    return res.status(400).json({ error: 'x-user-id header is required' });
  }

  try {
    const goals = relationshipsService.getGoals(userId, relationshipId);
    return res.json({ success: true, data: goals });
  } catch (error) {
    logger.error('Error getting goals:', error);
    return res.status(500).json({ error: 'Failed to get goals' });
  }
});

/**
 * POST /api/goals
 * Set a new relationship goal
 */
router.post('/goals', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(400).json({ error: 'x-user-id header is required' });
  }

  const validation = validate<SetGoalInput>(SetGoalInputSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const goal = relationshipsService.setRelationshipGoal(userId, validation.data!);
    return res.status(201).json({ success: true, data: goal });
  } catch (error) {
    logger.error('Error setting goal:', error);
    return res.status(500).json({ error: 'Failed to set goal' });
  }
});

/**
 * PUT /api/goals/:id/progress
 * Update goal progress
 */
router.put('/goals/:id/progress', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { id } = req.params;
  const { progress, currentValue } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'x-user-id header is required' });
  }

  if (typeof progress !== 'number') {
    return res.status(400).json({ error: 'progress must be a number between 0 and 100' });
  }

  try {
    const goal = relationshipsService.updateGoalProgress(id, userId, progress, currentValue);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    return res.json({ success: true, data: goal });
  } catch (error) {
    logger.error('Error updating goal progress:', error);
    return res.status(500).json({ error: 'Failed to update goal progress' });
  }
});

// =====================
// INSIGHTS ROUTE
// =====================

/**
 * GET /api/insights
 * Get relationship insights for a user
 */
router.get('/insights', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(400).json({ error: 'x-user-id header is required' });
  }

  try {
    const insights = relationshipsService.getInsights(userId);
    return res.json({ success: true, data: insights });
  } catch (error) {
    logger.error('Error getting insights:', error);
    return res.status(500).json({ error: 'Failed to get insights' });
  }
});

export default router;
