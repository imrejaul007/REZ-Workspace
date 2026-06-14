// Merchant AI Employee UI - Agent Routes
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { aiAgentService } from '../services/aiAgentService';
import { AIGentConfigSchema } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createAgentSchema = AIGentConfigSchema;
const updateAgentSchema = AIGentConfigSchema.partial();

// Middleware for merchant context
const withMerchantContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const merchantId = req.headers['x-merchant-id'] as string;
  if (!merchantId) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_MERCHANT_ID', message: 'x-merchant-id header required' }
    });
  }
  (req as any).merchantId = merchantId;
  next();
};

// Health check
router.get('/health', async (_req: Request, res: Response) => {
  const health = await aiAgentService.healthCheck();
  res.json({
    status: 'ok',
    service: 'merchant-ai-employee-ui',
    timestamp: new Date().toISOString(),
    connectedAgents: health.connectedAgents,
  });
});

// Create agent
router.post('/agents', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const validated = createAgentSchema.parse(req.body);
    const result = await aiAgentService.createAgent({
      ...validated,
      merchantId: (req as any).merchantId,
    });

    res.status(201).json({
      success: true,
      data: { agentId: result.agentId },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors }
      });
    }
    logger.error('[AgentRoutes] Create agent failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create agent' }
    });
  }
});

// List agents
router.get('/agents', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as any).merchantId;
    const { agents, total } = await aiAgentService.listAgents(merchantId);

    res.json({
      success: true,
      data: agents,
      meta: { total },
    });
  } catch (error) {
    logger.error('[AgentRoutes] List agents failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list agents' }
    });
  }
});

// Get agent
router.get('/agents/:agentId', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const agent = await aiAgentService.getAgent(req.params.agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' }
      });
    }

    res.json({ success: true, data: agent });
  } catch (error) {
    logger.error('[AgentRoutes] Get agent failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get agent' }
    });
  }
});

// Update agent
router.put('/agents/:agentId', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const validated = updateAgentSchema.parse(req.body);
    const agent = await aiAgentService.updateAgent(req.params.agentId, validated);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' }
      });
    }

    res.json({ success: true, data: agent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors }
      });
    }
    logger.error('[AgentRoutes] Update agent failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update agent' }
    });
  }
});

// Delete agent
router.delete('/agents/:agentId', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const deleted = await aiAgentService.deleteAgent(req.params.agentId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' }
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('[AgentRoutes] Delete agent failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete agent' }
    });
  }
});

// Activate agent
router.post('/agents/:agentId/activate', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const activated = await aiAgentService.activateAgent(req.params.agentId);

    if (!activated) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' }
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('[AgentRoutes] Activate agent failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to activate agent' }
    });
  }
});

// Deactivate agent
router.post('/agents/:agentId/deactivate', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const deactivated = await aiAgentService.deactivateAgent(req.params.agentId);

    if (!deactivated) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' }
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('[AgentRoutes] Deactivate agent failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to deactivate agent' }
    });
  }
});

// Get agent metrics
router.get('/agents/:agentId/metrics', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await aiAgentService.getAgentMetrics(
      req.params.agentId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' }
      });
    }

    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error('[AgentRoutes] Get metrics failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get metrics' }
    });
  }
});

export default router;
