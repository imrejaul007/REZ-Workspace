import { Router, Response } from 'express';
import { TierService, tierService } from '../services';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { createServiceLogger } from 'utils/logger.js';

const router = Router();
const logger = createServiceLogger('TierRoutes');

// Apply auth middleware
router.use(authMiddleware);

const tierServiceInstance: TierService = tierService;

// POST /api/tiers - Create a new tier
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const tier = await tierServiceInstance.createTier(req.body);
    logger.info('Tier created via API', { tierId: tier.tierId });
    res.status(201).json({ success: true, data: tier });
  } catch (error) {
    logger.error('Failed to create tier', { error });
    res.status(500).json({ success: false, error: 'Failed to create tier' });
  }
});

// GET /api/tiers - Get all tiers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    const tiers = await tierServiceInstance.getAllTiers(companyId);
    res.json({ success: true, data: tiers });
  } catch (error) {
    logger.error('Failed to get tiers', { error });
    res.status(500).json({ success: false, error: 'Failed to get tiers' });
  }
});

// GET /api/tiers/:id - Get tier by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tier = await tierServiceInstance.getTierById(req.params.id);
    if (!tier) {
      return res.status(404).json({ success: false, error: 'Tier not found' });
    }
    res.json({ success: true, data: tier });
  } catch (error) {
    logger.error('Failed to get tier', { error, tierId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to get tier' });
  }
});

// PUT /api/tiers/:id - Update tier
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tier = await tierServiceInstance.updateTier(req.params.id, req.body);
    if (!tier) {
      return res.status(404).json({ success: false, error: 'Tier not found' });
    }
    res.json({ success: true, data: tier });
  } catch (error) {
    logger.error('Failed to update tier', { error, tierId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to update tier' });
  }
});

// GET /api/tiers/:id/benefits - Get tier benefits
router.get('/:id/benefits', async (req: AuthRequest, res: Response) => {
  try {
    const benefits = await tierServiceInstance.getTierBenefits(req.params.id);
    res.json({ success: true, data: benefits });
  } catch (error) {
    logger.error('Failed to get tier benefits', { error, tierId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to get benefits' });
  }
});

// POST /api/members/:id/upgrade - Upgrade member
router.post('/members/:id/upgrade', async (req: AuthRequest, res: Response) => {
  try {
    const { toTierId, triggeredBy, approvedBy } = req.body;
    const upgrade = await tierServiceInstance.upgradeMember(
      req.params.id,
      toTierId,
      triggeredBy || 'manual',
      approvedBy
    );
    if (!upgrade) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    logger.info('Member upgraded via API', { memberId: req.params.id, toTierId });
    res.json({ success: true, data: upgrade });
  } catch (error) {
    logger.error('Failed to upgrade member', { error, memberId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to upgrade member' });
  }
});

// GET /api/members/:id - Get member by ID
router.get('/members/:id', async (req: AuthRequest, res: Response) => {
  try {
    const member = await tierServiceInstance.getMemberById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    res.json({ success: true, data: member });
  } catch (error) {
    logger.error('Failed to get member', { error, memberId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to get member' });
  }
});

// GET /api/members/user/:userId - Get member by user ID
router.get('/members/user/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    const member = await tierServiceInstance.getMemberByUserId(req.params.userId, companyId);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    res.json({ success: true, data: member });
  } catch (error) {
    logger.error('Failed to get member by userId', { error, userId: req.params.userId });
    res.status(500).json({ success: false, error: 'Failed to get member' });
  }
});

// GET /api/members/:id/upgrade-history - Get member upgrade history
router.get('/members/:id/upgrade-history', async (req: AuthRequest, res: Response) => {
  try {
    const history = await tierServiceInstance.getUpgradeHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Failed to get upgrade history', { error, memberId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to get upgrade history' });
  }
});

// GET /api/stats - Get tier statistics
router.get('/stats/all', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    const stats = await tierServiceInstance.getMemberStats(companyId);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Failed to get stats', { error });
    res.status(500).json({ success: false, error: 'Failed to get statistics' });
  }
});

export default router;