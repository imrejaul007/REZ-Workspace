import { Router, Response } from 'express';
import { FeatureFlagService, featureFlagService } from '../services';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { createServiceLogger } from 'utils/logger.js';

const router = Router();
const logger = createServiceLogger('FeatureFlagRoutes');
router.use(authMiddleware);
const service: FeatureFlagService = featureFlagService;

// POST /api/flags - Create flag
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const flag = await service.createFlag({ ...req.body, createdBy: req.userId || 'system', companyId: req.companyId || 'adb_company_001' });
    res.status(201).json({ success: true, data: flag });
  } catch (error) {
    logger.error('Failed to create flag', { error });
    res.status(500).json({ success: false, error: 'Failed to create flag' });
  }
});

// GET /api/flags/:id - Get flag by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const flag = await service.getFlagById(req.params.id);
    if (!flag) return res.status(404).json({ success: false, error: 'Flag not found' });
    res.json({ success: true, data: flag });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get flag' });
  }
});

// PUT /api/flags/:id - Update flag
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const flag = await service.updateFlag(req.params.id, req.body);
    if (!flag) return res.status(404).json({ success: false, error: 'Flag not found' });
    res.json({ success: true, data: flag });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update flag' });
  }
});

// POST /api/flags/:id/enable - Enable flag
router.post('/:id/enable', async (req: AuthRequest, res: Response) => {
  try {
    const flag = await service.enableFlag(req.params.id);
    if (!flag) return res.status(404).json({ success: false, error: 'Flag not found' });
    res.json({ success: true, data: flag });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to enable flag' });
  }
});

// POST /api/flags/:id/disable - Disable flag
router.post('/:id/disable', async (req: AuthRequest, res: Response) => {
  try {
    const flag = await service.disableFlag(req.params.id);
    if (!flag) return res.status(404).json({ success: false, error: 'Flag not found' });
    res.json({ success: true, data: flag });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to disable flag' });
  }
});

// POST /api/flags/:id/evaluate - Evaluate flag
router.post('/:id/evaluate', async (req: AuthRequest, res: Response) => {
  try {
    const { key, userId, attributes } = req.body;
    const result = await service.evaluateFlag(key, userId, req.companyId || 'adb_company_001', attributes);
    if (!result.flag) return res.status(404).json({ success: false, error: 'Flag not found' });
    await service.logEvaluation(key, userId, req.companyId || 'adb_company_001', result.result, result.reason, result.flag?.flagId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to evaluate flag' });
  }
});

// GET /api/flags - Get all flags
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string || 'adb_company_001';
    const status = req.query.status as string;
    const flags = await service.getAllFlags(companyId, status);
    res.json({ success: true, data: flags });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get flags' });
  }
});

// POST /api/flags/:id/rules - Create rule
router.post('/:id/rules', async (req: AuthRequest, res: Response) => {
  try {
    const rule = await service.createRule(req.params.id, req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create rule' });
  }
});

// GET /api/flags/:id/rules - Get rules
router.get('/:id/rules', async (req: AuthRequest, res: Response) => {
  try {
    const rules = await service.getRulesByFlag(req.params.id);
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get rules' });
  }
});

// DELETE /api/flags/rules/:ruleId - Delete rule
router.delete('/rules/:ruleId', async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await service.deleteRule(req.params.ruleId);
    if (!deleted) return res.status(404).json({ success: false, error: 'Rule not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete rule' });
  }
});

// GET /api/flags/:id/stats - Get flag stats
router.get('/:id/stats', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await service.getEvaluationStats(req.params.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

export default router;