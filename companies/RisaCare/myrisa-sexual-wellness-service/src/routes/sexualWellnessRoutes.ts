/**
 * MyRisa Sexual Wellness Service - Routes
 */

import { Router, Request, Response } from 'express';
import { sexualWellnessService } from '../services/sexualWellnessService.js';

const router = Router();

// Profile
router.get('/profile/:userId', (req, res) => {
  try {
    const profile = sexualWellnessService.getOrCreateProfile(req.params.userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

router.put('/profile/:userId', (req, res) => {
  try {
    const profile = sexualWellnessService.updateProfile(req.params.userId, req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// Sexual Activity
router.post('/activity', (req, res) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
    const activity = sexualWellnessService.logActivity(userId, data);
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log activity' });
  }
});

router.get('/activity/:userId', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const activities = sexualWellnessService.getActivities(req.params.userId, limit);
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get activities' });
  }
});

// Libido
router.post('/libido', (req, res) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
    const record = sexualWellnessService.logLibido(userId, data);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log libido' });
  }
});

router.get('/libido/:userId', (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : undefined;
    const records = sexualWellnessService.getLibidoRecords(req.params.userId, days);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get libido records' });
  }
});

router.get('/libido/:userId/analytics', (req, res) => {
  try {
    const analytics = sexualWellnessService.getLibidoAnalytics(req.params.userId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get libido analytics' });
  }
});

// Contraception
router.post('/contraception', (req, res) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
    const contraception = sexualWellnessService.addContraception(userId, data);
    res.status(201).json({ success: true, data: contraception });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add contraception' });
  }
});

router.get('/contraception/:userId', (req, res) => {
  try {
    const contraception = sexualWellnessService.getContraception(req.params.userId);
    res.json({ success: true, data: contraception });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get contraception' });
  }
});

router.get('/contraception/:userId/active', (req, res) => {
  try {
    const contraception = sexualWellnessService.getActiveContraception(req.params.userId);
    res.json({ success: true, data: contraception });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get active contraception' });
  }
});

// Reproductive Health
router.post('/reproductive', (req, res) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
    const record = sexualWellnessService.logReproductiveHealth(userId, data);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log reproductive health' });
  }
});

router.get('/reproductive/:userId', (req, res) => {
  try {
    const records = sexualWellnessService.getReproductiveHealth(req.params.userId);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get reproductive health' });
  }
});

// Intimacy
router.post('/intimacy', (req, res) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
    const journal = sexualWellnessService.logIntimacy(userId, data);
    res.status(201).json({ success: true, data: journal });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log intimacy' });
  }
});

router.get('/intimacy/:userId', (req, res) => {
  try {
    const journals = sexualWellnessService.getIntimacyJournals(req.params.userId);
    res.json({ success: true, data: journals });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get intimacy journals' });
  }
});

router.get('/intimacy/:userId/analytics', (req, res) => {
  try {
    const analytics = sexualWellnessService.getIntimacyAnalytics(req.params.userId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get intimacy analytics' });
  }
});

// STD Screening
router.post('/std-screening', (req, res) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
    const screening = sexualWellnessService.logSTDScreening(userId, data);
    res.status(201).json({ success: true, data: screening });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log STD screening' });
  }
});

router.get('/std-screening/:userId', (req, res) => {
  try {
    const screenings = sexualWellnessService.getSTDScreenings(req.params.userId);
    res.json({ success: true, data: screenings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get STD screenings' });
  }
});

// Insights
router.get('/insights/:userId', (req, res) => {
  try {
    const insights = sexualWellnessService.getInsights(req.params.userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get insights' });
  }
});

export default router;