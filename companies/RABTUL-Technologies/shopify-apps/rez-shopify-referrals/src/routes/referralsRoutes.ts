import { Router } from 'express';
import { z } from 'zod';
import { referralsService } from '../services/referralsService.js';
import { ReferralProgramSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/programs', (req, res) => {
  try {
    const program = ReferralProgramSchema.parse(req.body);
    const created = referralsService.createProgram(program);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else {
      logger.error('Failed to create program', { error });
      res.status(500).json({ success: false, error: 'Failed to create program' });
    }
  }
});

router.get('/programs/:id', (req, res) => {
  const program = referralsService.getProgram(req.params.id);
  program ? res.json({ success: true, data: program }) : res.status(404).json({ success: false, error: 'Program not found' });
});

router.get('/programs/code/:code', (req, res) => {
  const program = referralsService.getProgramByCode(req.params.code);
  program ? res.json({ success: true, data: program }) : res.status(404).json({ success: false, error: 'Program not found' });
});

router.get('/shops/:shopId/programs', (req, res) => {
  const programs = referralsService.getShopPrograms(req.params.shopId);
  res.json({ success: true, data: programs });
});

router.patch('/programs/:id', (req, res) => {
  const program = referralsService.updateProgram(req.params.id, req.body);
  program ? res.json({ success: true, data: program }) : res.status(404).json({ success: false, error: 'Program not found' });
});

router.post('/referrals', (req, res) => {
  const { programId, referrerId, refereeId } = req.body;
  if (!programId || !referrerId) {
    return res.status(400).json({ success: false, error: 'Missing programId or referrerId' });
  }
  const referral = referralsService.createReferral(programId, referrerId, refereeId);
  referral ? res.status(201).json({ success: true, data: referral }) : res.status(400).json({ success: false, error: 'Failed to create referral' });
});

router.get('/referrals/:id', (req, res) => {
  const referral = referralsService.getReferral(req.params.id);
  referral ? res.json({ success: true, data: referral }) : res.status(404).json({ success: false, error: 'Referral not found' });
});

router.get('/referrals/code/:code', (req, res) => {
  const referral = referralsService.getReferralByCode(req.params.code);
  referral ? res.json({ success: true, data: referral }) : res.status(404).json({ success: false, error: 'Referral not found' });
});

router.get('/users/:userId/referrals', (req, res) => {
  const referrals = referralsService.getUserReferrals(req.params.userId);
  res.json({ success: true, data: referrals });
});

router.post('/referrals/:id/convert', (req, res) => {
  const { refereeId, orderAmount } = req.body;
  if (!refereeId || orderAmount === undefined) {
    return res.status(400).json({ success: false, error: 'Missing refereeId or orderAmount' });
  }
  const referral = referralsService.convertReferral(req.params.id, refereeId, orderAmount);
  referral ? res.json({ success: true, data: referral }) : res.status(400).json({ success: false, error: 'Conversion failed' });
});

router.post('/referrals/:id/reward', (req, res) => {
  const referral = referralsService.rewardReferral(req.params.id);
  referral ? res.json({ success: true, data: referral }) : res.status(400).json({ success: false, error: 'Reward failed' });
});

router.post('/referrals/:id/share', (req, res) => {
  const { channel, recipient, message } = req.body;
  if (!channel) {
    return res.status(400).json({ success: false, error: 'Missing channel' });
  }
  referralsService.recordShare(req.params.id, channel, recipient, message);
  res.json({ success: true });
});

router.get('/referrals/:id/shares', (req, res) => {
  const shares = referralsService.getShares(req.params.id);
  res.json({ success: true, data: shares });
});

router.get('/programs/:programId/stats', (req, res) => {
  const stats = referralsService.getStats(req.params.programId);
  res.json({ success: true, data: stats });
});

export default router;
