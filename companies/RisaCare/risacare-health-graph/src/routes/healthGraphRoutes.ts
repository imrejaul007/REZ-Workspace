/**
 * Health Knowledge Graph API Routes
 */

import { Router, Request, Response } from 'express';
import { healthGraphService } from '../services/healthGraphService.js';

const router = Router();

/**
 * GET /api/graph
 * Get or create health graph
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({
        success: false,
        error: 'Person ID required',
        timestamp: new Date().toISOString()
      });
    }

    const graph = await healthGraphService.getOrCreateGraph(personId);
    res.json({
      success: true,
      data: graph,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get health graph',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/graph/nodes
 * Add a node to the graph
 */
router.post('/nodes', async (req: Request, res: Response) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({
        success: false,
        error: 'Person ID required',
        timestamp: new Date().toISOString()
      });
    }

    const { type, name, description, value, metadata } = req.body;
    const node = await healthGraphService.addNode(personId, type, name, { description, value, metadata });

    res.status(201).json({
      success: true,
      data: node,
      message: 'Node added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add node',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/graph/nodes
 * Get all nodes
 */
router.get('/nodes', async (req: Request, res: Response) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({
        success: false,
        error: 'Person ID required',
        timestamp: new Date().toISOString()
      });
    }

    const type = req.query.type as any;
    const nodes = await healthGraphService.getNodes(personId, type);

    res.json({
      success: true,
      data: nodes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get nodes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/graph/relationships
 * Create a relationship
 */
router.post('/relationships', async (req: Request, res: Response) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({
        success: false,
        error: 'Person ID required',
        timestamp: new Date().toISOString()
      });
    }

    const { sourceNodeId, targetNodeId, type, weight, description, evidence } = req.body;
    const relationship = await healthGraphService.createRelationship(personId, sourceNodeId, targetNodeId, type, { weight, description, evidence });

    res.status(201).json({
      success: true,
      data: relationship,
      message: 'Relationship created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create relationship',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/graph/relationships/:nodeId
 * Get relationships for a node
 */
router.get('/relationships/:nodeId', async (req: Request, res: Response) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({
        success: false,
        error: 'Person ID required',
        timestamp: new Date().toISOString()
      });
    }

    const relationships = await healthGraphService.getNodeRelationships(personId, req.params.nodeId);

    res.json({
      success: true,
      data: relationships,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get relationships',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/graph/extract
 * Extract knowledge from text
 */
router.post('/extract', async (req: Request, res: Response) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({
        success: false,
        error: 'Person ID required',
        timestamp: new Date().toISOString()
      });
    }

    const { text, source, metadata } = req.body;
    const result = await healthGraphService.extractKnowledge(personId, { text, source, metadata });

    res.json({
      success: true,
      data: result,
      message: 'Knowledge extracted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to extract knowledge',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/graph/analyze/symptom
 * Analyze a symptom
 */
router.post('/analyze/symptom', async (req: Request, res: Response) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({
        success: false,
        error: 'Person ID required',
        timestamp: new Date().toISOString()
      });
    }

    const { symptom } = req.body;
    const analysis = await healthGraphService.analyzeSymptom(personId, symptom);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze symptom',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/graph/analyze/condition
 * Analyze a condition
 */
router.post('/analyze/condition', async (req: Request, res: Response) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({
        success: false,
        error: 'Person ID required',
        timestamp: new Date().toISOString()
      });
    }

    const { condition } = req.body;
    const analysis = await healthGraphService.analyzeCondition(personId, condition);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze condition',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/graph/insights
 * Generate insights from graph
 */
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({
        success: false,
        error: 'Person ID required',
        timestamp: new Date().toISOString()
      });
    }

    const insights = await healthGraphService.generateInsights(personId);

    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/graph/correlations
 * Find correlations
 */
router.get('/correlations', async (req: Request, res: Response) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({
        success: false,
        error: 'Person ID required',
        timestamp: new Date().toISOString()
      });
    }

    const correlations = await healthGraphService.findCorrelations(personId);

    res.json({
      success: true,
      data: correlations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to find correlations',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/graph/neighborhood/:nodeId
 * Get connected nodes
 */
router.get('/neighborhood/:nodeId', async (req: Request, res: Response) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({
        success: false,
        error: 'Person ID required',
        timestamp: new Date().toISOString()
      });
    }

    const depth = parseInt(req.query.depth as string) || 1;
    const neighborhood = await healthGraphService.getNeighborhood(personId, req.params.nodeId, depth);

    res.json({
      success: true,
      data: neighborhood,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get neighborhood',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/graph/export
 * Export graph data
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({
        success: false,
        error: 'Person ID required',
        timestamp: new Date().toISOString()
      });
    }

    const graph = await healthGraphService.exportGraph(personId);

    res.json({
      success: true,
      data: graph,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export graph',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;