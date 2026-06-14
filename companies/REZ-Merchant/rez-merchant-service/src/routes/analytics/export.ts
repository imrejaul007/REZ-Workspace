import { Router, Request, Response } from 'express';
import { merchantAuth } from '../../middleware/auth';

const router = Router();
router.use(merchantAuth);

// POST /analytics/export — trigger export
router.post('/export', async (req: Request, res: Response) => {
  // In production, this would queue a job. For now, return a placeholder.
  res.json({ success: true, message: 'Export queued', data: { exportId: `exp_${Date.now()}` } });
});

// GET /analytics/export/:exportId — get export download URL
router.get('/export/:exportId', async (req: Request, res: Response) => {
  const { exportId } = req.params;
  // In production this would look up a job store. Stub response for now.
  res.json({ success: true, data: { url: null, status: 'pending', exportId } });
});

export default router;
