/**
 * NPS Routes - API endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { npsService } from '../services/npsService';
import { analyticsService } from '../services/analyticsService';
import { logger } from 'utils/logger.js';

const router = Router();

const createSurveySchema = z.object({
  customerId: z.string().min(1),
  type: z.enum(['transactional', 'relationship', 'churn', 'onboarding', 'support']),
  questions: z.array(z.object({
    order: z.number(),
    text: z.string(),
    type: z.enum(['nps', 'rating', 'text', 'multiple_choice']),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })).optional(),
  expiresInDays: z.number().optional(),
  triggeredBy: z.string().optional(),
});

const submitResponseSchema = z.object({
  answers: z.array(z.object({
    questionOrder: z.number(),
    questionText: z.string(),
    answerType: z.enum(['nps', 'rating', 'text', 'multiple_choice']),
    npsScore: z.number().min(0).max(10).optional(),
    ratingValue: z.number().optional(),
    textAnswer: z.string().optional(),
    selectedOption: z.string().optional(),
  })),
  feedback: z.string().optional(),
});

// POST /api/nps/surveys - Create survey
router.post('/surveys', async (req: Request, res: Response) => {
  try {
    const parseResult = createSurveySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Validation error', details: parseResult.error.errors });
      return;
    }

    const survey = await npsService.createSurvey(parseResult.data);
    res.status(201).json({ success: true, data: survey });
  } catch (error) {
    logger.error('Error creating survey', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/nps/surveys/:id/send - Send survey
router.post('/surveys/:id/send', async (req: Request, res: Response) => {
  try {
    const survey = await npsService.sendSurvey(req.params.id);
    if (!survey) {
      res.status(404).json({ success: false, error: 'Survey not found' });
      return;
    }
    res.json({ success: true, data: survey });
  } catch (error) {
    logger.error('Error sending survey', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/nps/surveys/:id - Get survey
router.get('/surveys/:id', async (req: Request, res: Response) => {
  try {
    const survey = await npsService.getSurvey(req.params.id);
    if (!survey) {
      res.status(404).json({ success: false, error: 'Survey not found' });
      return;
    }
    res.json({ success: true, data: survey });
  } catch (error) {
    logger.error('Error getting survey', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/nps/respond - Submit response
router.post('/respond', async (req: Request, res: Response) => {
  try {
    const { surveyId, ...rest } = req.body;
    if (!surveyId) {
      res.status(400).json({ success: false, error: 'surveyId is required' });
      return;
    }

    const parseResult = submitResponseSchema.safeParse(rest);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Validation error', details: parseResult.error.errors });
      return;
    }

    const response = await npsService.submitResponse({ surveyId, ...parseResult.data });
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    logger.error('Error submitting response', { error });
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

// GET /api/nps/:customerId/history - Get customer NPS history
router.get('/:customerId/history', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const history = await npsService.getCustomerHistory(req.params.customerId, limit);
    res.json({ success: true, data: { customerId: req.params.customerId, history } });
  } catch (error) {
    logger.error('Error getting history', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/nps/analytics - Get NPS analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as any) || 'monthly';
    const analytics = await analyticsService.getAnalytics(period);
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('Error getting analytics', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/nps/analytics/:customerId - Get customer analytics
router.get('/analytics/:customerId', async (req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getCustomerAnalytics(req.params.customerId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('Error getting customer analytics', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;