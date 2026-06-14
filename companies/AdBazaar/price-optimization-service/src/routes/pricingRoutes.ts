import { Router, Response } from 'express';
import { PricingService, pricingService } from '../services';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { createServiceLogger } from '../utils/logger';

const router = Router();
const logger = createServiceLogger('PricingRoutes');
router.use(authMiddleware);
const service: PricingService = pricingService;

// POST /api/pricing - Create pricing
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const pricing = await service.createPricing({ ...req.body, companyId: req.companyId || 'adb_company_001' });
    res.status(201).json({ success: true, data: pricing });
  } catch (error) {
    logger.error('Failed to create pricing', { error });
    res.status(500).json({ success: false, error: 'Failed to create pricing' });
  }
});

// GET /api/pricing/:id - Get pricing by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const pricing = await service.getPricingById(req.params.id);
    if (!pricing) return res.status(404).json({ success: false, error: 'Pricing not found' });
    res.json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get pricing' });
  }
});

// PUT /api/pricing/:id - Update pricing
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const pricing = await service.updatePricing(req.params.id, req.body);
    if (!pricing) return res.status(404).json({ success: false, error: 'Pricing not found' });
    res.json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update pricing' });
  }
});

// POST /api/pricing/:id/optimize - Optimize price
router.post('/:id/optimize', async (req: AuthRequest, res: Response) => {
  try {
    const { factors } = req.body;
    const optimization = await service.optimizePrice(req.params.id, factors);
    res.json({ success: true, data: optimization });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to optimize price' });
  }
});

// GET /api/pricing/:id/history - Get optimization history
router.get('/:id/history', async (req: AuthRequest, res: Response) => {
  try {
    const history = await service.getOptimizationHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

// GET /api/pricing/:id/stats - Get pricing stats
router.get('/:id/stats', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await service.getPricingStats(req.params.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// POST /api/pricing/:id/revert - Revert optimization
router.post('/:id/revert', async (req: AuthRequest, res: Response) => {
  try {
    const optimization = await service.revertOptimization(req.params.id);
    if (!optimization) return res.status(404).json({ success: false, error: 'Optimization not found' });
    res.json({ success: true, data: optimization });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to revert' });
  }
});

// GET /api/pricing - Get all pricing
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string || 'adb_company_001';
    const pricing = await service.getAllPricing(companyId);
    res.json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get pricing' });
  }
});

// POST /api/pricing/strategies - Create strategy
router.post('/strategies', async (req: AuthRequest, res: Response) => {
  try {
    const strategy = await service.createStrategy({ ...req.body, companyId: req.companyId || 'adb_company_001' });
    res.status(201).json({ success: true, data: strategy });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create strategy' });
  }
});

export default router;