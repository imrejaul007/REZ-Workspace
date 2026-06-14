import { Router, Request, Response } from 'express';
import {
  createSession,
  getSession,
  deleteSession,
  addMessage,
  getMessages,
  updateSessionContext,
  addMemory,
  getMemory,
  updateSessionState,
  getSessionsByUser,
  getSessionsByAgent,
  getActiveSessions,
  getSessionSummaries,
  resumeSession,
  pauseSession,
  completeSession,
  getSessionStats,
} from '../services/session.service';
import logger from '../utils/logger';

const router = Router();

// POST /api/sessions - Create session
router.post('/', (req: Request, res: Response) => {
  try {
    const { userId, agentId, context, config } = req.body;

    if (!userId || !agentId) {
      res.status(400).json({ success: false, error: 'userId and agentId are required' });
      return;
    }

    const session = createSession(userId, agentId, context, config);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    logger.error('Error creating session:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/sessions - List sessions
router.get('/', (req: Request, res: Response) => {
  try {
    const { userId, agentId, status } = req.query;
    const summaries = getSessionSummaries({
      userId: userId as string,
      agentId: agentId as string,
      status: status as string,
    });
    res.json({ success: true, data: summaries, count: summaries.length });
  } catch (error) {
    logger.error('Error listing sessions:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/sessions/active - Get active sessions
router.get('/active', (_req: Request, res: Response) => {
  res.json({ success: true, data: getActiveSessions() });
});

// GET /api/sessions/stats - Get session stats
router.get('/stats', (_req: Request, res: Response) => {
  res.json({ success: true, data: getSessionStats() });
});

// GET /api/sessions/:id - Get session by ID
router.get('/:id', (req: Request, res: Response) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ success: false, error: 'Session not found' });
    return;
  }
  res.json({ success: true, data: session });
});

// DELETE /api/sessions/:id - Delete session
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = deleteSession(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Session not found' });
    return;
  }
  res.json({ success: true, message: 'Session deleted' });
});

// POST /api/sessions/:id/messages - Add message
router.post('/:id/messages', (req: Request, res: Response) => {
  try {
    const { role, content, attachments, metadata } = req.body;

    if (!role || !content) {
      res.status(400).json({ success: false, error: 'role and content are required' });
      return;
    }

    if (!['user', 'agent', 'system'].includes(role)) {
      res.status(400).json({ success: false, error: 'Invalid role' });
      return;
    }

    const message = addMessage(req.params.id, role, content, attachments, metadata);
    if (!message) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    logger.error('Error adding message:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/sessions/:id/messages - Get messages
router.get('/:id/messages', (req: Request, res: Response) => {
  const { limit } = req.query;
  const messages = getMessages(req.params.id, limit ? parseInt(limit as string, 10) : undefined);
  res.json({ success: true, data: messages, count: messages.length });
});

// PATCH /api/sessions/:id/context - Update context
router.patch('/:id/context', (req: Request, res: Response) => {
  try {
    const session = updateSessionContext(req.params.id, req.body);
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }
    res.json({ success: true, data: session });
  } catch (error) {
    logger.error('Error updating context:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/sessions/:id/memory - Add memory
router.post('/:id/memory', (req: Request, res: Response) => {
  try {
    const { type, content, source, importance } = req.body;

    if (!type || !content || !source) {
      res.status(400).json({ success: false, error: 'type, content, and source are required' });
      return;
    }

    const entry = addMemory(req.params.id, type, content, source, importance);
    if (!entry) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    logger.error('Error adding memory:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/sessions/:id/memory - Get memory
router.get('/:id/memory', (req: Request, res: Response) => {
  const { type } = req.query;
  const memory = getMemory(req.params.id, type as any);
  res.json({ success: true, data: memory, count: memory.length });
});

// PATCH /api/sessions/:id/state - Update state
router.patch('/:id/state', (req: Request, res: Response) => {
  try {
    const session = updateSessionState(req.params.id, req.body);
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }
    res.json({ success: true, data: session });
  } catch (error) {
    logger.error('Error updating state:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/sessions/:id/resume - Resume session
router.post('/:id/resume', (req: Request, res: Response) => {
  const session = resumeSession(req.params.id);
  if (!session) {
    res.status(404).json({ success: false, error: 'Session not found' });
    return;
  }
  res.json({ success: true, data: session });
});

// POST /api/sessions/:id/pause - Pause session
router.post('/:id/pause', (req: Request, res: Response) => {
  const session = pauseSession(req.params.id);
  if (!session) {
    res.status(404).json({ success: false, error: 'Session not found' });
    return;
  }
  res.json({ success: true, data: session });
});

// POST /api/sessions/:id/complete - Complete session
router.post('/:id/complete', (req: Request, res: Response) => {
  const session = completeSession(req.params.id);
  if (!session) {
    res.status(404).json({ success: false, error: 'Session not found' });
    return;
  }
  res.json({ success: true, data: session });
});

export default router;
