// ============================================================================
// Role AI Agents - Role Routes
// ============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { agentService } from '../services';
import { ChatRequestSchema, RoleRecommendationRequestSchema, VALID_ROLES, VALID_LEVELS } from '../types/schemas';
import type { JobRole, AgentLevel, ApiResponse } from '../types';
import logger from '../utils/logger';

const router = Router();

// ============================================================================
// Validation Middleware
// ============================================================================

function asyncHandler<T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function validateRole(role: string): role is JobRole {
  return VALID_ROLES.includes(role as JobRole);
}

function validateLevel(level: string): level is AgentLevel {
  return VALID_LEVELS.includes(level as AgentLevel);
}

// ============================================================================
// GET /api/roles - List all roles
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Fetching all roles');

    const roles = await agentService.getAllRoles();

    const response: ApiResponse<typeof roles> = {
      success: true,
      data: roles,
      timestamp: new Date(),
    };

    res.json(response);
  })
);

// ============================================================================
// GET /api/roles/:role - Get role info
// ============================================================================

router.get(
  '/:role',
  asyncHandler(async (req: Request, res: Response) => {
    const { role } = req.params;

    if (!validateRole(role)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: `Invalid role: ${role}. Valid roles: ${VALID_ROLES.join(', ')}`,
        },
        timestamp: new Date(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    logger.info('Fetching role', { role });

    const roleData = await agentService.getRoleById(role);

    const response: ApiResponse<typeof roleData> = {
      success: true,
      data: roleData,
      timestamp: new Date(),
    };

    res.json(response);
  })
);

// ============================================================================
// GET /api/roles/:role/levels - Get all levels for a role
// ============================================================================

router.get(
  '/:role/levels',
  asyncHandler(async (req: Request, res: Response) => {
    const { role } = req.params;

    if (!validateRole(role)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: `Invalid role: ${role}`,
        },
        timestamp: new Date(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    logger.info('Fetching role levels', { role });

    const levels = await agentService.getRoleLevels(role);

    const response: ApiResponse<typeof levels> = {
      success: true,
      data: levels,
      timestamp: new Date(),
    };

    res.json(response);
  })
);

// ============================================================================
// GET /api/roles/:role/levels/:level - Get specific level
// ============================================================================

router.get(
  '/:role/levels/:level',
  asyncHandler(async (req: Request, res: Response) => {
    const { role, level } = req.params;

    if (!validateRole(role)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: `Invalid role: ${role}`,
        },
        timestamp: new Date(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (!validateLevel(level)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_LEVEL',
          message: `Invalid level: ${level}. Valid levels: ${VALID_LEVELS.join(', ')}`,
        },
        timestamp: new Date(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    logger.info('Fetching role level', { role, level });

    const levelData = await agentService.getRoleLevel(role, level);

    const response: ApiResponse<typeof levelData> = {
      success: true,
      data: levelData,
      timestamp: new Date(),
    };

    res.json(response);
  })
);

// ============================================================================
// POST /api/roles/chat - Chat with role agent
// ============================================================================

router.post(
  '/chat',
  asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const parseResult = ChatRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.issues,
        },
        timestamp: new Date(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    const { role, level, message, userId } = parseResult.data;

    logger.info('Chat request', { role, level, messageLength: message.length });

    const chatResponse = await agentService.chat({
      role,
      level,
      message,
      userId,
      context: undefined,
    });

    const response: ApiResponse<typeof chatResponse> = {
      success: true,
      data: chatResponse,
      timestamp: new Date(),
    };

    res.json(response);
  })
);

// ============================================================================
// POST /api/roles/chat/:sessionId - Continue chat session
// ============================================================================

router.post(
  '/chat/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message is required',
        },
        timestamp: new Date(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    logger.info('Continue chat request', { sessionId, messageLength: message.length });

    const chatResponse = await agentService.continueChat(sessionId, message);

    const response: ApiResponse<typeof chatResponse> = {
      success: true,
      data: chatResponse,
      timestamp: new Date(),
    };

    res.json(response);
  })
);

// ============================================================================
// POST /api/roles/recommend - Recommend roles for user
// ============================================================================

router.post(
  '/recommend',
  asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const parseResult = RoleRecommendationRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.issues,
        },
        timestamp: new Date(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    logger.info('Role recommendation request', { userId: req.body.userId });

    const recommendations = await agentService.recommendRoles(parseResult.data);

    const response: ApiResponse<typeof recommendations> = {
      success: true,
      data: recommendations,
      timestamp: new Date(),
    };

    res.json(response);
  })
);

// ============================================================================
// GET /api/roles/sessions/:sessionId - Get chat session
// ============================================================================

router.get(
  '/sessions/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    logger.info('Fetching session', { sessionId });

    const session = await agentService.getSession(sessionId);

    if (!session) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Session ${sessionId} not found`,
        },
        timestamp: new Date(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    const response: ApiResponse<typeof session> = {
      success: true,
      data: session,
      timestamp: new Date(),
    };

    res.json(response);
  })
);

export default router;
