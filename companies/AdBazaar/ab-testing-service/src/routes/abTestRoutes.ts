import { Router, Response } from 'express';
import { ABTestService, abTestService } from '../services';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { createServiceLogger } from 'utils/logger.js';

const router = Router();
const logger = createServiceLogger('ABTestRoutes');

router.use(authMiddleware);
const service: ABTestService = abTestService;

// POST /api/tests - Create test
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const test = await service.createTest({ ...req.body, createdBy: req.userId || 'system' });
    res.status(201).json({ success: true, data: test });
  } catch (error) {
    logger.error('Failed to create test', { error });
    res.status(500).json({ success: false, error: 'Failed to create test' });
  }
});

// GET /api/tests/:id - Get test by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const test = await service.getTestById(req.params.id);
    if (!test) return res.status(404).json({ success: false, error: 'Test not found' });
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get test' });
  }
});

// PUT /api/tests/:id - Update test
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const test = await service.updateTest(req.params.id, req.body);
    if (!test) return res.status(404).json({ success: false, error: 'Test not found' });
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update test' });
  }
});

// POST /api/tests/:id/start - Start test
router.post('/:id/start', async (req: AuthRequest, res: Response) => {
  try {
    const test = await service.startTest(req.params.id);
    if (!test) return res.status(400).json({ success: false, error: 'Cannot start test' });
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to start test' });
  }
});

// POST /api/tests/:id/pause - Pause test
router.post('/:id/pause', async (req: AuthRequest, res: Response) => {
  try {
    const test = await service.pauseTest(req.params.id);
    if (!test) return res.status(400).json({ success: false, error: 'Cannot pause test' });
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to pause test' });
  }
});

// POST /api/tests/:id/complete - Complete test
router.post('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const { winnerId, reason } = req.body;
    const test = await service.completeTest(req.params.id, winnerId, reason);
    if (!test) return res.status(400).json({ success: false, error: 'Cannot complete test' });
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to complete test' });
  }
});

// GET /api/tests/:id/results - Get test results
router.get('/:id/results', async (req: AuthRequest, res: Response) => {
  try {
    const results = await service.getResults(req.params.id);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get results' });
  }
});

// POST /api/tests/:id/compute - Compute results
router.post('/:id/compute', async (req: AuthRequest, res: Response) => {
  try {
    const results = await service.computeResults(req.params.id);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to compute results' });
  }
});

// POST /api/tests/:id/variants - Create variant
router.post('/:id/variants', async (req: AuthRequest, res: Response) => {
  try {
    const variant = await service.createVariant(req.params.id, req.body);
    res.status(201).json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create variant' });
  }
});

// GET /api/tests/:id/variants - Get variants
router.get('/:id/variants', async (req: AuthRequest, res: Response) => {
  try {
    const variants = await service.getVariantsByTest(req.params.id);
    res.json({ success: true, data: variants });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get variants' });
  }
});

// POST /api/tests/:id/assign - Assign user to variant
router.post('/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, sessionId } = req.body;
    const assignment = await service.assignUser(req.params.id, userId, req.companyId || 'adb_company_001', sessionId);
    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign user' });
  }
});

// POST /api/tests/convert - Record conversion
router.post('/convert', async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId, revenue } = req.body;
    const assignment = await service.recordConversion(assignmentId, revenue);
    if (!assignment) return res.status(404).json({ success: false, error: 'Assignment not found' });
    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record conversion' });
  }
});

// GET /api/tests - Get all tests
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string || 'adb_company_001';
    const status = req.query.status as string;
    const tests = await service.getTests(companyId, status);
    res.json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get tests' });
  }
});

export default router;