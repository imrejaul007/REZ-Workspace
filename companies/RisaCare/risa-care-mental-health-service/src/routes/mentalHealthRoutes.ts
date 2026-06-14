import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { moodTrackingService } from '../services/moodTrackingService.js';
import { therapyService } from '../services/therapyService.js';
import { supportGroupService } from '../services/supportGroupService.js';
import { crisisService } from '../services/crisisService.js';
import { selfHarmService } from '../services/selfHarmService.js';

const router = Router();

// ============================================
// MOOD TRACKING ROUTES
// ============================================

/**
 * POST /mood - Log mood entry
 */
router.post('/mood', async (req: Request, res: Response) => {
  try {
    const result = await moodTrackingService.logMood({
      userId: req.body.userId,
      date: new Date(req.body.date || Date.now()),
      mood: req.body.mood,
      energy: req.body.energy,
      anxiety: req.body.anxiety,
      sleep: req.body.sleep,
      stress: req.body.stress,
      notes: req.body.notes,
      triggers: req.body.triggers || [],
      activities: req.body.activities || [],
      medicationTaken: req.body.medicationTaken || false,
      exerciseDone: req.body.exerciseDone || false,
      socialInteraction: req.body.socialInteraction || false
    });

    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /mood/:userId - Get mood history
 */
router.get('/mood/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit, page } = req.query;

    const result = await moodTrackingService.getMoodHistory(userId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      page: page ? parseInt(page as string) : undefined
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /mood/:userId/trends - Get mood trends
 */
router.get('/mood/:userId/trends', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'week';

    const result = await moodTrackingService.getMoodTrends(userId, period);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /mood/:userId/triggers - Get common triggers
 */
router.get('/mood/:userId/triggers', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await moodTrackingService.getTriggers(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /mood/:userId/insights - Get personalized insights
 */
router.get('/mood/:userId/insights', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await moodTrackingService.getInsights(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /mood/:userId/:entryId - Delete mood entry
 */
router.delete('/mood/:userId/:entryId', async (req: Request, res: Response) => {
  try {
    const { userId, entryId } = req.params;
    const result = await moodTrackingService.deleteMoodEntry(userId, entryId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================
// COUNSELOR ROUTES
// ============================================

/**
 * GET /counselors - List counselors
 */
router.get('/counselors', async (req: Request, res: Response) => {
  try {
    const { specialization, language, minRating, maxPrice, therapyType, page, limit } = req.query;

    const result = await therapyService.findCounselors({
      specialization: specialization ? (specialization as string).split(',') as any[] : undefined,
      language: language as string | undefined,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      therapyType: therapyType as any,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /counselors/:id - Get counselor details
 */
router.get('/counselors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await therapyService.getCounselor(id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================
// THERAPY SESSION ROUTES
// ============================================

/**
 * POST /sessions - Book a session
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { userId, providerId, type, therapyType, date, duration, counselorId, therapistId } = req.body;

    if (!userId || !providerId || !type || !date) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const result = await therapyService.bookSession({
      userId,
      providerId,
      type,
      therapyType,
      date: new Date(date),
      duration,
      counselorId,
      therapistId
    });

    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /sessions/:userId - Get user's sessions
 */
router.get('/sessions/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, startDate, endDate, limit, page } = req.query;

    const result = await therapyService.getSessions(userId, {
      status: status as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      page: page ? parseInt(page as string) : undefined
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /sessions/:userId/upcoming - Get upcoming sessions
 */
router.get('/sessions/:userId/upcoming', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await therapyService.getUpcomingSessions(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /sessions/:userId/homework - Get homework
 */
router.get('/sessions/:userId/homework', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await therapyService.getHomework(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /sessions/session/:sessionId - Get session by ID
 */
router.get('/sessions/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({ success: false, error: 'userId query parameter required' });
      return;
    }

    const result = await therapyService.getSession(sessionId, userId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /sessions/:sessionId/complete - Complete a session
 */
router.put('/sessions/:sessionId/complete', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId, sessionNotes, homework, nextSession, rating, feedback } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' });
      return;
    }

    const result = await therapyService.completeSession(sessionId, userId, {
      sessionNotes,
      homework,
      nextSession: nextSession ? new Date(nextSession) : undefined,
      rating,
      feedback
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /sessions/:sessionId/cancel - Cancel a session
 */
router.put('/sessions/:sessionId/cancel', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId, reason } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' });
      return;
    }

    const result = await therapyService.cancelSession(sessionId, userId, reason);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /sessions/:sessionId/homework/complete - Mark homework complete
 */
router.put('/sessions/:sessionId/homework/complete', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' });
      return;
    }

    const result = await therapyService.completeHomework(userId, sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================
// SUPPORT GROUP ROUTES
// ============================================

/**
 * GET /groups - List support groups
 */
router.get('/groups', async (req: Request, res: Response) => {
  try {
    const { type, focusArea, hasSpace, search, page, limit } = req.query;

    const result = await supportGroupService.findGroups({
      type: type as any,
      focusArea: focusArea ? (focusArea as string).split(',') as any[] : undefined,
      hasSpace: hasSpace === 'true',
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /groups/:groupId - Get group details
 */
router.get('/groups/:groupId', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const result = await supportGroupService.getGroup(groupId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /groups/:groupId/join - Join a group
 */
router.post('/groups/:groupId/join', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' });
      return;
    }

    const result = await supportGroupService.joinGroup(groupId, userId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /groups/:groupId/leave - Leave a group
 */
router.post('/groups/:groupId/leave', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' });
      return;
    }

    const result = await supportGroupService.leaveGroup(groupId, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /groups/:groupId/sessions - Get upcoming group sessions
 */
router.get('/groups/:groupId/sessions', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const result = await supportGroupService.getUpcomingSessions(groupId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /groups/:groupId/members - Get group members
 */
router.get('/groups/:groupId/members', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const includeInactive = req.query.includeInactive === 'true';
    const result = await supportGroupService.getGroupMembers(groupId, includeInactive);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /groups/user/:userId - Get user's groups
 */
router.get('/groups/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await supportGroupService.getUserGroups(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================
// CRISIS ROUTES
// ============================================

/**
 * POST /crisis-plan - Create crisis plan
 */
router.post('/crisis-plan', async (req: Request, res: Response) => {
  try {
    const result = await crisisService.createCrisisPlan(req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /crisis-plan/:userId - Get crisis plan
 */
router.get('/crisis-plan/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await crisisService.getCrisisPlan(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /crisis-plan/:userId - Update crisis plan
 */
router.put('/crisis-plan/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await crisisService.updateCrisisPlan(userId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /crisis-plan/:userId - Delete crisis plan
 */
router.delete('/crisis-plan/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await crisisService.deleteCrisisPlan(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /crisis/alert - Trigger crisis alert
 */
router.post('/crisis/alert', async (req: Request, res: Response) => {
  try {
    const { userId, type, severity, reason, location } = req.body;

    if (!userId || !type || !severity || !reason) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const result = await crisisService.triggerCrisisAlert({
      userId,
      type,
      severity,
      reason,
      location
    });

    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /crisis/:userId/alerts - Get crisis alerts
 */
router.get('/crisis/:userId/alerts', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await crisisService.getCrisisAlerts(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /crisis/resources - Get crisis resources
 */
router.get('/crisis/resources', async (req: Request, res: Response) => {
  try {
    const country = req.query.country as 'india' | 'global' | undefined;
    const result = await crisisService.getCrisisResources(country);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /crisis/safety-tips - Get safety tips
 */
router.get('/crisis/safety-tips', async (req: Request, res: Response) => {
  try {
    const result = await crisisService.getSafetyTips();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /crisis/breathing-exercises - Get breathing exercises
 */
router.get('/crisis/breathing-exercises', async (req: Request, res: Response) => {
  try {
    const result = await crisisService.getBreathingExercises();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /crisis/grounding-techniques - Get grounding techniques
 */
router.get('/crisis/grounding-techniques', async (req: Request, res: Response) => {
  try {
    const result = await crisisService.getGroundingTechniques();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================
// SELF-HARM ROUTES
// ============================================

/**
 * POST /self-harm/log - Log self-harm incident
 */
router.post('/self-harm/log', async (req: Request, res: Response) => {
  try {
    const result = await selfHarmService.logIncident({
      userId: req.body.userId,
      date: new Date(req.body.date || Date.now()),
      severity: req.body.severity,
      triggers: req.body.triggers || [],
      emotions: req.body.emotions || [],
      usedCoping: req.body.usedCoping || [],
      reachedOutTo: req.body.reachedOutTo || [],
      followUpActions: req.body.followUpActions || [],
      location: req.body.location,
      circumstances: req.body.circumstances,
      isSafeNow: req.body.isSafeNow || false,
      needsProfessionalHelp: req.body.needsProfessionalHelp || false
    });

    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /self-harm/:userId - Get self-harm history
 */
router.get('/self-harm/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit, page } = req.query;

    const result = await selfHarmService.getHistory(userId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      page: page ? parseInt(page as string) : undefined
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /self-harm/:userId/safety-plan - Get safety plan
 */
router.get('/self-harm/:userId/safety-plan', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await selfHarmService.getSafetyPlan(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /self-harm/:userId/mark-safe - Mark as safe
 */
router.post('/self-harm/:userId/mark-safe', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { incidentId } = req.body;
    const result = await selfHarmService.markSafe(userId, incidentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /self-harm/:userId/statistics - Get statistics
 */
router.get('/self-harm/:userId/statistics', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await selfHarmService.getStatistics(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /self-harm/resources - Get crisis resources
 */
router.get('/self-harm/resources', async (req: Request, res: Response) => {
  try {
    const result = await selfHarmService.getCrisisResources();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /self-harm/:userId/:incidentId - Delete incident
 */
router.delete('/self-harm/:userId/:incidentId', async (req: Request, res: Response) => {
  try {
    const { userId, incidentId } = req.params;
    const result = await selfHarmService.deleteIncident(userId, incidentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================
// PROFILE ROUTES
// ============================================

/**
 * GET /profile/:userId - Get mental health profile
 */
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await therapyService.getProfile(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /profile/:userId - Update mental health profile
 */
router.put('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await therapyService.updateProfile(userId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'risa-care-mental-health', timestamp: new Date().toISOString() });
});

export default router;
