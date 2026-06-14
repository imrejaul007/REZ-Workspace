/**
 * MyRisa Work-Life Balance Service - Routes
 */

import { Router, Request, Response } from 'express';
import { worklifeService } from '../services/worklifeService.js';

const router = Router();

// ============================================
// WORK RECORDS
// ============================================

router.post('/work', (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const record = worklifeService.logWorkRecord(userId, data);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log work record' });
  }
});

router.get('/work/:userId', (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : undefined;
    const records = worklifeService.getWorkRecords(req.params.userId, days);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get work records' });
  }
});

// ============================================
// SETTINGS
// ============================================

router.get('/settings/:userId', (req: Request, res: Response) => {
  try {
    const settings = worklifeService.getOrCreateSettings(req.params.userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
});

router.put('/settings/:userId', (req: Request, res: Response) => {
  try {
    const settings = worklifeService.updateSettings(req.params.userId, req.body);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// ============================================
// WORK-LIFE SCORE
// ============================================

router.get('/score/:userId', (req: Request, res: Response) => {
  try {
    const score = worklifeService.getWorkLifeScore(req.params.userId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get work-life score' });
  }
});

// ============================================
// BURNOUT ASSESSMENT
// ============================================

router.get('/burnout/:userId', (req: Request, res: Response) => {
  try {
    const assessment = worklifeService.assessBurnoutRisk(req.params.userId);
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assess burnout risk' });
  }
});

// ============================================
// PTO
// ============================================

router.post('/pto', (req: Request, res: Response) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const record = worklifeService.logPTO(userId, data);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log PTO' });
  }
});

router.get('/pto/:userId', (req: Request, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const records = worklifeService.getPTORecords(req.params.userId, year);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get PTO records' });
  }
});

router.get('/pto/:userId/balance', (req: Request, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const balance = worklifeService.getPTOBalance(req.params.userId, year);
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get PTO balance' });
  }
});

// ============================================
// INSIGHTS
// ============================================

router.get('/insights/:userId', (req: Request, res: Response) => {
  try {
    const insights = worklifeService.getWorkInsights(req.params.userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get work insights' });
  }
});

export default router;