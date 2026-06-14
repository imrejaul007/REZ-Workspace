import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { graphService } from '../services/graphService';
import { logger } from '../utils/logger';
import { internalAuth } from '../middleware/auth';

const router = Router();

// Zod schemas for validation
const graphInputSchema = z.object({
  rootDeviceId: z.string().min(1),
  name: z.string().optional(),
  nodes: z.array(z.object({
    nodeId: z.string().optional(),
    deviceId: z.string(),
    type: z.enum(['device', 'user', 'household', 'ip', 'account']),
    attributes: z.object({
      firstSeen: z.string().datetime().optional(),
      lastSeen: z.string().datetime().optional(),
      matchCount: z.number().optional(),
      confidence: z.number().optional()
    }).optional(),
    metadata: z.record(z.unknown()).optional()
  })).optional(),
  edges: z.array(z.object({
    edgeId: z.string().optional(),
    sourceNodeId: z.string(),
    targetNodeId: z.string(),
    weight: z.number().optional(),
    type: z.enum(['ip-match', 'fingerprint-match', 'behavioral-match', 'temporal-match', 'geographic-match']),
    probability: z.number().optional(),
    confidence: z.number().optional(),
    features: z.record(z.unknown()).optional(),
    firstSeen: z.string().datetime().optional(),
    lastSeen: z.string().datetime().optional(),
    isActive: z.boolean().optional()
  })).optional(),
  metadata: z.record(z.unknown()).optional()
});

const nodeInputSchema = z.object({
  deviceId: z.string().min(1),
  type: z.enum(['device', 'user', 'household', 'ip', 'account']),
  attributes: z.object({
    firstSeen: z.string().datetime().optional(),
    lastSeen: z.string().datetime().optional(),
    matchCount: z.number().optional(),
    confidence: z.number().optional()
  }).optional(),
  metadata: z.record(z.unknown()).optional()
});

const edgeInputSchema = z.object({
  sourceDeviceId: z.string().min(1),
  targetDeviceId: z.string().min(1),
  type: z.enum(['ip-match', 'fingerprint-match', 'behavioral-match', 'temporal-match', 'geographic-match']),
  weight: z.number().min(0).max(1).optional(),
  probability: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(100).optional(),
  features: z.record(z.unknown()).optional()
});

// POST /api/match/graph - Create graph
router.post('/', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = graphInputSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const result = await graphService.createGraph(validationResult.data);

    logger.info('Match graph created', {
      graphId: result.graphId,
      rootDeviceId: result.rootDeviceId
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/match/graph/:id - Get graph
router.get('/:id', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const graph = await graphService.getGraph(id);

    if (!graph) {
      res.status(404).json({ error: 'Graph not found', graphId: id });
      return;
    }

    res.json(graph);
  } catch (error) {
    next(error);
  }
});

// GET /api/match/graph/device/:deviceId - Get graph by device ID
router.get('/device/:deviceId', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const graph = await graphService.getGraphByDeviceId(deviceId);

    if (!graph) {
      res.status(404).json({ error: 'Graph not found for device', deviceId });
      return;
    }

    res.json(graph);
  } catch (error) {
    next(error);
  }
});

// POST /api/match/graph/:id/node - Add node to graph
router.post('/:id/node', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validationResult = nodeInputSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const graph = await graphService.addNode(id, validationResult.data);

    if (!graph) {
      res.status(404).json({ error: 'Graph not found', graphId: id });
      return;
    }

    logger.info('Node added to graph', { graphId: id, deviceId: validationResult.data.deviceId });

    res.json(graph);
  } catch (error) {
    next(error);
  }
});

// POST /api/match/graph/:id/edge - Add edge to graph
router.post('/:id/edge', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validationResult = edgeInputSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const graph = await graphService.addEdge(id, validationResult.data);

    if (!graph) {
      res.status(404).json({ error: 'Graph not found or nodes not found', graphId: id });
      return;
    }

    logger.info('Edge added to graph', {
      graphId: id,
      sourceDeviceId: validationResult.data.sourceDeviceId,
      targetDeviceId: validationResult.data.targetDeviceId
    });

    res.json(graph);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/match/graph/:id/edge/:edgeId - Remove edge from graph
router.delete('/:id/edge/:edgeId', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, edgeId } = req.params;
    const graph = await graphService.removeEdge(id, edgeId);

    if (!graph) {
      res.status(404).json({ error: 'Graph not found', graphId: id });
      return;
    }

    logger.info('Edge removed from graph', { graphId: id, edgeId });

    res.json(graph);
  } catch (error) {
    next(error);
  }
});

// GET /api/match/graph/:id/connected/:deviceId - Get connected devices
router.get('/:id/connected/:deviceId', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, deviceId } = req.params;
    const graph = await graphService.getGraph(id);

    if (!graph) {
      res.status(404).json({ error: 'Graph not found', graphId: id });
      return;
    }

    const result = await graphService.getConnectedDevices(deviceId);

    if (!result) {
      res.status(404).json({ error: 'Device not found in graph', deviceId });
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/match/graph/:id/complete - Mark graph as complete
router.patch('/:id/complete', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const graph = await graphService.markGraphComplete(id);

    if (!graph) {
      res.status(404).json({ error: 'Graph not found', graphId: id });
      return;
    }

    logger.info('Graph marked as complete', { graphId: id });

    res.json(graph);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/match/graph/:id - Delete graph
router.delete('/:id', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await graphService.deleteGraph(id);

    if (!deleted) {
      res.status(404).json({ error: 'Graph not found', graphId: id });
      return;
    }

    logger.info('Graph deleted', { graphId: id });

    res.json({ message: 'Graph deleted', graphId: id });
  } catch (error) {
    next(error);
  }
});

// GET /api/match/graph/stats - Get graph statistics
router.get('/stats', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await graphService.getGraphStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/match/graph/active - Get all active graphs
router.get('/active', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const graphs = await graphService.getActiveGraphs();
    res.json({
      count: graphs.length,
      graphs
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/match/graph/merge - Merge two graphs
router.post('/merge', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sourceGraphId, targetGraphId } = req.body;

    if (!sourceGraphId || !targetGraphId) {
      res.status(400).json({ error: 'Both sourceGraphId and targetGraphId are required' });
      return;
    }

    const graph = await graphService.mergeGraphs(sourceGraphId, targetGraphId);

    if (!graph) {
      res.status(404).json({ error: 'One or both graphs not found' });
      return;
    }

    logger.info('Graphs merged', { sourceGraphId, targetGraphId });

    res.json(graph);
  } catch (error) {
    next(error);
  }
});

export default router;