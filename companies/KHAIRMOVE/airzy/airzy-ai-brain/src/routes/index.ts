import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { aiService } from '../services/aiService';
import { asyncHandler } from '../utils/errors';

const router = Router();

const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });
  next();
};

router.post('/chat', [body('message').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'guest';
  const response = await aiService.processMessage(req.body, userId);
  res.json({ success: true, data: response, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.get('/sessions/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const session = await aiService.getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: session, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.get('/recommendations', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'guest';
  const type = req.query.type as string;
  const recommendations = await aiService.getRecommendations(userId, type);
  res.json({ success: true, data: recommendations, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

export default router;