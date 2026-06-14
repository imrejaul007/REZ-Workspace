import { Router, Response } from 'express';
import { ReferralService, referralService } from '../services';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { createServiceLogger } from '../utils/logger';

const router = Router();
const logger = createServiceLogger('ReferralRoutes');

router.use(authMiddleware);
const service: ReferralService = referralService;

// POST /api/referrals - Create referral
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const referral = await service.createReferral(req.body);
    res.status(201).json({ success: true, data: referral });
  } catch (error) {
    logger.error('Failed to create referral', { error });
    res.status(500).json({ success: false, error: 'Failed to create referral' });
  }
});

// GET /api/referrals/:id - Get referral by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const referral = await service.getReferralById(req.params.id);
    if (!referral) {
      return res.status(404).json({ success: false, error: 'Referral not found' });
    }
    res.json({ success: true, data: referral });
  } catch (error) {
    logger.error('Failed to get referral', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to get referral' });
  }
});

// GET /api/referrals/referrer/:referrerId - Get referrals by referrer
router.get('/referrer/:referrerId', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    const referrals = await service.getReferralsByReferrer(req.params.referrerId, companyId);
    res.json({ success: true, data: referrals });
  } catch (error) {
    logger.error('Failed to get referrals', { error, referrerId: req.params.referrerId });
    res.status(500).json({ success: false, error: 'Failed to get referrals' });
  }
});

// POST /api/referrals/:id/credit - Credit referrer
router.post('/:id/credit', async (req: AuthRequest, res: Response) => {
  try {
    const credit = await service.creditReferrer(req.params.id, req.body);
    res.json({ success: true, data: credit });
  } catch (error) {
    logger.error('Failed to credit referrer', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to credit referrer' });
  }
});

// POST /api/referrals/:id/convert - Convert referral
router.post('/:id/convert', async (req: AuthRequest, res: Response) => {
  try {
    const { conversionType } = req.body;
    const referral = await service.convertReferral(req.params.id, conversionType);
    if (!referral) {
      return res.status(404).json({ success: false, error: 'Referral not found' });
    }
    res.json({ success: true, data: referral });
  } catch (error) {
    logger.error('Failed to convert referral', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to convert' });
  }
});

// GET /api/referrals/:id/credits - Get credits for referral
router.get('/:id/credits', async (req: AuthRequest, res: Response) => {
  try {
    const referral = await service.getReferralById(req.params.id);
    if (!referral) {
      return res.status(404).json({ success: false, error: 'Referral not found' });
    }
    const credits = await service.getCreditsByReferrer(referral.referrerId);
    res.json({ success: true, data: credits });
  } catch (error) {
    logger.error('Failed to get credits', { error });
    res.status(500).json({ success: false, error: 'Failed to get credits' });
  }
});

// GET /api/referrals/stats/:referrerId - Get referrer stats
router.get('/stats/:referrerId', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await service.getReferralStats(req.params.referrerId);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Failed to get stats', { error });
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// GET /api/referrals/top - Get top referrers
router.get('/leaderboard/top', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string || 'adb_company_001';
    const limit = parseInt(req.query.limit as string) || 10;
    const top = await service.getTopReferrers(companyId, limit);
    res.json({ success: true, data: top });
  } catch (error) {
    logger.error('Failed to get top referrers', { error });
    res.status(500).json({ success: false, error: 'Failed to get leaderboard' });
  }
});

// POST /api/referrals/:id/reward - Create reward
router.post('/:id/reward', async (req: AuthRequest, res: Response) => {
  try {
    const reward = await service.createReward(req.params.id, req.body);
    res.status(201).json({ success: true, data: reward });
  } catch (error) {
    logger.error('Failed to create reward', { error });
    res.status(500).json({ success: false, error: 'Failed to create reward' });
  }
});

// POST /api/rewards/:id/claim - Claim reward
router.post('/rewards/:id/claim', async (req: AuthRequest, res: Response) => {
  try {
    const reward = await service.claimReward(req.params.id);
    if (!reward) {
      return res.status(404).json({ success: false, error: 'Reward not found' });
    }
    res.json({ success: true, data: reward });
  } catch (error) {
    logger.error('Failed to claim reward', { error });
    res.status(500).json({ success: false, error: 'Failed to claim reward' });
  }
});

export default router;