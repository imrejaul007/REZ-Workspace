import { Router, Request, Response } from 'express';
import { distributionService } from '../services/distributionService';
import { successResponse } from '../utils/response';

const router = Router();

// Assign lead to broker
router.post('/assign', async (req: Request, res: Response) => {
  const brokerId = await distributionService.assignLead(req.body);
  successResponse(res, { brokerId });
});

// Create rule
router.post('/rules', async (req: Request, res: Response) => {
  await distributionService.createRule(req.body);
  successResponse(res, { created: true });
});

// Get rules
router.get('/rules', async (_req: Request, res: Response) => {
  const rules = await distributionService.getRules();
  successResponse(res, rules);
});

// Get stats
router.get('/stats', async (_req: Request, res: Response) => {
  const stats = await distributionService.getStats();
  successResponse(res, stats);
});

// Reset counts
router.post('/reset', async (_req: Request, res: Response) => {
  await distributionService.resetCounts();
  successResponse(res, { reset: true });
});

export default router;
