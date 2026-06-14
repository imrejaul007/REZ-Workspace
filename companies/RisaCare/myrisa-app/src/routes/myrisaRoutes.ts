import { logger } from '../../shared/logger';
/**
 * MyRisa App - API Routes
 * Unified consumer interface for all wellbeing domains
 */

import { Router, Request, Response } from 'express';
import { myRisaClient } from '../services/integrationClient.js';

const router = Router();

// ============================================
// DASHBOARD
// ============================================

router.get('/dashboard/:userId', async (req: Request, res: Response) => {
  try {
    const dashboard = await myRisaClient.getDashboard(req.params.userId);
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// WOMEN'S HEALTH
// ============================================

router.get('/womens-health/profile/:userId', async (req: Request, res: Response) => {
  try {
    const profile = await myRisaClient.getWomensHealthProfile(req.params.userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

router.post('/womens-health/period', async (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

    const cycle = await myRisaClient.logPeriod(userId, data);
    res.status(201).json({ success: true, data: cycle });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log period' });
  }
});

router.get('/womens-health/prediction/:userId', async (req: Request, res: Response) => {
  try {
    const prediction = await myRisaClient.getCyclePrediction(req.params.userId);
    res.json({ success: true, data: prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get prediction' });
  }
});

router.get('/womens-health/pregnancy-week/:userId', async (req: Request, res: Response) => {
  try {
    const week = await myRisaClient.getPregnancyWeek(req.params.userId);
    res.json({ success: true, data: week });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get pregnancy week' });
  }
});

router.get('/womens-health/insights/:userId', async (req: Request, res: Response) => {
  try {
    const insights = await myRisaClient.getWomensHealthInsights(req.params.userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get insights' });
  }
});

// ============================================
// SEXUAL WELLNESS
// ============================================

router.post('/sexual-wellness/activity', async (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

    const activity = await myRisaClient.logSexualActivity(userId, data);
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log activity' });
  }
});

router.post('/sexual-wellness/libido', async (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

    const record = await myRisaClient.logLibido(userId, data);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log libido' });
  }
});

router.get('/sexual-wellness/insights/:userId', async (req: Request, res: Response) => {
  try {
    const insights = await myRisaClient.getSexualWellnessInsights(req.params.userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get insights' });
  }
});

// ============================================
// WORK-LIFE BALANCE
// ============================================

router.post('/worklife/work', async (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

    const record = await myRisaClient.logWorkDay(userId, data);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log work day' });
  }
});

router.get('/worklife/score/:userId', async (req: Request, res: Response) => {
  try {
    const score = await myRisaClient.getWorkLifeScore(req.params.userId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get score' });
  }
});

router.get('/worklife/burnout/:userId', async (req: Request, res: Response) => {
  try {
    const assessment = await myRisaClient.getBurnoutRisk(req.params.userId);
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assess burnout' });
  }
});

router.get('/worklife/insights/:userId', async (req: Request, res: Response) => {
  try {
    const insights = await myRisaClient.getWorkInsights(req.params.userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get insights' });
  }
});

// ============================================
// RELATIONSHIPS
// ============================================

router.get('/relationships/:userId', async (req: Request, res: Response) => {
  try {
    const relationships = await myRisaClient.getRelationships(req.params.userId);
    res.json({ success: true, data: relationships });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get relationships' });
  }
});

router.post('/relationships', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ success: false, error: 'User ID required' });

    const relationship = await myRisaClient.addRelationship(userId, req.body);
    res.status(201).json({ success: true, data: relationship });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add relationship' });
  }
});

router.post('/relationships/:relationshipId/interactions', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ success: false, error: 'User ID required' });

    const interaction = await myRisaClient.logInteraction(req.params.relationshipId, userId, req.body);
    res.status(201).json({ success: true, data: interaction });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log interaction' });
  }
});

router.get('/relationships/:userId/health', async (req: Request, res: Response) => {
  try {
    const health = await myRisaClient.getRelationshipHealth(req.params.userId);
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get health' });
  }
});

// ============================================
// HUMAN TWIN
// ============================================

router.get('/twin/:userId', async (req: Request, res: Response) => {
  try {
    const twin = await myRisaClient.getHumanTwin(req.params.userId);
    res.json({ success: true, data: twin });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get human twin' });
  }
});

router.get('/twin/:userId/score', async (req: Request, res: Response) => {
  try {
    const score = await myRisaClient.getTwinScore(req.params.userId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get twin score' });
  }
});

router.get('/twin/:userId/insights', async (req: Request, res: Response) => {
  try {
    const insights = await myRisaClient.getTwinInsights(req.params.userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get twin insights' });
  }
});

router.get('/twin/:userId/timeline', async (req: Request, res: Response) => {
  try {
    const timeline = await myRisaClient.getTwinTimeline(req.params.userId);
    res.json({ success: true, data: timeline });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get timeline' });
  }
});

// ============================================
// CONSULTATIONS
// ============================================

router.post('/consultations', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ success: false, error: 'User ID required' });

    const consultation = await myRisaClient.scheduleConsultation(userId, req.body);
    res.status(201).json({ success: true, data: consultation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to schedule consultation' });
  }
});

router.get('/consultations/upcoming', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ success: false, error: 'User ID required' });

    const consultations = await myRisaClient.getUpcomingConsultations(userId);
    res.json({ success: true, data: consultations });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get consultations' });
  }
});

router.post('/consultations/:consultationId/pre-visit', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ success: false, error: 'User ID required' });

    const brief = await myRisaClient.generatePreVisitBrief(userId, req.params.consultationId);
    res.json({ success: true, data: brief });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate brief' });
  }
});

router.post('/consultations/:consultationId/questions', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ success: false, error: 'User ID required' });

    const questions = await myRisaClient.generateQuestions(userId, req.params.consultationId);
    res.json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate questions' });
  }
});

// ============================================
// MENTAL HEALTH
// ============================================

router.post('/mental/mood', async (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

    const mood = await myRisaClient.logMood(userId, data);
    res.status(201).json({ success: true, data: mood });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log mood' });
  }
});

router.get('/mental/trends/:userId', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'week';
    const trends = await myRisaClient.getMoodTrends(req.params.userId, period);
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get trends' });
  }
});

router.get('/mental/insights/:userId', async (req: Request, res: Response) => {
  try {
    const insights = await myRisaClient.getMentalInsights(req.params.userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get insights' });
  }
});

// ============================================
// SLEEP
// ============================================

router.post('/sleep', async (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

    const sleep = await myRisaClient.logSleep(userId, data);
    res.status(201).json({ success: true, data: sleep });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log sleep' });
  }
});

router.get('/sleep/analysis/:userId', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const analysis = await myRisaClient.getSleepAnalysis(req.params.userId, days);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get sleep analysis' });
  }
});

// ============================================
// LIFE EVENTS
// ============================================

router.post('/life-events', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-person-id'] as string;
    if (!userId) return res.status(401).json({ success: false, error: 'Person ID required' });

    const event = await myRisaClient.recordLifeEvent(userId, req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record life event' });
  }
});

export default router;