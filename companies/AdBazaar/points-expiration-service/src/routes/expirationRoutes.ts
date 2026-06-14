import { Router, Response } from 'express';
import { ExpirationService, expirationService } from '../services';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { createServiceLogger } from '../utils/logger';

const router = Router();
const logger = createServiceLogger('ExpirationRoutes');

router.use(authMiddleware);

const service: ExpirationService = expirationService;

// POST /api/expiration - Create expiration record
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const expiration = await service.createExpiration(req.body);
    res.status(201).json({ success: true, data: expiration });
  } catch (error) {
    logger.error('Failed to create expiration', { error });
    res.status(500).json({ success: false, error: 'Failed to create expiration' });
  }
});

// GET /api/expiration/:memberId - Get expirations by member
router.get('/:memberId', async (req: AuthRequest, res: Response) => {
  try {
    const expirations = await service.getExpirationsByMember(req.params.memberId);
    res.json({ success: true, data: expirations });
  } catch (error) {
    logger.error('Failed to get expirations', { error, memberId: req.params.memberId });
    res.status(500).json({ success: false, error: 'Failed to get expirations' });
  }
});

// PUT /api/expiration/rules - Update/create expiration rules
router.put('/rules', async (req: AuthRequest, res: Response) => {
  try {
    const rule = await service.createRule(req.body);
    res.json({ success: true, data: rule });
  } catch (error) {
    logger.error('Failed to update rules', { error });
    res.status(500).json({ success: false, error: 'Failed to update rules' });
  }
});

// GET /api/expiration/pending - Get pending expirations
router.get('/pending/all', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    const pending = await service.getPendingExpirations(companyId);
    res.json({ success: true, data: pending });
  } catch (error) {
    logger.error('Failed to get pending expirations', { error });
    res.status(500).json({ success: false, error: 'Failed to get pending' });
  }
});

// GET /api/expiration/expiring - Get expiring soon
router.get('/expiring/all', async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const companyId = req.query.companyId as string;
    const expiring = await service.getExpiringSoon(days, companyId);
    res.json({ success: true, data: expiring });
  } catch (error) {
    logger.error('Failed to get expiring soon', { error });
    res.status(500).json({ success: false, error: 'Failed to get expiring' });
  }
});

// POST /api/expiration/process - Process all expirations
router.post('/process', async (req: AuthRequest, res: Response) => {
  try {
    const result = await service.processExpirations();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to process expirations', { error });
    res.status(500).json({ success: false, error: 'Failed to process' });
  }
});

// POST /api/expiration/:id/forgive - Forgive an expiration
router.post('/:id/forgive', async (req: AuthRequest, res: Response) => {
  try {
    const { forgivenBy, reason } = req.body;
    const expiration = await service.forgiveExpiration(req.params.id, forgivenBy, reason);
    if (!expiration) {
      return res.status(404).json({ success: false, error: 'Expiration not found' });
    }
    res.json({ success: true, data: expiration });
  } catch (error) {
    logger.error('Failed to forgive expiration', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to forgive' });
  }
});

// GET /api/expiration/stats - Get expiration statistics
router.get('/stats/all', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    const stats = await service.getExpirationStats(companyId);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Failed to get stats', { error });
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

export default router;