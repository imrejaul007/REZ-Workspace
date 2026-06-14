/**
 * REZ Memory Cloud - Graph Routes (Knowledge Graph)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { graphService } from '../services/graphService.js';
import { CreateEntitySchema, CreateRelationSchema, GraphQuerySchema } from '../models/Entity.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/graph/entities - Create an entity
 */
router.post('/entities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = CreateEntitySchema.parse(req.body);
    const entity = await graphService.createEntity(input);

    res.status(201).json({
      success: true,
      data: {
        entityId: entity.entityId,
        type: entity.type,
        name: entity.name,
        description: entity.description,
        properties: entity.properties,
        createdAt: entity.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.errors));
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/graph/entities/:entityId - Get an entity
 */
router.get('/entities/:entityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entity = await graphService.getEntity(req.params.entityId);

    if (!entity) {
      throw new AppError('Entity not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        entityId: entity.entityId,
        type: entity.type,
        name: entity.name,
        description: entity.description,
        properties: entity.properties,
        incomingRelations: entity.incomingRelations,
        outgoingRelations: entity.outgoingRelations,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/graph/entities/:entityId/relations - Get entity relations
 */
router.get('/entities/:entityId/relations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const relations = await graphService.getRelations(req.params.entityId);

    res.json({
      success: true,
      data: {
        outgoing: relations.outgoing.map((r) => ({
          relationId: r.relationId,
          toEntityId: r.toEntityId,
          type: r.type,
          strength: r.strength,
        })),
        incoming: relations.incoming.map((r) => ({
          relationId: r.relationId,
          fromEntityId: r.fromEntityId,
          type: r.type,
          strength: r.strength,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/graph/search - Search entities
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      throw new AppError('q (query) is required', 400, 'MISSING_PARAMETER');
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const entities = await graphService.searchEntities(query, limit);

    res.json({
      success: true,
      data: entities.map((e) => ({
        entityId: e.entityId,
        type: e.type,
        name: e.name,
        description: e.description,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/graph/type/:type - Get entities by type
 */
router.get('/type/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      throw new AppError('userId is required', 400, 'MISSING_PARAMETER');
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const entities = await graphService.getEntitiesByType(req.params.type, userId, limit);

    res.json({
      success: true,
      data: entities.map((e) => ({
        entityId: e.entityId,
        type: e.type,
        name: e.name,
        description: e.description,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/graph/relations - Create a relation
 */
router.post('/relations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = CreateRelationSchema.parse(req.body);
    const relation = await graphService.createRelation(input);

    res.status(201).json({
      success: true,
      data: {
        relationId: relation.relationId,
        fromEntityId: relation.fromEntityId,
        toEntityId: relation.toEntityId,
        type: relation.type,
        strength: relation.strength,
        createdAt: relation.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.errors));
    } else {
      next(error);
    }
  }
});

/**
 * DELETE /api/graph/relations/:relationId - Delete a relation
 */
router.delete('/relations/:relationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await graphService.deleteRelation(req.params.relationId);

    if (!deleted) {
      throw new AppError('Relation not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Relation deleted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/graph/query - Query the graph
 */
router.post('/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = GraphQuerySchema.parse(req.body);
    const result = await graphService.query(input);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.errors));
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/graph/stats/:userId - Get graph statistics
 */
router.get('/stats/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await graphService.getStats(req.params.userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/graph/entities/:entityId - Delete an entity
 */
router.delete('/entities/:entityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await graphService.deleteEntity(req.params.entityId);

    if (!deleted) {
      throw new AppError('Entity not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Entity deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
