import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { sessionService } from '../services/sessionService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const startSessionSchema = z.object({
  storeId: z.string().min(1),
  deviceInfo: z.object({
    deviceId: z.string().optional(),
    platform: z.string().optional(),
    appVersion: z.string().optional(),
  }).optional(),
  location: z.object({
    entryLat: z.number(),
    entryLng: z.number(),
  }).optional(),
});

const getSessionsSchema = z.object({
  userId: z.string().optional(),
  storeId: z.string().optional(),
  merchantId: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'syncing', 'timeout']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
});

/**
 * POST /api/sessions/start
 * Start a new shopping session
 */
router.post('/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validated = startSessionSchema.parse(req.body);
    const session = await sessionService.startSession({
      userId,
      ...validated,
    });

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Start session error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to start session' });
  }
});

/**
 * GET /api/sessions/:sessionId
 * Get session by ID
 */
router.get('/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.query.userId;
    const { sessionId } = req.params;

    let session;
    if (userId) {
      session = await sessionService.getSessionForUser(sessionId, userId);
    } else {
      session = await sessionService.getSession(sessionId);
    }

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true, session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

/**
 * GET /api/sessions/user/active
 * Get user's active session
 */
router.get('/user/active', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.query.userId as string;
    const storeId = req.query.storeId as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required' });
    }

    const session = await sessionService.getActiveSession(userId, storeId);

    res.json({ success: true, session });
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({ error: 'Failed to get active session' });
  }
});

/**
 * GET /api/sessions
 * Get sessions with filters
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validated = getSessionsSchema.parse(req.query);
    const result = await sessionService.getSessions(validated);

    res.json({
      success: true,
      sessions: result.sessions,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

/**
 * GET /api/sessions/user/history
 * Get user's session history
 */
router.get('/user/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.query.userId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await sessionService.getUserHistory(userId, page, limit);

    res.json({
      success: true,
      sessions: result.sessions,
      total: result.total,
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

/**
 * POST /api/sessions/:sessionId/cancel
 * Cancel a session
 */
router.post('/:sessionId/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;
    const { sessionId } = req.params;
    const reason = req.body.reason;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const session = await sessionService.cancelSession(sessionId, userId, reason);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true, session });
  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to cancel session' });
  }
});

/**
 * POST /api/sessions/:sessionId/touch
 * Update session activity
 */
router.post('/:sessionId/touch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    await sessionService.touchSession(sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Touch session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

export default router;
