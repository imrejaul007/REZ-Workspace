// ==========================================
// AI Agents Service - Routes
// API endpoints for AI agents
// ==========================================

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AgentService } from '../services/agentService';
import { logger } from '../utils/logger';
import {
  ChatRequestSchema,
  ConfigureAgentRequestSchema,
  AgentId,
  AgentResponse,
  Conversation,
  DailyInsight,
  WeeklyDigest,
} from '../types';
import { ZodError } from 'zod';

const router = Router();

/**
 * Validation error handler
 */
const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  };
};

/**
 * Async handler wrapper
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error handler
 */
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Route error:', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

// ==========================================
// Agent Routes
// ==========================================

/**
 * GET /api/agents
 * List all available agents
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  logger.info('GET /api/agents - Fetching all agents');

  const agents = AgentService.getAllAgents();

  res.json({
    success: true,
    data: agents,
    count: agents.length,
  });
}));

/**
 * GET /api/agents/:id
 * Get agent details by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  logger.info(`GET /api/agents/${id} - Fetching agent details`);

  const agent = AgentService.getAgentById(id as AgentId);

  if (!agent) {
    return res.status(404).json({
      success: false,
      error: 'Agent not found',
    });
  }

  res.json({
    success: true,
    data: agent,
  });
}));

/**
 * POST /api/agents/:id/chat
 * Chat with a specific agent
 */
router.post('/:id/chat', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message, context, history } = req.body;
  const userId = req.headers['x-user-id'] as string || 'demo-user';

  logger.info(`POST /api/agents/${id}/chat - User: ${userId}`);

  // Validate request
  const validationResult = ChatRequestSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: validationResult.error.errors,
    });
  }

  const agent = AgentService.getAgentById(id as AgentId);
  if (!agent) {
    return res.status(404).json({
      success: false,
      error: 'Agent not found',
    });
  }

  const response = await AgentService.processChat(userId, id as AgentId, {
    message,
    context,
    history,
  });

  res.json({
    success: true,
    data: response,
  });
}));

/**
 * POST /api/agents/:id/configure
 * Configure agent for user
 */
router.post('/:id/configure', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] as string || 'demo-user';

  logger.info(`POST /api/agents/${id}/configure - User: ${userId}`);

  const validationResult = ConfigureAgentRequestSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: validationResult.error.errors,
    });
  }

  const config = AgentService.configureAgent(userId, id as AgentId, req.body);

  res.json({
    success: true,
    data: config,
    message: 'Agent configured successfully',
  });
}));

/**
 * GET /api/agents/:id/config
 * Get agent configuration for user
 */
router.get('/:id/config', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] as string || 'demo-user';

  logger.info(`GET /api/agents/${id}/config - User: ${userId}`);

  const config = AgentService.getAgentConfig(userId, id as AgentId);

  res.json({
    success: true,
    data: config || { enabled: true },
  });
}));

/**
 * GET /api/agents/:id/status
 * Get agent status
 */
router.get('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  logger.info(`GET /api/agents/${id}/status`);

  const status = AgentService.getAgentStatus(id as AgentId);

  res.json({
    success: true,
    data: { status },
  });
}));

// ==========================================
// Conversation Routes
// ==========================================

/**
 * GET /api/conversations
 * Get all conversations for user
 */
router.get('/conversations', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  logger.info(`GET /api/conversations - User: ${userId}`);

  const conversations = AgentService.getConversations(userId);

  res.json({
    success: true,
    data: conversations,
    count: conversations.length,
  });
}));

/**
 * GET /api/conversations/me
 * Get current user's conversations (alias)
 */
router.get('/conversations/me', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  logger.info(`GET /api/conversations/me - User: ${userId}`);

  const conversations = AgentService.getConversations(userId);

  res.json({
    success: true,
    data: conversations,
    count: conversations.length,
  });
}));

/**
 * GET /api/conversations/:conversationId
 * Get specific conversation
 */
router.get('/conversations/:conversationId', asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const userId = req.headers['x-user-id'] as string || 'demo-user';

  logger.info(`GET /api/conversations/${conversationId} - User: ${userId}`);

  const conversation = AgentService.getConversation(userId, conversationId);

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found',
    });
  }

  res.json({
    success: true,
    data: conversation,
  });
}));

/**
 * DELETE /api/conversations/:conversationId
 * Delete a conversation
 */
router.delete('/conversations/:conversationId', asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const userId = req.headers['x-user-id'] as string || 'demo-user';

  logger.info(`DELETE /api/conversations/${conversationId} - User: ${userId}`);

  const conversation = AgentService.getConversation(userId, conversationId);

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found',
    });
  }

  // Note: In production, delete from database
  res.json({
    success: true,
    message: 'Conversation deleted',
  });
}));

// ==========================================
// Insights Routes
// ==========================================

/**
 * GET /api/insights/daily
 * Get daily insights for user
 */
router.get('/insights/daily', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  logger.info(`GET /api/insights/daily - User: ${userId}`);

  // In production, get context from employee service
  const insights = AgentService.generateDailyInsights(userId, {});

  res.json({
    success: true,
    data: insights,
  });
}));

/**
 * GET /api/insights/weekly
 * Get weekly digest for user
 */
router.get('/insights/weekly', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  logger.info(`GET /api/insights/weekly - User: ${userId}`);

  const digest = AgentService.generateWeeklyDigest(userId);

  res.json({
    success: true,
    data: digest,
  });
}));

// ==========================================
// Error Handler
// ==========================================

router.use(errorHandler);

export default router;
