/**
 * MyRisa Women's Health Service - Routes
 */

import { Router, Request, Response } from 'express';
import { womensHealthService } from '../services/womensHealthService.js';

const router = Router();

// ============================================
// PROFILE
// ============================================

router.get('/profile/:userId', (req: Request, res: Response) => {
  try {
    const profile = womensHealthService.getOrCreateProfile(req.params.userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

router.put('/profile/:userId', (req: Request, res: Response) => {
  try {
    const profile = womensHealthService.updateProfile(req.params.userId, req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// ============================================
// MENSTRUAL CYCLE
// ============================================

router.post('/cycles', (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const cycle = womensHealthService.logCycle(userId, data);
    res.status(201).json({ success: true, data: cycle });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log cycle' });
  }
});

router.get('/cycles/:userId', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const cycles = womensHealthService.getCycles(req.params.userId, limit);
    res.json({ success: true, data: cycles });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get cycles' });
  }
});

router.get('/cycles/:userId/prediction', (req: Request, res: Response) => {
  try {
    const prediction = womensHealthService.predictNextCycle(req.params.userId);
    res.json({ success: true, data: prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get prediction' });
  }
});

router.get('/cycles/:userId/analytics', (req: Request, res: Response) => {
  try {
    const analytics = womensHealthService.getCycleAnalytics(req.params.userId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

// ============================================
// CYCLE SETTINGS
// ============================================

router.put('/settings/:userId', (req: Request, res: Response) => {
  try {
    const settings = womensHealthService.updateSettings(req.params.userId, req.body);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// ============================================
// FERTILITY
// ============================================

router.post('/fertility', (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const record = womensHealthService.logFertility(userId, data);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log fertility' });
  }
});

router.get('/fertility/:userId', (req: Request, res: Response) => {
  try {
    const records = womensHealthService.getFertilityRecords(
      req.params.userId,
      req.query.startDate as string,
      req.query.endDate as string
    );
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get fertility records' });
  }
});

router.put('/fertility-status/:userId', (req: Request, res: Response) => {
  try {
    const status = womensHealthService.updateFertilityStatus(req.params.userId, req.body);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update fertility status' });
  }
});

// ============================================
// PREGNANCY
// ============================================

router.post('/pregnancy', (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const pregnancy = womensHealthService.startPregnancy(userId, data);
    res.status(201).json({ success: true, data: pregnancy });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to start pregnancy' });
  }
});

router.get('/pregnancy/:userId/active', (req: Request, res: Response) => {
  try {
    const pregnancy = womensHealthService.getActivePregnancy(req.params.userId);
    res.json({ success: true, data: pregnancy });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get active pregnancy' });
  }
});

router.get('/pregnancy/:userId/week', (req: Request, res: Response) => {
  try {
    const week = womensHealthService.getPregnancyWeek(req.params.userId);
    res.json({ success: true, data: week });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get pregnancy week' });
  }
});

router.get('/pregnancy/:userId/history', (req: Request, res: Response) => {
  try {
    const history = womensHealthService.getPregnancyHistory(req.params.userId);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get pregnancy history' });
  }
});

router.put('/pregnancy/:userId/:pregnancyId', (req: Request, res: Response) => {
  try {
    const pregnancy = womensHealthService.updatePregnancy(
      req.params.userId,
      req.params.pregnancyId,
      req.body
    );
    res.json({ success: true, data: pregnancy });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update pregnancy' });
  }
});

// ============================================
// PCOS
// ============================================

router.post('/pcos', (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const record = womensHealthService.logPCOS(userId, data);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log PCOS' });
  }
});

router.get('/pcos/:userId', (req: Request, res: Response) => {
  try {
    const records = womensHealthService.getPCOSRecords(req.params.userId);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get PCOS records' });
  }
});

router.get('/pcos/:userId/plan', (req: Request, res: Response) => {
  try {
    const plan = womensHealthService.getPCOSManagementPlan(req.params.userId);
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get PCOS plan' });
  }
});

// ============================================
// MENOPAUSE
// ============================================

router.post('/menopause', (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const record = womensHealthService.logMenopause(userId, data);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log menopause' });
  }
});

router.get('/menopause/:userId', (req: Request, res: Response) => {
  try {
    const records = womensHealthService.getMenopauseRecords(req.params.userId);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get menopause records' });
  }
});

// ============================================
// REMINDERS
// ============================================

router.post('/reminders', (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const reminder = womensHealthService.createReminder(userId, data);
    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create reminder' });
  }
});

router.get('/reminders/:userId', (req: Request, res: Response) => {
  try {
    const reminders = womensHealthService.getReminders(req.params.userId);
    res.json({ success: true, data: reminders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get reminders' });
  }
});

router.put('/reminders/:userId/:reminderId', (req: Request, res: Response) => {
  try {
    const reminder = womensHealthService.updateReminder(
      req.params.userId,
      req.params.reminderId,
      req.body
    );
    res.json({ success: true, data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update reminder' });
  }
});

router.delete('/reminders/:userId/:reminderId', (req: Request, res: Response) => {
  try {
    const deleted = womensHealthService.deleteReminder(req.params.userId, req.params.reminderId);
    res.json({ success: deleted, message: deleted ? 'Reminder deleted' : 'Reminder not found' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete reminder' });
  }
});

// ============================================
// INSIGHTS
// ============================================

router.get('/insights/:userId', (req: Request, res: Response) => {
  try {
    const insights = womensHealthService.getHealthInsights(req.params.userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get insights' });
  }
});

export default router;